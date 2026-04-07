<template>
  <div class="dw-statistics-tab">
    <!-- ─── HP / MP ─────────────────────────────────────────────── -->
    <fieldset class="dw-fieldset">
      <legend>Resources</legend>
      <div class="dw-grid-2">
        <label>Max HP</label>
        <input
          type="number"
          class="dw-input-num"
          :value="system.resources.hp.max"
          @change="
            saveAndClamp(
              'resources.hp.max',
              Number(($event.target as HTMLInputElement).value)
            )
          "
          min="0"
        />
        <label>Current HP</label>
        <input
          type="number"
          class="dw-input-num"
          :value="system.resources.hp.value"
          @change="
            save(
              'resources.hp.value',
              Number(($event.target as HTMLInputElement).value)
            )
          "
        />
        <label>Max MP</label>
        <input
          type="number"
          class="dw-input-num"
          :value="system.resources.mp.max"
          @change="
            save(
              'resources.mp.max',
              Number(($event.target as HTMLInputElement).value)
            )
          "
          min="0"
        />
        <label>Current MP</label>
        <input
          type="number"
          class="dw-input-num"
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
    </fieldset>

    <!-- ─── Soak ─────────────────────────────────────────────────── -->
    <fieldset class="dw-fieldset">
      <legend>Base Soak</legend>
      <div class="dw-grid-2">
        <label>Physical Soak</label>
        <input
          type="number"
          class="dw-input-num"
          :value="system.soak.physicalBase"
          @change="
            save(
              'soak.physicalBase',
              Number(($event.target as HTMLInputElement).value)
            )
          "
          min="0"
        />
        <label>Magical Soak</label>
        <input
          type="number"
          class="dw-input-num"
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
    </fieldset>

    <!-- ─── Elements ─────────────────────────────────────────────── -->
    <fieldset class="dw-fieldset">
      <legend>Elements</legend>
      <div class="dw-grid-4">
        <label>Element 1</label>
        <select
          :value="system.elements.element1Name"
          @change="
            save(
              'elements.element1Name',
              ($event.target as HTMLSelectElement).value
            )
          "
          class="dw-select"
        >
          <option v-for="el in elementChoices" :key="el.key" :value="el.key">
            {{ el.label }}
          </option>
        </select>
        <label>Level</label>
        <select
          :value="system.elements.element1Level"
          @change="
            save(
              'elements.element1Level',
              Number(($event.target as HTMLSelectElement).value)
            )
          "
          class="dw-select dw-select-xs"
        >
          <option v-for="n in 6" :key="n - 1" :value="n - 1">
            {{ n - 1 }}
          </option>
        </select>

        <label>Element 2</label>
        <select
          :value="system.elements.element2Name"
          @change="
            save(
              'elements.element2Name',
              ($event.target as HTMLSelectElement).value
            )
          "
          class="dw-select"
        >
          <option v-for="el in elementChoices" :key="el.key" :value="el.key">
            {{ el.label }}
          </option>
        </select>
        <label>Level</label>
        <select
          :value="system.elements.element2Level"
          @change="
            save(
              'elements.element2Level',
              Number(($event.target as HTMLSelectElement).value)
            )
          "
          class="dw-select dw-select-xs"
        >
          <option v-for="n in 6" :key="n - 1" :value="n - 1">
            {{ n - 1 }}
          </option>
        </select>
      </div>
    </fieldset>

    <!-- ─── Gauges ────────────────────────────────────────────────── -->
    <fieldset class="dw-fieldset">
      <legend>Gauges</legend>
      <div class="dw-grid-2">
        <label>Has Trance</label>
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
        <label v-if="system.gauges.hasTrance">Trance (cur)</label>
        <input
          v-if="system.gauges.hasTrance"
          type="number"
          class="dw-input-num"
          :value="system.gauges.trance"
          @change="
            save(
              'gauges.trance',
              Number(($event.target as HTMLInputElement).value)
            )
          "
          min="0"
        />

        <label>Has Limit Break</label>
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
        <label v-if="system.gauges.hasLimitBreak">Limit Break (cur)</label>
        <input
          v-if="system.gauges.hasLimitBreak"
          type="number"
          class="dw-input-num"
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
    <fieldset class="dw-fieldset">
      <legend>Movement</legend>
      <div class="dw-grid-2">
        <template v-for="skill in movementSkills" :key="skill.key">
          <label>{{ skill.label }}</label>
          <input
            type="number"
            class="dw-input-num"
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
        </template>
      </div>
      <div class="dw-row dw-mt-2">
        <label class="dw-check-label">
          <input
            type="checkbox"
            :checked="getSkillFlag('hasFlight')"
            @change="
              saveSkillFlag(
                'hasFlight',
                ($event.target as HTMLInputElement).checked
              )
            "
          />
          Has Flight
        </label>
        <label class="dw-check-label">
          <input
            type="checkbox"
            :checked="getSkillFlag('hasParkour')"
            @change="
              saveSkillFlag(
                'hasParkour',
                ($event.target as HTMLInputElement).checked
              )
            "
          />
          Has Parkour
        </label>
        <label class="dw-check-label">
          <input
            type="checkbox"
            :checked="getSkillFlag('hasTeleport')"
            @change="
              saveSkillFlag(
                'hasTeleport',
                ($event.target as HTMLInputElement).checked
              )
            "
          />
          Has Teleport
        </label>
      </div>
      <div v-if="speeds.walking" class="dw-speed-display dw-mt-2">
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
  </div>
</template>

<script setup lang="ts">
import { inject, computed } from "vue";
import type { DwBaseSheet } from "../DwBaseSheet";

type SkillEntry = { level: number };
type MovementSkills = {
  Acrobatics?: { statistics?: unknown[]; level?: number } | SkillEntry;
  Athletics?: { statistics?: unknown[]; level?: number } | SkillEntry;
  Swimming?: { statistics?: unknown[]; level?: number } | SkillEntry;
  Reaction?: SkillEntry;
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

function getSkillFlag(flag: string): boolean {
  return !!(system.movementFlags as Record<string, unknown> | undefined)?.[
    flag
  ];
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
