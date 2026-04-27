<template>
  <div class="dw-customs-tab">
    <div class="mb-3">
      <button
        class="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        @click="addCustom"
      >
        Add Custom Ability
      </button>
    </div>

    <div v-if="customs.length === 0" class="text-gray-500 italic">
      No custom abilities defined. Click "Add Custom Ability" to create one.
    </div>

    <div
      v-for="(custom, index) in customs"
      :key="index"
      class="mb-4 border p-3 rounded"
    >
      <div class="flex justify-between items-center mb-2">
        <h3 class="font-bold text-lg">Custom Ability {{ index + 1 }}</h3>
        <button
          class="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700"
          @click="removeCustom(index)"
        >
          Remove
        </button>
      </div>

      <div class="mb-2">
        <label class="block mb-1 font-medium">Name</label>
        <input
          type="text"
          class="px-3 py-1.5 border border-gray-600 rounded text-gray-700 w-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          v-model="custom.name"
        />
      </div>

      <div class="mb-2">
        <label class="block mb-1 font-medium">MP Cost</label>
        <input
          type="number"
          class="px-3 py-1.5 border border-gray-600 rounded text-gray-700 w-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          v-model.number="custom.mpCost"
          min="1"
        />
      </div>

      <fieldset class="border p-2">
        <legend class="font-bold">Special Attributes</legend>

        <div class="mb-2">
          <label class="block mb-1 font-medium">Elemental Type</label>
          <select
            class="px-3 py-1.5 border border-gray-600 rounded text-gray-700 w-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            v-model="custom.specialAttributes.elemental"
          >
            <option value="">None</option>
            <option value="Fire">Fire</option>
            <option value="Water">Water</option>
            <option value="Earth">Earth</option>
            <option value="Air">Air</option>
            <option value="Shadow">Shadow</option>
            <option value="Light">Light</option>
            <option value="Force">Force</option>
            <option value="Time">Time</option>
            <option value="Darkness">Darkness</option>
            <option value="Holy">Holy</option>
          </select>
        </div>

        <div class="flex items-center gap-2">
          <input
            type="checkbox"
            :id="`restorative-${index}`"
            v-model="custom.specialAttributes.restorative"
          />
          <label :for="`restorative-${index}`" class="font-medium"
            >Restorative</label
          >
        </div>
      </fieldset>
    </div>
  </div>
</template>

<script setup lang="ts">
import { inject, computed } from "vue";

interface Custom {
  name: string;
  mpCost: number;
  specialAttributes?: {
    elemental?: string;
    restorative?: boolean;
  };
}

interface SystemData {
  customs?: Custom[];
}

const actor = inject<Actor>("actor")!;
const system = inject<SystemData>("reactiveSystem")!;

const customs = computed(() => {
  const list = system.customs ?? [];
  // Ensure specialAttributes exists on all customs
  return list.map(custom => ({
    ...custom,
    specialAttributes: custom.specialAttributes ?? {
      elemental: "",
      restorative: false
    }
  }));
});

function addCustom() {
  const newCustoms = [
    ...customs.value,
    {
      name: "New Custom Ability",
      mpCost: 1,
      specialAttributes: {
        elemental: "",
        restorative: false
      }
    }
  ];
  system.customs = newCustoms;
}

function removeCustom(index: number) {
  const newCustoms = customs.value.filter((_, i) => i !== index);
  system.customs = newCustoms;
}
</script>
