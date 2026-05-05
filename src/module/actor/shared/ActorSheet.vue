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
        <div class="dw-actor-type">{{ actorTypeLabel }}</div>
      </div>
    </div>

    <!-- ─── Tab Bar ─────────────────────────────────────────────── -->
    <nav class="flex gap-0 border-b border-gray-300 flex-shrink-0">
      <button
        v-for="tab in tabs"
        :key="tab.id"
        class="px-4 py-2 border rounded-t cursor-pointer text-sm text-gray-700 transition-all duration-150 ease-in-out relative -mb-px mr-0.5 hover:text-red-600 hover:border-gray-300 hover:border-b-gray-300"
        :class="
          activeTab === tab.id
            ? 'bg-gray-600/15 border-b-gray-600/15'
            : 'bg-transparent'
        "
        @click="activeTab = tab.id"
      >
        {{ tab.label }}
      </button>
    </nav>

    <!-- ─── Tab Content ─────────────────────────────────────────── -->
    <div class="dw-tab-content">
      <StatusTab v-if="activeTab === 'status'" />
      <ArmorTab v-else-if="activeTab === 'armor'" />
      <StatisticsTab v-else-if="activeTab === 'statistics'" />
      <CustomsTab v-else-if="activeTab === 'customs'" />
      <RollsTab v-else-if="activeTab === 'rolls'" />
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

const actor = inject<Actor>("actor")!;
const reactiveActor = inject<Actor>("reactiveActor")!;
const sheet = inject<{ actor: Actor; render: () => void }>("sheet")!;

// Initialize from stored preference or default to "status"
const activeTab = ref(
  // @ts-expect-error - Flag types not fully defined in Foundry types
  (actor.getFlag("dimensionalwar", "activeTab") as string) ?? "status"
);

const tabs = computed(() => {
  const type = actor.type as string;

  // Enemy: Status, Rolls, Armor, Statistics (no Customs)
  if (type === ActorType.Enemy) {
    return [
      { id: "status", label: "Status" },
      { id: "rolls", label: "Rolls" },
      { id: "armor", label: "Armor" },
      { id: "statistics", label: "Statistics" }
    ];
  }

  // PC and Ally: Status, Rolls, Armor, Statistics, Customs
  if (type === ActorType.Pc || type === ActorType.Ally) {
    return [
      { id: "status", label: "Status" },
      { id: "rolls", label: "Rolls" },
      { id: "armor", label: "Armor" },
      { id: "statistics", label: "Statistics" },
      { id: "customs", label: "Customs" }
    ];
  }

  // NPC and Boss: Status, Rolls, Armor, Statistics (no Customs)
  return [
    { id: "status", label: "Status" },
    { id: "rolls", label: "Rolls" },
    { id: "armor", label: "Armor" },
    { id: "statistics", label: "Statistics" }
  ];
});

const actorTypeLabel = computed(() => {
  const type = actor.type;
  const labels: Record<string, string> = {
    [ActorType.Pc]: "Player Character",
    [ActorType.Npc]: "Non-Player Character",
    [ActorType.Ally]: "Ally",
    [ActorType.Enemy]: "Enemy",
    [ActorType.Boss]: "Boss"
  };
  return labels[type] ?? type;
});

// Validate that the stored tab exists for this actor type
onMounted(() => {
  const validTabIds = tabs.value.map(t => t.id);
  if (!validTabIds.includes(activeTab.value)) {
    activeTab.value = "status";
  }
});

// Save active tab preference when it changes
watch(activeTab, newTab => {
  // @ts-expect-error - Flag types not fully defined in Foundry types
  actor.setFlag("dimensionalwar", "activeTab", newTab);
});

function editImage() {
  // Use Foundry's file picker
  const fp = new FilePicker({
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
