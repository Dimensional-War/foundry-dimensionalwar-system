<template>
  <div class="mb-4 border p-3 rounded">
    <div class="flex justify-between items-center mb-2">
      <input
        type="text"
        class="px-3 py-1.5 border border-gray-600 rounded text-gray-700 w-1/2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        v-model="form.name"
      />
      <div class="flex gap-2 items-center">
        <span v-if="mpCostTooltip" class="text-xs text-gray-500">
          {{ mpCostTooltip }}
        </span>
        <button
          v-if="active"
          class="px-3 py-1 bg-gray-600 text-white rounded hover:bg-gray-700"
          :title="mpCostTooltip"
          @click="$emit('deactivate')"
        >
          Deactivate
        </button>
        <button
          v-else
          class="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700"
          :title="mpCostTooltip"
          @click="$emit('activate')"
        >
          Activate
        </button>
        <button
          class="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700"
          @click="$emit('remove')"
        >
          Remove
        </button>
      </div>
    </div>

    <div class="grid grid-cols-2 gap-2 mb-2">
      <div>
        <label class="block mb-1 font-medium">Token Image</label>
        <div class="flex gap-2 items-center">
          <img
            v-if="form.img"
            :src="form.img"
            class="w-8 h-8 object-cover rounded border border-gray-600 cursor-pointer shrink-0"
            title="Click to change token image"
            @click="pickTokenImage"
          />
          <input
            type="text"
            class="px-3 py-1.5 border border-gray-600 rounded text-gray-700 w-full"
            v-model="form.img"
          />
          <button
            type="button"
            class="px-3 py-1.5 border border-gray-600 rounded text-gray-700 hover:bg-gray-50 cursor-pointer shrink-0"
            title="Browse for token image"
            @click="pickTokenImage"
          >
            📁
          </button>
        </div>
      </div>
      <div class="flex gap-2">
        <div>
          <label class="block mb-1 font-medium">Token Width</label>
          <input
            type="number"
            min="0"
            step="0.5"
            class="px-3 py-1.5 border border-gray-600 rounded text-gray-700 w-full"
            v-model.number="form.tokenWidth"
          />
        </div>
        <div>
          <label class="block mb-1 font-medium">Token Height</label>
          <input
            type="number"
            min="0"
            step="0.5"
            class="px-3 py-1.5 border border-gray-600 rounded text-gray-700 w-full"
            v-model.number="form.tokenHeight"
          />
        </div>
      </div>
    </div>

    <!-- Statistic fields hidden for now - not wired into anything yet -->
    <fieldset v-if="false" class="border p-2 mb-2">
      <legend class="font-bold">
        {{ bonusMode ? "Statistic Bonuses" : "Statistics" }}
      </legend>
      <div class="grid grid-cols-3 gap-2">
        <div v-for="key in statKeys" :key="key">
          <label class="block mb-1 capitalize">{{ key }}</label>
          <input
            type="number"
            class="px-2 py-1 border border-gray-600 rounded text-gray-700 w-full"
            v-model.number="form.statistics[key].value"
          />
        </div>
      </div>
    </fieldset>

    <fieldset class="border p-2 mb-2">
      <legend class="font-bold">
        {{ bonusMode ? "Resource/Soak Bonuses" : "Resources & Soak" }}
      </legend>
      <div class="grid grid-cols-4 gap-2">
        <div>
          <label class="block mb-1">Max HP</label>
          <input
            type="number"
            class="px-2 py-1 border border-gray-600 rounded text-gray-700 w-full"
            v-model.number="form.resources.hp.max"
          />
        </div>
        <div>
          <label class="block mb-1">Max MP</label>
          <input
            type="number"
            class="px-2 py-1 border border-gray-600 rounded text-gray-700 w-full"
            v-model.number="form.resources.mp.max"
          />
        </div>
        <div>
          <label class="block mb-1">Physical Soak</label>
          <input
            type="number"
            class="px-2 py-1 border border-gray-600 rounded text-gray-700 w-full"
            v-model.number="form.soak.physicalBase"
          />
        </div>
        <div>
          <label class="block mb-1">Magical Soak</label>
          <input
            type="number"
            class="px-2 py-1 border border-gray-600 rounded text-gray-700 w-full"
            v-model.number="form.soak.magicalBase"
          />
        </div>
        <div v-if="!bonusMode">
          <label class="block mb-1" title="Blank = auto-computed from the % of HP remaining in whatever form was just left">
            Current HP (optional)
          </label>
          <input
            type="number"
            min="0"
            :placeholder="`Auto (${hpAutoPreview})`"
            class="px-2 py-1 border border-gray-600 rounded text-gray-700 w-full"
            v-model="hpCurrentInput"
          />
        </div>
        <div v-if="!bonusMode">
          <label class="block mb-1" title="Blank = auto-computed from the % of MP remaining in whatever form was just left">
            Current MP (optional)
          </label>
          <input
            type="number"
            min="0"
            :placeholder="`Auto (${mpAutoPreview})`"
            class="px-2 py-1 border border-gray-600 rounded text-gray-700 w-full"
            v-model="mpCurrentInput"
          />
        </div>
      </div>
    </fieldset>

    <fieldset v-if="!bonusMode" class="border p-2 mb-2">
      <legend class="font-bold">Gauges</legend>
      <p class="text-xs text-gray-500 mb-2">
        Unchecked = this form doesn't have that gauge, regardless of the base
        sheet. Current value blank = auto-computed from the % remaining in
        whatever form was just left.
      </p>
      <div class="grid grid-cols-2 gap-2">
        <div>
          <label class="flex items-center gap-2 mb-1">
            <input type="checkbox" v-model="form.gauges.hasTrance" />
            Has Trance
          </label>
          <input
            v-if="form.gauges.hasTrance"
            type="number"
            min="0"
            :placeholder="`Auto (${tranceAutoPreview})`"
            class="px-2 py-1 border border-gray-600 rounded text-gray-700 w-full"
            v-model="tranceInput"
          />
        </div>
        <div>
          <label class="flex items-center gap-2 mb-1">
            <input type="checkbox" v-model="form.gauges.hasLimitBreak" />
            Has Limit Break
          </label>
          <input
            v-if="form.gauges.hasLimitBreak"
            type="number"
            min="0"
            :placeholder="`Auto (${limitBreakAutoPreview})`"
            class="px-2 py-1 border border-gray-600 rounded text-gray-700 w-full"
            v-model="limitBreakInput"
          />
        </div>
      </div>
    </fieldset>

    <fieldset v-if="!bonusMode" class="border p-2">
      <legend class="font-bold">Elements</legend>
      <div class="grid grid-cols-4 gap-2">
        <div>
          <label class="block mb-1">Element 1</label>
          <select
            class="px-2 py-1 border border-gray-600 rounded text-gray-700 w-full"
            v-model="form.elements.element1Name"
          >
            <option v-for="el in elementChoices" :key="el.key" :value="el.key">
              {{ el.label }}
            </option>
          </select>
        </div>
        <div>
          <label class="block mb-1">Level</label>
          <select
            class="px-2 py-1 border border-gray-600 rounded text-gray-700 w-full"
            v-model.number="form.elements.element1Level"
          >
            <option v-for="n in 6" :key="n - 1" :value="n - 1">
              {{ n - 1 }}
            </option>
          </select>
        </div>
        <div>
          <label class="block mb-1">Element 2</label>
          <select
            class="px-2 py-1 border border-gray-600 rounded text-gray-700 w-full"
            v-model="form.elements.element2Name"
          >
            <option v-for="el in elementChoices" :key="el.key" :value="el.key">
              {{ el.label }}
            </option>
          </select>
        </div>
        <div>
          <label class="block mb-1">Level</label>
          <select
            class="px-2 py-1 border border-gray-600 rounded text-gray-700 w-full"
            v-model.number="form.elements.element2Level"
          >
            <option v-for="n in 6" :key="n - 1" :value="n - 1">
              {{ n - 1 }}
            </option>
          </select>
        </div>
      </div>
    </fieldset>
  </div>
