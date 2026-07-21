<template>
  <div class="dw-rolls-tab">
    <!-- Perception Rolls Section (only for actors with skills) -->
    <div v-if="hasSkills" class="border rounded p-4 mb-4 bg-gray-50">
      <h3 class="font-bold text-lg mb-3 text-gray-900">Perception Rolls</h3>
      <div class="grid grid-cols-3 gap-2">
        <button
          type="button"
          class="px-3 py-2 border border-green-600 rounded bg-green-600 text-white hover:bg-green-700 cursor-pointer transition-colors text-left"
          @click="rollPerception('sight')"
        >
          👁️ Sight (Level {{ getPerceptionSkill('sight').level
          }}{{
            getPerceptionSkill('sight').bonus !== 0
              ? ` ${getPerceptionSkill('sight').bonus >= 0 ? "+" : ""}${getPerceptionSkill('sight').bonus}`
              : ""
          }})
        </button>
        <button
          type="button"
          class="px-3 py-2 border border-green-600 rounded bg-green-600 text-white hover:bg-green-700 cursor-pointer transition-colors text-left"
          @click="rollPerception('hearing')"
        >
          👂 Hearing (Level {{ getPerceptionSkill('hearing').level
          }}{{
            getPerceptionSkill('hearing').bonus !== 0
              ? ` ${getPerceptionSkill('hearing').bonus >= 0 ? "+" : ""}${getPerceptionSkill('hearing').bonus}`
              : ""
          }})
        </button>
        <button
          type="button"
          class="px-3 py-2 border border-green-600 rounded bg-green-600 text-white hover:bg-green-700 cursor-pointer transition-colors text-left"
          @click="rollPerception('smell')"
        >
          👃 Smell (Level {{ getPerceptionSkill('smell').level
          }}{{
            getPerceptionSkill('smell').bonus !== 0
              ? ` ${getPerceptionSkill('smell').bonus >= 0 ? "+" : ""}${getPerceptionSkill('smell').bonus}`
              : ""
          }})
        </button>
        <button
          type="button"
          class="px-3 py-2 border border-green-600 rounded bg-green-600 text-white hover:bg-green-700 cursor-pointer transition-colors text-left"
          @click="rollPerception('taste')"
        >
          👅 Taste (Level {{ getPerceptionSkill('taste').level
          }}{{
            getPerceptionSkill('taste').bonus !== 0
              ? ` ${getPerceptionSkill('taste').bonus >= 0 ? "+" : ""}${getPerceptionSkill('taste').bonus}`
              : ""
          }})
        </button>
        <button
          type="button"
          class="px-3 py-2 border border-green-600 rounded bg-green-600 text-white hover:bg-green-700 cursor-pointer transition-colors text-left"
          @click="rollPerception('touch')"
        >
          ✋ Touch (Level {{ getPerceptionSkill('touch').level
          }}{{
            getPerceptionSkill('touch').bonus !== 0
              ? ` ${getPerceptionSkill('touch').bonus >= 0 ? "+" : ""}${getPerceptionSkill('touch').bonus}`
              : ""
          }})
        </button>
      </div>
    </div>

    <!-- Movement Rolls Section (only for actors with skills) -->
    <div v-if="hasSkills" class="border rounded p-4 mb-4 bg-gray-50">
      <h3 class="font-bold text-lg mb-3 text-gray-900">Movement Rolls</h3>
      <div class="grid grid-cols-2 gap-2">
        <!-- @ts-expect-error - SystemActor has walkingSpeed -->
        <button
          v-if="actor.walkingSpeed > 0"
          type="button"
          class="px-3 py-2 border border-blue-600 rounded bg-blue-600 text-white hover:bg-blue-700 cursor-pointer transition-colors text-left"
          @click="rollMovement('Walking', actor.walkingSpeed)"
        >
          🚶 Walking (Level {{ getMovementSkill("Athletics").level
          }}{{
            getMovementSkill("Athletics").bonus !== 0
              ? ` ${getMovementSkill("Athletics").bonus >= 0 ? "+" : ""}${getMovementSkill("Athletics").bonus}`
              : ""
          }})
        </button>
        <!-- @ts-expect-error - SystemActor has acrobaticsSpeed -->
        <button
          v-if="actor.acrobaticsSpeed > 0"
          type="button"
          class="px-3 py-2 border border-blue-600 rounded bg-blue-600 text-white hover:bg-blue-700 cursor-pointer transition-colors text-left"
          @click="rollMovement('Acrobatics', actor.acrobaticsSpeed)"
        >
          🤸 Acrobatics (Level {{ getMovementSkill("Acrobatics").level
          }}{{
            getMovementSkill("Acrobatics").bonus !== 0
              ? ` ${getMovementSkill("Acrobatics").bonus >= 0 ? "+" : ""}${getMovementSkill("Acrobatics").bonus}`
              : ""
          }})
        </button>
        <!-- @ts-expect-error - SystemActor has swimmingSpeed -->
        <button
          v-if="actor.swimmingSpeed > 0"
          type="button"
          class="px-3 py-2 border border-blue-600 rounded bg-blue-600 text-white hover:bg-blue-700 cursor-pointer transition-colors text-left"
          @click="rollMovement('Swimming', actor.swimmingSpeed)"
        >
          🏊 Swimming (Level {{ getMovementSkill("Swimming").level
          }}{{
            getMovementSkill("Swimming").bonus !== 0
              ? ` ${getMovementSkill("Swimming").bonus >= 0 ? "+" : ""}${getMovementSkill("Swimming").bonus}`
              : ""
          }})
        </button>
        <!-- @ts-expect-error - SystemActor has flyingSpeed and system has movementFlags -->
        <button
          v-if="system.movementFlags?.hasFlight && actor.flyingSpeed > 0"
          type="button"
          class="px-3 py-2 border border-blue-600 rounded bg-blue-600 text-white hover:bg-blue-700 cursor-pointer transition-colors text-left"
          @click="rollMovement('Flying', actor.flyingSpeed)"
        >
          🦅 Flying (Level {{ getMovementSkill("Athletics").level
          }}{{
            getMovementSkill("Athletics").bonus !== 0
              ? ` ${getMovementSkill("Athletics").bonus >= 0 ? "+" : ""}${getMovementSkill("Athletics").bonus}`
              : ""
          }})
        </button>
        <!-- @ts-expect-error - SystemActor has burrowingSpeed and system has movementFlags -->
        <button
          v-if="
            (system.movementFlags?.burrowing ?? 0) > 0 &&
            actor.burrowingSpeed > 0
          "
          type="button"
          class="px-3 py-2 border border-blue-600 rounded bg-blue-600 text-white hover:bg-blue-700 cursor-pointer transition-colors text-left"
          @click="rollMovement('Burrowing', actor.burrowingSpeed)"
        >
          ⛏️ Burrowing (Level {{ getMovementSkill("Athletics").level
          }}{{
            getMovementSkill("Athletics").bonus !== 0
              ? ` ${getMovementSkill("Athletics").bonus >= 0 ? "+" : ""}${getMovementSkill("Athletics").bonus}`
              : ""
          }})
        </button>
      </div>
    </div>

    <!-- Custom Rolls Section -->
    <h3 class="font-bold text-lg mb-2 text-gray-900">Custom Rolls</h3>
    <div class="border rounded">
      <div v-for="(entry, idx) in system.rolls" :key="idx" class="border-b p-2">
        <div class="flex flex-wrap gap-1">
          <div class="basis-1/4">
            Category
            <select
              v-model="entry.category"
              class="px-3 py-1.5 border border-gray-600 rounded text-gray-700 w-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option v-for="cat in categories" :key="cat" :value="cat">
                {{ cat }}
              </option>
            </select>
          </div>
          <div class="basis-1/6">
            Formula
            <input
              type="text"
              class="px-3 py-1.5 border border-gray-600 rounded text-gray-700 w-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              v-model="entry.bonusFormula"
              placeholder="Formula (e.g. 1s5, 1s5*2, 1s5*2c,3f)"
            />
          </div>
          <div class="basis-1/10">
            Bonus
            <input
              type="number"
              class="px-3 py-1.5 border border-gray-600 rounded text-gray-700 w-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              v-model.number="entry.bonusNumber"
              placeholder="Bonus"
            />
          </div>
          <div class="basis-1/10">
            MP Cost?
            <input
              type="number"
              class="px-3 py-1.5 border border-gray-600 rounded text-gray-700 w-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              v-model.number="entry.mpCost"
              placeholder="MP Cost"
            />
          </div>
          <div class="basis-auto">
            Roll
            <button
              type="button"
              class="block px-3 py-1.5 border border-gray-600 rounded text-gray-700 hover:bg-gray-50 cursor-pointer transition-colors"
              @click="doRoll(idx)"
              :title="'Roll'"
            >
              🎲
            </button>
          </div>
          <div class="basis-auto ms-auto">
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
        <div>
          <div class="basis-1/5">
            Reason
            <input
              type="text"
              class="px-3 py-1.5 border border-gray-600 rounded text-gray-700 w-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              v-model="entry.reasonBase"
              placeholder="Reason"
            />
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
import { inject, computed } from "vue";
import { rollPerceptionCheck } from "../../utils/token-hud";
import type { SystemActor as SystemActorType } from "../../documents";

