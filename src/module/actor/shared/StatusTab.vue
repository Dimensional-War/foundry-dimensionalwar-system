<template>
  <div class="dw-status-tab">
    <!-- ─── HP Row ─────────────────────────────────────────────── -->
    <div class="flex gap-1 my-2">
      <div class="basis-2/12 my-2 font-bold">HP:</div>
      <div class="basis-5/12 ml-1">
        <div class="relative h-6 bg-gray-200 rounded overflow-hidden">
          <div
            class="absolute inset-y-0 left-0 flex items-center justify-center transition-all"
            :class="
              hpPercent < 25
                ? 'bg-red-600'
                : hpPercent < 50
                  ? 'bg-yellow-500'
                  : 'bg-green-600'
            "
            :style="`width: ${hpPercent}%`"
          >
            <span
              class="text-white text-xs font-semibold px-2 whitespace-nowrap"
              :title="`${system.resources.hp.value}/${system.resources.hp.max} (${hpPercent}%)`"
            >
              {{ system.resources.hp.value }}/{{ system.resources.hp.max }} ({{
                hpPercent
              }}%)
            </span>
          </div>
        </div>
      </div>
      <div class="basis-5/12">
        <div class="flex gap-0">
          <button
            type="button"
            class="grow px-3 py-1.5 border border-gray-600 cursor-pointer transition-colors first:rounded-l last:rounded-r -ml-px first:ml-0"
            :class="
              system.combat.emp
                ? 'bg-blue-600 text-white border-blue-600 z-10'
                : ' text-gray-700 hover:bg-gray-50'
            "
            @click="save('combat.emp', !system.combat.emp)"
          >
            EMP
          </button>
          <select
            v-model="system.combat.defenseEffect"
            class="flex-1 px-3 py-1.5 border border-gray-600 text-gray-700 -ml-px focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:z-10"
          >
            <option value="no_effect">No Defense Effect</option>
            <option value="protect">Protect</option>
            <option value="shell">Shell</option>
            <option value="wall">Wall</option>
            <option value="shield">Shield</option>
          </select>
          <select
            v-model="system.combat.braceType"
            class="flex-1 px-3 py-1.5 border border-gray-600 rounded-r text-gray-700 -ml-px focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:z-10"
          >
            <option value="no_brace">No Brace</option>
            <option value="brace">Brace</option>
            <option value="half_brace">Half Brace</option>
          </select>
        </div>
      </div>
    </div>

    <!-- ─── Soak Row ──────────────────────────────────────────── -->
    <div class="flex flex-wrap items-center gap-1 mb-2">
      <div class="basis-2/12 my-2 font-bold">Soak:</div>
      <div class="flex-1 ml-1">
        <span title="Physical Soak (base + armor + shield)"
          ><span class="font-bold">P: </span>{{ system.soak.physicalBase }}({{
            totalPhysical
          }})</span
        >
        <span>, </span>
        <span title="Magical Soak (base + armor + shield)"
          ><span class="font-bold">M: </span>{{ system.soak.magicalBase }}({{
            totalMagical
          }})</span
        >
        <br v-if="system.soak.shieldSoak > 0" />
        <span
          v-if="system.soak.shieldSoak > 0"
          title="Shield adds to soak for limited hits"
          :class="{
            'text-green-600 font-semibold': system.soak.shieldHitsLeft > 0,
            'text-gray-400 line-through': system.soak.shieldHitsLeft === 0
          }"
          ><span class="font-bold">Shield: </span>+{{
            system.soak.shieldSoak
          }}
          ({{ system.soak.shieldHitsLeft }} hits)</span
        >
      </div>
      <div class="flex-1">
        <div class="flex gap-0">
          <button
            type="button"
            class="flex-1 px-3 py-1.5 border border-gray-600 rounded-l cursor-pointer transition-colors"
            :class="
              system.soak.shieldHitsLeft > 0
                ? 'bg-blue-600 text-white border-blue-600 z-10'
                : ' text-gray-700 hover:bg-gray-50'
            "
            @click="resetShield"
            :title="'Reset shield hits to max'"
          >
            Shield ({{ system.soak.shieldHitsLeft }})
          </button>
          <button
            type="button"
            class="flex-1 px-3 py-1.5 border border-gray-600 rounded-r cursor-pointer transition-colors -ml-px"
            :class="
              system.combat.unsoakable
                ? 'bg-blue-600 text-white border-blue-600 z-10'
                : ' text-gray-700 hover:bg-gray-50'
            "
            @click="save('combat.unsoakable', !system.combat.unsoakable)"
          >
            Unsoakable
          </button>
        </div>
      </div>
    </div>

    <!-- ─── Damage Row ────────────────────────────────────────── -->
    <div class="flex flex-wrap gap-1">
      <div class="basis-1/3">
        <select
          v-model="system.combat.damageType"
          class="px-3 py-1.5 border border-gray-600 rounded text-gray-700 w-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="0">Normal Damage</option>
          <option value="1">Elemental Damage</option>
        </select>
      </div>
      <div class="basis-1/4">
        <input
          type="text"
          class="px-3 py-1.5 border border-gray-600 rounded text-gray-700 w-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          v-model="system.combat.damage"
          :title="'Damage/Healing (1 or 1% or 1%c)'"
          placeholder="Damage (1 or 1%)"
        />
      </div>
      <div class="flex-1">
        <div class="flex gap-0">
          <button
            type="button"
            class="flex-1 px-3 py-1.5 border border-gray-600 rounded-l text-gray-700 hover:bg-gray-50 cursor-pointer transition-colors"
            :title="'Physical'"
            @click="dealDamage('physical')"
          >
            Physical
          </button>
          <button
            type="button"
            class="flex-1 px-3 py-1.5 border border-gray-600 text-gray-700 hover:bg-gray-50 cursor-pointer transition-colors -ml-px"
            :title="'Magical'"
            @click="dealDamage('magical')"
          >
            Magical
          </button>
          <button
            type="button"
            class="flex-1 px-3 py-1.5 border border-gray-600 rounded-r text-gray-700 hover:bg-gray-50 cursor-pointer transition-colors -ml-px"
            :title="'Heal'"
            @click="dealHealing"
          >
            Heal
          </button>
        </div>
      </div>
    </div>
    <div class="flex gap-1 mt-1">
      <button
        type="button"
        class="flex-1 px-3 py-1.5 border border-gray-600 rounded text-gray-700 hover:bg-gray-50 cursor-pointer transition-colors"
        @click="resetDamageState"
      >
        Reset State
      </button>
      <button
        type="button"
        class="flex-1 px-3 py-1.5 border border-yellow-500 rounded bg-yellow-500 text-white hover:bg-yellow-600 cursor-pointer transition-colors"
        @click="undoLastAction"
      >
        Undo Last Action
      </button>
    </div>

    <!-- ─── Elemental Row (visible when elemental damage) ─────── -->
    <div
      v-if="system.combat.damageType === '1'"
      class="flex flex-wrap gap-1 my-2"
    >
      <div class="flex-1">
        <div class="flex gap-1">
          <select
            v-model="system.elements.selectedElement1Name"
            class="flex-1 px-3 py-1.5 border border-gray-600 rounded text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option v-for="el in elementChoices" :key="el.key" :value="el.key">
              {{ el.label }}
            </option>
          </select>
          <select
            v-model.number="system.elements.selectedElement1Level"
            class="basis-20 px-3 py-1.5 border border-gray-600 rounded text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option v-for="n in 11" :key="n - 1" :value="n - 1">
              {{ n - 1 }}
            </option>
          </select>
          <select
            v-model="system.elements.selectedElement2Name"
            class="flex-1 px-3 py-1.5 border border-gray-600 rounded text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option v-for="el in elementChoices" :key="el.key" :value="el.key">
              {{ el.label }}
            </option>
          </select>
          <select
            v-model.number="system.elements.selectedElement2Level"
            class="basis-20 px-3 py-1.5 border border-gray-600 rounded text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option v-for="n in 11" :key="n - 1" :value="n - 1">
              {{ n - 1 }}
            </option>
          </select>
        </div>
      </div>
    </div>

    <!-- ─── Trance Row ────────────────────────────────────────── -->
    <div v-if="system.gauges.hasTrance" class="flex flex-wrap gap-1 mb-2">
      <div class="basis-2/12 my-2 font-bold">Trance:</div>
      <div class="basis-5/12 ml-1">
        <div class="relative h-6 bg-gray-200 rounded overflow-hidden">
          <div
            class="absolute inset-y-0 left-0 flex items-center justify-center transition-all bg-blue-500"
            :style="`width: ${trancePct}%`"
          >
            <span class="inline-block mx-auto px-2"> {{ trancePct }}% </span>
          </div>
        </div>
      </div>
      <div class="flex-1">
        <button
          type="button"
          class="px-3 py-1.5 border border-blue-600 rounded bg-blue-600 text-white hover:bg-blue-700 cursor-pointer transition-colors"
          @click="activateTrance"
        >
          Activate
        </button>
      </div>
    </div>

    <!-- ─── Limit Break Row ───────────────────────────────────── -->
    <div v-if="system.gauges.hasLimitBreak" class="flex flex-wrap gap-1 mb-2">
      <div class="basis-2/12 my-2 font-bold">Limit Break:</div>
      <div class="basis-5/12 ml-1">
        <div class="relative h-6 bg-gray-200 rounded overflow-hidden">
          <div
            class="absolute inset-y-0 left-0 flex items-center justify-center transition-all bg-yellow-500"
            :style="`width: ${limitBreakPct}%`"
          >
            <span class="inline-block mx-auto px-2">
              {{ limitBreakPct }}%
            </span>
          </div>
        </div>
      </div>
      <div class="flex-1">
        <div class="flex gap-1">
          <input
            type="number"
            class="basis-20 px-3 py-1.5 border border-gray-600 rounded text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            v-model.number="spendLbAmount"
            min="0"
            :title="'Amount of Limit Break to spend'"
            placeholder="0"
          />
          <button
            type="button"
            class="flex-1 px-3 py-1.5 border border-blue-600 rounded bg-blue-600 text-white hover:bg-blue-700 cursor-pointer transition-colors"
            @click="spendLimitBreak"
          >
            Spend
          </button>
        </div>
      </div>
    </div>

    <!-- ─── Gauge Multiplier Row ──────────────────────────────── -->
    <div
      v-if="system.gauges.hasTrance || system.gauges.hasLimitBreak"
      class="flex flex-wrap gap-1 mb-2"
    >
      <div class="basis-2/12"></div>
      <div class="basis-5/12">
        <div class="flex gap-0">
          <span
            class="px-3 py-1.5 border border-gray-600 rounded-l bg-gray-100 text-gray-700"
            title="times"
            >×</span
          >
          <input
            type="number"
            class="flex-1 px-3 py-1.5 border border-gray-600 rounded-r text-gray-700 -ml-px focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:z-10"
            v-model.number="system.gauges.multiplier"
            min="1"
            :title="'Gauge Multiplier'"
          />
        </div>
      </div>
      <div class="flex-1">
        <div class="flex gap-1">
          <input
            type="text"
            class="flex-1 px-3 py-1.5 border border-gray-600 rounded text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            v-model="gaugeMod"
            placeholder="1 or +1/-1"
            :title="'Modify Gauge to/by 1 or +1/-1'"
          />
          <button
            type="button"
            class="px-3 py-1.5 border border-gray-600 rounded text-gray-700 hover:bg-gray-50 cursor-pointer transition-colors"
            @click="modifyGauge"
            :title="'Modify'"
          >
            Modify
          </button>
        </div>
      </div>
    </div>

    <!-- ─── MP Row ────────────────────────────────────────────── -->
    <div class="flex flex-wrap gap-1 my-2">
      <div class="basis-2/12 my-2 font-bold">MP:</div>
      <div class="flex-1 ml-1">
        <div class="relative h-6 bg-gray-200 rounded overflow-hidden">
          <div
            class="absolute inset-y-0 left-0 flex items-center justify-center transition-all bg-blue-600"
            :style="`width: ${mpPercent}%`"
          >
            <span
              class="inline-block mx-auto px-2 text-white text-xs font-semibold"
              :title="`${system.resources.mp.value}/${system.resources.mp.max} (${mpPercent}%)`"
            >
              {{ system.resources.mp.value }}/{{ system.resources.mp.max }} ({{
                mpPercent
              }}%)
            </span>
          </div>
        </div>
      </div>
      <div class="basis-1/6">
        <input
          type="text"
          class="px-3 py-1.5 border border-gray-600 rounded text-gray-700 w-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          v-model="mpMod"
          placeholder=""
          :title="'MP modification amount'"
        />
      </div>
      <div class="w-auto">
        <div class="flex gap-1">
          <button
            type="button"
            class="px-3 py-1.5 border border-gray-600 rounded text-gray-700 hover:bg-gray-50 cursor-pointer transition-colors"
            @click="modifyMp(-1)"
          >
            -
          </button>
          <button
            type="button"
            class="px-3 py-1.5 border border-gray-600 rounded text-gray-700 hover:bg-gray-50 cursor-pointer transition-colors"
            @click="modifyMp(1)"
          >
            +
          </button>
        </div>
      </div>
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
    shieldSoak: number;
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
  armors?: {
    name: string;
    physicalSoak: number;
    magicalSoak: number;
    shieldSoak: number;
    shield: number;
    shieldHitsMax: number;
    hasEmp: boolean;
    equipped: boolean;
  }[];
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

