import type { SystemActor } from "../documents";
import {
  ELEMENT_OPPOSITIONS,
  ELEMENTAL_WEAKNESS_BONUS,
  ELEMENTAL_RESISTANCE_MULT
} from "./elements";

export interface SoakInfo {
  physical: number;
  magical: number;
}

/** Internal breakdown used for per-hit shield tracking */
interface SoakComponents {
  /** Physical base + armor soak (no shield) */
  physicalBase: number;
  /** Magical base + armor soak (no shield) */
  magicalBase: number;
  /** Shield soak value per hit (0 if EMP’d or no shield equipped) */
  shieldSoak: number;
  /** Current shield hits remaining on the actor */
  shieldHitsLeft: number;
}

export interface DamageElement {
  name: string;
  level: number;
}

export interface ApplyDamageOptions {
  actor: SystemActor;
  rawDamage: number;
  type: "physical" | "magical" | "unsoakable";
  piercing: number;
  /** Number of combo hits. Soak (including shield depletion) is applied per hit. Default: 1 */
  hits?: number;
  /** Attack elements for elemental weakness/resistance calculation. Empty = no elemental effect. */
  elements?: DamageElement[];
}

export interface ApplyDamageResult {
  rawDamage: number;
  /** Total final damage across all hits */
  finalDamage: number;
  /** Total soak absorbed across all hits */
  effectiveSoak: number;
  hits: number;
  oldHp: number;
  newHp: number;
  type: "physical" | "magical" | "unsoakable";
  piercing: number;
}

/**
 * Extract raw soak components, keeping base soak and shield soak separate so
 * per-hit shield depletion can be simulated across a combo.
 */
function getActorSoakComponents(system: any): SoakComponents {
  const hasArmors: boolean =
    Array.isArray(system.armors) && system.armors.length > 0;
  const equippedArmor = hasArmors
    ? ((system.armors as any[]).find(a => a.equipped) ?? null)
    : null;

  const armoredPhysical: number = hasArmors
    ? (equippedArmor?.physicalSoak ?? 0)
    : system.soak.armoredPhysical;
  const armoredMagical: number = hasArmors
    ? (equippedArmor?.magicalSoak ?? 0)
    : system.soak.armoredMagical;
  const rawShieldSoak: number = hasArmors
    ? (equippedArmor?.shieldSoak ?? 0)
    : system.soak.shieldSoak;

  // Resolve of Ages: doubles base soak when no armor is equipped
  const roaActive: boolean = system.soak.resolveOfAges && !equippedArmor;
  const physicalBase =
    (roaActive ? system.soak.physicalBase * 2 : system.soak.physicalBase) +
    armoredPhysical;
  const magicalBase =
    (roaActive ? system.soak.magicalBase * 2 : system.soak.magicalBase) +
    armoredMagical;

  return {
    physicalBase,
    magicalBase,
    shieldSoak: system.combat.emp ? 0 : rawShieldSoak,
    shieldHitsLeft: system.soak.shieldHitsLeft
  };
}

/**
 * Calculate the total effective soak values for a given actor system snapshot.
 * Mirrors the logic in StatusTab.vue (totalPhysical / totalMagical computeds).
 */
export function calcActorSoak(system: any): SoakInfo {
  const { physicalBase, magicalBase, shieldSoak, shieldHitsLeft } =
    getActorSoakComponents(system);
  const shieldBonus = shieldHitsLeft > 0 && shieldSoak > 0 ? shieldSoak : 0;
  return {
    physical: physicalBase + shieldBonus,
    magical: magicalBase + shieldBonus
  };
}

/**
 * Apply damage to an actor, accounting for soak and piercing.
 * Handles gauge updates (trance / limit break), shield hit decrement, and
 * pushes an undo entry into actionHistory (matching the sheet's Undo pattern).
 */
