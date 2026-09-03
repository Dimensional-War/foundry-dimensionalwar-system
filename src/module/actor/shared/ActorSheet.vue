<template>
  <div class="dw-sheet">
    <!-- ─── Header ─────────────────────────────────────────────── -->
    <div class="dw-sheet-header">
      <img
        class="dw-actor-img"
        :src="reactiveActor.img ?? 'icons/svg/mystery-man.svg'"
        @click="editImage"
        title="Click to change portrait"
      />
      <div class="dw-header-info">
        <input
          type="text"
          class="px-3 py-1.5 border border-gray-600 rounded text-gray-700 w-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          v-model="reactiveActor.name"
        />
        <select
          v-if="isGM"
          class="dw-actor-type"
          :value="actor.type"
          @change="onTypeChange"
          title="Change actor type"
        >
          <option v-for="opt in typeOptions" :key="opt.value" :value="opt.value">
            {{ opt.label }}
          </option>
        </select>
        <div v-else class="dw-actor-type">{{ actorTypeLabels[actor.type] ?? actor.type }}</div>
      </div>
    </div>

    <!-- ─── Tab Bar ─────────────────────────────────────────────── -->
    <nav class="flex gap-0 border-b border-gray-300 shrink-0">
      <button
        v-for="tab in tabs"
        :key="tab.id"
        class="dw-tab-btn px-4 py-2 border rounded-t cursor-pointer text-sm text-gray-700 transition-all duration-150 ease-in-out relative -mb-px mr-0.5 hover:text-red-600 hover:border-red-300 hover:border-b-red-300"
        :class="activeTab === tab.id
            ? 'bg-gray-600/15 border-b-gray-600/15'
            : 'bg-transparent'
          "
        @click="activeTab = tab.id"
      >
        {{ tab.label }}
      </button>
    </nav>

    <!-- ─── Tab Content ─────────────────────────────────────────── -->
    <div class="dw-tab-content mt-2">
      <StatusTab v-if="activeTab === 'status'" />
      <ArmorTab v-else-if="activeTab === 'armor'" />
      <StatisticsTab v-else-if="activeTab === 'statistics'" />
      <CustomsTab v-else-if="activeTab === 'customs'" />
      <RollsTab v-else-if="activeTab === 'rolls'" />
      <FormsTab v-else-if="activeTab === 'forms'" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { inject, ref, computed, watch, onMounted } from "vue";
import { ActorType } from "../../enums";
import StatusTab from "./StatusTab.vue";
import ArmorTab from "./ArmorTab.vue";
import StatisticsTab from "./StatisticsTab.vue";
import CustomsTab from "./CustomsTab.vue";
import RollsTab from "./RollsTab.vue";
import FormsTab from "./FormsTab.vue";
import { SystemActor } from "~/module/documents.ts";
import type { BaseData } from "../../types/base-data";

const actor = inject<SystemActor>("actor")!;
const reactiveActor = inject<SystemActor>("reactiveActor")!;
const sheet = inject<{ actor: Actor; render: () => void }>("sheet")!;
const reactiveSystem = inject<BaseData.DwSystem>("reactiveSystem")!;

// Initialize from stored preference or default to "status"
const activeTab = ref(
  // @ts-expect-error - Flag types not fully defined in Foundry types
  (actor.getFlag("dimensionalwar", "activeTab") as string) ?? "status"
);

const tabs = computed(() => {
  const type = actor.type as string;

  // Enemy: Status, Rolls, Armor, Statistics, Forms (no Customs)
  if (type === ActorType.Enemy) {
    return [
      { id: "status", label: "Status" },
      { id: "rolls", label: "Rolls" },
      { id: "armor", label: "Armor" },
      { id: "statistics", label: "Statistics" },
      { id: "forms", label: "Forms" }
    ];
  }

  // PC and Ally: Status, Rolls, Armor, Statistics, Forms (Customs hidden for now)
  if (type === ActorType.Pc || type === ActorType.Ally) {
    return [
      { id: "status", label: "Status" },
      { id: "rolls", label: "Rolls" },
      { id: "armor", label: "Armor" },
      { id: "statistics", label: "Statistics" },
      { id: "forms", label: "Forms" }
    ];
  }

  // NPC and Boss: Status, Rolls, Armor, Statistics, Forms (no Customs)
  return [
    { id: "status", label: "Status" },
    { id: "rolls", label: "Rolls" },
    { id: "armor", label: "Armor" },
    { id: "statistics", label: "Statistics" },
    { id: "forms", label: "Forms" }
  ];
});

const isGM = computed(() => game.user?.isGM ?? false);

const actorTypeLabels: Record<string, string> = {
  [ActorType.Pc]: "Player Character",
  [ActorType.Npc]: "Non-Player Character",
  [ActorType.Ally]: "Ally",
  [ActorType.Enemy]: "Enemy",
  [ActorType.Boss]: "Boss"
};

const typeOptions = Object.values(ActorType).map(value => ({
  value,
  label: actorTypeLabels[value] ?? value
}));

async function onTypeChange(event: Event) {
  const select = event.target as HTMLSelectElement;
  if (!isGM.value) {
    select.value = actor.type as string;
    return;
  }
  const newType = select.value;
  const oldType = actor.type as string;
  if (newType === oldType) return;

  const confirmed = await Dialog.confirm({
    title: "Change Actor Type",
    content: `<p>Change <strong>${actor.name}</strong> from <em>${actorTypeLabels[oldType] ?? oldType}</em> to <em>${actorTypeLabels[newType] ?? newType}</em>?</p><p>Fields not shared between these types may be lost.</p>`
  });

  if (!confirmed) {
    select.value = oldType;
    return;
  }

  const currentSystem = actor.toObject().system;
  await actor.update(
    { type: newType as ActorType, system: currentSystem },
    { recursive: false }
  );
}

// Validate that the stored tab exists for this actor type
onMounted(() => {
  const validTabIds = tabs.value.map(t => t.id);
  if (!validTabIds.includes(activeTab.value)) {
    activeTab.value = "status";
  }

  migrateCustomRollBonuses();
});

// Older custom rolls stored the flat bonus separately from the dice formula.
// Fold any leftover bonusNumber into the formula string so Rolls tab only
// shows a single combined formula field going forward.
function migrateCustomRollBonuses() {
  const rolls = reactiveSystem.rolls as BaseData.RollEntry[] | undefined;
  if (!rolls?.length) return;

  for (const entry of rolls) {
    if (!entry.bonusNumber) continue;
    const base = entry.bonusFormula?.trim() || "1d20";
    entry.bonusFormula = `${base} ${entry.bonusNumber >= 0 ? "+" : "-"} ${Math.abs(entry.bonusNumber)}`;
    entry.bonusNumber = 0;
  }
}

// Save active tab preference when it changes
watch(activeTab, newTab => {
  // @ts-expect-error - Flag types not fully defined in Foundry types
  actor.setFlag("dimensionalwar", "activeTab", newTab);
});

function editImage() {
  // Use Foundry's file picker
  const fp = new foundry.applications.apps.FilePicker.implementation({
    type: "image",
    current: actor.img ?? undefined,
    callback: (path: string) => {
      // Modify reactive actor - watcher will sync to Foundry
      reactiveActor.img = path;
    }
  });
  fp.browse();
}

void sheet;
</script>
