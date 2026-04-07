<template>
  <div class="dw-rolls-tab">
    <div class="dw-rolls-list">
      <div v-for="(entry, idx) in system.rolls" :key="idx" class="dw-roll-row">
        <select
          :value="entry.category"
          @change="
            saveRoll(
              idx,
              'category',
              ($event.target as HTMLSelectElement).value
            )
          "
          class="dw-select"
        >
          <option v-for="cat in categories" :key="cat" :value="cat">
            {{ cat }}
          </option>
        </select>
        <select
          :value="entry.type"
          @change="
            saveRoll(idx, 'type', ($event.target as HTMLSelectElement).value)
          "
          class="dw-select dw-select-sm"
        >
          <option value="die">Die</option>
          <option value="skill">Skill</option>
        </select>
        <input
          type="text"
          class="dw-input-text"
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
        <input
          type="number"
          class="dw-input-num"
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
        <input
          type="text"
          class="dw-input-text"
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
        <button class="dw-btn" @click="doRoll(idx)" title="Roll">🎲</button>
        <button
          class="dw-btn dw-btn-danger"
          @click="removeRoll(idx)"
          title="Remove"
        >
          ✕
        </button>
      </div>
    </div>

    <div class="dw-row">
      <button class="dw-btn" @click="addRoll">+ Add Roll</button>
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
