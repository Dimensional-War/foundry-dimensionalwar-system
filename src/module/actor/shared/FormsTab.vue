<template>
  <div class="dw-forms-tab">
    <section class="mb-6">
      <div class="flex justify-between items-center mb-2">
        <h3 class="font-bold text-lg">Transformations</h3>
        <button
          class="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          @click="addTransformation"
        >
          Add Transformation
        </button>
      </div>
      <p class="text-sm text-gray-500 mb-2">
        Fully replaces statistics, resources, soak, and elements while active.
        Only one transformation can be active at a time.
      </p>

      <div v-if="transformations.length === 0" class="text-gray-500 italic">
        No transformations defined.
      </div>

      <FormEntryEditor
        v-for="(form, index) in transformations"
        :key="form.id"
        :form="form"
        :active="system.formState?.activeTransformationId === form.id"
        :mp-cost="transformationMpCost"
        @remove="removeEntry('transformations', index)"
        @activate="activateTransformation(actor, form.id)"
        @deactivate="deactivateTransformation(actor)"
      />
    </section>

    <section>
      <div class="flex justify-between items-center mb-2">
        <h3 class="font-bold text-lg">Alternate Forms</h3>
        <button
          class="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          @click="addAlternateForm"
        >
          Add Alternate Form
        </button>
      </div>
      <p class="text-sm text-gray-500 mb-2">
        Adds bonuses on top of whatever is currently active (base sheet or an
        active transformation). Only one alternate form can be active at a
        time.
      </p>

      <div v-if="alternateForms.length === 0" class="text-gray-500 italic">
        No alternate forms defined.
      </div>

      <FormEntryEditor
        v-for="(form, index) in alternateForms"
        :key="form.id"
        :form="form"
        :active="system.formState?.activeAlternateFormId === form.id"
        bonus-mode
        @remove="removeEntry('alternateForms', index)"
        @activate="activateAlternateForm(actor, form.id)"
        @deactivate="deactivateAlternateForm(actor)"
      />
    </section>
  </div>
</template>

<script setup lang="ts">
import { inject, computed } from "vue";
import { SystemActor } from "~/module/documents.ts";
import FormEntryEditor from "./FormEntryEditor.vue";
import {
  activateTransformation,
  deactivateTransformation,
  activateAlternateForm,
  deactivateAlternateForm
} from "~/module/utils/forms.ts";

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
  gauges?: {
    hasTrance?: boolean;
    hasLimitBreak?: boolean;
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

interface SystemData {
  transformations?: FormEntry[];
  alternateForms?: FormEntry[];
  formState?: {
    activeTransformationId?: string;
    activeAlternateFormId?: string;
  };
  resources?: { mp?: { max?: number } };
}

const actor = inject<SystemActor>("actor")!;
const system = inject<SystemData>("reactiveSystem")!;

const transformations = computed(() => system.transformations ?? []);
const alternateForms = computed(() => system.alternateForms ?? []);
const transformationMpCost = computed(() =>
  Math.ceil((system.resources?.mp?.max ?? 0) * 0.05)
);

function blankForm(): FormEntry {
  return {
    id: foundry.utils.randomID(),
    name: "New Form",
    img: "",
    tokenWidth: 1,
    tokenHeight: 1,
    statistics: {
      health: { value: 0 },
      awareness: { value: 0 },
      dexterity: { value: 0 },
      strength: { value: 0 },
      spirit: { value: 0 },
      luck: { value: 0 }
    },
    resources: { hp: { max: 0, current: null }, mp: { max: 0, current: null } },
    gauges: {
      hasTrance: false,
      hasLimitBreak: false,
      trance: null,
      limitBreak: null
    },
    soak: { physicalBase: 0, magicalBase: 0 },
    elements: {
      element1Name: "no_element",
      element1Level: 0,
      element2Name: "no_element",
      element2Level: 0
    }
  };
}

function addTransformation() {
  system.transformations = [...transformations.value, blankForm()];
}

function addAlternateForm() {
  system.alternateForms = [...alternateForms.value, blankForm()];
}

async function removeEntry(
  key: "transformations" | "alternateForms",
  index: number
) {
  const entry = (system[key] ?? [])[index];
  const label = entry?.name?.trim() || "this form";
  const confirmed = await foundry.applications.api.DialogV2.confirm({
    content: `<p>Delete <strong>${label}</strong>?</p>`,
    modal: true
  });
  if (!confirmed) return;

  system[key] = (system[key] ?? []).filter((_, i) => i !== index);
}
</script>
