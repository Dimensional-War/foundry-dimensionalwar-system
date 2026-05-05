import "./dimensionalwar.css";

// System entry point – Foundry loads this as the ESModule for the system.
import { SystemActor } from "./module/documents";
import { ActorType } from "./module/enums";
import {
  PcDataModel,
  NpcDataModel,
  AllyDataModel,
  EnemyDataModel,
  BossDataModel
} from "./module/data-models/index";
import {
  PcSheet,
  NpcSheet,
  AllySheet,
  EnemySheet,
  BossSheet
} from "./module/actor/ActorSheets";
import { rollPerceptionCheck } from "./module/utils/token-hud";
import {
  showPerceptionOverlay,
  cleanupAllPerceptionOverlays,
  initPerceptionHoverListener,
  removePerceptionOverlay
} from "./module/utils/perception-overlay";
import { DwRoll } from "./module/rolling/DwRoll";
import { DwRollParser } from "./module/rolling/DwRollParser";
import { DwSkillDiceTerm } from "./module/rolling/DwSkillDiceTerm";
import { openCSBImportDialog } from "./module/utils/csb-import-dialog";

const initHandler = () => {
  CONFIG.debug.rollParsing = false; // Enable debug logging for roll parsing
  // Register the custom Actor document class
  CONFIG.Actor.documentClass = SystemActor as unknown as typeof Actor;

  // Register data models for each actor type
  CONFIG.Actor.dataModels = {
    [ActorType.Pc]: PcDataModel,
    [ActorType.Npc]: NpcDataModel,
    [ActorType.Ally]: AllyDataModel,
    [ActorType.Enemy]: EnemyDataModel,
    [ActorType.Boss]: BossDataModel
  } as unknown as typeof CONFIG.Actor.dataModels;

  // Register actor sheets
  foundry.documents.collections.Actors.unregisterSheet(
    "core",
    foundry.applications.sheets.ActorSheetV2
  );
  foundry.documents.collections.Actors.registerSheet(
    "dimensionalwar",
    PcSheet,
    { types: [ActorType.Pc], makeDefault: true, label: "PC" }
  );
  foundry.documents.collections.Actors.registerSheet(
    "dimensionalwar",
    NpcSheet,
    { types: [ActorType.Npc], makeDefault: true, label: "NPC" }
  );
  foundry.documents.collections.Actors.registerSheet(
    "dimensionalwar",
    AllySheet,
    { types: [ActorType.Ally], makeDefault: true, label: "Ally" }
  );
  foundry.documents.collections.Actors.registerSheet(
    "dimensionalwar",
    EnemySheet,
    { types: [ActorType.Enemy], makeDefault: true, label: "Enemy" }
  );
  foundry.documents.collections.Actors.registerSheet(
    "dimensionalwar",
    BossSheet,
    { types: [ActorType.Boss], makeDefault: true, label: "Boss" }
  );

  // Register custom dice system for skill checks
  // Parser: Routes "1s5" notation to set class="DwSkillDiceTerm" in parse nodes
  CONFIG.Dice.parser = DwRollParser;
  // Roll: instantiateAST() routes DwSkillDiceTerm parse nodes to the proper class
  CONFIG.Dice.rolls = [DwRoll];
  // Register skill dice term with "s" denomination (e.g., "1s5" = 1 die at skill level 5)
  // @ts-expect-error - Custom DiceTerm registration
  CONFIG.Dice.terms.s = DwSkillDiceTerm;
  // @ts-expect-error - Custom DiceTerm type registration
  CONFIG.Dice.termTypes.DwSkillDiceTerm = DwSkillDiceTerm;
};

// ─── Custom Token HUD: Add Perception Palette ──────────────────────────────────

/**
 * Custom TokenHUD that extends the base TokenHUD to add perception roll functionality
 */
class DwTokenHUD extends foundry.applications.hud.TokenHUD {
  constructor(options = {}) {
    super(options);
  }

  /** @override */
  static DEFAULT_OPTIONS = foundry.utils.mergeObject(
    super.DEFAULT_OPTIONS,
    {
      actions: {
        perception: DwTokenHUD.#onSelectPerception
      }
    },
    { inplace: false }
  );

