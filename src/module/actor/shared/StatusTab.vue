<template>
  <div class="dw-status-tab">
    <!-- ─── HP Row ─────────────────────────────────────────────── -->
    <div class="dw-row">
      <span class="dw-label">HP:</span>
      <div class="dw-meter-wrap">
        <progress
          class="dw-meter"
          :value="system.resources.hp.value"
          :max="system.resources.hp.max || 1"
        />
        <span class="dw-meter-text">
          {{ system.resources.hp.value }} / {{ system.resources.hp.max }}
        </span>
      </div>
      <span class="dw-pct">{{ hpPercent }}%</span>
      <label class="dw-check-label">
        <input
          type="checkbox"
          :checked="system.combat.emp"
          @change="
            save('combat.emp', ($event.target as HTMLInputElement).checked)
          "
        />
        EMP
      </label>
      <select
        :value="system.combat.defenseEffect"
        @change="
          save(
            'combat.defenseEffect',
            ($event.target as HTMLSelectElement).value
          )
        "
        class="dw-select"
      >
        <option value="no_effect">No Defense Effect</option>
        <option value="protect">Protect</option>
        <option value="shell">Shell</option>
        <option value="wall">Wall</option>
        <option value="shield">Shield</option>
      </select>
      <select
        :value="system.combat.braceType"
        @change="
          save('combat.braceType', ($event.target as HTMLSelectElement).value)
        "
        class="dw-select dw-select-sm"
      >
        <option value="no_brace">No Brace</option>
        <option value="brace">Brace</option>
        <option value="half_brace">Half Brace</option>
      </select>
    </div>

    <!-- ─── Soak Row ──────────────────────────────────────────── -->
    <div class="dw-row">
      <span class="dw-label">Soak:</span>
      <span class="dw-soak-text">
        P: {{ system.soak.physicalBase }}({{ totalPhysical }}), M:
        {{ system.soak.magicalBase }}({{ totalMagical }}), S:
        {{ system.soak.shield }}
      </span>
      <button
        class="dw-btn"
        @click="resetShield"
        :title="'Reset shield hits to max'"
      >
        Shield ({{ system.soak.shieldHitsLeft }})
      </button>
      <label class="dw-check-label">
        <input
          type="checkbox"
          :checked="system.combat.unsoakable"
          @change="
            save(
              'combat.unsoakable',
              ($event.target as HTMLInputElement).checked
            )
          "
        />
        Unsoakable
      </label>
    </div>

    <!-- ─── Damage Row ────────────────────────────────────────── -->
    <div class="dw-row">
      <button class="dw-btn" @click="resetDamageState">Reset</button>
      <select
        :value="system.combat.damageType"
        @change="
          save('combat.damageType', ($event.target as HTMLSelectElement).value)
        "
        class="dw-select"
      >
        <option value="0">Normal Damage</option>
        <option value="1">Elemental Damage</option>
      </select>
      <input
        type="text"
        class="dw-input-sm"
        :value="system.combat.damage"
        @change="
          save('combat.damage', ($event.target as HTMLInputElement).value)
        "
        title="Damage/Healing (1 or 1% or 1%c)"
        placeholder="0"
      />
      <button class="dw-btn" @click="dealDamage('physical')">Physical</button>
      <button class="dw-btn" @click="dealDamage('magical')">Magical</button>
      <button class="dw-btn" @click="dealHealing">Heal</button>
      <button class="dw-btn" @click="undoLastAction">Undo</button>
    </div>

    <!-- ─── Elemental Row (visible when elemental damage) ─────── -->
    <div v-if="system.combat.damageType === '1'" class="dw-row dw-row-indent">
      <span class="dw-label">Elem 1:</span>
      <select
        :value="system.elements.selectedElement1Name"
        @change="
          save(
            'elements.selectedElement1Name',
            ($event.target as HTMLSelectElement).value
          )
        "
        class="dw-select"
      >
        <option v-for="el in elementChoices" :key="el.key" :value="el.key">
          {{ el.label }}
        </option>
      </select>
      <select
        :value="system.elements.selectedElement1Level"
        @change="
          save(
            'elements.selectedElement1Level',
            Number(($event.target as HTMLSelectElement).value)
          )
        "
        class="dw-select dw-select-xs"
      >
        <option v-for="n in 11" :key="n - 1" :value="n - 1">{{ n - 1 }}</option>
      </select>
      <span class="dw-label">Elem 2:</span>
      <select
        :value="system.elements.selectedElement2Name"
        @change="
          save(
            'elements.selectedElement2Name',
            ($event.target as HTMLSelectElement).value
          )
        "
        class="dw-select"
      >
        <option v-for="el in elementChoices" :key="el.key" :value="el.key">
          {{ el.label }}
        </option>
      </select>
      <select
        :value="system.elements.selectedElement2Level"
        @change="
          save(
            'elements.selectedElement2Level',
            Number(($event.target as HTMLSelectElement).value)
          )
        "
        class="dw-select dw-select-xs"
      >
        <option v-for="n in 11" :key="n - 1" :value="n - 1">{{ n - 1 }}</option>
      </select>
    </div>

    <!-- ─── Trance Row ────────────────────────────────────────── -->
    <div v-if="system.gauges.hasTrance" class="dw-row">
      <span class="dw-label">Trance:</span>
      <div class="dw-meter-wrap">
        <progress
          class="dw-meter dw-meter-trance"
          :value="system.gauges.trance"
          :max="tranceMax"
        />
        <span class="dw-meter-text">{{ trancePct }}%</span>
      </div>
      <button class="dw-btn" @click="activateTrance">Activate</button>
    </div>

    <!-- ─── Limit Break Row ───────────────────────────────────── -->
    <div v-if="system.gauges.hasLimitBreak" class="dw-row">
      <span class="dw-label">Limit Break:</span>
      <div class="dw-meter-wrap">
        <progress
          class="dw-meter dw-meter-lb"
          :value="system.gauges.limitBreak"
          :max="limitBreakMax"
        />
        <span class="dw-meter-text">{{ limitBreakPct }}%</span>
      </div>
      <input
        type="number"
        class="dw-input-num"
        :value="spendLbAmount"
        @change="
          spendLbAmount = Number(($event.target as HTMLInputElement).value)
        "
        min="0"
        title="Amount of Limit Break to spend"
        placeholder="0"
      />
      <button class="dw-btn" @click="spendLimitBreak">Spend</button>
    </div>

    <!-- ─── Gauge Multiplier Row ──────────────────────────────── -->
    <div
      v-if="system.gauges.hasTrance || system.gauges.hasLimitBreak"
      class="dw-row"
    >
      <span class="dw-label dw-label-wide">Trance/Limit<br />Multiplier:</span>
      <input
        type="number"
        class="dw-input-num"
        :value="system.gauges.multiplier"
        @change="
          save(
            'gauges.multiplier',
            Number(($event.target as HTMLInputElement).value)
          )
        "
        min="0"
        step="0.1"
      />
      <input
        type="text"
        class="dw-input-sm"
        v-model="gaugeMod"
        placeholder=""
        title="Modify trance/LB by this amount"
      />
      <button class="dw-btn" @click="modifyGauge">Modify To/By</button>
    </div>

    <!-- ─── MP Row ────────────────────────────────────────────── -->
    <div class="dw-row">
      <span class="dw-label">MP:</span>
      <div class="dw-meter-wrap">
        <progress
          class="dw-meter dw-meter-mp"
          :value="system.resources.mp.value"
          :max="system.resources.mp.max || 1"
        />
        <span class="dw-meter-text">
          {{ system.resources.mp.value }} / {{ system.resources.mp.max }}
        </span>
      </div>
      <input
        type="text"
        class="dw-input-sm"
        v-model="mpMod"
        placeholder=""
        title="MP modification amount"
      />
      <button class="dw-btn dw-btn-sm" @click="modifyMp(-1)">-</button>
      <button class="dw-btn dw-btn-sm" @click="modifyMp(1)">+</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { inject, computed, ref } from "vue";
