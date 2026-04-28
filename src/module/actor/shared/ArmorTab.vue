<template>
  <div class="dw-armor-tab">
    <!-- Simplified armor interface for enemies -->
    <div v-if="isEnemy" class="space-y-4 p-4">
      <h3 class="text-lg font-bold mb-4">Armor & Defense</h3>

      <!-- Base Soak Values -->
      <div class="grid grid-cols-2 gap-4">
        <div>
          <label class="block font-bold mb-1">Physical Base Soak</label>
          <input
            type="number"
            class="px-3 py-1.5 border border-gray-600 rounded text-gray-700 w-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            v-model.number="system.soak.physicalBase"
            min="0"
          />
        </div>
        <div>
          <label class="block font-bold mb-1">Magical Base Soak</label>
          <input
            type="number"
            class="px-3 py-1.5 border border-gray-600 rounded text-gray-700 w-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            v-model.number="system.soak.magicalBase"
            min="0"
          />
        </div>
      </div>

      <!-- Armored Soak Values -->
      <div class="grid grid-cols-2 gap-4">
        <div>
          <label class="block font-bold mb-1">Armored Physical Soak</label>
          <input
            type="number"
            class="px-3 py-1.5 border border-gray-600 rounded text-gray-700 w-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            v-model.number="system.soak.armoredPhysical"
            min="0"
          />
        </div>
        <div>
          <label class="block font-bold mb-1">Armored Magical Soak</label>
          <input
            type="number"
            class="px-3 py-1.5 border border-gray-600 rounded text-gray-700 w-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            v-model.number="system.soak.armoredMagical"
            min="0"
          />
        </div>
      </div>

      <!-- Shield Soak -->
      <div>
        <label class="block font-bold mb-1">Shield Soak</label>
        <input
          type="number"
          class="px-3 py-1.5 border border-gray-600 rounded text-gray-700 w-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          v-model.number="system.soak.shieldSoak"
          min="0"
        />
      </div>

      <!-- Shield Value -->
      <div>
        <label class="block font-bold mb-1">Shield Value</label>
        <input
          type="number"
          class="px-3 py-1.5 border border-gray-600 rounded text-gray-700 w-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          v-model.number="system.soak.shield"
          min="0"
        />
      </div>

      <!-- Shield Hits -->
      <div class="grid grid-cols-2 gap-4">
        <div>
          <label class="block font-bold mb-1">Shield Hits Left</label>
          <input
            type="number"
            class="px-3 py-1.5 border border-gray-600 rounded text-gray-700 w-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            v-model.number="system.soak.shieldHitsLeft"
            min="0"
          />
        </div>
        <div>
          <label class="block font-bold mb-1">Shield Hits Max</label>
          <input
            type="number"
            class="px-3 py-1.5 border border-gray-600 rounded text-gray-700 w-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            v-model.number="system.soak.shieldHitsMax"
            min="0"
          />
        </div>
      </div>

      <!-- EMP Status -->
      <div class="flex items-center gap-2">
        <input
          type="checkbox"
          id="emp-status"
          class="w-4 h-4"
          v-model="system.combat.emp"
        />
        <label for="emp-status" class="font-bold"
          >EMP Status (Electromagnetic Pulse)</label
        >
      </div>
    </div>

    <!-- Full armor array interface for non-enemies -->
    <div v-else>
      <!-- Shield hits tracker -->
      <div class="flex flex-wrap gap-1 my-2">
        <div class="w-auto font-bold">Shield Hits Left:</div>
        <div class="basis-1/6">
          <input
            type="number"
            class="px-3 py-1.5 border border-gray-600 rounded text-gray-700 w-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            v-model.number="system.soak.shieldHitsLeft"
            min="0"
          />
        </div>
      </div>

      <!-- Armor List -->
      <table class="w-full border rounded border-collapse">
        <thead>
          <tr class="border-b bg-gray-100">
            <th class="p-2 text-left font-bold">Name</th>
            <th class="p-2 text-left font-bold">P.Soak</th>
            <th class="p-2 text-left font-bold">M.Soak</th>
            <th class="p-2 text-center font-bold border-l" rowspan="2">
              Actions
            </th>
          </tr>
          <tr class="border-b bg-gray-100">
            <th class="p-2 text-left font-bold">Shield Soak</th>
            <th class="p-2 text-left font-bold">Shield Hits</th>
            <th class="p-2 text-left font-bold">Max Hits</th>
          </tr>
        </thead>
        <tbody>
          <template v-for="(armor, idx) in system.armors" :key="idx">
            <!-- First row: Name, P.Soak, M.Soak -->
            <tr class="border-b">
              <td class="p-2">
                <input
                  type="text"
                  class="px-2 py-1 border border-gray-600 rounded text-gray-700 w-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  v-model="armor.name"
                  placeholder="Armor Name"
                />
              </td>
              <td class="p-2">
                <input
                  type="number"
                  class="px-2 py-1 border border-gray-600 rounded text-gray-700 w-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  v-model.number="armor.physicalSoak"
                  min="0"
                />
              </td>
              <td class="p-2">
                <input
                  type="number"
                  class="px-2 py-1 border border-gray-600 rounded text-gray-700 w-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  v-model.number="armor.magicalSoak"
                  min="0"
                />
              </td>
              <td class="p-2 text-center border-l" rowspan="2">
                <button
                  type="button"
                  class="px-2 py-1 text-sm border rounded cursor-pointer transition-colors block mb-1 w-full"
                  :class="
                    armor.equipped
                      ? 'bg-blue-600 text-white border-blue-600 hover:bg-blue-700'
                      : 'border-blue-600 text-blue-600  hover:bg-blue-50'
                  "
                  @click="equipArmor(idx)"
                  :title="armor.equipped ? 'Unequip' : 'Equip'"
                >
                  {{ armor.equipped ? "✓" : "Equip" }}
                </button>
                <button
                  type="button"
                  class="px-2 py-1 text-sm border border-red-600 rounded cursor-pointer bg-red-600 text-white hover:bg-red-700 transition-colors block w-full"
                  @click="removeArmor(idx)"
                  :title="'Remove armor'"
                >
                  ✕
                </button>
              </td>
            </tr>

            <!-- Second row: Shield stats -->
            <tr class="border-b">
              <td class="p-2">
                <input
                  type="number"
                  class="px-2 py-1 border border-gray-600 rounded text-gray-700 w-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  v-model.number="armor.shieldSoak"
                  min="0"
                  placeholder="Shield Soak"
                />
              </td>
              <td class="p-2">
                <input
                  type="number"
                  class="px-2 py-1 border border-gray-600 rounded text-gray-700 w-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  v-model.number="armor.shield"
                  min="0"
                  placeholder="Hits"
                />
              </td>
              <td class="p-2">
                <input
                  type="number"
                  class="px-2 py-1 border border-gray-600 rounded text-gray-700 w-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  v-model.number="armor.shieldHitsMax"
                  min="0"
                  placeholder="Max"
                />
              </td>
            </tr>
          </template>
        </tbody>
      </table>

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
  </div>
