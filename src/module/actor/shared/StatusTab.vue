<template>
  <div class="dw-status-rolls-tab flex items-start mx-2 @container">
    <div class="dw-status-tab flex-1" ref="statusColumnRef">
      <!-- ─── Form Activation Row ────────────────────────────────── -->
      <div
        v-if="formButtons.length > 0"
        class="flex flex-wrap gap-1 mb-2"
      >
        <button
          v-for="btn in formButtons"
          :key="btn.key"
          type="button"
          class="dw-roll-btn flex-1 px-3 py-1.5 border rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent"
          :class="[
            btn.active
              ? 'bg-blue-600 text-white border-blue-600'
              : 'border-gray-600 text-gray-700 hover:bg-gray-50',
            btn.disabled ? '' : 'cursor-pointer'
          ]"
          :disabled="btn.disabled"
          :title="btn.title"
          @click="btn.onClick"
        >
          {{ btn.label }}
        </button>
      </div>
      <!-- ─── HP Row ─────────────────────────────────────────────── -->
      <div class="flex gap-1 my-2">
        <div class="basis-2/12 my-2 font-bold">HP:</div>
        <div class="basis-5/12 ml-1">
          <div class="relative h-6 bg-gray-200 rounded overflow-hidden">
            <div
              class="absolute inset-y-0 left-0 flex items-center justify-center transition-all"
              :class="hpPercent < 25
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
              :class="system.combat.emp
                ? 'bg-blue-600 text-white border-blue-600 z-10'
                : ' text-gray-700 hover:bg-gray-50'
                "
              @click="save('combat.emp', !system.combat.emp)"
            >
              EMP
            </button>
            <button
              type="button"
              class="flex-1 px-3 py-1.5 border border-gray-600 text-gray-700 -ml-px focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:z-10 hover:bg-gray-50"
              :title="currentDefenseEffect.label"
              @click="cycleDefenseEffect"
            >
              <i :class="currentDefenseEffect.iconClass" aria-hidden="true" :title="currentDefenseEffect.label"></i>
            </button>
            <button
              type="button"
              class="flex-1 px-3 py-1.5 border border-gray-600 rounded-r text-gray-700 -ml-px focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:z-10 hover:bg-gray-50"
              :title="currentBraceType.label"
              @click="cycleBraceType"
            >
              <i :class="currentBraceType.iconClass" aria-hidden="true" :title="currentBraceType.label"></i>
            </button>
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
          <br v-if="currentShieldSoak > 0" />
          <span
            v-if="currentShieldSoak > 0"
            title="Shield adds to soak for limited hits"
            :class="{
              'text-green-600 font-semibold': system.soak.shieldHitsLeft > 0 && !system.combat.emp,
              'text-gray-400 line-through': system.soak.shieldHitsLeft === 0 || system.combat.emp
            }"
            ><span class="font-bold">Shield: </span>+{{ currentShieldSoak }} ({{
              system.soak.shieldHitsLeft
            }}
            hits)</span
          >
        </div>
        <div class="flex-1">
          <div class="flex gap-0">
            <button
              type="button"
              class="flex-1 px-3 py-1.5 border border-gray-600 rounded-l cursor-pointer transition-colors whitespace-nowrap"
              :class="system.soak.shieldHitsLeft > 0
                ? 'bg-blue-600 text-white border-blue-600 z-10'
                : ' text-gray-700 hover:bg-gray-50'
                "
              @click="resetShield"
              :title="'Reset shield hits to max'"
            >
              Shield ({{ system.soak.shieldHitsLeft }}/{{ maxShieldHits }})
            </button>
            <button
              type="button"
              class="flex-1 px-3 py-1.5 border border-gray-600 rounded-r cursor-pointer transition-colors -ml-px"
              :class="system.combat.unsoakable
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
      <div class="flex gap-1">
        <div class="basis-4/12">
          <select
            v-model="system.combat.damageType"
            class="px-3 py-1.5 border border-gray-600 rounded text-gray-700 w-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="0">Normal Damage</option>
            <option value="1">Elemental Damage</option>
          </select>
        </div>
        <div class="basis-3/12">
          <input
            type="text"
            class="px-3 py-1.5 border border-gray-600 rounded text-gray-700 w-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            v-model="system.combat.damage"
            :title="'Damage/Healing (1 or 1% or 1%c)'"
            placeholder="Damage (1 or 1%)"
            @keydown="onDamageInputKeydown"
          />
        </div>
        <div class="basis-5/12">
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
              <option v-for="n in 6" :key="n - 1" :value="n - 1">
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
              <option v-for="n in 6" :key="n - 1" :value="n - 1">
                {{ n - 1 }}
              </option>
            </select>
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
        <button
          type="button"
          class="flex-1 px-3 py-1.5 border border-blue-500 rounded bg-blue-500 text-white hover:bg-blue-600 cursor-pointer transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          :disabled="!redoStack.length"
          @click="redoLastAction"
        >
          Redo Last Action
        </button>
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
            class="px-3 py-1.5 border border-blue-600 rounded bg-blue-600 text-white hover:bg-blue-700 cursor-pointer transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-blue-600"
            :disabled="system.gauges.trance < tranceMax"
            :title="system.gauges.trance < tranceMax ? 'Trance gauge is not full' : 'Spend the full trance gauge'"
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
          <div
            class="relative h-6 rounded overflow-hidden transition-colors"
            :class="{
              'bg-transparent': limitBreakFullBars === 0,
              'bg-green-600': limitBreakFullBars === 1,
              'bg-yellow-500': limitBreakFullBars === 2,
              'bg-orange-500': limitBreakFullBars === 3,
              'bg-red-500': limitBreakFullBars >= 4
            }"
          >
            <!-- Current bar being filled (full width) -->
            <div
              v-if="limitBreakPct > 0 && limitBreakFullBars < 4"
              class="absolute inset-y-0 left-0 transition-all"
              :class="{
                'bg-green-600': limitBreakFullBars === 0,
                'bg-yellow-500': limitBreakFullBars === 1,
                'bg-orange-500': limitBreakFullBars === 2,
                'bg-red-500': limitBreakFullBars === 3
              }"
              :style="`width: ${limitBreakPct}%`"
            ></div>
            <!-- Text overlay -->
            <div
              class="absolute inset-0 flex items-center justify-center pointer-events-none"
            >
              <span
                class="inline-block px-2 py-0.5 text-sm font-semibold text-white rounded"
              >
                Bars: {{ limitBreakFullBars }} / 4 ({{ limitBreakPct }}%)
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
              :max="limitBreakFullBars"
              :title="'Number of full bars to spend (max: ' + limitBreakFullBars + ')'
                "
              placeholder="Bars"
            />
            <button
              type="button"
              class="flex-1 px-3 py-1.5 border border-blue-600 rounded bg-blue-600 text-white hover:bg-blue-700 cursor-pointer transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-blue-600"
              :disabled="!spendLbAmount || spendLbAmount <= 0 || spendLbAmount > limitBreakFullBars"
              :title="!limitBreakFullBars ? 'No full bars available to spend' : 'Spend the entered number of bars'"
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
    <div
      class="basis-2/12 @lg:basis-3/12 @xl:basis-4/12 @3xl:basis-5/12 ms-2 flex flex-col"
      :style="rollsColumnMaxHeight ? `max-height: ${rollsColumnMaxHeight}px` : undefined"
    >
      <!-- ─── Dice/Bonus Modifiers ─────────────────────────────── -->
      <div class="flex gap-1 mb-2">
        <input
          type="text"
          class="px-2 py-1 border border-gray-600 rounded text-gray-700 text-sm w-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          v-model="diceMod"
          placeholder="Dice Mod (+1/-1)"
          :title="'Shifts the skill die level of rolled dice (e.g. -1 turns 1s2 into 1s1)'"
        />
        <input
          type="text"
          class="px-2 py-1 border border-gray-600 rounded text-gray-700 text-sm w-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          v-model="bonusMod"
          placeholder="Bonus Mod (+1/-1)"
          :title="'Adds to the flat bonus of any roll'"
        />
      </div>
      <!-- display buttons for rolls available in the current form -->
      <div class="flex flex-col gap-2 flex-1 min-h-0 overflow-y-auto">
          <button v-for="entry in visibleRolls"
            :key="entry.index"
            type="button"
            class="dw-roll-btn px-3 w-full py-1.5 border border-gray-600 rounded text-gray-700 hover:bg-gray-50 cursor-pointer transition-colors shrink-0"
            @click="onRollClick(entry.index)"
            :title="`(${entry.roll.mpCost} mp)`"
          >
            {{ entry.roll.reasonBase }}
          </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { inject, computed, ref, onMounted, onUnmounted } from "vue";