</template>

<script setup lang="ts">
import { computed, inject } from "vue";
import { ELEMENT_CHOICES as elementChoices } from "~/module/utils/elements.ts";

interface LiveSystem {
  resources?: { hp?: { value?: number; max?: number }; mp?: { value?: number; max?: number } };
  gauges?: { trance?: number; limitBreak?: number };
}

interface FormEntry {
  id: string;
  name: string;
  img?: string;
  tokenWidth?: number;
  tokenHeight?: number;
  statistics: Record<string, { value: number }>;
  resources: {
    hp: { max: number; current?: number | null };
    mp: { max: number; current?: number | null };
  };
  gauges: {
    hasTrance: boolean;
    hasLimitBreak: boolean;
    trance?: number | null;
    limitBreak?: number | null;
  };
  soak: { physicalBase: number; magicalBase: number };
  elements: {
    element1Name: string;
    element1Level: number;
    element2Name: string;
    element2Level: number;
  };
}

// `form` is the live entry from reactiveSystem (not a copy), so v-model
// bindings below mutate it directly and Foundry's watcher in DwBaseSheet
// picks up the change and persists it - no local draft/emit round-trip.
const props = defineProps<{
  form: FormEntry;
  active?: boolean;
  bonusMode?: boolean;
  mpCost?: number;
}>();

