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
            :value="system.resources.hp.max"
            @change="
              saveAndClamp(
                'resources.hp.max',
                Number(($event.target as HTMLInputElement).value)
              )
            "
            min="0"
          />
        </div>
        <div class="basis-1/2">
          <label class="block mb-1 font-medium">Current HP</label>
          <input
            type="number"
            class="px-3 py-1.5 border border-gray-600 rounded text-gray-700 w-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            :value="system.resources.hp.value"
            @change="
              save(
                'resources.hp.value',
                Number(($event.target as HTMLInputElement).value)
              )
            "
          />
        </div>
        <div class="basis-1/2">
          <label class="block mb-1 font-medium">Max MP</label>
          <input
            type="number"
            class="px-3 py-1.5 border border-gray-600 rounded text-gray-700 w-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            :value="system.resources.mp.max"
            @change="
              save(
                'resources.mp.max',
                Number(($event.target as HTMLInputElement).value)
              )
            "
            min="0"
          />
        </div>
        <div class="basis-1/2">
          <label class="block mb-1 font-medium">Current MP</label>
          <input
            type="number"
            class="px-3 py-1.5 border border-gray-600 rounded text-gray-700 w-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            :value="system.resources.mp.value"
            @change="
              save(
                'resources.mp.value',
                Number(($event.target as HTMLInputElement).value)
              )
            "
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
            :value="system.soak.physicalBase"
            @change="
              save(
                'soak.physicalBase',
                Number(($event.target as HTMLInputElement).value)
              )
            "
            min="0"
          />
        </div>
        <div class="basis-1/2">
          <label class="block mb-1 font-medium">Magical Soak</label>
          <input
            type="number"
            class="px-3 py-1.5 border border-gray-600 rounded text-gray-700 w-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            :value="system.soak.magicalBase"
            @change="
              save(
                'soak.magicalBase',
                Number(($event.target as HTMLInputElement).value)
              )
            "
            min="0"
          />
        </div>
      </div>
    </fieldset>

    <!-- ─── Elements ─────────────────────────────────────────────── -->
    <fieldset class="border p-2 mb-3">
      <legend class="font-bold">Elements</legend>
      <div class="flex gap-2">
        <div class="basis-1/2">
          <label class="block mb-1 font-medium">Element 1</label>
          <select
            :value="system.elements.element1Name"
            @change="
              save(
                'elements.element1Name',
                ($event.target as HTMLSelectElement).value
              )
            "
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
            :value="system.elements.element1Level"
            @change="
              save(
                'elements.element1Level',
                Number(($event.target as HTMLSelectElement).value)
              )
            "
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
            :value="system.elements.element2Name"
            @change="
              save(
                'elements.element2Name',
                ($event.target as HTMLSelectElement).value
              )
            "
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
            :value="system.elements.element2Level"
            @change="
              save(
                'elements.element2Level',
                Number(($event.target as HTMLSelectElement).value)
              )
            "
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
        <input
          type="checkbox"
          :checked="system.gauges.hasTrance"
          @change="
            save(
              'gauges.hasTrance',
              ($event.target as HTMLInputElement).checked
            )
          "
        />
        <label v-if="system.gauges.hasTrance" class="block font-medium"
          >Trance (cur)</label
        >
        <input
          v-if="system.gauges.hasTrance"
          type="number"
          class="px-3 py-1.5 border border-gray-600 rounded text-gray-700 w-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          :value="system.gauges.trance"
          @change="
            save(
              'gauges.trance',
              Number(($event.target as HTMLInputElement).value)
            )
          "
          min="0"
        />

        <label class="block font-medium">Has Limit Break</label>
        <input
          type="checkbox"
          :checked="system.gauges.hasLimitBreak"
          @change="
            save(
              'gauges.hasLimitBreak',
              ($event.target as HTMLInputElement).checked
            )
          "
        />
        <label v-if="system.gauges.hasLimitBreak" class="block font-medium"
          >Limit Break (cur)</label
        >
        <input
          v-if="system.gauges.hasLimitBreak"
          type="number"
          class="px-3 py-1.5 border border-gray-600 rounded text-gray-700 w-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          :value="system.gauges.limitBreak"
          @change="
            save(
              'gauges.limitBreak',
              Number(($event.target as HTMLInputElement).value)
            )
          "
          min="0"
        />
      </div>
    </fieldset>

    <!-- ─── Movement Skills ──────────────────────────────────────── -->
    <fieldset class="border p-2 mb-3">
      <legend class="font-bold">Movement</legend>
      <div class="flex gap-2 flex-wrap">
        <template v-for="skill in movementSkills" :key="skill.key">
          <div class="basis-1/6">
            <label class="block mb-1 font-medium"
              >{{ skill.label }} Level</label
            >
            <input
              type="number"
              class="px-3 py-1.5 border border-gray-600 rounded text-gray-700 w-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              :value="getSkillLevel(skill.key)"
              @change="
                saveSkillLevel(
                  skill.key,
                  Number(($event.target as HTMLInputElement).value)
                )
              "
              min="0"
              max="10"
            />
          </div>
          <div class="basis-1/6">
            <label class="block mb-1 font-medium"
              >{{ skill.label }} Bonus</label
            >
            <input
              type="number"
              class="px-3 py-1.5 border border-gray-600 rounded text-gray-700 w-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              :value="getSkillBonus(skill.key)"
              @change="
                saveSkillBonus(
                  skill.key,
                  Number(($event.target as HTMLInputElement).value)
                )
              "
            />
          </div>
        </template>
      </div>
      <div class="flex gap-2 mt-2">
        <div class="basis-1/3">
          <div class="flex items-center">
            <input
              type="checkbox"
              class="mr-2"
              id="hasFlight"
              :checked="getSkillFlag('hasFlight')"
              @change="
                saveSkillFlag(
                  'hasFlight',
                  ($event.target as HTMLInputElement).checked
                )
              "
            />
            <label class="ml-2" for="hasFlight">Has Flight</label>
          </div>
        </div>
        <div class="basis-1/3">
          <div class="flex items-center">
            <input
              type="checkbox"
              class="mr-2"
              id="hasParkour"
              :checked="getSkillFlag('hasParkour')"
              @change="
                saveSkillFlag(
                  'hasParkour',
                  ($event.target as HTMLInputElement).checked
                )
              "
            />
            <label class="ml-2" for="hasParkour">Has Parkour</label>
          </div>
        </div>
        <div class="basis-1/3">
          <div class="flex items-center">
            <input
              type="checkbox"
              class="mr-2"
              id="hasTeleport"
              :checked="getSkillFlag('hasTeleport')"
              @change="
                saveSkillFlag(
                  'hasTeleport',
                  ($event.target as HTMLInputElement).checked
                )
              "
            />
            <label class="ml-2" for="hasTeleport">Has Teleport</label>
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
            :value="getSenseLevel('Sight')"
            @change="
              saveSenseLevel(
                'Sight',
                Number(($event.target as HTMLInputElement).value)
              )
            "
            min="0"
            max="10"
          />
        </div>
        <div class="basis-1/4">
          <label class="block mb-1 font-medium">Sight Bonus</label>
          <input
            type="number"
            class="px-3 py-1.5 border border-gray-600 rounded text-gray-700 w-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            :value="getSenseBonus('Sight')"
            @change="
              saveSenseBonus(
                'Sight',
                Number(($event.target as HTMLInputElement).value)
              )
            "
          />
        </div>
        <div class="basis-1/4">
          <label class="block mb-1 font-medium">Hearing Level</label>
          <input
            type="number"
            class="px-3 py-1.5 border border-gray-600 rounded text-gray-700 w-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            :value="getSenseLevel('Hearing')"
            @change="
              saveSenseLevel(
                'Hearing',
                Number(($event.target as HTMLInputElement).value)
              )
            "
            min="0"
            max="10"
          />
        </div>
        <div class="basis-1/4">
          <label class="block mb-1 font-medium">Hearing Bonus</label>
          <input
            type="number"
            class="px-3 py-1.5 border border-gray-600 rounded text-gray-700 w-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            :value="getSenseBonus('Hearing')"
            @change="
              saveSenseBonus(
                'Hearing',
                Number(($event.target as HTMLInputElement).value)
              )
            "
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
            :value="getSenseLevel('Smell')"
            @change="
              saveSenseLevel(
                'Smell',
                Number(($event.target as HTMLInputElement).value)
              )
            "
            min="0"
            max="10"
          />
        </div>
        <div class="basis-1/4">
          <label class="block mb-1 font-medium">Smell Bonus</label>
          <input
            type="number"
            class="px-3 py-1.5 border border-gray-600 rounded text-gray-700 w-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            :value="getSenseBonus('Smell')"
            @change="
              saveSenseBonus(
                'Smell',
                Number(($event.target as HTMLInputElement).value)
              )
            "
          />
        </div>
        <div class="basis-1/4">
          <label class="block mb-1 font-medium">Taste Level</label>
          <input
            type="number"
            class="px-3 py-1.5 border border-gray-600 rounded text-gray-700 w-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            :value="getSenseLevel('Taste')"
            @change="
              saveSenseLevel(
                'Taste',
                Number(($event.target as HTMLInputElement).value)
              )
            "
            min="0"
            max="10"
          />
        </div>
        <div class="basis-1/4">
          <label class="block mb-1 font-medium">Taste Bonus</label>
          <input
            type="number"
            class="px-3 py-1.5 border border-gray-600 rounded text-gray-700 w-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            :value="getSenseBonus('Taste')"
            @change="
              saveSenseBonus(
                'Taste',
                Number(($event.target as HTMLInputElement).value)
              )
            "
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
            :value="getSenseLevel('Touch')"
            @change="
              saveSenseLevel(
                'Touch',
                Number(($event.target as HTMLInputElement).value)
              )
            "
            min="0"
            max="10"
          />
        </div>
        <div class="basis-1/4">
          <label class="block mb-1 font-medium">Touch Bonus</label>
          <input
            type="number"
            class="px-3 py-1.5 border border-gray-600 rounded text-gray-700 w-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            :value="getSenseBonus('Touch')"
            @change="
              saveSenseBonus(
                'Touch',
                Number(($event.target as HTMLInputElement).value)
              )
            "
          />
        </div>
      </div>
    </fieldset>
  </div>
