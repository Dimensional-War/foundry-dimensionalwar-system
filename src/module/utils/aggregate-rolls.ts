/**
 * Aggregate Roll Dialog
 *
 * Shows all rolls from selected tokens in a single dialog for quick execution.
 * Groups rolls by name - click a roll to execute it for all actors that have it.
 */

import { SystemActor } from "../documents";
import { BaseData } from "../types/base-data";
import { doRoll } from "../rolling/dice-utils";

type RollType = "custom" | "movement";

interface RollOption {
  tokenId: string; // Add token ID to track individual tokens
  actorId: string;
  actorName: string;
  rollIndex: number;
  roll: BaseData.RollEntry;
  rollType: RollType;
  // For movement rolls
  movementType?: "Walking" | "Acrobatics" | "Swimming" | "Flying" | "Burrowing";
}

interface GroupedRoll {
  rollName: string;
  category: string;
  formula: string;
  mpCost: number;
  rollType: RollType;
  movementType?: "Walking" | "Acrobatics" | "Swimming" | "Flying" | "Burrowing";
  actors: Array<{
    tokenId: string; // Track by token instead of just actor
    actorId: string;
    actorName: string;
    rollIndex: number;
  }>;
}

/**
 * Show aggregate roll dialog for all selected tokens
 */
export async function showAggregateRollDialog(): Promise<void> {
  const controlled = canvas.tokens?.controlled ?? [];

  if (controlled.length === 0) {
    ui.notifications?.warn(
      "No tokens selected. Select one or more tokens to see their rolls."
    );
    return;
  }

  let dialog: Dialog | null = null;
  let updateCallback: (() => void) | null = null;
  let currentGroupedRolls: GroupedRoll[] = [];

  // Function to collect and build dialog content
  function buildDialogContent(): string {
    const controlled = canvas.tokens?.controlled ?? [];

    if (controlled.length === 0) {
      return `<div class="aggregate-rolls-dialog"><p>No tokens selected.</p></div>`;
    }

    // Collect all rolls from selected tokens
    const rollOptions: RollOption[] = [];

    for (const token of controlled) {
      const actor = token.actor as SystemActor | null;
      if (!actor) continue;

      // Add custom rolls
      if (actor.system?.rolls) {
        const rolls = actor.system.rolls as BaseData.RollEntry[];
        rolls.forEach((roll, idx) => {
          rollOptions.push({
            tokenId: token.document.id!,
            actorId: actor.id!,
            actorName: actor.name!,
            rollIndex: idx,
            roll,
            rollType: "custom"
          });
        });
      }

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

        rollOptions.push({
          tokenId: token.document.id!,
          actorId: actor.id!,
          actorName: actor.name!,
          rollIndex: -1, // Not a custom roll
          roll: {
            reasonBase: `${type} Movement`,
            category: "Movement",
            bonusFormula: formula,
            bonusNumber: 0,
            mpCost: 0
          } as BaseData.RollEntry,
          rollType: "movement",
          movementType: type
        });
      });
    }

    if (rollOptions.length === 0) {
      return `<div class="aggregate-rolls-dialog"><p>Selected tokens have no rolls available.</p></div>`;
    }

    // Group rolls by name
    const groupedRolls = groupRollsByName(rollOptions);
    currentGroupedRolls = groupedRolls;

    // Build HTML for the dialog
    return `
    <style>
      .aggregate-rolls-dialog {
        max-height: 600px;
        overflow-y: auto;
      }
      .roll-option {
        padding: 10px 12px;
        margin: 6px 0;
        border: 1px solid #ccc;
        border-radius: 4px;
        background: #f9f9f9;
        cursor: pointer;
        transition: all 0.2s;
      }
      .roll-option:hover {
        background: #e3f2fd;
        border-color: #2196F3;
        transform: translateX(3px);
        box-shadow: 2px 2px 4px rgba(0,0,0,0.1);
      }
      .roll-option-header {
        font-weight: bold;
        color: #333;
        margin-bottom: 4px;
        display: flex;
        justify-content: space-between;
        align-items: center;
      }
      .actor-count {
        font-size: 0.85em;
        color: #666;
        font-weight: normal;
        background: #E3F2FD;
        padding: 2px 8px;
        border-radius: 12px;
      }
      .roll-actors {
        font-size: 0.85em;
        color: #666;
        margin-top: 4px;
        font-style: italic;
      }
      .roll-details {
        font-size: 0.85em;
        color: #555;
        margin-top: 4px;
      }
      .roll-category {
        display: inline-block;
        padding: 2px 6px;
        background: #4CAF50;
        color: white;
        border-radius: 3px;
        font-size: 0.85em;
        margin-right: 4px;
      }
      .roll-formula {
        font-family: monospace;
        background: #eee;
        padding: 2px 5px;
        border-radius: 2px;
      }
    </style>
    <div class="aggregate-rolls-dialog">
      ${buildGroupedRollListHTML(groupedRolls)}
    </div>
  `;
  }

  // Function to update dialog content and re-attach handlers
  function updateDialog() {
    if (!dialog) return;

    const controlled = canvas.tokens?.controlled ?? [];
    const newContent = buildDialogContent();

    // Update title
    dialog.options.title = `Aggregate Rolls (${controlled.length} token${controlled.length !== 1 ? "s" : ""} selected)`;

    // Update content
    const contentElement = dialog.element?.find(".window-content");
    if (contentElement) {
      contentElement.html(newContent);
      attachHandlers(contentElement);
    }
  }

  // Function to attach event handlers
  function attachHandlers(html: JQuery) {
    // Individual roll group handlers
    html.find(".roll-option").on("click", async function () {
      const rollName = $(this).data("roll-name");
      const group = currentGroupedRolls.find(g => g.rollName === rollName);
      if (group) {
        await executeRollGroup(group);
      }
    });
  }

  // Create and show dialog
  dialog = new Dialog(
    {
      title: `Aggregate Rolls (${controlled.length} token${controlled.length !== 1 ? "s" : ""} selected)`,
      content: buildDialogContent(),
      buttons: {
        close: {
          icon: '<i class="fas fa-times"></i>',
          label: "Close",
          callback: () => {
            // Clean up hook when dialog closes
            if (updateCallback) {
              Hooks.off("controlToken", updateCallback);
            }
          }
        }
      },
      default: "close",
      render: html => {
        attachHandlers(html);
      },
      close: () => {
        // Clean up hook when dialog closes
        if (updateCallback) {
          Hooks.off("controlToken", updateCallback);
        }
      }
    },
    {
      width: 550,
      height: "auto",
      resizable: true
    }
  );

  dialog.render(true);

  // Define callback for hook cleanup
  updateCallback = () => {
    updateDialog();
  };

  // Listen for token control changes
  Hooks.on("controlToken", updateCallback);
}