defineEmits<{
  remove: [];
  activate: [];
  deactivate: [];
}>();

const system = inject<LiveSystem>("reactiveSystem")!;

// Preview what the "Auto" resolution would actually produce right now
// (same math as forms.ts's scaleResourceValue), so the placeholder shows a
// concrete number instead of leaving the user to guess a percentage.
function scalePreview(value: number, fromMax: number, toMax: number): number {
  if (!fromMax) return value;
  return Math.max(0, Math.round((value / fromMax) * toMax));
}

const hpAutoPreview = computed(() =>
  scalePreview(
    system.resources?.hp?.value ?? 0,
    system.resources?.hp?.max ?? 0,
    props.form.resources.hp.max ?? 0
  )
);
const mpAutoPreview = computed(() =>
  scalePreview(
    system.resources?.mp?.value ?? 0,
    system.resources?.mp?.max ?? 0,
    props.form.resources.mp.max ?? 0
  )
);
const tranceAutoPreview = computed(() =>
  scalePreview(
    system.gauges?.trance ?? 0,
    (system.resources?.hp?.max ?? 0) * 2,
    (props.form.resources.hp.max ?? 0) * 2
  )
);
const limitBreakAutoPreview = computed(() =>
  scalePreview(
    system.gauges?.limitBreak ?? 0,
    (system.resources?.hp?.max ?? 0) * 4,
    (props.form.resources.hp.max ?? 0) * 4
  )
);

const mpCostTooltip = computed(() =>
  props.mpCost ? `Costs ${props.mpCost} MP (5% of max MP)` : undefined
);

function pickTokenImage() {
  const fp = new foundry.applications.apps.FilePicker.implementation({
    type: "image",
    current: props.form.img ?? undefined,
    callback: (path: string) => {
      props.form.img = path;
    }
  });
  fp.browse();
}

const statKeys = [
  "health",
  "awareness",
  "dexterity",
  "strength",
  "spirit",
  "luck"
] as const;

// Text-bound (not v-model.number) so the field can be left blank to mean
// "no override, auto-scale by %" (stored as null) rather than 0.
function nullableNumberInput(get: () => number | null | undefined, set: (v: number | null) => void) {
  return computed<string>({
    get: () => {
      const value = get();
      return value === null || value === undefined ? "" : String(value);
    },
    set: raw => {
      const trimmed = raw.trim();
      set(trimmed === "" ? null : Number(trimmed));
    }
  });
}

const hpCurrentInput = nullableNumberInput(
  () => props.form.resources.hp.current,
  v => (props.form.resources.hp.current = v)
);
const mpCurrentInput = nullableNumberInput(
  () => props.form.resources.mp.current,
  v => (props.form.resources.mp.current = v)
);
const tranceInput = nullableNumberInput(
  () => props.form.gauges.trance,
  v => (props.form.gauges.trance = v)
);
const limitBreakInput = nullableNumberInput(
  () => props.form.gauges.limitBreak,
  v => (props.form.gauges.limitBreak = v)
);
</script>