  /**
   * Get the valid perception sense choices
   * @returns {Object} Perception choices keyed by sense ID
   * @protected
   */
  _getPerceptionChoices(): Record<string, any> {
    const actor = this.document?.actor as SystemActor;
    if (!actor) {
      console.warn("No actor found");
      return {};
    }

    // Only show for supported actor types
    const supportedTypes: string[] = [
      ActorType.Pc,
      ActorType.Npc,
      ActorType.Ally,
      ActorType.Enemy,
      ActorType.Boss
    ];
    if (!supportedTypes.includes(actor.type)) {
      console.warn("Actor type not supported:", actor.type);
      return {};
    }

    return {
      Sight: {
        id: "Sight",
        label: "Sight",
        icon: "fa-eye",
        isActive: false,
        cssClass: ""
      },
      Hearing: {
        id: "Hearing",
        label: "Hearing",
        icon: "fa-ear-listen",
        isActive: false,
        cssClass: ""
      },
      Smell: {
        id: "Smell",
        label: "Smell",
        icon: "fa-wind",
        isActive: false,
        cssClass: ""
      },
      Taste: {
        id: "Taste",
        label: "Taste",
        icon: "fa-utensils",
        isActive: false,
        cssClass: ""
      },
      Touch: {
        id: "Touch",
        label: "Touch",
        icon: "fa-hand",
        isActive: false,
        cssClass: ""
      }
    };
  }

  /** @override */
  async _prepareContext(options: any) {
    const context = await super._prepareContext(options);
    const perceptionSenses = this._getPerceptionChoices();
    return foundry.utils.mergeObject(context, {
      perceptionSenses
    });
  }

  /**
   * Handle selecting a perception sense to roll
   * @param {PointerEvent} event
   * @param {HTMLElement} target
   * @returns {Promise<void>}
   */
  static async #onSelectPerception(
    this: DwTokenHUD,
    event: PointerEvent,
    target: HTMLElement
  ): Promise<void> {
    const senseType = (target as HTMLButtonElement).dataset.senseType;
    if (!senseType) return;

    // Roll for all selected tokens
    const controlledTokens = (canvas as any)?.tokens?.controlled || [];

    if (controlledTokens.length === 0) {
      // Fallback to the HUD's token if none are selected
      const actor = this.document?.actor as SystemActor;
      if (actor) {
        await rollPerceptionCheck(actor, senseType);
      }
    } else {
      // Roll for each selected token
      for (const token of controlledTokens) {
        const actor = token.actor as SystemActor;
        if (actor) {
          await rollPerceptionCheck(actor, senseType);
        }
      }
    }
  }
}

// ─── System Initialization ──────────────────────────────────────────────────────

// Call initHandler and register TokenHUD
if (import.meta.env.DEV) {
  initHandler();
  CONFIG.Token.hudClass = DwTokenHUD;
} else {
  Hooks.once("init", () => {
    initHandler();
    CONFIG.Token.hudClass = DwTokenHUD;
  });
}

// ─── Token HUD: Inject Perception Button ──────────────────────────────────────

Hooks.on("renderTokenHUD", (_hud: any, html: HTMLElement, data: any) => {
  const perceptionSenses = data.perceptionSenses;
  if (!perceptionSenses || Object.keys(perceptionSenses).length === 0) {
    console.warn("No perception senses, returning early");
    return;
  }

  // Add perception button to left column
  const leftCol = html.querySelector(".col.left");
  if (!leftCol) {
    console.warn("No left column found");
    return;
  }

  // Create perception palette button
  const perceptionBtn = document.createElement("button");
  perceptionBtn.type = "button";
  perceptionBtn.classList.add("control-icon");
  perceptionBtn.dataset.action = "togglePalette";
  perceptionBtn.dataset.palette = "perception";
  perceptionBtn.dataset.tooltip = "Roll Perception Check";
  perceptionBtn.innerHTML = `<i class="fas fa-eye"></i>`;
  leftCol.appendChild(perceptionBtn);

  // Create perception palette with proper structure
  const palette = document.createElement("div");
  palette.classList.add("palette", "palette-perception");
  palette.dataset.palette = "perception"; // This is what togglePalette looks for

  // Add sense options to palette
  for (const [id, sense] of Object.entries(perceptionSenses)) {
    const senseData = sense as { label: string; icon: string };
    const option = document.createElement("button");
    option.type = "button";
    option.classList.add("palette-option", "control-icon");
    option.dataset.action = "perception";
    option.dataset.senseType = id;
    option.dataset.tooltip = `Roll ${senseData.label} Perception`;
    option.innerHTML = `<i class="fas ${senseData.icon}"></i>`;
    palette.appendChild(option);
  }

  // Insert palette as a sibling to the columns (at HUD root level)
  const hudElement = html.querySelector("#token-hud-hud");
  if (hudElement) {
    hudElement.appendChild(palette);
  } else {
    html.appendChild(palette);
  }
});

// ─── Chat Message: Show Perception Overlay ──────────────────────────────────────

