<template>
  <div class="dw-damage-dialog" style="min-width: 380px; padding: 1rem">
    <!-- ─── Target name ─────────────────────────────────────────────────────── -->
    <div class="mb-3 font-bold text-base">{{ targetName }}</div>

    <!-- ─── Inputs ──────────────────────────────────────────────────────────── -->
    <div class="flex flex-col gap-2">
      <!-- Raw damage -->
      <div>
        <label class="block text-sm font-semibold mb-1">Raw Damage</label>
        <input
          type="number"
          v-model.number="rawDamage"
          min="0"
          placeholder="0"
          class="w-full px-3 py-1.5 border border-gray-500 rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
        />
      </div>

      <!-- Damage type -->
      <div>
        <label class="block text-sm font-semibold mb-1">Damage Type</label>
        <div class="flex gap-0">
          <button
            type="button"
            class="flex-1 px-3 py-1.5 border border-gray-500 rounded-l transition-colors cursor-pointer"
            :class="
              damageType === 'physical'
                ? 'bg-blue-600 text-white border-blue-600 z-10'
                : 'text-gray-700 hover:bg-gray-50'
            "
            @click="damageType = 'physical'"
          >
            Physical
          </button>
          <button
            type="button"
            class="flex-1 px-3 py-1.5 border border-gray-500 -ml-px transition-colors cursor-pointer"
            :class="
              damageType === 'magical'
                ? 'bg-purple-600 text-white border-purple-600 z-10'
                : 'text-gray-700 hover:bg-gray-50'
            "
            @click="damageType = 'magical'"
          >
            Magical
          </button>
          <button
            type="button"
            class="flex-1 px-3 py-1.5 border border-gray-500 rounded-r -ml-px transition-colors cursor-pointer"
            :class="
              damageType === 'unsoakable'
                ? 'bg-orange-600 text-white border-orange-600 z-10'
                : 'text-gray-700 hover:bg-gray-50'
            "
            @click="damageType = 'unsoakable'"
          >
            Unsoakable
          </button>
        </div>
      </div>

      <!-- Piercing (hidden when unsoakable — all damage bypasses soak anyway) -->
      <div v-if="damageType !== 'unsoakable'">
        <label
          class="block text-sm font-semibold mb-1"
          :title="'This amount of soak is bypassed before applying damage'"
        >
          Piercing
          <span class="font-normal text-gray-500">(bypasses soak)</span>
        </label>
        <input
          type="number"
          v-model.number="piercing"
          min="0"
          placeholder="0"
          class="w-full px-3 py-1.5 border border-gray-500 rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
        />
      </div>

      <!-- Number of Hits (combo) -->
      <div>
        <label
          class="block text-sm font-semibold mb-1"
          :title="'Each hit applies soak independently (shield depletes per hit)'"
        >
          Number of Hits
          <span class="font-normal text-gray-500">(combo)</span>
        </label>
        <input
          type="number"
          v-model.number="hits"
          min="1"
          placeholder="1"
          class="w-full px-3 py-1.5 border border-gray-500 rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
        />
      </div>

      <!-- Elemental (optional) -->
      <div>
        <label
          class="flex items-center gap-2 text-sm font-semibold cursor-pointer select-none"
        >
          <input type="checkbox" v-model="isElemental" class="cursor-pointer" />
          Elemental
        </label>
        <div v-if="isElemental" class="mt-1.5 flex flex-col gap-1">
          <!-- Element 1 -->
          <div class="flex gap-1 items-center">
            <select
              v-model="elementName1"
              class="flex-1 px-2 py-1.5 border border-gray-500 rounded text-sm focus:outline-none"
            >
              <option
                v-for="el in ELEMENT_CHOICES"
                :key="el.key"
                :value="el.key"
              >
                {{ el.label }}
              </option>
            </select>
            <select
              v-model.number="elementLevel1"
              class="w-20 px-2 py-1.5 border border-gray-500 rounded text-sm focus:outline-none"
            >
              <option v-for="n in 5" :key="n" :value="n">Lv.{{ n }}</option>
            </select>
          </div>
          <!-- Element 2 -->
          <div class="flex gap-1 items-center">
            <select
              v-model="elementName2"
              class="flex-1 px-2 py-1.5 border border-gray-500 rounded text-sm focus:outline-none"
            >
              <option
                v-for="el in ELEMENT_CHOICES"
                :key="el.key"
                :value="el.key"
              >
                {{ el.label }}
              </option>
            </select>
            <select
              v-model.number="elementLevel2"
              class="w-20 px-2 py-1.5 border border-gray-500 rounded text-sm focus:outline-none"
            >
              <option v-for="n in 5" :key="n" :value="n">Lv.{{ n }}</option>
            </select>
          </div>
        </div>
      </div>

      <!-- Apply scope -->
      <div v-if="props.showApplyToTargetsOption">
        <label
          class="flex items-center gap-2 text-sm font-semibold cursor-pointer select-none"
        >
          <input
            type="checkbox"
            v-model="applyToCurrentTargets"
            class="cursor-pointer"
          />
          {{
            props.applyToTargetsLabel ?? "Apply to all currently targeted tokens"
          }}
        </label>
      </div>

      <!-- ─── Buttons ─────────────────────────────────────────────────────── -->
      <div class="flex gap-2 mt-1">
        <button
          type="button"
          class="flex-1 px-4 py-1.5 border border-gray-400 rounded text-gray-700 hover:bg-gray-100 cursor-pointer transition-colors"
          @click="dialog.submit(null)"
        >
          Cancel
        </button>
        <button
          type="button"
          class="flex-1 px-4 py-1.5 bg-red-600 text-white rounded hover:bg-red-700 cursor-pointer transition-colors font-semibold"
          @click="handleApply"
        >
          Apply Damage
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import type { VueDialog } from "../vue-dialog";
import { ELEMENT_CHOICES } from "../../utils/elements";

interface Props {
  /** VueDialog instance — injected automatically by VueDialog.show() */
  dialog: VueDialog;
  targetName: string;
  showApplyToTargetsOption?: boolean;
  applyToTargetsLabel?: string;
}

const props = defineProps<Props>();

// ─── Form state ──────────────────────────────────────────────────────────────
const rawDamage = ref(0);
const damageType = ref<"physical" | "magical" | "unsoakable">("physical");
const piercing = ref(0);
const hits = ref(1);
const isElemental = ref(false);
const elementName1 = ref("no_element");
const elementLevel1 = ref(1);
const elementName2 = ref("no_element");
const elementLevel2 = ref(1);
const applyToCurrentTargets = ref(false);

// ─── Actions ─────────────────────────────────────────────────────────────────
function handleApply() {
  const elements = isElemental.value
    ? [
        { name: elementName1.value, level: elementLevel1.value },
        { name: elementName2.value, level: elementLevel2.value }
      ].filter(e => e.name !== "no_element")
    : [];

  props.dialog.submit({
    rawDamage: rawDamage.value,
    damageType: damageType.value,
    piercing: damageType.value === "unsoakable" ? 0 : piercing.value,
    hits: Math.max(1, hits.value ?? 1),
    elements,
    applyToCurrentTargets:
      !!props.showApplyToTargetsOption && applyToCurrentTargets.value
  });
}
</script>