type RollEntry = {
  category: string;
  bonusFormula: string;
  bonusNumber: number;
  mpCost: number;
  reasonBase: string;
};

type DwSystem = {
  rolls: RollEntry[];
  skills?: {
    movement?: Record<string, any>;
    senses?: Record<string, any>;
    utility?: Record<string, any>;
  };
  bonuses?: {
    senses?: Record<string, number>;
  };
  movementFlags?: {
    hasFlight: boolean;
    hasParkour: boolean;
    hasTeleport: boolean;
    hasCrossCountry: boolean;
    burrowing: number;
  };
};

type SystemActor = SystemActorType & {
  walkingSpeed: number;
  acrobaticsSpeed: number;
  swimmingSpeed: number;
  flyingSpeed: number;
  burrowingSpeed: number;
};

const system = inject<DwSystem>("reactiveSystem")!;
const actor = inject<SystemActor>("actor")!;

// Check if actor has skills (CharacterDataModel-based actors only)
const hasSkills = computed(() => {
  return !!(system.skills?.movement && system.skills?.senses);
});

const categories = [
  "Offensive",
  "Defensive",
  "Movement",
  "Perception",
  "Vehicle Operation",
  "Non-Combat",
  "Artisan"
];

// Helper to get skill level and bonus for movement skills
function getMovementSkill(skillName: string): { level: number; bonus: number } {
  const skill = (system as any).skills?.movement?.[skillName];
  if (!skill) return { level: 0, bonus: 0 };

  // Handle both simple structure {level, bonus} and array structure
  if (Array.isArray(skill)) {
    return {
      level: skill[0]?.level ?? 0,
      bonus: skill[0]?.bonus ?? 0
    };
  }
  return {
    level: skill.level ?? 0,
    bonus: skill.bonus ?? 0
  };
}

