<template>
  <div class="dw-armor-tab">
    <!-- Shield hits tracker -->
    <div class="flex flex-wrap gap-1 my-2">
      <div class="w-auto font-bold">Shield Hits Left:</div>
      <div class="basis-1/6">
        <input
          type="number"
          class="px-3 py-1.5 border border-gray-600 rounded text-gray-700 w-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
    </div>

    <!-- Armor List -->
    <div class="border rounded">
      <div class="border-b p-2">
        <div class="flex font-bold">
          <div class="basis-1/4">Name</div>
          <div class="flex-1">P.Soak</div>
          <div class="flex-1">M.Soak</div>
          <div class="flex-1">Shield</div>
          <div class="flex-1">Shield Max</div>
          <div class="w-16">EMP</div>
          <div class="w-auto"></div>
        </div>
      </div>
      <div
        v-for="(armor, idx) in system.armors"
        :key="idx"
        class="border-b p-2"
      >
        <div class="flex flex-wrap gap-1">
          <div class="basis-1/4">
            <input
              type="text"
              class="px-3 py-1.5 border border-gray-600 rounded text-gray-700 w-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              :value="armor.name"
              @change="
                saveArmor(
                  idx,
                  'name',
                  ($event.target as HTMLInputElement).value
                )
              "
              placeholder="Armor Name"
            />
          </div>
          <div class="flex-1">
            <input
              type="number"
              class="px-3 py-1.5 border border-gray-600 rounded text-gray-700 w-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
          </div>
          <div class="flex-1">
            <input
              type="number"
              class="px-3 py-1.5 border border-gray-600 rounded text-gray-700 w-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
          </div>
          <div class="flex-1">
            <input
              type="number"
              class="px-3 py-1.5 border border-gray-600 rounded text-gray-700 w-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
          </div>
          <div class="flex-1">
            <input
              type="number"
              class="px-3 py-1.5 border border-gray-600 rounded text-gray-700 w-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
          </div>
          <div class="w-16 text-center">
            <input
              type="checkbox"
              class="mr-2"
              :checked="armor.hasEmp"
              @change="
                saveArmor(
                  idx,
                  'hasEmp',
                  ($event.target as HTMLInputElement).checked
                )
              "
            />
          </div>
          <div class="w-auto">
            <button
              type="button"
              class="px-2 py-1 text-sm border rounded cursor-pointer transition-colors"
              :class="
                armor.equipped
                  ? 'bg-blue-600 text-white border-blue-600 hover:bg-blue-700'
                  : 'border-blue-600 text-blue-600  hover:bg-blue-50'
              "
              @click="equipArmor(idx)"
              :title="armor.equipped ? 'Unequip' : 'Equip'"
            >
              {{ armor.equipped ? "Equipped" : "Equip" }}
            </button>
            <button
              type="button"
              class="px-2 py-1 text-sm border border-red-600 rounded cursor-pointer bg-red-600 text-white hover:bg-red-700 transition-colors ml-1"
              @click="removeArmor(idx)"
              :title="'Remove armor'"
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
          @click="addArmor"
        >
          + Add Armor
        </button>
      </div>
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
