/**
 * Dice Utilities for Dimensional War Skill System
 *
 * Handles skill level to die size conversions and physical dice formulas
 * for achieving true uniform distribution using only Dice So Nice supported dice.
 */

import { SystemActor } from "../documents";
import { BaseData } from "../types/base-data";

/**
 * Get the die size for a given skill level according to Dimensional War rules
 * Level 0: 1d40 (no bonus allowed)
 * Level 1: 1d40
 * Level 2-3: 1d60
 * Level 4-5: 1d90
 * Level 6-7: 1d140
 * Level 8-9: 1d220
 * Level 10: 1d350
 * Level 11+: 1d375 (for temporary boosts beyond base skill cap)
 */
export function getSkillDieSize(level: number): number {
  if (level <= 1) return 40;
  if (level <= 3) return 60;
  if (level <= 5) return 90;
  if (level <= 7) return 140;
  if (level <= 9) return 220;
  if (level === 10) return 350;
  return 375; // level 11+
}

/**
 * Get physical dice formula for a given die size using only Dice So Nice supported dice.
 * Uses the "digit method" to achieve true uniform distribution (each value equally likely).
 *
 * Examples:
 *   1d40 = (1d4 - 1) * 10 + 1d10  → Ranges from (0*10)+1=1 to (3*10)+10=40
 *   1d60 = (1d6 - 1) * 10 + 1d10  → Ranges from 1 to 60
 *
 * @param dieSize - The target die size (40, 60, 90, 140, 220, 350, 375)
 * @returns Roll formula string using real physical dice
 */
export function getPhysicalDiceFormula(dieSize: number): string {
  switch (dieSize) {
    case 40:
      // Uses: D4, D10 → 1-40 uniform
      return "(1d4 - 1) * 10 + 1d10";
    case 60:
      // Uses: D6, D10 → 1-60 uniform
      return "(1d6 - 1) * 10 + 1d10";
    case 90:
      // Uses: D3, D30 → 1-90 uniform
      return "(1d3 - 1) * 30 + 1d30";
    case 140:
      // Uses: D14, D10 → 1-140 uniform
      return "(1d14 - 1) * 10 + 1d10";
    case 220:
      // Uses: D8, D30 → 1-240 range (close approximation, 9% wider)
      // True 1d220 would require reroll logic for 221-240
      return "(1d8 - 1) * 30 + 1d30";
    case 350:
      // Uses: D5, D7, D10 → 1-350 uniform
      // Hundreds: (1d5-1)*70 = 0,70,140,210,280
      // Tens: (1d7-1)*10 = 0,10,20,30,40,50,60
      // Ones: 1d10 = 1-10
      return "(1d5 - 1) * 70 + (1d7 - 1) * 10 + 1d10";
    case 375:
      // Uses: D3, D5 → 1-375 uniform (3 × 5 × 5 × 5 = 375)
      // 125s place: (1d3-1)*125 = 0,125,250
      // 25s place: (1d5-1)*25 = 0,25,50,75,100
      // 5s place: (1d5-1)*5 = 0,5,10,15,20
      // 1s place: 1d5 = 1-5
      return "(1d3 - 1) * 125 + (1d5 - 1) * 25 + (1d5 - 1) * 5 + 1d5";
    default:
      // Fallback for any unexpected values
      return `1d${dieSize}`;
  }
}

/**
 * Result of parsing a crit/fail multiplier string from a roll formula.
 * Matches the IRC `parseMults` syntax: *N, *Nc, *Nf, *Nc,Mf, *NcMf
 */
export interface ParseMultsResult {
  /** Formula with the *N[c/f] modifier stripped */
  cleanFormula: string;
  critMult: number;
  failMult: number;
}

/**
 * Parse and strip an optional crit/fail range multiplier from a roll formula.
 *
 * Supported syntax (mirrors IRC's parseMults):
 *   1s5*2      → critMult=2, failMult=2
 *   1s5*2c     → critMult=2, failMult=1
 *   1s5*2f     → critMult=1, failMult=2
 *   1s5*2c,3f  → critMult=2, failMult=3
 *   1s5*2c3f   → critMult=2, failMult=3  (compact, no comma)
 */
