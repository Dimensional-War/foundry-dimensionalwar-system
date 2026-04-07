<template>
  <div class="dw-armor-tab">
    <!-- Shield hits tracker -->
    <div class="dw-row">
      <span class="dw-label">Shield Hits Left:</span>
      <input
        type="number"
        class="dw-input-num"
        :value="system.soak.shieldHitsLeft"
        @change="
          save(
            'soak.shieldHitsLeft',
            Number(($event.target as HTMLInputElement).value)
          )
        "
        min="0"
      />
    </div>

    <!-- Armor List -->
    <div class="dw-armor-table">
      <div class="dw-armor-header">
        <span>Name</span>
        <span>P.Soak</span>
        <span>M.Soak</span>
        <span>Shield</span>
        <span>Shield Max</span>
        <span>EMP</span>
        <span>Equipped</span>
        <span></span>
      </div>
      <div
        v-for="(armor, idx) in system.armors"
        :key="idx"
        class="dw-armor-row"
      >
        <input
          type="text"
          class="dw-input-text"
          :value="armor.name"
          @change="
            saveArmor(idx, 'name', ($event.target as HTMLInputElement).value)
          "
          placeholder="Armor Name"
        />
        <input
          type="number"
          class="dw-input-num"
          :value="armor.physicalSoak"
          @change="
            saveArmor(
              idx,
              'physicalSoak',
              Number(($event.target as HTMLInputElement).value)
            )
          "
          min="0"
        />
        <input
          type="number"
          class="dw-input-num"
          :value="armor.magicalSoak"
          @change="
            saveArmor(
              idx,
              'magicalSoak',
              Number(($event.target as HTMLInputElement).value)
            )
          "
          min="0"
        />
        <input
          type="number"
          class="dw-input-num"
          :value="armor.shield"
          @change="
            saveArmor(
              idx,
              'shield',
              Number(($event.target as HTMLInputElement).value)
            )
          "
          min="0"
        />
        <input
          type="number"
          class="dw-input-num"
          :value="armor.shieldHitsMax"
          @change="
            saveArmor(
              idx,
              'shieldHitsMax',
              Number(($event.target as HTMLInputElement).value)
            )
          "
          min="0"
        />
        <input
          type="checkbox"
          :checked="armor.hasEmp"
          @change="
            saveArmor(
              idx,
              'hasEmp',
              ($event.target as HTMLInputElement).checked
            )
          "
        />
        <button
          class="dw-btn"
          :class="armor.equipped ? 'dw-btn-active' : ''"
          @click="equipArmor(idx)"
          :title="armor.equipped ? 'Unequip' : 'Equip'"
        >
          {{ armor.equipped ? "✓" : "Equip" }}
        </button>
        <button
          class="dw-btn dw-btn-danger"
          @click="removeArmor(idx)"
          title="Remove armor"
        >
          ✕
        </button>
      </div>
    </div>

    <div class="dw-row">
      <button class="dw-btn" @click="addArmor">+ Add Armor</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { inject } from "vue";
import type { DwBaseSheet } from "../DwBaseSheet";

type ArmorEntry = {
  name: string;
  physicalSoak: number;
  magicalSoak: number;
  shield: number;
  shieldHitsMax: number;
  hasEmp: boolean;
  equipped: boolean;
};

type DwSystem = {
  soak: {
    physicalBase: number;
    magicalBase: number;
    armoredPhysical: number;
    armoredMagical: number;
    shield: number;
    shieldHitsLeft: number;
    shieldHitsMax: number;
  };
  armors: ArmorEntry[];
};

const system = inject<DwSystem>("reactiveSystem")!;
const actor = inject<Actor>("actor")!;
const sheet = inject<DwBaseSheet>("sheet")!;
void sheet;

function save(path: string, value: unknown) {
  const keys = path.split(".");
  let obj = system as Record<string, unknown>;
  for (let i = 0; i < keys.length - 1; i++) {
    obj = obj[keys[i]] as Record<string, unknown>;
  }
  obj[keys[keys.length - 1]] = value;
  sheet.saveSystem({ [`${path}`]: value });
}

function saveArmor(idx: number, field: keyof ArmorEntry, value: unknown) {
  (system.armors[idx] as Record<string, unknown>)[field as string] = value;
  sheet.saveSystem({ armors: JSON.parse(JSON.stringify(system.armors)) });
}

function addArmor() {
  const newArmor: ArmorEntry = {
    name: "New Armor",
    physicalSoak: 0,
    magicalSoak: 0,
    shield: 0,
    shieldHitsMax: 0,
    hasEmp: false,
    equipped: false
  };
  system.armors.push(newArmor);
  sheet.saveSystem({ armors: JSON.parse(JSON.stringify(system.armors)) });
}

function removeArmor(idx: number) {
  system.armors.splice(idx, 1);
  sheet.saveSystem({ armors: JSON.parse(JSON.stringify(system.armors)) });
}

function equipArmor(idx: number) {
  // Toggle equip; unequip all others
  const wasEquipped = system.armors[idx].equipped;
  system.armors.forEach((a, i) => {
    a.equipped = !wasEquipped && i === idx;
  });

  // Recalculate active soak values
  const equipped = system.armors.find(a => a.equipped);
  system.soak.armoredPhysical = equipped?.physicalSoak ?? 0;
  system.soak.armoredMagical = equipped?.magicalSoak ?? 0;
  system.soak.shield = equipped?.shield ?? 0;
  system.soak.shieldHitsMax = equipped?.shieldHitsMax ?? 0;
  system.soak.shieldHitsLeft = equipped?.shieldHitsMax ?? 0;

  sheet.saveSystem({
    armors: JSON.parse(JSON.stringify(system.armors)),
    "soak.armoredPhysical": system.soak.armoredPhysical,
    "soak.armoredMagical": system.soak.armoredMagical,
    "soak.shield": system.soak.shield,
    "soak.shieldHitsMax": system.soak.shieldHitsMax,
    "soak.shieldHitsLeft": system.soak.shieldHitsLeft
  });
}
</script>
