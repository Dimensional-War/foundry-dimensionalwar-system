<template>
  <div class="dw-rolls-tab">
    <div class="border rounded">
      <div v-for="(entry, idx) in system.rolls" :key="idx" class="border-b p-2">
        <div class="flex flex-wrap gap-1">
          <div class="basis-1/4">
            <select
              :value="entry.category"
              @change="
                saveRoll(
                  idx,
                  'category',
                  ($event.target as HTMLSelectElement).value
                )
              "
              class="px-3 py-1.5 border border-gray-600 rounded text-gray-700 w-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option v-for="cat in categories" :key="cat" :value="cat">
                {{ cat }}
              </option>
            </select>
          </div>
          <div class="basis-1/6">
            <select
              :value="entry.type"
              @change="
                saveRoll(
                  idx,
                  'type',
                  ($event.target as HTMLSelectElement).value
                )
              "
              class="px-3 py-1.5 border border-gray-600 rounded text-gray-700 w-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="die">Die</option>
              <option value="skill">Skill</option>
            </select>
          </div>
          <div class="basis-1/6">
            <input
              type="text"
              class="px-3 py-1.5 border border-gray-600 rounded text-gray-700 w-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              :value="entry.bonusFormula"
              @change="
                saveRoll(
                  idx,
                  'bonusFormula',
                  ($event.target as HTMLInputElement).value
                )
              "
              placeholder="Formula (e.g. 1d20)"
            />
          </div>
          <div class="w-16">
            <input
              type="number"
              class="px-3 py-1.5 border border-gray-600 rounded text-gray-700 w-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              :value="entry.bonusNumber"
              @change="
                saveRoll(
                  idx,
                  'bonusNumber',
                  Number(($event.target as HTMLInputElement).value)
                )
              "
              placeholder="Bonus"
            />
          </div>
          <div class="basis-1/4">
            <input
              type="text"
              class="px-3 py-1.5 border border-gray-600 rounded text-gray-700 w-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              :value="entry.reasonBase"
              @change="
                saveRoll(
                  idx,
                  'reasonBase',
                  ($event.target as HTMLInputElement).value
                )
              "
              placeholder="Reason"
            />
          </div>
          <div class="w-auto">
            <button
              type="button"
              class="px-3 py-1.5 border border-gray-600 rounded text-gray-700 hover:bg-gray-50 cursor-pointer transition-colors"
              @click="doRoll(idx)"
              :title="'Roll'"
            >
              🎲
            </button>
            <button
              type="button"
              class="px-3 py-1.5 border border-red-600 rounded bg-red-600 text-white hover:bg-red-700 cursor-pointer transition-colors ml-1"
              @click="removeRoll(idx)"
              :title="'Remove'"
            >
              ✕
            </button>
          </div>
        </div>
      </div>
    </div>

    <div class="flex flex-wrap gap-1 my-2">
      <div class="flex-1">
        <button
          type="button"
          class="px-3 py-1.5 border border-blue-600 rounded bg-blue-600 text-white hover:bg-blue-700 cursor-pointer transition-colors"
          @click="addRoll"
        >
          + Add Roll
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { inject } from "vue";

type RollEntry = {
  category: string;
  amount: number;
  type: string;
  bonusFormula: string;
  bonusNumber: number;
  reasonBase: string;
};

type DwSystem = {
  rolls: RollEntry[];
};

const system = inject<DwSystem>("reactiveSystem")!;
const actor = inject<Actor>("actor")!;

const categories = [
  "Offensive",
  "Defensive",
  "Movement",
  "Perception",
  "Vehicle Operation",
  "Non-Combat",
  "Artisan"
];

function saveRoll(idx: number, field: keyof RollEntry, value: unknown) {
  (system.rolls[idx] as Record<string, unknown>)[field as string] = value;
  // @ts-expect-error
  actor.update({ "system.rolls": JSON.parse(JSON.stringify(system.rolls)) });
}

function addRoll() {
  const newRoll: RollEntry = {
    category: "Offensive",
    amount: 1,
    type: "die",
    bonusFormula: "1d20",
    bonusNumber: 0,
    reasonBase: ""
  };
  system.rolls.push(newRoll);
  // @ts-expect-error
  actor.update({ "system.rolls": JSON.parse(JSON.stringify(system.rolls)) });
}

function removeRoll(idx: number) {
  system.rolls.splice(idx, 1);
  // @ts-expect-error
  actor.update({ "system.rolls": JSON.parse(JSON.stringify(system.rolls)) });
}

async function doRoll(idx: number) {
  const entry = system.rolls[idx];
  if (!entry?.bonusFormula) return;
  const formula = entry.bonusNumber
    ? `${entry.bonusFormula} + ${entry.bonusNumber}`
    : entry.bonusFormula;
  try {
    const roll = await Roll.create(formula);
    await roll.evaluate();
    await roll.toMessage({
      speaker: ChatMessage.getSpeaker({ actor: actor as any }),
      flavor: entry.reasonBase
        ? `${entry.reasonBase} (${entry.category})`
        : entry.category
    });
  } catch (e) {
    ui.notifications?.error(`Invalid roll formula: ${formula}`);
  }
}
</script>
