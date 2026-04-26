<template>
  <div class="dw-sheet">
    <!-- ─── Header ─────────────────────────────────────────────── -->
    <div class="dw-sheet-header">
      <img
        class="dw-actor-img"
        :src="actor.img ?? 'icons/svg/mystery-man.svg'"
        @click="editImage"
        title="Click to change portrait"
      />
      <div class="dw-header-info">
        <input
          type="text"
          class="px-3 py-1.5 border border-gray-600 rounded text-gray-700 w-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          :value="actor.name"
          @change="saveName(($event.target as HTMLInputElement).value)"
        />
        <div class="dw-actor-type">{{ actorTypeLabel }}</div>
      </div>
    </div>

    <!-- ─── Tab Bar ─────────────────────────────────────────────── -->
    <nav class="dw-tabs">
      <button
        v-for="tab in tabs"
        :key="tab.id"
        class="dw-tab"
        :class="{ 'dw-tab-active': activeTab === tab.id }"
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
      <RollsTab v-else-if="activeTab === 'rolls'" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { inject, ref, computed } from "vue";
import { ActorType } from "../../enums";
import StatusTab from "./StatusTab.vue";
import ArmorTab from "./ArmorTab.vue";
import StatisticsTab from "./StatisticsTab.vue";
import RollsTab from "./RollsTab.vue";

const actor = inject<Actor>("actor")!;
const sheet = inject<{ actor: Actor; render: () => void }>("sheet")!;

const activeTab = ref("status");

const tabs = [
  { id: "status", label: "Status" },
  { id: "armor", label: "Armor" },
  { id: "statistics", label: "Statistics" },
  { id: "rolls", label: "Rolls" }
];

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

function editImage() {
  // Use Foundry's file picker
  const fp = new FilePicker({
    type: "image",
    current: actor.img ?? undefined,
    callback: (path: string) => {
      actor.update({ img: path });
    }
  });
  fp.browse();
}

function saveName(value: string) {
  actor.update({ name: value });
}
void sheet;
</script>