import type { DwBaseSheet } from "../DwBaseSheet";
import {
  ELEMENT_CHOICES as elementChoices,
  ELEMENT_OPPOSITIONS as elementOppositions,
  ELEMENTAL_WEAKNESS_BONUS as elementalWeakness,
  ELEMENTAL_RESISTANCE_MULT as elementalResistance
} from "../../utils/elements";
import { SystemActor } from "~/module/documents";
import { doRoll } from "~/module/rolling/dice-utils";
import { BaseData } from "~/module/types/base-data";
import {
  activateTransformation,
  deactivateTransformation,
  activateAlternateForm,
  deactivateAlternateForm
} from "~/module/utils/forms";

const defenseEffectOptions = [
  { value: "no_effect", label: "No Defense Effect", iconClass: "fa-solid fa-ban" },
  { value: "protect", label: "Protect", iconClass: "fa-solid fa-shield-halved" },
  { value: "shell", label: "Shell", iconClass: "fa-solid fa-circle-notch" },
  { value: "wall", label: "Wall", iconClass: "fa-solid fa-block-brick" },
  { value: "shield", label: "Shield", iconClass: "fa-solid fa-shield" }
];

const braceTypeOptions = [
  { value: "no_brace", label: "No Brace", iconClass: "fa-solid fa-shield-slash" },
  { value: "brace", label: "Brace", iconClass: "fa-solid fa-shield" },
  { value: "half_brace", label: "Half Brace", iconClass: "fa-solid fa-shield-halved" }
];