const mpPercent = computed(() => {
  const { value, max } = system.resources.mp;
  if (!max) return 0;
  return Math.round((value / max) * 100 * 100) / 100;
});

const totalPhysical = computed(() => {
  let total = system.soak.physicalBase + system.soak.armoredPhysical;
  if (
    !system.combat.emp &&
    system.soak.shieldHitsLeft > 0 &&
    system.soak.shieldSoak > 0
  ) {
    total += system.soak.shieldSoak;
  }
  return total;
});
const totalMagical = computed(() => {
  let total = system.soak.magicalBase + system.soak.armoredMagical;
  if (
    !system.combat.emp &&
    system.soak.shieldHitsLeft > 0 &&
    system.soak.shieldSoak > 0
  ) {
    total += system.soak.shieldSoak;
  }
  return total;
});

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
    shieldSoak,
    shieldHitsLeft
  } = system.soak;
  // Calculate total soak including shield (if available)
  let totalPSoak = pSoak + armoredPhysical;
  let totalMSoak = mSoak + armoredMagical;
  let newShieldHits = shieldHitsLeft;
  let shieldUsed = false;

  // Add shield to soak if available and not EMP'd
  if (!system.combat.emp && shieldHitsLeft > 0 && shieldSoak > 0) {
    totalPSoak += shieldSoak;
    totalMSoak += shieldSoak;
    shieldUsed = true;
  }

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

  // Decrement shield hits if shield was used
  if (shieldUsed) {
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

  // Track gauge changes for undo
  if (system.gauges.hasTrance) {
    changes["gauges.trance"] = system.gauges.trance;
  }
  if (system.gauges.hasLimitBreak) {
    changes["gauges.limitBreak"] = system.gauges.limitBreak;
  }

  // Apply
  system.resources.hp.value = newHp;
  system.soak.shieldHitsLeft = newShieldHits;
  system.gauges.trance = newTrance;
  system.gauges.limitBreak = newLimitBreak;

  // Also update the equipped armor's shield hits
  const equippedArmorIdx = system.armors?.findIndex((a: any) => a.equipped);
  if (
    equippedArmorIdx !== undefined &&
    equippedArmorIdx >= 0 &&
    system.armors
  ) {
    system.armors[equippedArmorIdx].shield = newShieldHits;
  }

  const saveData: Record<string, unknown> = {
    "resources.hp.value": newHp,
    "soak.shieldHitsLeft": newShieldHits,
    "gauges.trance": newTrance,
    "gauges.limitBreak": newLimitBreak
  };

  // Save armor array if shield hits changed
  if (equippedArmorIdx !== undefined && equippedArmorIdx >= 0 && shieldUsed) {
    saveData.armors = JSON.parse(JSON.stringify(system.armors));
  }

  await sheet.saveSystem(saveData);

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
  // Save old value for undo
  pushHistory("activateTrance", { "gauges.trance": system.gauges.trance });
  system.gauges.trance = 0;
  await sheet.saveSystem({ "gauges.trance": 0 });
}

async function spendLimitBreak() {
  const amount = spendLbAmount.value;
  if (!amount) return;
  // Save old value for undo
  pushHistory("spendLimitBreak", {
    "gauges.limitBreak": system.gauges.limitBreak
  });
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