// Helper to get Perception level and sense-specific bonus
function getPerceptionSkill(senseName = "sight"): { level: number; bonus: number } {
  const level = system.skills?.utility?.Perception?.level ?? 0;
  const senseBonus = system.bonuses?.senses?.[senseName] ?? 0;

  return {
    level,
    bonus: senseBonus
  };
}

// Roll a perception check for a specific sense
async function rollPerception(senseType: "sight" | "hearing" | "smell" | "taste" | "touch") {
  try {
    await rollPerceptionCheck(actor as unknown as SystemActorType, senseType);
  } catch (e) {
    ui.notifications?.error(`Failed to roll perception: ${e}`);
  }
}

async function rollMovement(type: string, speed: number) {
  // Map movement type to skill name
  const skillMap: Record<string, string> = {
    Walking: "Athletics",
    Acrobatics: "Acrobatics",
    Swimming: "Swimming",
    Flying: "Athletics", // Flying uses Athletics skill
    Burrowing: "Athletics" // Burrowing uses Athletics skill (or could be a separate skill)
  };

  const skillName = skillMap[type] || "Athletics";
  const skill = getMovementSkill(skillName);

  // Roll formula: 1s{level}+{bonus} (skill dice notation)
  // Example: 1s5+2 = 1 skill die at level 5 with +2 bonus
  const formula =
    skill.bonus !== 0
      ? `1s${skill.level}${skill.bonus >= 0 ? "+" : ""}${skill.bonus}`
      : `1s${skill.level}`;

  try {
    const roll = await Roll.create(formula);
    await roll.evaluate();
    await roll.toMessage({
      speaker: ChatMessage.getSpeaker({ actor: actor as any }),
      flavor: `${skillName}${skill.bonus !== 0 ? ` ${skill.bonus >= 0 ? "+" : ""}${skill.bonus}` : ""}`
    });
  } catch (e) {
    ui.notifications?.error(`Failed to roll movement: ${e}`);
  }
}

function addRoll() {
  const newRoll: RollEntry = {
    category: "Offensive",
    bonusFormula: "",
    bonusNumber: 0,
    mpCost: 0,
    reasonBase: ""
  };
  system.rolls.push(newRoll);
}

async function removeRoll(idx: number) {
  const entry = system.rolls[idx];
  const label = entry?.reasonBase?.trim() || entry?.category || "this roll";
  const confirmed = await foundry.applications.api.DialogV2.confirm({
    content: `<p>Delete <strong>${label}</strong>?</p>`,
    modal: true
  });

  if (!confirmed) return;
  system.rolls.splice(idx, 1);
}

async function doRoll(idx: number) {
  const entry = system.rolls[idx];
  if (!entry) return;
  const formulaBase = entry.bonusFormula?.trim() || "1d20";
  const formula = entry.bonusNumber
    ? `${formulaBase} + ${entry.bonusNumber}`
    : formulaBase;
  try {
    if (entry.mpCost > 0) {
      // @ts-expect-error - SystemActor has resources.mp.value
      if (system.resources.mp.value < entry.mpCost) {
        ui.notifications?.warn(`Not enough MP to perform this roll.`);
        return;
      }
      // @ts-expect-error - SystemActor has resources.mp.value
      system.resources.mp.value -= entry.mpCost;
    }
  } catch (e) {
    ui.notifications?.error(`Failed to deduct MP: ${e}`);
  }
  try {
    const roll = Roll.create(formula);
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