/**
 * Group rolls by their name (reasonBase), combining actors with the same roll
 */
function groupRollsByName(rollOptions: RollOption[]): GroupedRoll[] {
  const groups = new Map<string, GroupedRoll>();

  for (const option of rollOptions) {
    const rollName = option.roll.reasonBase || "Unnamed Roll";
    const formula = option.roll.bonusFormula || "1d20";
    const bonus = option.roll.bonusNumber || 0;
    const fullFormula =
      bonus !== 0 ? `${formula}${bonus >= 0 ? "+" : ""}${bonus}` : formula;

    if (!groups.has(rollName)) {
      groups.set(rollName, {
        rollName,
        category: option.roll.category,
        formula: fullFormula,
        mpCost: option.roll.mpCost || 0,
        rollType: option.rollType,
        movementType: option.movementType,
        actors: []
      });
    }

    const group = groups.get(rollName)!;

    // Track by token ID to handle both linked and unlinked tokens
    const alreadyAdded = group.actors.some(a => a.tokenId === option.tokenId);
    if (!alreadyAdded) {
      group.actors.push({
        tokenId: option.tokenId,
        actorId: option.actorId,
        actorName: option.actorName,
        rollIndex: option.rollIndex
      });
    }
  }

  return Array.from(groups.values()).sort((a, b) => {
    // Sort by category, then by name
    if (a.category !== b.category) return a.category.localeCompare(b.category);
    return a.rollName.localeCompare(b.rollName);
  });
}

/**
 * Build HTML for grouped roll list
 */
function buildGroupedRollListHTML(groupedRolls: GroupedRoll[]): string {
  let html = "";

  for (const group of groupedRolls) {
    const actorNames = group.actors.map(a => a.actorName).join(", ");
    const actorCount = group.actors.length;

    html += `
      <div class="roll-option" 
           data-roll-name="${group.rollName}"
           title="Click to roll for all ${actorCount} actor${actorCount !== 1 ? "s" : ""}">
        <div class="roll-option-header">
          <span>${group.rollName}</span>
          <span class="actor-count">${actorCount} actor${actorCount !== 1 ? "s" : ""}</span>
        </div>
        <div class="roll-details">
          <span class="roll-category">${group.category}</span>
          <span class="roll-formula">${group.formula}</span>
          ${group.mpCost > 0 ? `<span style="color: #9C27B0; font-weight: bold;">⚡ ${group.mpCost} MP</span>` : ""}
        </div>
        <div class="roll-actors">
          ${actorNames}
        </div>
      </div>
    `;
  }

  return html;
}

/**
 * Execute a single roll group (all actors with the same roll)
 */
async function executeRollGroup(group: GroupedRoll): Promise<void> {
  for (const actorData of group.actors) {
    // Get actor from token ID to ensure we're using the correct instance
    const token = canvas.tokens?.get(actorData.tokenId);
    const actor = token?.actor as SystemActor | undefined;
    if (!actor) continue;

    // Execute based on roll type
    if (group.rollType === "movement" && group.movementType) {
      // Roll movement check
      await rollMovementCheck(actor, group.movementType);
    } else {
      // Custom roll - use doRoll
      // Pass true to update base actor since we're outside sheet context
      await doRoll(actor, actor.system as any, actorData.rollIndex, true);
    }

    // Small delay between rolls for readability
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  ui.notifications?.info(
    `Rolled ${group.rollName} for ${group.actors.length} actor${group.actors.length !== 1 ? "s" : ""}`
  );
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