const currentDefenseEffect = computed(
  () =>
    defenseEffectOptions.find(
      option => option.value === system.combat.defenseEffect
    ) ?? defenseEffectOptions[0]
);

const currentBraceType = computed(
  () =>
    braceTypeOptions.find(
      option => option.value === system.combat.braceType
    ) ?? braceTypeOptions[0]
);

const system = inject<BaseData.DwSystem>("reactiveSystem")!;
const actor = inject<SystemActor>("actor")!;
const sheet = inject<DwBaseSheet>("sheet")!;

// ─── Local transient state ─────────────────────────────────────────────────
const mpMod = ref("");
const gaugeMod = ref("");
const spendLbAmount = ref(0);
const diceMod = ref("");
const bonusMod = ref("");
// Redo history is session-only (not persisted); cleared whenever a new action is recorded
const redoStack = ref<{ name: string; changes: Record<string, unknown> }[]>([]);

// Tracks the rolls column's max-height against the available window space, so it
// grows/shrinks with the sheet window; falls back to the left column's content
// height only until the tab content area has been measured (first mount)
const statusColumnRef = ref<HTMLElement | null>(null);
const rollsColumnMaxHeight = ref(0);
let statusColumnResizeObserver: ResizeObserver | null = null;

// Bottom breathing room so the rolls column never forces the tab content to scroll
const ROLLS_COLUMN_BOTTOM_MARGIN = 16;

function recomputeRollsColumnMaxHeight() {
  const leftHeight = statusColumnRef.value?.scrollHeight ?? 0;
  const tabContentHeight =
    statusColumnRef.value?.closest<HTMLElement>(".dw-tab-content")?.clientHeight ?? 0;
  const availableHeight = tabContentHeight - ROLLS_COLUMN_BOTTOM_MARGIN;
  rollsColumnMaxHeight.value = tabContentHeight > 0 ? availableHeight : leftHeight;
}

