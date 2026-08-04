/**
 * Quick Roll HUD
 *
 * Adds a "Quick Rolls" button to token HUD for fast access to custom rolls
 * without opening the actor sheet.
 */

import { SystemActor } from "../documents";
import { BaseData } from "../types/base-data";
import { doRoll } from "../rolling/dice-utils";

/**
 * Initialize quick roll HUD (no longer needed - handled by DwTokenHUD._onRender)
 * Kept for backwards compatibility
 */
export function initializeQuickRollHUD(): void {
  // Functionality now handled by DwTokenHUD class in dimensionalwar.ts
  // This function is kept empty to avoid breaking existing code
}

interface RollItem {
  type: "custom" | "movement";
  name: string;
  category: string;
  formula: string;
  mpCost: number;
  index: number;
  movementType?: "Walking" | "Acrobatics" | "Swimming" | "Flying" | "Burrowing";
}

/**
 * Show quick roll menu as a context menu
 */
export async function showQuickRollMenu(
  token: Token,
  actor: SystemActor,
  rolls: BaseData.RollEntry[]
): Promise<void> {
  // Collect custom rolls
  const rollItems: RollItem[] = rolls.map((roll, idx) => {
    const formula = roll.bonusFormula || "1d20";
    const bonus = roll.bonusNumber || 0;
    const fullFormula =
      bonus !== 0 ? `${formula}${bonus >= 0 ? "+" : ""}${bonus}` : formula;

    return {
      type: "custom" as const,
      name: roll.reasonBase || "Unnamed Roll",
      category: roll.category,
      formula: fullFormula,
      mpCost: roll.mpCost || 0,
      index: idx
    };
  });

  // Add movement rolls
  const movements: Array<{
    type: "Walking" | "Acrobatics" | "Swimming" | "Flying" | "Burrowing";
    skillName: string;
  }> = [
    { type: "Walking", skillName: "Athletics" },
    { type: "Acrobatics", skillName: "Acrobatics" },
    { type: "Swimming", skillName: "Swimming" },
    { type: "Flying", skillName: "Athletics" },
    { type: "Burrowing", skillName: "Athletics" }
  ];

  movements.forEach(({ type, skillName }) => {
    // Get skill level and bonus
    let skillLevel = 0;
    let skillBonus = 0;

    // Try to find the skill in different categories
    const skillCategories = ["movement", "utility", "combat"];
    for (const category of skillCategories) {
      const categorySkills = (actor.system as any).skills?.[category];
      if (categorySkills?.[skillName]) {
        skillLevel = categorySkills[skillName].level ?? 0;
        skillBonus = categorySkills[skillName].bonus ?? 0;
        break;
      }
    }

    const formula =
      skillBonus !== 0
        ? `1s${skillLevel}${skillBonus >= 0 ? "+" : ""}${skillBonus}`
        : `1s${skillLevel}`;

    rollItems.push({
      type: "movement" as const,
      name: `${type} Movement`,
      category: "Movement",
      formula,
      mpCost: 0,
      index: -1,
      movementType: type
    });
  });

  // Show as a dialog instead of context menu (better formatting)
  const html = `
    <style>
      .quick-roll-menu {
        max-height: 500px;
        overflow-y: auto;
      }
      .quick-roll-item {
        padding: 10px 12px;
        margin: 4px 0;
        border: 1px solid #ddd;
        border-radius: 4px;
        background: #f9f9f9;
        cursor: pointer;
        transition: all 0.15s;
        display: flex;
        align-items: center;
        gap: 10px;
      }
      .quick-roll-item:hover {
        background: #e3f2fd;
        border-color: #2196F3;
        transform: translateX(3px);
      }
      .quick-roll-icon {
        font-size: 1.2em;
        min-width: 24px;
        text-align: center;
      }
      .quick-roll-content {
        flex: 1;
      }
      .quick-roll-name {
        font-weight: 500;
        color: #333;
        margin-bottom: 2px;
      }
      .quick-roll-details {
        font-size: 0.85em;
        color: #666;
        display: flex;
        gap: 8px;
        align-items: center;
      }
      .quick-roll-category {
        display: inline-block;
        padding: 2px 6px;
        background: #4CAF50;
        color: white;
        border-radius: 3px;
        font-size: 0.85em;
      }
      .quick-roll-formula {
        font-family: monospace;
        background: #eee;
        padding: 2px 5px;
        border-radius: 2px;
      }
      .quick-roll-mp {
        color: #9C27B0;
        font-weight: bold;
      }
    </style>
    <div class="quick-roll-menu">
      ${rollItems
        .map((item, idx) => {
          const icon = getCategoryIcon(item.category);

          return `
          <div class="quick-roll-item" data-item-index="${idx}">
            <div class="quick-roll-icon">${icon}</div>
            <div class="quick-roll-content">
              <div class="quick-roll-name">${item.name}</div>
              <div class="quick-roll-details">
                <span class="quick-roll-category">${item.category}</span>
                <span class="quick-roll-formula">${item.formula}</span>
                ${item.mpCost > 0 ? `<span class="quick-roll-mp">⚡ ${item.mpCost} MP</span>` : ""}
              </div>
            </div>
          </div>
        `;
        })
        .join("")}
    </div>
  `;

  new Dialog(
    {
      title: `${actor.name} - Quick Rolls`,
      content: html,
      buttons: {
        close: {
          icon: '<i class="fas fa-times"></i>',
          label: "Close"
        }
      },
      default: "close",
      render: (html: JQuery | HTMLElement) => {
        // Dialog passes jQuery object, convert to HTMLElement
        const element = html instanceof HTMLElement ? html : html[0];
        const rollItemElements = element.querySelectorAll(".quick-roll-item");
        rollItemElements.forEach(itemElement => {
          itemElement.addEventListener("click", async () => {
            const itemIndex = parseInt(
              itemElement.getAttribute("data-item-index") || "0"
            );
            const item = rollItems[itemIndex];
            if (!item) return;

            if (item.type === "custom") {
              // Pass true to update base actor since we're outside sheet context
              await doRoll(
                actor,
                actor.system as BaseData.DwSystem,
                item.index,
                true
              );
            } else if (item.type === "movement" && item.movementType) {
              // Roll movement check
              await rollMovementCheck(actor, item.movementType);
            }
          });
        });
      }
    },
    {
      width: 450,
      height: "auto"
    }
  ).render(true);
}

