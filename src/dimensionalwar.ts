import "./dimensionalwar.css";

// System entry point – Foundry loads this as the ESModule for the system.
import { SystemActor } from "./module/documents";
import { ActorType } from "./module/enums";
import { BaseData } from "./module/types/base-data";
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
  removePerceptionOverlay,
  isMessageVisibleToCurrentUser
} from "./module/utils/perception-overlay";
import { DwRoll } from "./module/rolling/DwRoll";
import { DwRollParser } from "./module/rolling/DwRollParser";
import { DwSkillDiceTerm } from "./module/rolling/DwSkillDiceTerm";
import { openCSBImportDialog } from "./module/utils/csb-import-dialog";
import { openJsonActorImportDialog } from "./module/utils/json-actor-import-dialog";
import { VueDialog } from "./module/applications/vue-dialog";
import DamageDialog from "./module/applications/dialogs/DamageDialog.vue";
import { calcActorSoak, applyDamageToActor } from "./module/utils/apply-damage";
import type {
  ApplyDamageOptions,
  ApplyDamageResult,
  DamageElement
} from "./module/utils/apply-damage";
import { showAggregateRollDialog } from "./module/utils/aggregate-rolls";
import { initializeQuickRollHUD } from "./module/utils/quick-roll-hud";

const initHandler = () => {
  CONFIG.debug.rollParsing = false; // Enable debug logging for roll parsing
  // Register the custom Actor document class
  CONFIG.Actor.documentClass = SystemActor;

  // Register data models for each actor type
  CONFIG.Actor.dataModels = {
    [ActorType.Pc]: PcDataModel,
    [ActorType.Npc]: NpcDataModel,
    [ActorType.Ally]: AllyDataModel,
    [ActorType.Enemy]: EnemyDataModel,
    [ActorType.Boss]: BossDataModel
  };

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

  // Load shared roll card template (used by kefka-sync module for dice display)
  foundry.applications.handlebars.loadTemplates(["systems/dimensionalwar/templates/roll.hbs"]);

  // Register game settings
  // @ts-expect-error - Custom system namespace
  game.settings.register("dimensionalwar", "usePhysicalDiceFormulas", {
    name: "Use Physical Dice Formulas",
    hint: "Roll skill dice using physical dice combinations (e.g., 1d6+1d10 for d60) that animate with Dice So Nice. When disabled, uses simple virtual dice (e.g., 1d60).",
    scope: "world",
    config: true,
    type: Boolean,
    default: false
  });

  // @ts-expect-error - Custom system namespace
  game.settings.register("dimensionalwar", "perceptionHoverDuration", {
    name: "Perception Hover Overlay Duration",
    hint: "How long (in seconds) the perception overlay lingers after mousing over a token. Set to 0 to disable hover overlays entirely.",
    scope: "world",
    config: true,
    type: Number,
    default: 15,
    range: { min: 0, max: 60, step: 1 }
  });
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
        perception: DwTokenHUD.#onSelectPerception,
        quickRolls: DwTokenHUD.#onQuickRolls
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

    // Add quick rolls button info
    const actor = this.document?.actor as SystemActor;
    const rolls = (actor?.system as unknown as BaseData.DwSystem)?.rolls ?? [];
    const hasQuickRolls = rolls.length > 0;

    return foundry.utils.mergeObject(context, {
      perceptionSenses,
      quickRolls: {
        enabled: hasQuickRolls,
        icon: "fa-dice-d20",
        label: "Quick Rolls",
        cssClass: "quick-rolls"
      }
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
        await rollPerceptionCheck(
          actor,
          senseType.toLowerCase() as
            | "sight"
            | "hearing"
            | "smell"
            | "taste"
            | "touch"
        );
      }
    } else {
      // Roll for each selected token
      for (const token of controlledTokens) {
        const actor = token.actor as SystemActor;
        if (actor) {
          await rollPerceptionCheck(
            actor,
            senseType.toLowerCase() as
              | "sight"
              | "hearing"
              | "smell"
              | "taste"
              | "touch"
          );
        }
      }
    }
  }

  /**
   * Handle quick rolls button click
   * @param {PointerEvent} event
   * @param {HTMLElement} target
   * @returns {Promise<void>}
   */
  static async #onQuickRolls(
    this: DwTokenHUD,
    event: PointerEvent,
    target: HTMLElement
  ): Promise<void> {
    const actor = this.document?.actor as SystemActor;
    if (!actor) return;

    const rolls = (actor.system as unknown as BaseData.DwSystem)?.rolls ?? [];
    if (rolls.length === 0) {
      ui.notifications?.warn("This token has no configured rolls");
      return;
    }

    // Import the showQuickRollMenu function
    const { showQuickRollMenu } = await import("./module/utils/quick-roll-hud");
    await showQuickRollMenu(this.object as any, actor, rolls);
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

// Between "init" and document initialization, Foundry rebuilds CONFIG.Dice.termTypes
// from CONFIG.Dice.terms keyed by each class's static `name`. Since DwSkillDiceTerm's
// name is forced to "Die" (required so it properly extends Die), that rebuild clobbers
// both the "Die" -> core Die mapping and drops the "DwSkillDiceTerm" key entirely,
// breaking Roll.fromData for any stored roll (e.g. old chat messages) that references
// class "DwSkillDiceTerm". Re-assert both mappings once more, right before documents
// (including ChatMessages) are initialized.
Hooks.once("setup", () => {
  CONFIG.Dice.termTypes.Die = foundry.dice.terms.Die;
  // @ts-expect-error - Custom DiceTerm type registration
  CONFIG.Dice.termTypes.DwSkillDiceTerm = DwSkillDiceTerm;
});

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

  // Add quick rolls button if actor has rolls configured
  const quickRolls = data.quickRolls;
  if (quickRolls?.enabled) {
    const quickRollsBtn = document.createElement("button");
    quickRollsBtn.type = "button";
    quickRollsBtn.classList.add("control-icon", quickRolls.cssClass);
    quickRollsBtn.dataset.action = "quickRolls";
    quickRollsBtn.dataset.tooltip = quickRolls.label;
    quickRollsBtn.innerHTML = `<i class="fas ${quickRolls.icon}"></i>`;
    leftCol.appendChild(quickRollsBtn);
  }

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

// ─── Chat Message: Display Physical Dice Formula & Result Labels ────────────────
Hooks.on("renderChatMessageHTML", (_message: any, html: HTMLElement) => {
  const messageRolls = _message.rolls || [];
  if (!messageRolls.length) return;

  const roll = messageRolls[0];
  if (!roll?.terms) return;

  // Find DwSkillDiceTerm instances
  const skillTerms = roll.terms.filter(
    (term: any) =>
      term.constructor?.baseClassName === "DwSkillDiceTerm" ||
      term.constructor?.name === "DwSkillDiceTerm"
  );

  if (skillTerms.length === 0) return;

  const skillTerm = skillTerms[0];

  // Add physical formula display (if physical dice formulas are enabled)
  const usePhysicalFormulas =
    // @ts-expect-error - Custom system namespace
    game.settings.get("dimensionalwar", "usePhysicalDiceFormulas");
  if (usePhysicalFormulas) {
    const rollFormula = html.querySelectorAll(".dice-formula");
    if (rollFormula.length) {
      const physicalFormula = skillTerm.physicalFormula;
      if (physicalFormula) {
        rollFormula.forEach(element => {
          element.insertAdjacentHTML(
            "beforeend",
            `<div class="physical-formula" style="font-size: 0.85em; opacity: 0.8; margin-top: 2px;">[${physicalFormula}]</div>`
          );
        });
      }
    }
  }

  // Add result category colors to individual die results
  const diceRolls = html.querySelectorAll(".dice-rolls .roll");
  if (diceRolls.length && skillTerm.results) {
    diceRolls.forEach((element, index) => {
      const result = skillTerm.results[index];
      if (!result) return;

      const category = skillTerm.getResultCategory(result.result);
      if (category) {
        const categoryClass = category.toLowerCase().replace(/\s+/g, "-");
        element.classList.add(`result-${categoryClass}`);
      }
    });
  }
});

// ─── Chat Message: Show Perception Overlay ──────────────────────────────────────

Hooks.on("createChatMessage", (message: any) => {
  if (!message.flags?.dimensionalwar?.perceptionCheck) return;

  // ── Visibility gate ───────────────────────────────────────────────────────
  // Respect roll mode: blind rolls show only to GM, whisper rolls only to
  // recipients, public rolls to everyone.
  if (!isMessageVisibleToCurrentUser(message)) return;
  // ─────────────────────────────────────────────────────────────────────────

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

// Make sure PC tokens always have friendly disposition and hover name/bars

Hooks.on(
  "preCreateToken",
  (
    tokenDoc: TokenDocument,
    _data: object,
    _options: object,
    _userId: string
  ) => {
    if (tokenDoc.actor?.type !== ActorType.Pc) return;

    tokenDoc.updateSource({
      disposition: CONST.TOKEN_DISPOSITIONS.FRIENDLY,
      displayName: CONST.TOKEN_DISPLAY_MODES.HOVER,
      displayBars: CONST.TOKEN_DISPLAY_MODES.HOVER
    });
  }
);

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

// ─── Add Import Buttons to Actors Directory ─────────────────────────────────

function resolveHTMLElement(input: any): HTMLElement | null {
  if (input instanceof HTMLElement) return input;
  if (input?.[0] instanceof HTMLElement) return input[0];
  if (input?.element?.[0] instanceof HTMLElement) return input.element[0];
  if (input?.element instanceof HTMLElement) return input.element;
  return null;
}

function injectActorImportButtons(rootLike: any): void {
  const resolvedRoot = resolveHTMLElement(rootLike);
  const actorsRoot = resolvedRoot?.matches?.("#actors")
    ? resolvedRoot
    : resolvedRoot?.querySelector?.("#actors") ||
      document.querySelector("#actors");
  if (!(actorsRoot instanceof HTMLElement)) return;

  const header =
    actorsRoot.querySelector("header.directory-header") ||
    actorsRoot.querySelector(".directory-header") ||
    actorsRoot;

  const hasCsbButton = !!actorsRoot.querySelector(".csb-import-btn");
  const hasJsonButton = !!actorsRoot.querySelector(".json-import-btn");
  if (hasCsbButton && hasJsonButton) return;

  let importBtn: HTMLButtonElement | null = null;
  let jsonImportBtn: HTMLButtonElement | null = null;

  if (!hasCsbButton) {
    importBtn = document.createElement("button");
    importBtn.className = "csb-import-btn";
    importBtn.title = "Import CSB Actors";
    importBtn.type = "button";
    importBtn.innerHTML =
      '<i class="fas fa-file-import"></i><span>Import CSB</span>';
    importBtn.addEventListener("click", () => {
      openCSBImportDialog();
    });
  }

  if (!hasJsonButton) {
    jsonImportBtn = document.createElement("button");
    jsonImportBtn.className = "json-import-btn";
    jsonImportBtn.title = "Import JSON NPCs / Monsters";
    jsonImportBtn.type = "button";
    jsonImportBtn.innerHTML =
      '<i class="fas fa-file-code"></i><span>Import JSON</span>';
    jsonImportBtn.addEventListener("click", () => {
      openJsonActorImportDialog();
    });
  }

  const createBtn = actorsRoot.querySelector(
    '[data-action="createEntry"], [data-action="createDocument"]'
  );
  if (createBtn && createBtn.parentElement) {
    if (importBtn) createBtn.parentElement.appendChild(importBtn);
    if (jsonImportBtn) createBtn.parentElement.appendChild(jsonImportBtn);
    return;
  }

  const headerActions =
    actorsRoot.querySelector(".header-actions.action-buttons") ||
    actorsRoot.querySelector(".action-buttons");
  if (headerActions) {
    if (importBtn) headerActions.appendChild(importBtn);
    if (jsonImportBtn) headerActions.appendChild(jsonImportBtn);
    return;
  }

  const footerActions = actorsRoot.querySelector("footer.action-buttons");
  if (footerActions) {
    if (importBtn) footerActions.appendChild(importBtn);
    if (jsonImportBtn) footerActions.appendChild(jsonImportBtn);
    return;
  }

  if (importBtn) header.appendChild(importBtn);
  if (jsonImportBtn) header.appendChild(jsonImportBtn);
}

function injectActorImportFooterButtons(rootLike: any): void {
  const resolvedRoot = resolveHTMLElement(rootLike);
  const actorsRoot = resolvedRoot?.matches?.("#actors")
    ? resolvedRoot
    : resolvedRoot?.querySelector?.("#actors") ||
      document.querySelector("#actors");
  if (!(actorsRoot instanceof HTMLElement)) return;

  const footer = actorsRoot.querySelector(".directory-footer");
  if (!(footer instanceof HTMLElement)) return;

  if (!footer.querySelector(".csb-import-btn")) {
    const csbBtn = document.createElement("button");
    csbBtn.className = "csb-import-btn";
    csbBtn.type = "button";
    csbBtn.title = "Import CSB Actors";
    csbBtn.innerHTML =
      '<i class="fas fa-file-import"></i><span>Import CSB</span>';
    csbBtn.addEventListener("click", () => openCSBImportDialog());
    footer.appendChild(csbBtn);
  }

  if (!footer.querySelector(".json-import-btn")) {
    const jsonBtn = document.createElement("button");
    jsonBtn.className = "json-import-btn";
    jsonBtn.type = "button";
    jsonBtn.title = "Import JSON NPCs / Monsters";
    jsonBtn.innerHTML =
      '<i class="fas fa-file-code"></i><span>Import JSON</span>';
    jsonBtn.addEventListener("click", () => openJsonActorImportDialog());
    footer.appendChild(jsonBtn);
  }
}

function injectActorImportButtonsFromUiSidebar(): void {
  const actorTabElement =
    (ui as any)?.actors?.element?.[0] ||
    (ui as any)?.sidebar?.tabs?.actors?.element?.[0] ||
    document.querySelector("#actors");

  if (!(actorTabElement instanceof HTMLElement)) return;
  injectActorImportButtons(actorTabElement);
}

let actorDirectoryButtonObserver: MutationObserver | null = null;

function startActorDirectoryButtonObserver(): void {
  if (actorDirectoryButtonObserver) return;

  const sidebar =
    document.querySelector("#sidebar") || document.querySelector("body");
  if (!(sidebar instanceof HTMLElement)) return;

  actorDirectoryButtonObserver = new MutationObserver(() => {
    injectActorImportButtonsFromUiSidebar();
    injectActorImportButtons(sidebar);
    injectActorImportFooterButtons(sidebar);
  });

  actorDirectoryButtonObserver.observe(sidebar, {
    childList: true,
    subtree: true
  });

  // Immediate pass after observer starts.
  injectActorImportButtonsFromUiSidebar();
  injectActorImportButtons(sidebar);
  injectActorImportFooterButtons(sidebar);
}

Hooks.on("renderActorDirectory", (_app: any, element: HTMLElement | any) => {
  injectActorImportButtons(element);
  injectActorImportFooterButtons(element);
});

Hooks.on("ready", () => {
  const sidebar = document.querySelector("#sidebar");
  injectActorImportButtonsFromUiSidebar();
  injectActorImportButtons(sidebar);
  injectActorImportFooterButtons(sidebar);
  startActorDirectoryButtonObserver();

  // Extra delayed pass for late-rendered sidebars in some clients.
  setTimeout(() => {
    injectActorImportButtonsFromUiSidebar();
    injectActorImportButtons(document.querySelector("#sidebar"));
    injectActorImportFooterButtons(document.querySelector("#sidebar"));
  }, 500);
});

Hooks.on("changeSidebarTab", (_tab: any) => {
  injectActorImportButtonsFromUiSidebar();
  injectActorImportFooterButtons(document.querySelector("#sidebar"));
});

// ─── game.dimensionalwar: Public API for macros ──────────────────────────────

/** socketlib socket instance, set once socketlib signals ready. */
let dwSocket: any = null;

/**
 * Socket handler — always runs on the active GM client.
 * Resolves the actor from scene+token (unlinked) or actorId (linked),
 * then applies damage so permission checks are always satisfied.
 */
async function socketApplyDamage(data: {
  sceneId: string | null;
  tokenId: string | null;
  actorId: string | null;
  rawDamage: number;
  type: "physical" | "magical" | "unsoakable";
  piercing: number;
  hits: number;
  elements: DamageElement[];
}): Promise<ApplyDamageResult> {
  let actor: SystemActor | undefined;
  if (data.tokenId && data.sceneId) {
    const scene = (game.scenes as any)?.get(data.sceneId);
    const tokenDoc = scene?.tokens?.get(data.tokenId);
    actor = tokenDoc?.actor as SystemActor | undefined;
  } else if (data.actorId) {
    actor = (game.actors as any)?.get(data.actorId) as SystemActor | undefined;
  }
  if (!actor) throw new Error(`[DW] socketApplyDamage: actor not found`);
  return applyDamageToActor({
    actor,
    rawDamage: data.rawDamage,
    type: data.type,
    piercing: data.piercing,
    hits: data.hits,
    elements: data.elements
  });
}

// Register with socketlib once it's ready (fires on every client).
// @ts-expect-error - socketlib.ready is not in the Foundry hook type definitions
Hooks.once("socketlib.ready", () => {
  dwSocket = (globalThis as any).socketlib.registerSystem("dimensionalwar");
  dwSocket.register("applyDamage", socketApplyDamage);
});

interface DamageDialogInput {
  rawDamage: number;
  damageType: "physical" | "magical" | "unsoakable";
  piercing: number;
  hits: number;
  elements: DamageElement[];
  applyToCurrentTargets?: boolean;
}

function getDamageTypeLabel(type: DamageDialogInput["damageType"]): string {
  return type === "physical"
    ? "Physical"
    : type === "magical"
      ? "Magical"
      : "Unsoakable";
}

function getAttackerName(): string {
  const controlledToken = (canvas as any)?.tokens?.controlled?.[0];
  return (
    controlledToken?.name ??
    (game as any).user?.character?.name ??
    (game as any).user?.name ??
    "Unknown"
  );
}

async function promptDamageDialog(
  targetLabel: string,
  targetCount = 1,
  options: {
    showApplyToTargetsOption?: boolean;
    applyToTargetsLabel?: string;
  } = {}
): Promise<DamageDialogInput | null> {
  const title =
    targetCount > 1
      ? `Apply Damage: ${targetCount} Targets`
      : `Apply Damage: ${targetLabel}`;

  return (await VueDialog.show(
    DamageDialog,
    {
      targetName: targetLabel,
      showApplyToTargetsOption: !!options.showApplyToTargetsOption,
      applyToTargetsLabel: options.applyToTargetsLabel
    },
    {
      window: { title },
      position: { width: 420 }
    }
  )) as DamageDialogInput | null;
}

async function applyDamageToSingleTarget(
  actor: SystemActor,
  input: DamageDialogInput
): Promise<ApplyDamageResult> {
  const { rawDamage, damageType, piercing, hits, elements } = input;
  const tokenDoc: any = (actor as any).token ?? null;

  if (!actor.isOwner && dwSocket) {
    return (await dwSocket.executeAsGM("applyDamage", {
      sceneId: tokenDoc?.parent?.id ?? null,
      tokenId: tokenDoc?.id ?? null,
      actorId: tokenDoc ? null : (actor.id ?? null),
      rawDamage,
      type: damageType,
      piercing,
      hits,
      elements
    })) as ApplyDamageResult;
  }

  return applyDamageToActor({
    actor,
    rawDamage,
    type: damageType,
    piercing,
    hits,
    elements
  } as ApplyDamageOptions);
}

async function postDamageChatCard(
  targets: SystemActor[],
  input: DamageDialogInput
): Promise<void> {
  if (!targets.length) return;

  const { rawDamage, damageType, piercing, hits, elements } = input;
  const typeLabel = getDamageTypeLabel(damageType);
  const hitsNote = hits > 1 ? ` ×${hits} hits` : "";
  const piercingNote =
    piercing > 0 && damageType !== "unsoakable" ? `, ${piercing} piercing` : "";
  const elementNote =
    elements.length > 0
      ? ` [${elements.map(e => `${e.name.charAt(0).toUpperCase()}${e.name.slice(1)} Lv.${e.level}`).join(", ")}]`
      : "";

  const attackerName = getAttackerName();
  const targetNames = targets.map(t => t.name ?? "Unknown");
  const targetSummary =
    targetNames.length === 1
      ? `<strong>${targetNames[0]}</strong>`
      : `<strong>${targetNames.length} targets</strong>: ${targetNames.join(", ")}`;

  await ChatMessage.create({
    speaker: ChatMessage.getSpeaker({ actor: targets[0] as any }),
    content: `<div style="border-left:3px solid #c00;padding:4px 8px;font-size:13px">
      <strong>${attackerName}</strong> → ${targetSummary}<br>
      <strong>${rawDamage}</strong> <strong>${typeLabel}</strong> damage${piercingNote}${hitsNote}${elementNote}
    </div>`
  });
}

async function applyDialogDamageToTargets(
  actors: SystemActor[],
  input: DamageDialogInput
): Promise<void> {
  const appliedActors: SystemActor[] = [];
  const failedActors: string[] = [];

  for (const actor of actors) {
    try {
      await applyDamageToSingleTarget(actor, input);
      appliedActors.push(actor);
    } catch (error) {
      console.error("[DW] Failed to apply damage", actor, error);
      failedActors.push(actor.name ?? "Unknown");
    }
  }

  if (appliedActors.length > 0) {
    await postDamageChatCard(appliedActors, input);
  }

  if (failedActors.length > 0) {
    ui.notifications.warn(
      `Damage was not applied to: ${failedActors.join(", ")}`
    );
  }
}

/**
 * Show one damage dialog and apply that result to every actor provided.
 */
async function showDamageDialogForActors(actors: SystemActor[]): Promise<void> {
  const validActors = actors.filter(Boolean);
  if (!validActors.length) return;

  const targetLabel =
    validActors.length === 1
      ? validActors[0].name
      : `${validActors.length} targets`;

  const input = await promptDamageDialog(targetLabel, validActors.length);
  if (!input) return;

  await applyDialogDamageToTargets(validActors, input);
}

function getCurrentTargetActors(): SystemActor[] {
  const targets = [...((game as any).user?.targets ?? [])];
  return targets
    .map(target => target?.actor as SystemActor | null | undefined)
    .filter((actor): actor is SystemActor => !!actor);
}

function uniqueActorsByUuid(actors: SystemActor[]): SystemActor[] {
  const seen = new Set<string>();
  const unique: SystemActor[] = [];
  for (const actor of actors) {
    const key = actor.uuid ?? actor.id ?? actor.name;
    if (!key || seen.has(key)) continue;
    seen.add(key);
    unique.push(actor);
  }
  return unique;
}

/**
 * Show the damage dialog for a given actor (targeted from the canvas).
 * Calculates soak, applies final damage, and posts a chat card.
 */
async function showDamageDialog(actor: SystemActor): Promise<void> {
  const targetActors = uniqueActorsByUuid(getCurrentTargetActors());
  const hasTargets = targetActors.length > 0;
  const applyToTargetsLabel = hasTargets
    ? `Apply to all currently targeted tokens (${targetActors.length})`
    : "Apply to all currently targeted tokens";

  const input = await promptDamageDialog(actor.name, 1, {
    showApplyToTargetsOption: hasTargets,
    applyToTargetsLabel
  });
  if (!input) return;

  const actorsToApply =
    input.applyToCurrentTargets && hasTargets ? targetActors : [actor];
  await applyDialogDamageToTargets(uniqueActorsByUuid(actorsToApply), input);
}

Hooks.once("ready", () => {
  // Initialize quick roll HUD extension
  initializeQuickRollHUD();

  // Expose utility functions to game global
  (game as any).dimensionalwar = {
    /** Open the damage dialog for a given actor, then apply the result. */
    showDamageDialog,
    /** Open one damage dialog and apply the result to all provided actors. */
    showDamageDialogForActors,
    /** Calculate total effective soak for an actor system snapshot. */
    calcActorSoak,
    /** Directly apply damage to an actor without a dialog. */
    applyDamageToActor,
    /** Show aggregate roll dialog for all selected tokens. */
    showAggregateRolls: showAggregateRollDialog
  };
});