onMounted(() => {
  if (!statusColumnRef.value) return;
  statusColumnResizeObserver = new ResizeObserver(recomputeRollsColumnMaxHeight);
  statusColumnResizeObserver.observe(statusColumnRef.value);
  const tabContent = statusColumnRef.value.closest<HTMLElement>(".dw-tab-content");
  if (tabContent) statusColumnResizeObserver.observe(tabContent);
  recomputeRollsColumnMaxHeight();
});

onUnmounted(() => {
  statusColumnResizeObserver?.disconnect();
  statusColumnResizeObserver = null;
});

// ─── Form activation buttons ────────────────────────────────────────────────
interface FormButton {
  key: string;
  label: string;
  title: string;
  active: boolean;
  disabled: boolean;
  onClick: () => void;
}

const formButtons = computed<FormButton[]>(() => {
  const transformations = system.transformations ?? [];
  const alternateForms = system.alternateForms ?? [];
  const activeTransformationId = system.formState?.activeTransformationId;
  const activeAlternateFormId = system.formState?.activeAlternateFormId;

  const transformationMpCost = Math.ceil(
    (system.resources?.mp?.max ?? 0) * 0.05
  );
  const currentMp = Number(system.resources?.mp?.value) || 0;
  // Both transforming and reverting charge the same MP cost, so gate on it either way.
  const cannotAffordMp =
    transformationMpCost > 0 && currentMp < transformationMpCost;

  const transformationButtons = transformations.map(form => {
    const active = activeTransformationId === form.id;
    const action = active ? `Revert from ${form.name}` : `Transform into ${form.name}`;
    const title = cannotAffordMp
      ? `Not enough MP (requires ${transformationMpCost})`
      : `${action} (Costs ${transformationMpCost} MP, 5% of max MP)`;
    return {
      key: `transformation-${form.id}`,
      label: form.name,
      title,
      active,
      disabled: cannotAffordMp,
      onClick: () =>
        active
          ? deactivateTransformation(actor)
          : activateTransformation(actor, form.id)
    };
  });

  const alternateFormButtons = alternateForms.map(form => {
    const active = activeAlternateFormId === form.id;
    return {
      key: `alternate-${form.id}`,
      label: form.name,
      title: active
        ? `Remove ${form.name} bonuses`
        : `Apply ${form.name} bonuses`,
      active,
      disabled: false,
      onClick: () =>
        active
          ? deactivateAlternateForm(actor)
          : activateAlternateForm(actor, form.id)
    };
  });

  return [...transformationButtons, ...alternateFormButtons];
});

// Rolls tagged with a transformation's id only show while that transformation
// is active; untagged rolls always show. Alternate forms don't filter rolls.
const visibleRolls = computed(() => {
  const activeTransformationId = system.formState?.activeTransformationId;
  return (system.rolls ?? [])
    .map((roll, index) => ({ roll, index }))
    .filter(
      ({ roll }) => !roll.formId || roll.formId === activeTransformationId
    );
});

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

// Compute equipped armor values from the armor array (non-enemies only)
const equippedArmor = computed(() => {
  return system.armors?.find(a => a.equipped) ?? null;
});

const armoredPhysical = computed(() => {
  // For enemies: use stored value; for others: compute from equipped armor
  if (!system.armors || system.armors.length === 0) {
    return system.soak.armoredPhysical;
  }
  return equippedArmor.value?.physicalSoak ?? 0;
});

const armoredMagical = computed(() => {
  // For enemies: use stored value; for others: compute from equipped armor
  if (!system.armors || system.armors.length === 0) {
    return system.soak.armoredMagical;
  }
  return equippedArmor.value?.magicalSoak ?? 0;
});

const currentShieldSoak = computed(() => {
  // For enemies: use stored value; for others: compute from equipped armor
  if (!system.armors || system.armors.length === 0) {
    return system.soak.shieldSoak;
  }
  return equippedArmor.value?.shieldSoak ?? 0;
});

const maxShieldHits = computed(() => {
  // For enemies: use stored value; for others: compute from equipped armor
  if (!system.armors || system.armors.length === 0) {
    return system.soak.shieldHitsMax;
  }
  return equippedArmor.value?.shieldHitsMax ?? 0;
});