export function parseMults(formula: string): ParseMultsResult {
  const multsRegex = /\*(\d[\d,cf]*)/i;
  const match = formula.match(multsRegex);
  if (!match) return { cleanFormula: formula, critMult: 1, failMult: 1 };

  const cleanFormula = formula.replace(multsRegex, "").trim();
  const content = match[1];

  let critMult = 1;
  let failMult = 1;

  // Compact format: "2c3f" or "2f3c"
  const compact = content.match(/^(\d+)([cf])(\d+)([cf])$/i);
  if (compact) {
    const aVal = parseInt(compact[1]);
    const aSide = compact[2].toLowerCase();
    const bVal = parseInt(compact[3]);
    const bSide = compact[4].toLowerCase();
    if (aSide !== bSide) {
      if (aSide === "c") critMult = aVal;
      else failMult = aVal;
      if (bSide === "c") critMult = bVal;
      else failMult = bVal;
    }
    return { cleanFormula, critMult, failMult };
  }

  // Comma-separated or single tag: "2", "2c", "3f", "2c,3f"
  const parts = content.split(",");
  for (const part of parts) {
    const p = part.match(/^(\d+)([cf]?)$/i);
    if (!p) continue;
    const val = parseInt(p[1]);
    const side = p[2].toLowerCase();
    if (side === "c") critMult = val;
    else if (side === "f") failMult = val;
    else {
      critMult = val;
      failMult = val;
    }
  }

  return { cleanFormula, critMult, failMult };
}

/**
 * Apply a signed dice modifier to every die term (e.g. "1s5" or "1d20") in a formula,
 * shifting the die size up or down. "1s5" with diceMod=-1 becomes "1s4";
 * "1d20" with diceMod=-1 becomes "1d19".
 */
export function applyDiceModifier(formula: string, diceMod: number): string {
  if (!diceMod) return formula;
  return formula.replace(
    /(\d+)([sd])(\d+)/gi,
    (_match, diceCount, dieType, dieSize) => {
      const newSize = Math.max(0, parseInt(dieSize, 10) + diceMod);
      return `${diceCount}${dieType}${newSize}`;
    }
  );
}

/**
 * One roll to be merged into a single combined chat message.
 */
export interface CombinedRollEntry {
  actor: SystemActor;
  tokenId?: string;
  formula: string;
  label: string;
  /** Extra per-entry data to include in the message's group flag array (e.g. senseType). */
  extraFlags?: Record<string, any>;
}

/**
 * Strip characters that would break out of a formula's "[flavor]" bracket
 * annotation or the formula syntax itself.
 */
function sanitizeFlavorLabel(label: string): string {
  return label.replace(/[[\]]/g, "");
}

/**
 * Sum a contiguous run of already-evaluated RollTerms (operators + operands),
 * left-to-right, the same way Roll evaluates a flat term sequence.
 */
function sumTermGroup(terms: foundry.dice.terms.RollTerm[]): number {
  let total = 0;
  let operator = "+";
  for (const term of terms) {
    const op = (term as any).operator;
    if (op) {
      operator = op;
      continue;
    }
    const value = (term as any).total ?? (term as any).number ?? 0;
    switch (operator) {
      case "-":
        total -= value;
        break;
      case "*":
        total *= value;
        break;
      case "/":
        total /= value;
        break;
      default:
        total += value;
    }
  }
  return total;
}

/**
 * Split an evaluated Roll's terms back into per-entry groups using the
 * "[flavor]" label attached to each entry's final term as the group
 * boundary, then sum each group to recover that entry's own subtotal.
 */
function splitTermsByFlavor(terms: foundry.dice.terms.RollTerm[]): number[] {
  const totals: number[] = [];
  let current: foundry.dice.terms.RollTerm[] = [];

  for (let i = 0; i < terms.length; i++) {
    const term = terms[i];
    current.push(term);
    const flavor = (term as any).options?.flavor ?? (term as any).flavor;
    if (flavor) {
      totals.push(sumTermGroup(current));
      current = [];
      // Skip the "+" joiner between entries; it belongs to neither group.
      if ((terms[i + 1] as any)?.operator) i++;
    }
  }
  if (current.length) totals.push(sumTermGroup(current));

  return totals;
}