import type { DwBaseSheet } from "../DwBaseSheet";

type DwSystem = {
  resources: {
    hp: { value: number; max: number; min: number };
    mp: { value: number; max: number; min: number };
  };
  combat: {
    emp: boolean;
    defenseEffect: string;
    braceType: string;
    unsoakable: boolean;
    damageType: string;
    damage: string;
  };
  soak: {
    physicalBase: number;
    magicalBase: number;
    armoredPhysical: number;
    armoredMagical: number;
    shield: number;
    shieldHitsLeft: number;
    shieldHitsMax: number;
  };
  gauges: {
    hasTrance: boolean;
    trance: number;
    hasLimitBreak: boolean;
    limitBreak: number;
    multiplier: number;
  };
  elements: {
    element1Name: string;
    element1Level: number;
    element2Name: string;
    element2Level: number;
    selectedElement1Name: string;
    selectedElement1Level: number;
    selectedElement2Name: string;
    selectedElement2Level: number;
  };
  actionHistory: { name: string; changes: string }[];
};

const system = inject<DwSystem>("reactiveSystem")!;
const actor = inject<Actor>("actor")!;
const sheet = inject<DwBaseSheet>("sheet")!;

// ─── Local transient state ─────────────────────────────────────────────────
const mpMod = ref("");
const gaugeMod = ref("");
const spendLbAmount = ref(0);