export async function applyDamageToActor({
  actor,
  rawDamage,
  type,
  piercing,
  hits = 1,
  elements = []
}: ApplyDamageOptions): Promise<ApplyDamageResult> {
  const system = actor.system as any;
  const hitCount = Math.max(1, Math.floor(hits));

  // ─── Per-hit damage loop ──────────────────────────────────────────────────
  // Each hit is evaluated against soak independently. Shield hits deplete
  // one-per-hit so late hits in a combo may not benefit from shield soak.
  const { physicalBase, magicalBase, shieldSoak, shieldHitsLeft } =
    getActorSoakComponents(system);

  let remainingShieldHits = shieldHitsLeft;
  let totalFinalDamage = 0;
  let totalEffectiveSoak = 0;
  let shieldUsed = false;

  // ─── Pre-compute elemental modifiers (target elements are stable across hits) ──
  const attackEls = elements.filter(
    e => e.name !== "no_element" && e.level > 0
  );
  let weaknessBonus = 0;
  let resistanceMult = 1;
  if (attackEls.length > 0) {
    const targetEls = [
      {
        name: (system as any).elements?.element1Name,
        level: (system as any).elements?.element1Level ?? 0
      },
      {
        name: (system as any).elements?.element2Name,
        level: (system as any).elements?.element2Level ?? 0
      }
    ].filter(e => e.name && e.name !== "no_element");

    const weaknessLevel = targetEls
      .filter(ce =>
        attackEls.some(ae => ae.name === ELEMENT_OPPOSITIONS[ce.name])
      )
      .reduce((acc, ce) => {
        const ae = attackEls.find(a => a.name === ELEMENT_OPPOSITIONS[ce.name]);
        return acc + ce.level + (ae?.level ?? 0);
      }, 0);

    const resistedEls = targetEls.filter(ce =>
      attackEls.some(ae => ae.name === ce.name)
    );

    weaknessBonus = ELEMENTAL_WEAKNESS_BONUS[weaknessLevel] ?? 0;
    resistedEls.forEach(re => {
      resistanceMult *=
        ELEMENTAL_RESISTANCE_MULT[Math.abs(re.level - weaknessLevel)] ?? 1;
    });
  }

  for (let i = 0; i < hitCount; i++) {
    // Pre-soak damage includes elemental weakness bonus
    const preSoakDamage = rawDamage + weaknessBonus;

    if (type === "unsoakable") {
      // Unsoakable: all damage bypasses soak on every hit; elemental resistance still applies
      totalFinalDamage += Math.floor(preSoakDamage * resistanceMult);
      continue;
    }

    // Shield contributes only while hits remain
    const shieldBonus =
      remainingShieldHits > 0 && shieldSoak > 0 ? shieldSoak : 0;
    const totalSoak =
      (type === "physical" ? physicalBase : magicalBase) + shieldBonus;

    const piercingPart = Math.min(piercing, preSoakDamage);
    const soakedPart = preSoakDamage - piercingPart;
    const absorbed = Math.min(totalSoak, soakedPart);
    let hitDamage = piercingPart + Math.max(0, soakedPart - totalSoak);

    // Apply elemental resistance to post-soak damage (mirrors StatusTab.vue logic)
    if (hitDamage > 0) hitDamage *= resistanceMult;
    hitDamage = Math.floor(hitDamage);

    totalFinalDamage += hitDamage;
    totalEffectiveSoak += absorbed;

    if (shieldBonus > 0) {
      remainingShieldHits = Math.max(0, remainingShieldHits - 1);
      shieldUsed = true;
    }
  }

  const finalDamage = totalFinalDamage;
  const newShieldHits = remainingShieldHits;

  // ─── HP delta ────────────────────────────────────────────────────────────
  const { value: oldHp, max, min } = system.resources.hp;
  const newHp = Math.max(min, oldHp - finalDamage);

  // ─── Gauge updates ───────────────────────────────────────────────────────
  const tranceMax = max * 2;
  const limitBreakMax = max * 4;
  const mult: number = system.gauges.multiplier;

  let newTrance: number = system.gauges.trance;
  let newLimitBreak: number = system.gauges.limitBreak;

  if (finalDamage > 0 && system.gauges.hasTrance) {
    if (newHp > 0) {
      newTrance = Math.min(
        tranceMax,
        newTrance + Math.floor(finalDamage * mult)
      );
    } else if (oldHp > 0) {
      newTrance = Math.max(0, newTrance - Math.floor(newTrance * 0.2));
    }
  }

  if (finalDamage > 0 && system.gauges.hasLimitBreak) {
    if (newHp > 0) {
      newLimitBreak = Math.min(
        limitBreakMax,
        newLimitBreak + Math.floor(finalDamage * mult)
      );
    } else if (oldHp > 0) {
      newLimitBreak = Math.max(
        0,
        newLimitBreak - Math.floor(newLimitBreak * 0.2)
      );
    }
  }

  // ─── Action history (for sheet Undo) ────────────────────────────────────
  const history: any[] = [...(system.actionHistory ?? [])];
  const undoSnapshot: Record<string, unknown> = {
    "resources.hp.value": oldHp
  };
  if (system.gauges.hasTrance)
    undoSnapshot["gauges.trance"] = system.gauges.trance;
  if (system.gauges.hasLimitBreak)
    undoSnapshot["gauges.limitBreak"] = system.gauges.limitBreak;
  if (shieldUsed) {
    undoSnapshot["soak.shieldHitsLeft"] = system.soak.shieldHitsLeft;
    if (system.armors) {
      undoSnapshot["armors"] = JSON.parse(JSON.stringify(system.armors));
    }
  }
  const historyLabel =
    hitCount > 1
      ? `${type}_damage_macro_${hitCount}hit`
      : `${type}_damage_macro`;
  history.push({ name: historyLabel, changes: JSON.stringify(undoSnapshot) });
  if (history.length > 20) history.shift();

  // ─── Build update payload ────────────────────────────────────────────────
  const updateData: Record<string, unknown> = {
    "system.resources.hp.value": newHp,
    "system.soak.shieldHitsLeft": newShieldHits,
    "system.gauges.trance": newTrance,
    "system.gauges.limitBreak": newLimitBreak,
    "system.actionHistory": history
  };

  if (shieldUsed && system.armors) {
    const armors: any[] = JSON.parse(JSON.stringify(system.armors));
    const idx = armors.findIndex((a: any) => a.equipped);
    if (idx >= 0) armors[idx].shield = newShieldHits;
    updateData["system.armors"] = armors;
  }

  await actor.update(updateData);

  return {
    rawDamage,
    finalDamage,
    effectiveSoak: totalEffectiveSoak,
    hits: hitCount,
    oldHp,
    newHp,
    type,
    piercing
  };
}