/**
 * Roll movement check for an actor
 */
async function rollMovementCheck(
  actor: SystemActor,
  movementType: "Walking" | "Acrobatics" | "Swimming" | "Flying" | "Burrowing"
): Promise<void> {
  // Map movement type to skill name
  const skillMap: Record<string, string> = {
    Walking: "Athletics",
    Acrobatics: "Acrobatics",
    Swimming: "Swimming",
    Flying: "Athletics",
    Burrowing: "Athletics"
  };

  const skillName = skillMap[movementType] || "Athletics";

  // Get skill level and bonus
  let skillLevel = 0;
  let skillBonus = 0;

  // Try to find the skill in different categories
  const skillCategories = ["movement", "utility", "combat"];
  for (const category of skillCategories) {
    const categorySkills = (actor.system as any).skills?.[category];
    if (categorySkills?.[skillName]) {
      skillLevel = categorySkills[skillName].level ?? 0;
      skillBonus = categorySkills[skillName].bonus ?? 0;
      break;
    }
  }

  // Build formula
  const formula =
    skillBonus !== 0
      ? `1s${skillLevel}${skillBonus >= 0 ? "+" : ""}${skillBonus}`
      : `1s${skillLevel}`;

  try {
    const roll = await Roll.create(formula);
    await roll.evaluate();
    await roll.toMessage({
      speaker: ChatMessage.getSpeaker({ actor: actor as any }),
      flavor: `${movementType} Movement`
    });
  } catch (e) {
    ui.notifications?.error(`Failed to roll ${movementType} movement: ${e}`);
  }
}

/**
 * Get icon for roll category
 */
function getCategoryIcon(category: string): string {
  const icons: Record<string, string> = {
    Offensive: "⚔️",
    Defensive: "🛡️",
    Movement: "🏃",
    Perception: "👁️",
    "Vehicle Operation": "🚗",
    "Non-Combat": "🔧",
    Artisan: "🎨"
  };

  return icons[category] || "🎲";
}
