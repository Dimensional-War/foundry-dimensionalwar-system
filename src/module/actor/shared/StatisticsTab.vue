<template>
  <div class="dw-statistics-tab">
    <!-- ─── HP / MP ─────────────────────────────────────────────── -->
    <fieldset class="border p-2 mb-3">
      <legend class="font-bold">Resources</legend>
      <div class="flex gap-2">
        <div class="basis-1/2">
          <label class="block mb-1 font-medium">Max HP</label>
          <input
            type="number"
            class="px-3 py-1.5 border border-gray-600 rounded text-gray-700 w-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            v-model.number="system.resources.hp.max"
            @input="clampHP"
            min="0"
          />
        </div>
        <div class="basis-1/2">
          <label class="block mb-1 font-medium">Current HP</label>
          <input
            type="number"
            class="px-3 py-1.5 border border-gray-600 rounded text-gray-700 w-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            v-model.number="system.resources.hp.value"
          />
        </div>
        <div class="basis-1/2">
          <label class="block mb-1 font-medium">Max MP</label>
          <input
            type="number"
            class="px-3 py-1.5 border border-gray-600 rounded text-gray-700 w-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            v-model.number="system.resources.mp.max"
            min="0"
          />
        </div>
        <div class="basis-1/2">
          <label class="block mb-1 font-medium">Current MP</label>
          <input
            type="number"
            class="px-3 py-1.5 border border-gray-600 rounded text-gray-700 w-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            v-model.number="system.resources.mp.value"
            min="0"
          />
        </div>
      </div>
    </fieldset>

    <!-- ─── Soak ─────────────────────────────────────────────────── -->
    <fieldset class="border p-2 mb-3">
      <legend class="font-bold">Base Soak</legend>
      <div class="flex gap-2">
        <div class="basis-1/2">
          <label class="block mb-1 font-medium">Physical Soak</label>
          <input
            type="number"
            class="px-3 py-1.5 border border-gray-600 rounded text-gray-700 w-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            v-model.number="system.soak.physicalBase"
            min="0"
          />
        </div>
        <div class="basis-1/2">
          <label class="block mb-1 font-medium">Magical Soak</label>
          <input
            type="number"
            class="px-3 py-1.5 border border-gray-600 rounded text-gray-700 w-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            v-model.number="system.soak.magicalBase"
            min="0"
          />
        </div>
      </div>
      <div class="flex items-center gap-2 mt-2">
        <input
          type="checkbox"
          id="resolveOfAges"
          v-model="system.soak.resolveOfAges"
        />
        <label for="resolveOfAges" class="font-medium"
          >Primary Characteristic: Resolve of Ages</label
        >
      </div>
    </fieldset>

    <!-- ─── Elements ─────────────────────────────────────────────── -->
    <fieldset class="border p-2 mb-3">
      <legend class="font-bold">Elements</legend>
      <div class="flex gap-2">
        <div class="basis-1/2">
          <label class="block mb-1 font-medium">Element 1</label>
          <select
            v-model="system.elements.element1Name"
            class="px-3 py-1.5 border border-gray-600 rounded text-gray-700 w-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option v-for="el in elementChoices" :key="el.key" :value="el.key">
              {{ el.label }}
            </option>
          </select>
        </div>
        <div class="basis-1/2">
          <label class="block mb-1 font-medium">Level</label>
          <select
            v-model.number="system.elements.element1Level"
            class="px-3 py-1.5 border border-gray-600 rounded text-gray-700 w-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option v-for="n in 6" :key="n - 1" :value="n - 1">
              {{ n - 1 }}
            </option>
          </select>
        </div>

        <div class="basis-1/2">
          <label class="block mb-1 font-medium">Element 2</label>
          <select
            v-model="system.elements.element2Name"
            class="px-3 py-1.5 border border-gray-600 rounded text-gray-700 w-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option v-for="el in elementChoices" :key="el.key" :value="el.key">
              {{ el.label }}
            </option>
          </select>
        </div>
        <div class="basis-1/2">
          <label class="block mb-1 font-medium">Level</label>
          <select
            v-model.number="system.elements.element2Level"
            class="px-3 py-1.5 border border-gray-600 rounded text-gray-700 w-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option v-for="n in 6" :key="n - 1" :value="n - 1">
              {{ n - 1 }}
            </option>
          </select>
        </div>
      </div>
    </fieldset>

    <!-- ─── Gauges ────────────────────────────────────────────────── -->
    <fieldset class="border p-2 mb-3">
      <legend class="font-bold">Gauges</legend>
      <div class="grid grid-cols-2 gap-2 items-center">
        <label class="block font-medium">Has Trance</label>
        <input type="checkbox" v-model="system.gauges.hasTrance" />
        <label v-if="system.gauges.hasTrance" class="block font-medium"
          >Trance (cur)</label
        >
        <input
          v-if="system.gauges.hasTrance"
          type="number"
          class="px-3 py-1.5 border border-gray-600 rounded text-gray-700 w-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          v-model.number="system.gauges.trance"
          min="0"
        />

        <label class="block font-medium">Has Limit Break</label>
        <input type="checkbox" v-model="system.gauges.hasLimitBreak" />
        <label v-if="system.gauges.hasLimitBreak" class="block font-medium"
          >Limit Break (cur)</label
        >
        <input
          v-if="system.gauges.hasLimitBreak"
          type="number"
          class="px-3 py-1.5 border border-gray-600 rounded text-gray-700 w-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          v-model.number="system.gauges.limitBreak"
          min="0"
        />
      </div>
    </fieldset>

    <!-- ─── Skills (Character types only: pc, npc, ally, boss) ─────── -->
    <template v-if="hasSkills">
      <!-- ─── Movement Skills ──────────────────────────────────────── -->
      <fieldset class="border p-2 mb-3">
        <legend class="font-bold">Movement</legend>
        <div class="flex gap-2 flex-wrap">
          <div class="basis-1/6">
            <label class="block mb-1 font-medium">Athletics Level</label>
            <input
              type="number"
              class="px-3 py-1.5 border border-gray-600 rounded text-gray-700 w-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              v-model.number="athleticsLevel"
              min="0"
              max="10"
            />
          </div>
          <div class="basis-1/6">
            <label class="block mb-1 font-medium">Athletics Bonus</label>
            <input
              type="number"
              class="px-3 py-1.5 border border-gray-600 rounded text-gray-700 w-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              v-model.number="athleticsBonus"
            />
          </div>
          <div class="basis-1/6">
            <label class="block mb-1 font-medium">Acrobatics Level</label>
            <input
              type="number"
              class="px-3 py-1.5 border border-gray-600 rounded text-gray-700 w-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              v-model.number="acrobaticsLevel"
              min="0"
              max="10"
            />
          </div>
          <div class="basis-1/6">
            <label class="block mb-1 font-medium">Acrobatics Bonus</label>
            <input
              type="number"
              class="px-3 py-1.5 border border-gray-600 rounded text-gray-700 w-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              v-model.number="acrobaticsBonus"
            />
          </div>
          <div class="basis-1/6">
            <label class="block mb-1 font-medium">Swimming Level</label>
            <input
              type="number"
              class="px-3 py-1.5 border border-gray-600 rounded text-gray-700 w-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              v-model.number="swimmingLevel"
              min="0"
              max="10"
            />
          </div>
          <div class="basis-1/6">
            <label class="block mb-1 font-medium">Swimming Bonus</label>
            <input
              type="number"
              class="px-3 py-1.5 border border-gray-600 rounded text-gray-700 w-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              v-model.number="swimmingBonus"
            />
          </div>
        </div>
        <div class="flex gap-2 mt-2">
          <div class="basis-1/4">
            <div class="flex items-center">
              <input
                type="checkbox"
                class="mr-2"
                id="hasFlight"
                v-model="hasFlight"
              />
              <label class="ml-2" for="hasFlight">Has Flight</label>
            </div>
          </div>
          <div class="basis-1/4">
            <div class="flex items-center">
              <input
                type="checkbox"
                class="mr-2"
                id="hasParkour"
                v-model="hasParkour"
              />
              <label class="ml-2" for="hasParkour">Has Parkour</label>
            </div>
          </div>
          <div class="basis-1/4">
            <div class="flex items-center">
              <input
                type="checkbox"
                class="mr-2"
                id="hasTeleport"
                v-model="hasTeleport"
              />
              <label class="ml-2" for="hasTeleport">Has Teleport</label>
            </div>
          </div>
          <div class="basis-1/4">
            <div class="flex items-center">
              <input
                type="checkbox"
                class="mr-2"
                id="hasCrossCountry"
                v-model="hasCrossCountry"
              />
              <label
                class="ml-2"
                for="hasCrossCountry"
                :title="'Ignores difficult terrain when enabled'"
                >Cross-Country Running</label
              >
            </div>
          </div>
        </div>
        <div v-if="speeds.walking" class="mt-2 p-2 bg-gray-100 border rounded">
          <div>
            Walking: {{ speeds.walking }} ft | Acrobatics:
            {{ speeds.acrobatics }} ft | Swimming: {{ speeds.swimming }} ft
          </div>
          <template v-if="speeds.flying">
            | Flying: {{ speeds.flying }} ft</template
          >
          <template v-if="speeds.burrowing">
            | Burrow: {{ speeds.burrowing }} ft</template
          >
        </div>
      </fieldset>

      <!-- ─── Senses ────────────────────────────────────────────────── -->
      <fieldset class="border p-2 mb-3">
        <legend class="font-bold">Senses (Perception)</legend>

        <!-- Row 1: Sight and Hearing -->
        <div class="flex gap-2 mb-2">
          <div class="basis-1/4">
            <label class="block mb-1 font-medium">Sight Level</label>
            <input
              type="number"
              class="px-3 py-1.5 border border-gray-600 rounded text-gray-700 w-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              v-model.number="sightLevel"
              min="0"
              max="10"
            />
          </div>
          <div class="basis-1/4">
            <label class="block mb-1 font-medium">Sight Bonus</label>
            <input
              type="number"
              class="px-3 py-1.5 border border-gray-600 rounded text-gray-700 w-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              v-model.number="sightBonus"
            />
          </div>
          <div class="basis-1/4">
            <label class="block mb-1 font-medium">Hearing Level</label>
            <input
              type="number"
              class="px-3 py-1.5 border border-gray-600 rounded text-gray-700 w-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              v-model.number="hearingLevel"
              min="0"
              max="10"
            />
          </div>
          <div class="basis-1/4">
            <label class="block mb-1 font-medium">Hearing Bonus</label>
            <input
              type="number"
              class="px-3 py-1.5 border border-gray-600 rounded text-gray-700 w-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              v-model.number="hearingBonus"
            />
          </div>
        </div>

        <!-- Row 2: Smell and Taste -->
        <div class="flex gap-2 mb-2">
          <div class="basis-1/4">
            <label class="block mb-1 font-medium">Smell Level</label>
            <input
              type="number"
              class="px-3 py-1.5 border border-gray-600 rounded text-gray-700 w-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              v-model.number="smellLevel"
              min="0"
              max="10"
            />
          </div>
          <div class="basis-1/4">
            <label class="block mb-1 font-medium">Smell Bonus</label>
            <input
              type="number"
              class="px-3 py-1.5 border border-gray-600 rounded text-gray-700 w-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              v-model.number="smellBonus"
            />
          </div>
          <div class="basis-1/4">
            <label class="block mb-1 font-medium">Taste Level</label>
            <input
              type="number"
              class="px-3 py-1.5 border border-gray-600 rounded text-gray-700 w-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              v-model.number="tasteLevel"
              min="0"
              max="10"
            />
          </div>
          <div class="basis-1/4">
            <label class="block mb-1 font-medium">Taste Bonus</label>
            <input
              type="number"
              class="px-3 py-1.5 border border-gray-600 rounded text-gray-700 w-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              v-model.number="tasteBonus"
            />
          </div>
        </div>

        <!-- Row 3: Touch -->
        <div class="flex gap-2">
          <div class="basis-1/4">
            <label class="block mb-1 font-medium">Touch Level</label>
            <input
              type="number"
              class="px-3 py-1.5 border border-gray-600 rounded text-gray-700 w-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              v-model.number="touchLevel"
              min="0"
              max="10"
            />
          </div>
          <div class="basis-1/4">
            <label class="block mb-1 font-medium">Touch Bonus</label>
            <input
              type="number"
              class="px-3 py-1.5 border border-gray-600 rounded text-gray-700 w-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              v-model.number="touchBonus"
            />
          </div>
        </div>
      </fieldset>
    </template>
  </div>