// ─── Constants ─────────────────────────────────────────────────────────────
const elementChoices = [
  { key: "no_element", label: "No Element" },
  { key: "fire", label: "Fire" },
  { key: "water", label: "Water" },
  { key: "earth", label: "Earth" },
  { key: "wind", label: "Wind" },
  { key: "shadow", label: "Shadow" },
  { key: "light", label: "Light" },
  { key: "force", label: "Force" },
  { key: "time", label: "Time" },
  { key: "darkness", label: "Darkness" },
  { key: "holy", label: "Holy" }
];

const elementOppositions: Record<string, string> = {
  fire: "water",
  water: "fire",
  earth: "wind",
  wind: "earth",
  shadow: "light",
  light: "shadow",
  force: "time",
  time: "force",
  darkness: "holy",
  holy: "darkness"
};

const elementalWeakness: Record<number, number> = {
  0: 0,
  1: 500,
  2: 1000,
  3: 1500,
  4: 2000,
  5: 2500,
  7: 3500,
  8: 4000,
  9: 4500,
  10: 5000
};

const elementalResistance: Record<number, number> = {
  0: 1,
  1: 0.75,
  2: 0.5,
  3: 0.33,
  4: 0.2,
  5: 0
};

// ─── Computed ──────────────────────────────────────────────────────────────
const hpPercent = computed(() => {
  const { value, max } = system.resources.hp;
  if (!max) return 0;
  return Math.round((value / max) * 100 * 100) / 100;
});

const totalPhysical = computed(
  () => system.soak.physicalBase + system.soak.armoredPhysical
);
const totalMagical = computed(
  () => system.soak.magicalBase + system.soak.armoredMagical
);

/** Max trance = max_hp * 2  */
const tranceMax = computed(() => system.resources.hp.max * 2);
const trancePct = computed(() => {
  if (!tranceMax.value) return 0;
  return Math.round((system.gauges.trance / tranceMax.value) * 100);
});

/** Max limit break = max_hp * 4 */
const limitBreakMax = computed(() => system.resources.hp.max * 4);
const limitBreakPct = computed(() => {
  if (!limitBreakMax.value) return 0;
  return Math.round((system.gauges.limitBreak / limitBreakMax.value) * 100);
});

// ─── Helpers ───────────────────────────────────────────────────────────────
function save(path: string, value: unknown) {
  const keys = path.split(".");
  // Update reactive system immediately for snappy UI
  let obj = system as Record<string, unknown>;
  for (let i = 0; i < keys.length - 1; i++) {
    obj = obj[keys[i]] as Record<string, unknown>;
  }
  obj[keys[keys.length - 1]] = value;
  // Persist to Foundry
  sheet.saveSystem({ [path]: value });
}

function parseDmgValue(raw: string, cur: number, max: number): number {
  let dmg: number;
  if (/^\d+\.?\d*%$/.test(raw)) {
    dmg = Math.round(max * (parseFloat(raw) / 100));
  } else if (/^\d+\.?\d*%c$/i.test(raw)) {
    dmg = Math.round(cur * (parseFloat(raw) / 100));
  } else {
    dmg = Math.round(parseFloat(raw));
  }
  return isNaN(dmg) ? 0 : dmg;
}