const totalPhysical = computed(() => {
  const basePhysical =
    system.soak.resolveOfAges && !equippedArmor.value
      ? system.soak.physicalBase * 2
      : system.soak.physicalBase;
  let total = basePhysical + armoredPhysical.value;
  if (
    !system.combat.emp &&
    system.soak.shieldHitsLeft > 0 &&
    currentShieldSoak.value > 0
  ) {
    total += currentShieldSoak.value;
  }
  return total;
});
const totalMagical = computed(() => {
  const baseMagical =
    system.soak.resolveOfAges && !equippedArmor.value
      ? system.soak.magicalBase * 2
      : system.soak.magicalBase;
  let total = baseMagical + armoredMagical.value;
  if (
    !system.combat.emp &&
    system.soak.shieldHitsLeft > 0 &&
    currentShieldSoak.value > 0
  ) {
    total += currentShieldSoak.value;
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
const limitBreakBarSize = computed(() => system.resources.hp.max);
const limitBreakFullBars = computed(() =>
  Math.floor(system.gauges.limitBreak / limitBreakBarSize.value)
);
const limitBreakPct = computed(() => {
  if (!limitBreakBarSize.value) return 0;
  // When all 4 bars are full, show 100% instead of 0%
  if (limitBreakFullBars.value >= 4) return 100;
  const remainder = system.gauges.limitBreak % limitBreakBarSize.value;
  return Math.round((remainder / limitBreakBarSize.value) * 100);
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

function cycleOption(options: { value: string }[], currentValue: string) {
  const currentIndex = options.findIndex(option => option.value === currentValue);
  const nextIndex = currentIndex >= 0 ? (currentIndex + 1) % options.length : 0;
  return options[nextIndex];
}

function cycleDefenseEffect() {
  const nextOption = cycleOption(
    defenseEffectOptions,
    system.combat.defenseEffect
  );
  save("combat.defenseEffect", nextOption.value);
}

function cycleBraceType() {
  const nextOption = cycleOption(braceTypeOptions, system.combat.braceType);
  save("combat.braceType", nextOption.value);
}

function formatInputNumber(value: number): string {
  if (Number.isInteger(value)) return String(value);
  return String(parseFloat(value.toFixed(6)));
}

function onDamageInputKeydown(event: KeyboardEvent) {
  if (event.key !== "ArrowUp" && event.key !== "ArrowDown") return;

  event.preventDefault();

  const raw = String(system.combat.damage ?? "").trim();
  const suffixMatch = raw.match(/%c?$/i);
  const suffix = suffixMatch ? suffixMatch[0] : "";
  const numberPart = suffix ? raw.slice(0, -suffix.length).trim() : raw;

  let value = parseFloat(numberPart);
  if (!Number.isFinite(value)) value = 0;

  let step = 1;
  if (event.shiftKey) {
    step = 1000;
  } else if (event.ctrlKey) {
    step = 100;
  }

  const direction = event.key === "ArrowUp" ? 1 : -1;
  const nextValue = Math.max(0, value + direction * step);
  system.combat.damage = `${formatInputNumber(nextValue)}${suffix}`;
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
  // A fresh action invalidates whatever was available to redo
  redoStack.value = [];
}

function getSystemValue(path: string): unknown {
  const keys = path.split(".");
  let obj: unknown = system;
  for (const key of keys) {
    if (obj == null) return undefined;
    obj = (obj as Record<string, unknown>)[key];
  }
  return obj;
}

function setSystemValue(path: string, value: unknown) {
  const keys = path.split(".");
  let obj = system as Record<string, unknown>;
  for (let i = 0; i < keys.length - 1; i++) {
    obj = obj[keys[i]] as Record<string, unknown>;
  }
  obj[keys[keys.length - 1]] = value;
}

// ─── Actions ───────────────────────────────────────────────────────────────
async function dealDamage(type: "physical" | "magical") {
  const { value: cur, max } = system.resources.hp;
  const {
    physicalBase: pSoak,
    magicalBase: mSoak,
    shieldHitsLeft
  } = system.soak;
  // Apply Resolve of Ages doubling when no armor is equipped
  const roaActive = system.soak.resolveOfAges && !equippedArmor.value;
  const effectivePSoak = roaActive ? pSoak * 2 : pSoak;
  const effectiveMSoak = roaActive ? mSoak * 2 : mSoak;
  // Calculate total soak including shield (if available)
  let totalPSoak = effectivePSoak + armoredPhysical.value;
  let totalMSoak = effectiveMSoak + armoredMagical.value;
  let newShieldHits = shieldHitsLeft;
  let shieldUsed = false;

  // Add shield to soak if available and not EMP'd
  if (!system.combat.emp && shieldHitsLeft > 0 && currentShieldSoak.value > 0) {
    totalPSoak += currentShieldSoak.value;
    totalMSoak += currentShieldSoak.value;
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

  // Track shield hits for undo
  if (shieldUsed) {
    changes["soak.shieldHitsLeft"] = shieldHitsLeft;
    // Also track the armor array state before modification
    if (system.armors) {
      changes["armors"] = JSON.parse(JSON.stringify(system.armors));
    }
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

  // Capture the values being overwritten so redo can restore them
  const redoChanges: Record<string, unknown> = {};
  for (const path of Object.keys(changes)) {
    redoChanges[path] = JSON.parse(JSON.stringify(getSystemValue(path) ?? null));
  }
  redoStack.value = [...redoStack.value, { name: last.name, changes: redoChanges }];

  system.actionHistory = history;
  const undoUpdates: Record<string, unknown> = {
    "system.actionHistory": history
  };
  for (const [path, oldVal] of Object.entries(changes)) {
    undoUpdates[`system.${path}`] = oldVal;
    setSystemValue(path, oldVal);
  }
  await (actor as any).update(undoUpdates);
}

async function redoLastAction() {
  if (!redoStack.value.length) return;
  const redoStackCopy = [...redoStack.value];
  const last = redoStackCopy.pop()!;
  redoStack.value = redoStackCopy;

  // Capture the pre-redo values so this redo can be undone again
  const undoChanges: Record<string, unknown> = {};
  for (const path of Object.keys(last.changes)) {
    undoChanges[path] = JSON.parse(JSON.stringify(getSystemValue(path) ?? null));
  }
  const history = [...(system.actionHistory ?? [])];
  history.push({ name: last.name, changes: JSON.stringify(undoChanges) });
  if (history.length > 20) history.shift();
  system.actionHistory = history;

  const redoUpdates: Record<string, unknown> = {
    "system.actionHistory": history
  };
  for (const [path, newVal] of Object.entries(last.changes)) {
    redoUpdates[`system.${path}`] = newVal;
    setSystemValue(path, newVal);
  }
  await (actor as any).update(redoUpdates);
}

async function resetShield() {
  const max = maxShieldHits.value;
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
  const oldTrance = system.gauges.trance;
  system.gauges.trance = 0;
  await sheet.saveSystem({ "gauges.trance": 0 });
  // Record for undo after the spend has actually landed, matching the
  // save-then-record ordering used elsewhere (dealDamage/dealHealing) so
  // this write can't race the reactive watcher's own auto-save.
  pushHistory("activateTrance", { "gauges.trance": oldTrance });
}

async function spendLimitBreak() {
  const numBars = spendLbAmount.value;
  if (!numBars || numBars <= 0) return;

  // Can only spend full bars that are complete
  const maxBars = limitBreakFullBars.value;
  if (numBars > maxBars) {
    ui.notifications?.warn(`Can only spend ${maxBars} full bar(s).`);
    return;
  }

  // Save old value for undo
  pushHistory("spendLimitBreak", {
    "gauges.limitBreak": system.gauges.limitBreak
  });

  // Spend full bars (numBars × bar size)
  const amountToSpend = numBars * limitBreakBarSize.value;
  const newVal = Math.max(0, system.gauges.limitBreak - amountToSpend);
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

function parseSignedInt(raw: string): number {
  const parsed = parseInt(raw.trim(), 10);
  return Number.isFinite(parsed) ? parsed : 0;
}

async function onRollClick(index: number) {
  await doRoll(
    actor,
    system,
    index,
    false,
    parseSignedInt(diceMod.value),
    parseSignedInt(bonusMod.value)
  );
  diceMod.value = "";
  bonusMod.value = "";
}
</script>