</template>

<script setup lang="ts">
import { inject, computed } from "vue";
import type { DwBaseSheet } from "../DwBaseSheet";
import type { SystemActor } from "../../documents";

type SkillEntry = { level: number; bonus: number };
type MovementSkills = {
  Acrobatics?:
    | { statistics?: unknown[]; level?: number; bonus?: number }
    | SkillEntry;
  Athletics?:
    | { statistics?: unknown[]; level?: number; bonus?: number }
    | SkillEntry;
  Swimming?:
    | { statistics?: unknown[]; level?: number; bonus?: number }
    | SkillEntry;
  Reaction?: SkillEntry;
};

type SensesSkills = {
  Sight?: SkillEntry;
  Hearing?: SkillEntry;
  Smell?: SkillEntry;
  Taste?: SkillEntry;
  Touch?: SkillEntry;
};

type DwSystem = {
  resources: {
    hp: { value: number; max: number; min: number };
    mp: { value: number; max: number; min: number };
  };
  soak: {
    physicalBase: number;
    magicalBase: number;
    armoredPhysical: number;
    armoredMagical: number;
    shield: number;
    shieldHitsLeft: number;
    shieldHitsMax: number;
    resolveOfAges: boolean;
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
  skills: {
    movement?: MovementSkills;
    senses?: SensesSkills;
    [key: string]: unknown;
  };
  movementFlags?: {
    hasFlight?: boolean;
    hasParkour?: boolean;
    hasTeleport?: boolean;
    hasCrossCountry?: boolean;
    burrowing?: number;
    [key: string]: unknown;
  };
};

const system = inject<DwSystem>("reactiveSystem")!;
const actor = inject<SystemActor>("actor")!;
const sheet = inject<DwBaseSheet>("sheet")!;
void sheet;

// Character types (pc, npc, ally, boss) have skills; enemies don't
const hasSkills = computed(
  () => "skills" in system && system.skills !== undefined
);

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

const movementSkills = [
  { key: "Athletics", label: "Athletics" },
  { key: "Acrobatics", label: "Acrobatics" },
  { key: "Swimming", label: "Swimming" }
];

const senses = [
  { key: "Sight", label: "Sight" },
  { key: "Hearing", label: "Hearing" },
  { key: "Smell", label: "Smell" },
  { key: "Taste", label: "Taste" },
  { key: "Touch", label: "Touch" }
];

function clampHP() {
  // Clamp hp.value if it exceeds the new max
  if (system.resources.hp.value > system.resources.hp.max) {
    system.resources.hp.value = system.resources.hp.max;
  }
}

// Helper functions for initializing nested structures
function getSkillLevel(skillName: string): number {
  const s = system.skills?.movement;
  if (!s) return 0;
  const entry = (s as Record<string, unknown>)[skillName];
  if (!entry) return 0;
  if (Array.isArray(entry)) {
    return (entry[0] as SkillEntry)?.level ?? 0;
  }
  return (entry as SkillEntry).level ?? 0;
}

function setSkillLevel(skillName: string, value: number) {
  if (!system.skills) {
    (system as Record<string, unknown>).skills = {};
  }
  if (!system.skills.movement) {
    system.skills.movement = {};
  }
  const entry = (system.skills.movement as Record<string, unknown>)[skillName];
  if (!entry) {
    (system.skills.movement as Record<string, unknown>)[skillName] = {
      level: value,
      bonus: 0
    };
  } else if (Array.isArray(entry)) {
    (entry[0] as SkillEntry).level = value;
  } else {
    (entry as SkillEntry).level = value;
  }
}

function getSkillBonus(skillName: string): number {
  const s = system.skills?.movement;
  if (!s) return 0;
  const entry = (s as Record<string, unknown>)[skillName];
  if (!entry) return 0;
  if (Array.isArray(entry)) {
    return (entry[0] as SkillEntry)?.bonus ?? 0;
  }
  return (entry as SkillEntry).bonus ?? 0;
}

function setSkillBonus(skillName: string, value: number) {
  if (!system.skills) {
    (system as Record<string, unknown>).skills = {};
  }
  if (!system.skills.movement) {
    system.skills.movement = {};
  }
  const entry = (system.skills.movement as Record<string, unknown>)[skillName];
  if (!entry) {
    (system.skills.movement as Record<string, unknown>)[skillName] = {
      level: 0,
      bonus: value
    };
  } else if (Array.isArray(entry)) {
    (entry[0] as SkillEntry).bonus = value;
  } else {
    (entry as SkillEntry).bonus = value;
  }
}

function getSenseLevel(senseName: string): number {
  const s = system.skills?.senses;
  if (!s) return 0;
  const entry = (s as Record<string, unknown>)[senseName];
  if (!entry) return 0;
  return (entry as SkillEntry).level ?? 0;
}

function setSenseLevel(senseName: string, value: number) {
  if (!system.skills) {
    (system as Record<string, unknown>).skills = {};
  }
  if (!system.skills.senses) {
    (system.skills as Record<string, unknown>).senses = {};
  }
  const entry = (system.skills.senses as Record<string, unknown>)[senseName];
  if (!entry) {
    (system.skills.senses as Record<string, unknown>)[senseName] = {
      level: value,
      bonus: 0
    };
  } else {
    (entry as SkillEntry).level = value;
  }
}

function getSenseBonus(senseName: string): number {
  const s = system.skills?.senses;
  if (!s) return 0;
  const entry = (s as Record<string, unknown>)[senseName];
  if (!entry) return 0;
  return (entry as SkillEntry).bonus ?? 0;
}

function setSenseBonus(senseName: string, value: number) {
  if (!system.skills) {
    (system as Record<string, unknown>).skills = {};
  }
  if (!system.skills.senses) {
    (system.skills as Record<string, unknown>).senses = {};
  }
  const entry = (system.skills.senses as Record<string, unknown>)[senseName];
  if (!entry) {
    (system.skills.senses as Record<string, unknown>)[senseName] = {
      level: 0,
      bonus: value
    };
  } else {
    (entry as SkillEntry).bonus = value;
  }
}

function getSkillFlag(flag: string): boolean {
  const flags = system.movementFlags as
    | Record<string, boolean | number | undefined>
    | undefined;
  const value = flags?.[flag];
  return typeof value === "boolean" ? value : false;
}

function setSkillFlag(flag: string, value: boolean) {
  if (system.movementFlags) {
    (system.movementFlags as Record<string, unknown>)[flag] = value;
  }
}

// Computed properties for v-model binding
const athleticsLevel = computed({
  get: () => getSkillLevel("Athletics"),
  set: (value: number) => setSkillLevel("Athletics", value)
});

const athleticsBonus = computed({
  get: () => getSkillBonus("Athletics"),
  set: (value: number) => setSkillBonus("Athletics", value)
});

const acrobaticsLevel = computed({
  get: () => getSkillLevel("Acrobatics"),
  set: (value: number) => setSkillLevel("Acrobatics", value)
});

const acrobaticsBonus = computed({
  get: () => getSkillBonus("Acrobatics"),
  set: (value: number) => setSkillBonus("Acrobatics", value)
});

const swimmingLevel = computed({
  get: () => getSkillLevel("Swimming"),
  set: (value: number) => setSkillLevel("Swimming", value)
});

const swimmingBonus = computed({
  get: () => getSkillBonus("Swimming"),
  set: (value: number) => setSkillBonus("Swimming", value)
});

const hasFlight = computed({
  get: () => getSkillFlag("hasFlight"),
  set: (value: boolean) => setSkillFlag("hasFlight", value)
});

const hasParkour = computed({
  get: () => getSkillFlag("hasParkour"),
  set: (value: boolean) => setSkillFlag("hasParkour", value)
});

const hasTeleport = computed({
  get: () => getSkillFlag("hasTeleport"),
  set: (value: boolean) => setSkillFlag("hasTeleport", value)
});

const hasCrossCountry = computed({
  get: () => getSkillFlag("hasCrossCountry"),
  set: (value: boolean) => setSkillFlag("hasCrossCountry", value)
});

const sightLevel = computed({
  get: () => getSenseLevel("Sight"),
  set: (value: number) => setSenseLevel("Sight", value)
});

const sightBonus = computed({
  get: () => getSenseBonus("Sight"),
  set: (value: number) => setSenseBonus("Sight", value)
});

const hearingLevel = computed({
  get: () => getSenseLevel("Hearing"),
  set: (value: number) => setSenseLevel("Hearing", value)
});

const hearingBonus = computed({
  get: () => getSenseBonus("Hearing"),
  set: (value: number) => setSenseBonus("Hearing", value)
});

const smellLevel = computed({
  get: () => getSenseLevel("Smell"),
  set: (value: number) => setSenseLevel("Smell", value)
});

const smellBonus = computed({
  get: () => getSenseBonus("Smell"),
  set: (value: number) => setSenseBonus("Smell", value)
});

const tasteLevel = computed({
  get: () => getSenseLevel("Taste"),
  set: (value: number) => setSenseLevel("Taste", value)
});

const tasteBonus = computed({
  get: () => getSenseBonus("Taste"),
  set: (value: number) => setSenseBonus("Taste", value)
});

const touchLevel = computed({
  get: () => getSenseLevel("Touch"),
  set: (value: number) => setSenseLevel("Touch", value)
});

const touchBonus = computed({
  get: () => getSenseBonus("Touch"),
  set: (value: number) => setSenseBonus("Touch", value)
});

// Speeds calculated by the actor document
// Formula: 20 + (ceil(skillLevel / 3) * 5)
const speeds = computed(() => {
  const hasFlight = getSkillFlag("hasFlight");

  return {
    walking: actor.walkingSpeed,
    acrobatics: actor.acrobaticsSpeed,
    swimming: actor.swimmingSpeed,
    flying: hasFlight ? actor.flyingSpeed : 0,
    burrowing: actor.burrowingSpeed
  };
});
</script>