/**
 * Combine several tokens' roll formulas into a single chained formula —
 * "(x)s(y)(+/-/*)(z)[label] + (x)s(y)(+/-/*)(z)[label] + ..." — evaluate it
 * with ONE Roll, and post ONE chat message. Each entry's own subtotal is
 * still recovered afterwards (for flags/overlays) by splitting the evaluated
 * terms at each entry's "[label]" marker.
 *
 * @param entries Rolls to combine, in formula order
 * @param flavorTitle Flavor text/title shown on the combined message
 * @param groupFlagKey Key under `flags.dimensionalwar` where the per-entry
 *   results array is stored (e.g. "perceptionGroup", "rollGroup")
 */
export async function executeCombinedRoll(
  entries: CombinedRollEntry[],
  flavorTitle: string,
  groupFlagKey: string
): Promise<void> {
  if (!entries.length) return;

  const formula = entries
    .map(entry => `${entry.formula}[${sanitizeFlavorLabel(entry.label)}]`)
    .join(" + ");

  let roll: Roll;
  try {
    roll = Roll.create(formula);
    await roll.evaluate();
  } catch (e) {
    ui.notifications?.error(`Invalid combined roll formula: ${formula}`);
    return;
  }

  const subtotals = splitTermsByFlavor(roll.terms);

  await ChatMessage.create({
    rolls: [roll],
    flavor: flavorTitle,
    speaker: ChatMessage.getSpeaker({ actor: entries[0].actor as any }),
    flags: {
      dimensionalwar: {
        combined: true,
        [groupFlagKey]: entries.map((entry, i) => ({
          tokenId: entry.tokenId,
          total: subtotals[i] ?? roll.total,
          ...entry.extraFlags
        }))
      }
    }
  } as any);
}

/**
 * Compute the roll formula for a movement check, using skill-notation "s" dice.
 */
export function getMovementFormula(
  actor: SystemActor,
  movementType: "Walking" | "Acrobatics" | "Swimming" | "Flying" | "Burrowing"
): string {
  const skillMap: Record<string, string> = {
    Walking: "Athletics",
    Acrobatics: "Acrobatics",
    Swimming: "Swimming",
    Flying: "Athletics",
    Burrowing: "Athletics"
  };
  const skillName = skillMap[movementType] || "Athletics";

  let skillLevel = 0;
  let skillBonus = 0;
  const skillCategories = ["movement", "utility", "combat"];
  for (const category of skillCategories) {
    const categorySkills = (actor.system as any).skills?.[category];
    if (categorySkills?.[skillName]) {
      skillLevel = categorySkills[skillName].level ?? 0;
      skillBonus = categorySkills[skillName].bonus ?? 0;
      break;
    }
  }

  return skillBonus !== 0
    ? `1s${skillLevel}${skillBonus >= 0 ? "+" : ""}${skillBonus}`
    : `1s${skillLevel}`;
}

export async function doRoll(
  actor: SystemActor,
  system: BaseData.DwSystem,
  idx: number,
  updateBaseActor = false,
  diceMod = 0,
  bonusMod = 0
) {
  const entry = system.rolls[idx];
  if (!entry) return;
  const formulaBase = applyDiceModifier(
    entry.bonusFormula?.trim() || "1d20",
    diceMod
  );
  const totalBonus = (entry.bonusNumber || 0) + bonusMod;
  const formula = totalBonus ? `${formulaBase} + ${totalBonus}` : formulaBase;
  try {
    if (entry.mpCost > 0) {
      if (system.resources.mp.value < entry.mpCost) {
        ui.notifications?.warn(`Not enough MP to perform this roll.`);
        return;
      }

      if (updateBaseActor) {
        // Update the base actor document (for use outside sheet context)
        const newMP = system.resources.mp.value - entry.mpCost;
        await actor.update({ "system.resources.mp.value": newMP } as any);
      } else {
        // Update reactive system (for use within sheet context)
        system.resources.mp.value -= entry.mpCost;
      }
    }
  } catch (e) {
    ui.notifications?.error(`Failed to deduct MP: ${e}`);
  }
  try {
    const targets =
      (game.user.targets.size > 0 ? " -> " : "") +
      Array.from(game.user.targets)
        .map(t => t.name)
        .join(", ");
    const roll = Roll.create(formula);
    await roll.evaluate();
    await roll.toMessage({
      speaker: ChatMessage.getSpeaker({ actor: actor as any }),
      flavor: entry.reasonBase
        ? `${entry.reasonBase} (${entry.category})${targets}`
        : entry.category + targets
    });
  } catch (e) {
    ui.notifications?.error(`Invalid roll formula: ${formula}`);
  }
}