function calcElementalModifiers() {
  const charEls = [
    {
      name: system.elements.element1Name,
      level: system.elements.element1Level
    },
    { name: system.elements.element2Name, level: system.elements.element2Level }
  ].filter(e => e.name !== "no_element");
  const dmgEls = [
    {
      name: system.elements.selectedElement1Name,
      level: system.elements.selectedElement1Level
    },
    {
      name: system.elements.selectedElement2Name,
      level: system.elements.selectedElement2Level
    }
  ].filter(e => e.name !== "no_element");

  const resistedElements = charEls.filter(ce =>
    dmgEls.some(de => de.name === ce.name)
  );
  const weaknessLevel = charEls
    .filter(ce => dmgEls.some(de => de.name === elementOppositions[ce.name]))
    .reduce((acc, ce) => {
      const de = dmgEls.find(d => d.name === elementOppositions[ce.name]);
      return acc + ce.level + (de?.level ?? 0);
    }, 0);

  return { resistedElements, weaknessLevel };
}

function pushHistory(name: string, changes: Record<string, unknown>) {
  const history = [...(system.actionHistory ?? [])];
  history.push({ name, changes: JSON.stringify(changes) });
  // Keep only last 20 actions
  if (history.length > 20) history.shift();
  system.actionHistory = history;
  sheet.saveSystem({ actionHistory: history });
}

// ─── Actions ───────────────────────────────────────────────────────────────
async function dealDamage(type: "physical" | "magical") {
  const { value: cur, max } = system.resources.hp;
  const {
    physicalBase: pSoak,
    magicalBase: mSoak,
    armoredPhysical,
    armoredMagical,
    shield,
    shieldHitsLeft
  } = system.soak;
  const totalPSoak = pSoak + armoredPhysical;
  const totalMSoak = mSoak + armoredMagical;

  let dmg = parseDmgValue(system.combat.damage, cur, max);

  if (system.combat.damageType === "1") {
    const { resistedElements, weaknessLevel } = calcElementalModifiers();
    dmg += elementalWeakness[weaknessLevel] ?? 0;
    if (!system.combat.unsoakable) {
      dmg -= type === "physical" ? totalPSoak : totalMSoak;
    }
    if (resistedElements.length > 0 && dmg > 0) {
      resistedElements.forEach(re => {
        dmg *= elementalResistance[Math.abs(re.level - weaknessLevel)] ?? 1;
      });
    }
  } else if (!system.combat.unsoakable) {
    dmg -= type === "physical" ? totalPSoak : totalMSoak;
  }

  // Shield
  let newShieldHits = shieldHitsLeft;
  if (!system.combat.emp && shieldHitsLeft > 0 && shield > 0) {
    dmg -= shield;
    newShieldHits = Math.max(0, shieldHitsLeft - 1);
  }

  // Defense effect
  const effectType = type === "physical" ? "protect" : "shell";
  const def = system.combat.defenseEffect;
  if (def === effectType || def === "wall") {
    dmg /= 2;
  } else if (def === "shield") {
    dmg *= 0.1;
  }

  // Brace
  if (system.combat.braceType === "brace") {
    dmg /= 2;
  } else if (system.combat.braceType === "half_brace") {
    dmg *= 0.75;
  }

  if (dmg <= 0) {
    dmg = 0;
  }
  dmg = Math.floor(dmg);

  const oldHp = cur;
  const newHp = Math.max(system.resources.hp.min, cur - dmg);

  // Gauge update (trance/limitbreak)
  let newTrance = system.gauges.trance;
  let newLimitBreak = system.gauges.limitBreak;
  const mult = system.gauges.multiplier;

  if (dmg > 0 && system.gauges.hasTrance) {
    if (newHp > 0) {
      newTrance = Math.min(tranceMax.value, newTrance + Math.floor(dmg * mult));
    } else if (oldHp > 0) {
      newTrance = Math.max(0, newTrance - Math.floor(newTrance * 0.2));
    }
  }
  if (dmg > 0 && system.gauges.hasLimitBreak) {
    if (newHp > 0) {
      newLimitBreak = Math.min(
        limitBreakMax.value,
        newLimitBreak + Math.floor(dmg * mult)
      );
    } else if (oldHp > 0) {
      newLimitBreak = Math.max(
        0,
        newLimitBreak - Math.floor(newLimitBreak * 0.2)
      );
    }
  }

  const changes: Record<string, unknown> = { "resources.hp.value": oldHp };

  // Apply
  system.resources.hp.value = newHp;
  system.soak.shieldHitsLeft = newShieldHits;
  system.gauges.trance = newTrance;
  system.gauges.limitBreak = newLimitBreak;

  await sheet.saveSystem({
    "resources.hp.value": newHp,
    "soak.shieldHitsLeft": newShieldHits,
    "gauges.trance": newTrance,
    "gauges.limitBreak": newLimitBreak
  });

  pushHistory(`${type}_damage`, changes);
}