</template>

<script setup lang="ts">
import { inject, computed } from "vue";
import type { DwBaseSheet } from "../DwBaseSheet";

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
    burrowing?: number;
    [key: string]: unknown;
  };
};

const system = inject<DwSystem>("reactiveSystem")!;
const actor = inject<Actor>("actor")!;
const sheet = inject<DwBaseSheet>("sheet")!;
void sheet;

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

function save(path: string, value: unknown) {
  const keys = path.split(".");
  let obj = system as Record<string, unknown>;
  for (let i = 0; i < keys.length - 1; i++) {
    obj = obj[keys[i]] as Record<string, unknown>;
  }
  obj[keys[keys.length - 1]] = value;
  sheet.saveSystem({ [path]: value });
}

function saveAndClamp(path: string, value: number) {
  save(path, value);
  // Clamp hp.value if max changed
  if (path === "resources.hp.max") {
    const cur = system.resources.hp.value;
    if (cur > value) {
      save("resources.hp.value", value);
    }
  }
}

function getSkillLevel(skillName: string): number {
  const s = system.skills?.movement;
  if (!s) return 0;
  const entry = (s as Record<string, unknown>)[skillName];
  if (!entry) return 0;
  // Handle both simple { level } and complex { statistics[], level } entries
  if (Array.isArray(entry)) {
    return (entry[0] as SkillEntry)?.level ?? 0;
  }
  return (entry as SkillEntry).level ?? 0;
}

