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
          <div class="basis-1/5">
            <label class="block mb-1 font-medium">Athletics Level</label>
            <input
              type="number"
              class="px-3 py-1.5 border border-gray-600 rounded text-gray-700 w-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              v-model.number="athleticsLevel"
              min="0"
              max="10"
            />
          </div>
          <div class="basis-1/5">
            <label class="block mb-1 font-medium">Athletics Bonus</label>
            <input
              type="number"
              class="px-3 py-1.5 border border-gray-600 rounded text-gray-700 w-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              v-model.number="athleticsBonus"
            />
          </div>
          <div class="basis-1/5">
            <label class="block mb-1 font-medium">Acrobatics Level</label>
            <input
              type="number"
              class="px-3 py-1.5 border border-gray-600 rounded text-gray-700 w-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              v-model.number="acrobaticsLevel"
              min="0"
              max="10"
            />
          </div>
          <div class="basis-1/5">
            <label class="block mb-1 font-medium">Acrobatics Bonus</label>
            <input
              type="number"
              class="px-3 py-1.5 border border-gray-600 rounded text-gray-700 w-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              v-model.number="acrobaticsBonus"
            />
          </div>
        </div>
        <div class="flex gap-2 flex-wrap mt-2">
          <div class="basis-1/5">
            <label class="block mb-1 font-medium">Swimming Level</label>
            <input
              type="number"
              class="px-3 py-1.5 border border-gray-600 rounded text-gray-700 w-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              v-model.number="swimmingLevel"
              min="0"
              max="10"
            />
          </div>
          <div class="basis-1/5">
            <label class="block mb-1 font-medium">Swimming Bonus</label>
            <input
              type="number"
              class="px-3 py-1.5 border border-gray-600 rounded text-gray-700 w-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              v-model.number="swimmingBonus"
            />
          </div>
          <div class="basis-1/5">
            <label class="block mb-1 font-medium">Burrowing Level</label>
            <input
              type="number"
              class="px-3 py-1.5 border border-gray-600 rounded text-gray-700 w-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              v-model.number="burrowing"
              min="0"
              max="10"
            />
          </div>
        </div>
        <div class="flex gap-2 mt-2">
          <div class="basis-1/5">
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
          <div class="basis-1/5">
            <div class="flex items-center">
              <input
                type="checkbox"
                class="mr-2"
                id="hasImprovedFlight"
                v-model="hasImprovedFlight"
              />
              <label class="ml-2" for="hasImprovedFlight">Has Improved Flight</label>
            </div>
          </div>
          <div class="basis-1/5">
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
          <div class="basis-1/5">
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
          <div class="basis-1/5">
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
          Walking: {{ speeds.walking }} ft | Acrobatics:
          {{ speeds.acrobatics }} ft | Swimming: {{ speeds.swimming }} ft
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

        <!-- Row 1: Perception and Hearing -->
        <div class="flex gap-2 mb-2">
          <div class="basis-1/4">
            <label class="block mb-1 font-medium">Perception Level</label>
            <input
              type="number"
              class="px-3 py-1.5 border border-gray-600 rounded text-gray-700 w-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              v-model.number="perceptionLevel"
              min="0"
              max="10"
            />
          </div>
          <div class="basis-1/4">
            <label class="block mb-1 font-medium">Sight Bonus</label>
            <input
              type="number"
              class="px-3 py-1.5 border border-gray-600 rounded text-gray-700 w-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              v-model.number="system.bonuses.senses.sight"
            />
          </div>
          <div class="basis-1/4">
            <label class="block mb-1 font-medium">Hearing Bonus</label>
            <input
              type="number"
              class="px-3 py-1.5 border border-gray-600 rounded text-gray-700 w-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              v-model.number="system.bonuses.senses.hearing"
            />
          </div>
          <div class="basis-1/4">
            <label class="block mb-1 font-medium">Smell Bonus</label>
            <input
              type="number"
              class="px-3 py-1.5 border border-gray-600 rounded text-gray-700 w-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              v-model.number="system.bonuses.senses.smell"
            />
          </div>
          <div class="basis-1/4">
            <label class="block mb-1 font-medium">Taste Bonus</label>
            <input
              type="number"
              class="px-3 py-1.5 border border-gray-600 rounded text-gray-700 w-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              v-model.number="system.bonuses.senses.taste"
            />
          </div>
          <div class="basis-1/4">
            <label class="block mb-1 font-medium">Touch Bonus</label>
            <input
              type="number"
              class="px-3 py-1.5 border border-gray-600 rounded text-gray-700 w-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              v-model.number="system.bonuses.senses.touch"
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
import { BaseData } from "~/module/types/base-data";

type SkillEntry = { level: number; bonus: number };

const system = inject<BaseData.ActorUniversal>("reactiveSystem")!;
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

const hasImprovedFlight = computed({
  get: () => getSkillFlag("hasImprovedFlight"),
  set: (value: boolean) => setSkillFlag("hasImprovedFlight", value)
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

const burrowing = computed({
  get: () => system.movementFlags?.burrowing ?? 0,
  set: (value: number) => (system.movementFlags as Record<string, unknown>).burrowing = value
});

const perceptionLevel = computed({
  get: () => system.skills?.utility?.Perception?.level ?? 0,
  set: (value: number) => {
    if (system.skills?.utility?.Perception) {
      system.skills.utility.Perception.level = value;
    } else {
      (system.skills as Record<string, unknown>).utility = {
        Perception: { level: value }
      };
    }
  }
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