</template>

<script setup lang="ts">
import { inject, computed } from "vue";
import type { DwBaseSheet } from "../DwBaseSheet";

type ArmorEntry = {
  name: string;
  physicalSoak: number;
  magicalSoak: number;
  shieldSoak: number;
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
    shieldSoak: number;
    shieldHitsLeft: number;
    shieldHitsMax: number;
  };
  combat: {
    emp: boolean;
    defenseEffect: string;
    braceType: string;
    unsoakable: boolean;
    damageType: string;
    damage: string;
  };
  armors: ArmorEntry[];
};

const system = inject<DwSystem>("reactiveSystem")!;
const actor = inject<Actor>("actor")!;
const sheet = inject<DwBaseSheet>("sheet")!;
void sheet;

// @ts-expect-error - Foundry types don't include our custom actor types
const isEnemy = computed(() => actor.type === "enemy");

function save(path: string, value: unknown) {
  const keys = path.split(".");
  let obj = system as Record<string, unknown>;
  for (let i = 0; i < keys.length - 1; i++) {
    obj = obj[keys[i]] as Record<string, unknown>;
  }
  obj[keys[keys.length - 1]] = value;
  sheet.saveSystem({ [`${path}`]: value });
}

function addArmor() {
  const newArmor: ArmorEntry = {
    name: "",
    physicalSoak: 0,
    magicalSoak: 0,
    shieldSoak: 0,
    shield: 0,
    shieldHitsMax: 0,
    hasEmp: false,
    equipped: false
  };
  system.armors.push(newArmor);
  sheet.saveSystem({ armors: JSON.parse(JSON.stringify(system.armors)) });
}

async function removeArmor(idx: number) {
  const confirmed = await foundry.applications.api.DialogV2.confirm({
    content: `<p>Are you sure you want to remove <strong>${system.armors[idx].name || "this armor"}</strong>?</p>`,
    modal: true,
    rejectClose: false
  });

  if (confirmed) {
    system.armors.splice(idx, 1);
    sheet.saveSystem({ armors: JSON.parse(JSON.stringify(system.armors)) });
  }
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
  system.soak.shieldSoak = equipped?.shieldSoak ?? 0;
  system.soak.shieldHitsMax = equipped?.shieldHitsMax ?? 0;
  system.soak.shieldHitsLeft = equipped?.shield ?? 0; // Use current hits, not max

  sheet.saveSystem({
    armors: JSON.parse(JSON.stringify(system.armors)),
    "soak.armoredPhysical": system.soak.armoredPhysical,
    "soak.armoredMagical": system.soak.armoredMagical,
    "soak.shield": system.soak.shield,
    "soak.shieldSoak": system.soak.shieldSoak,
    "soak.shieldHitsMax": system.soak.shieldHitsMax,
    "soak.shieldHitsLeft": system.soak.shieldHitsLeft
  });
}
</script>