function saveSkillLevel(skillName: string, value: number) {
  const path = `skills.movement.${skillName}.level`;
  save(path, value);
}

function getSkillBonus(skillName: string): number {
  const s = system.skills?.movement;
  if (!s) return 0;
  const entry = (s as Record<string, unknown>)[skillName];
  if (!entry) return 0;
  // Handle both simple { level, bonus } and complex { statistics[], level, bonus } entries
  if (Array.isArray(entry)) {
    return (entry[0] as SkillEntry)?.bonus ?? 0;
  }
  return (entry as SkillEntry).bonus ?? 0;
}

function saveSkillBonus(skillName: string, value: number) {
  const path = `skills.movement.${skillName}.bonus`;
  save(path, value);
}

function getSkillFlag(flag: string): boolean {
  return !!(system.movementFlags as Record<string, unknown> | undefined)?.[
    flag
  ];
}

function getSenseLevel(senseName: string): number {
  const s = system.skills?.senses;
  if (!s) return 0;
  const entry = (s as Record<string, unknown>)[senseName];
  if (!entry) return 0;
  return (entry as SkillEntry).level ?? 0;
}

function saveSenseLevel(senseName: string, value: number) {
  const path = `skills.senses.${senseName}.level`;
  save(path, value);
}

function getSenseBonus(senseName: string): number {
  const s = system.skills?.senses;
  if (!s) return 0;
  const entry = (s as Record<string, unknown>)[senseName];
  if (!entry) return 0;
  return (entry as SkillEntry).bonus ?? 0;
}

function saveSenseBonus(senseName: string, value: number) {
  const path = `skills.senses.${senseName}.bonus`;
  save(path, value);
}

function saveSkillFlag(flag: string, value: boolean) {
  if (!system.movementFlags) {
    (system as Record<string, unknown>).movementFlags = {};
  }
  (system.movementFlags as Record<string, unknown>)[flag] = value;
  sheet.saveSystem({ [`movementFlags.${flag}`]: value });
}

// Speeds mirroring the CSB hidden formulas:
// walkingSpeed = 20 + (ceil(athletics / 3) * 5)
// acrobaticsSpeed = 20 + (ceil(acrobatics / 3) * 5)
// swimmingSpeed = 20 + (ceil(swimming / 3) * 5)
// flyingSpeed = walkingSpeed * hasFlight
const speeds = computed(() => {
  const athl = getSkillLevel("Athletics");
  const acro = getSkillLevel("Acrobatics");
  const swim = getSkillLevel("Swimming");
  const burrow = (system.movementFlags?.burrowing as number | undefined) ?? 0;
  const hasFlight = getSkillFlag("hasFlight");

  const walking = 20 + Math.ceil(athl / 3) * 5;
  const acrobatics = 20 + Math.ceil(acro / 3) * 5;
  const swimming = 20 + Math.ceil(swim / 3) * 5;
  const flying = hasFlight ? walking : 0;
  const burrowing = burrow > 0 ? 20 + Math.ceil(burrow / 3) * 5 : 0;

  return { walking, acrobatics, swimming, flying, burrowing };
});
</script>