Hooks.on("createChatMessage", (message: any) => {
  if (!message.flags?.dimensionalwar?.perceptionCheck) return;

  const tokenId: string | undefined = message.flags?.dimensionalwar?.tokenId;
  const senseType: string | undefined =
    message.flags?.dimensionalwar?.senseType;
  if (!tokenId || !senseType) return;

  const rolls: any[] = message.rolls ?? [];
  if (!rolls.length) return;
  const total: number = rolls[0]?.total ?? 0;

  const durationMs = 8000; // 8 seconds default

  // If Dice So Nice is active it will fire diceSoNiceRollComplete after the
  // animation finishes. Register a listener so the overlay appears only after
  // the dice have settled. Fall back to immediate display if DSN is not active.
  const hasDSN = !!(game as any).dice3d;
  if (hasDSN) {
    let shown = false;

    const dsnCallback = (completedMessageId: string) => {
      if (completedMessageId !== message.id) return;
      shown = true;
      // @ts-expect-error - Dice So Nice hook not in core types
      Hooks.off("diceSoNiceRollComplete", dsnCallback);
      showPerceptionOverlay(tokenId, total, senseType, durationMs);
    };
    // @ts-expect-error - Dice So Nice hook not in core types
    Hooks.on("diceSoNiceRollComplete", dsnCallback);

    // Safety fallback: if DSN never fires, show after 4 seconds
    setTimeout(() => {
      // @ts-expect-error - Dice So Nice hook not in core types
      Hooks.off("diceSoNiceRollComplete", dsnCallback);
      if (!shown) showPerceptionOverlay(tokenId, total, senseType, durationMs);
    }, 4000);
  } else {
    showPerceptionOverlay(tokenId, total, senseType, durationMs);
  }
});

// ─── Canvas Lifecycle: Manage Overlays ──────────────────────────────────────────

// Clean up overlays when the scene changes and register hover listener
Hooks.on("canvasReady", () => {
  cleanupAllPerceptionOverlays();
  initPerceptionHoverListener();
});

// Clean up the overlay for any token that is deleted
Hooks.on("deleteToken", (_scene: any, tokenDoc: any) => {
  if (tokenDoc?.id) removePerceptionOverlay(tokenDoc.id);
});

// ─── Region Movement Cost: Cross-Country Running ─────────────────────────────

/**
 * Override CONFIG.Token.movement.TerrainData.getMovementCostFunction to ignore terrain for Cross-Country Running
 * In Foundry v13, this is the proper place to control how terrain costs are calculated
 */
Hooks.once("ready", () => {
  const TerrainData = CONFIG.Token.movement.TerrainData;
  if (!TerrainData) {
    console.warn(
      "[DW] TerrainData not found - region terrain costs cannot be modified"
    );
    return;
  }

  // @ts-expect-error - getMovementCostFunction not in type definition but exists in v13
  const originalGetMovementCostFunction = TerrainData.getMovementCostFunction;

  // @ts-expect-error - getMovementCostFunction not in type definition but exists in v13
  TerrainData.getMovementCostFunction = function (
    token: any,
    options: any = {}
  ) {
    // Check if this token has cross-country running
    const actor = token?.actor as SystemActor | undefined;
    const hasCrossCountry =
      // @ts-expect-error - movementFlags not in base type definition
      actor?.system?.movementFlags?.hasCrossCountry || false;

    if (hasCrossCountry) {
      // Return a cost function that ignores terrain.difficulty
      return (from: any, to: any, distance: number, segment: any) => {
        // Return base distance, ignoring segment.terrain?.difficulty multiplier
        return distance;
      };
    }

    // Normal flow: use original cost function (includes terrain.difficulty)
    return originalGetMovementCostFunction.call(this, token, options);
  };
});

// ─── Add CSB Import Button to Actors Directory ───────────────────────────────

Hooks.on("renderActorDirectory", (_app: any, element: HTMLElement) => {
  if (!element) return;

  const header = element.querySelector(".directory-header");
  if (!header) return;

  // Check if button already exists
  if (header.querySelector(".csb-import-btn")) return;

  // Create import button
  const importBtn = document.createElement("button");
  importBtn.className = "csb-import-btn";
  importBtn.title = "Import CSB Actors";
  importBtn.type = "button";
  importBtn.innerHTML = '<i class="fas fa-file-import"></i> Import CSB';

  importBtn.addEventListener("click", () => {
    openCSBImportDialog();
  });

  // Try multiple insertion strategies
  let inserted = false;

  // Strategy 1: After create button
  const createBtn = header.querySelector('[data-action="createDocument"]');
  if (createBtn && createBtn.parentElement) {
    createBtn.parentElement.insertBefore(importBtn, createBtn.nextSibling);
    inserted = true;
  }

  // Strategy 2: In action-buttons container
  if (!inserted) {
    const actionButtons = header.querySelector(".action-buttons");
    if (actionButtons) {
      actionButtons.appendChild(importBtn);
      inserted = true;
    }
  }

  // Strategy 3: Directly to header as fallback
  if (!inserted) {
    header.appendChild(importBtn);
  }
});
