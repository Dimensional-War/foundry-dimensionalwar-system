import { createApp, reactive, type App, type Component } from "vue";

const ActorSheetV2 = foundry.applications.sheets.ActorSheetV2;

type SystemActor = Actor & { system: Record<string, unknown> };

/**
 * Base sheet class for the Dimensional War system.
 * Mounts a single Vue application into the sheet body and keeps a reactive
 * clone of actor.system in sync with Foundry's document model.
 */
export abstract class DwBaseSheet extends ActorSheetV2 {
  static SHADOWROOT = false;

  /** The Vue component rendered by this sheet. Override in subclasses. */
  abstract get vueComponent(): Component;

  #vueApp: App | null = null;
  #reactiveSystem: Record<string, unknown> | null = null;
  #updateActorCallback:
    | ((
        actor: Actor,
        _changed: unknown,
        _options: unknown,
        _userId: string
      ) => void)
    | null = null;

  /** Expose the reactive system snapshot for components that need the sheet ref. */
  get reactiveSystem() {
    return this.#reactiveSystem;
  }

  // ─── ApplicationV2 lifecycle ──────────────────────────────────────────────

  async _renderHTML(
    _context: unknown,
    _options: unknown
  ): Promise<Record<string, HTMLElement>> {
    // Create the reactive system snapshot once.
    if (!this.#reactiveSystem) {
      this.#reactiveSystem = reactive(
        JSON.parse(JSON.stringify((this.actor as SystemActor).system))
      );
    }

    const container = document.createElement("div");
    container.className = "dw-sheet-root";

    if (!this.#vueApp) {
      const app = createApp(this.vueComponent);
      app.provide("reactiveSystem", this.#reactiveSystem);
      // Provide the real actor for calling .update() etc.
      app.provide("actor", this.actor);
      app.provide("sheet", this);
      app.mount(container);
      this.#vueApp = app;

      // Register for external updates.
      this.#updateActorCallback = (
        actor: Actor,
        _changed: unknown,
        _options: unknown,
        _userId: string
      ) => {
        if (actor.id === this.actor.id) this.#syncReactiveSystem();
      };
      Hooks.on("updateActor", this.#updateActorCallback);
    }

    return { main: container };
  }

  _replaceHTML(
    result: Record<string, HTMLElement>,
    content: HTMLElement,
    _options: unknown
  ): void {
    // On first render, append the container.  On subsequent re-renders, Vue
    // keeps the DOM up-to-date so we only append when the container is absent.
    if (!content.querySelector(".dw-sheet-root")) {
      content.innerHTML = "";
      content.append(result.main);
    }
  }

  override async close(options?: Record<string, unknown>): Promise<this> {
    this.#vueApp?.unmount();
    this.#vueApp = null;
    this.#reactiveSystem = null;
    if (this.#updateActorCallback !== null) {
      Hooks.off("updateActor", this.#updateActorCallback);
      this.#updateActorCallback = null;
    }
    return super.close(options) as Promise<this>;
  }

  // ─── Helpers ──────────────────────────────────────────────────────────────

  #syncReactiveSystem() {
    if (!this.#reactiveSystem) return;
    const fresh = JSON.parse(
      JSON.stringify((this.actor as SystemActor).system)
    ) as Record<string, unknown>;
    for (const key of Object.keys(fresh)) {
      (this.#reactiveSystem as Record<string, unknown>)[key] = fresh[key];
    }
  }

  /**
   * Persist updates for a path under `system`. Vue components should call
   * this after modifying `reactiveSystem` so Foundry is kept in sync.
   *
   * @example sheet.saveSystem({ "resources.hp.value": 5000 });
   */
  async saveSystem(data: Record<string, unknown>): Promise<void> {
    const prefixed: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(data)) {
      prefixed[`system.${key}`] = val;
    }
    await this.actor.update(prefixed);
  }
}