async function dealHealing() {
  const { value: cur, max } = system.resources.hp;
  const heal = parseDmgValue(system.combat.damage, cur, max);
  if (heal <= 0) return;
  const newHp = Math.min(max, cur + heal);
  const changes: Record<string, unknown> = { "resources.hp.value": cur };
  system.resources.hp.value = newHp;
  await sheet.saveSystem({ "resources.hp.value": newHp });
  pushHistory("heal", changes);
}

async function undoLastAction() {
  const history = [...(system.actionHistory ?? [])];
  if (!history.length) return;
  const last = history.pop()!;
  const changes: Record<string, unknown> = JSON.parse(last.changes ?? "{}");
  system.actionHistory = history;
  const undoUpdates: Record<string, unknown> = {
    "system.actionHistory": history
  };
  for (const [path, oldVal] of Object.entries(changes)) {
    undoUpdates[`system.${path}`] = oldVal;
    const sysKeys = path.split(".");
    let sysObj = system as Record<string, unknown>;
    for (let i = 0; i < sysKeys.length - 1; i++) {
      sysObj = sysObj[sysKeys[i]] as Record<string, unknown>;
    }
    if (sysObj) sysObj[sysKeys[sysKeys.length - 1]] = oldVal;
  }
  await (actor as any).update(undoUpdates);
}

async function resetShield() {
  const max = system.soak.shieldHitsMax;
  system.soak.shieldHitsLeft = max;
  await sheet.saveSystem({ "soak.shieldHitsLeft": max });
}

async function resetDamageState() {
  system.combat.damageType = "0";
  system.combat.damage = "0";
  system.elements.selectedElement1Name = "no_element";
  system.elements.selectedElement1Level = 0;
  system.elements.selectedElement2Name = "no_element";
  system.elements.selectedElement2Level = 0;
  await sheet.saveSystem({
    "combat.damageType": "0",
    "combat.damage": "0",
    "elements.selectedElement1Name": "no_element",
    "elements.selectedElement1Level": 0,
    "elements.selectedElement2Name": "no_element",
    "elements.selectedElement2Level": 0
  });
}

async function activateTrance() {
  // Activating uses 100% trance
  const full = tranceMax.value;
  if (system.gauges.trance < full) {
    ui.notifications?.warn("Trance gauge is not full.");
    return;
  }
  system.gauges.trance = 0;
  await sheet.saveSystem({ "gauges.trance": 0 });
}

async function spendLimitBreak() {
  const amount = spendLbAmount.value;
  if (!amount) return;
  const newVal = Math.max(0, system.gauges.limitBreak - amount);
  system.gauges.limitBreak = newVal;
  spendLbAmount.value = 0;
  await sheet.saveSystem({ "gauges.limitBreak": newVal });
}

async function modifyGauge() {
  const raw = gaugeMod.value;
  if (!raw) return;
  const isRelative = raw.startsWith("+") || raw.startsWith("-");
  const amount = parseFloat(raw);
  if (isNaN(amount)) return;

  const updates: Record<string, unknown> = {};

  if (system.gauges.hasTrance) {
    const newVal = isRelative
      ? Math.max(0, Math.min(tranceMax.value, system.gauges.trance + amount))
      : Math.max(0, Math.min(tranceMax.value, amount));
    system.gauges.trance = newVal;
    updates["gauges.trance"] = newVal;
  }
  if (system.gauges.hasLimitBreak) {
    const newVal = isRelative
      ? Math.max(
          0,
          Math.min(limitBreakMax.value, system.gauges.limitBreak + amount)
        )
      : Math.max(0, Math.min(limitBreakMax.value, amount));
    system.gauges.limitBreak = newVal;
    updates["gauges.limitBreak"] = newVal;
  }

  gaugeMod.value = "";
  await sheet.saveSystem(updates);
}

async function modifyMp(sign: 1 | -1) {
  const raw = mpMod.value;
  const { value: cur, max, min } = system.resources.mp;
  let delta: number;
  if (raw && raw.trim() !== "") {
    delta = sign * parseDmgValue(raw, cur, max);
  } else {
    delta = sign * 1;
  }
  const newVal = Math.min(max, Math.max(min, cur + delta));
  system.resources.mp.value = newVal;
  await sheet.saveSystem({ "resources.mp.value": newVal });
}
</script>
