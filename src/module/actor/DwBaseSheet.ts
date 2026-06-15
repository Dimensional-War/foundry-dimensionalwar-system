import { createApp, reactive, type App, type Component } from "vue";
import { watchIgnorable } from "@vueuse/core";

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
  #reactiveActor: any = null;
  #stopWatcher: (() => void) | null = null;
  #ignoreUpdates: ((cb: () => void) => void) | null = null;
  #updateActorCallback:
    | ((
        actor: Actor,
        _changed: unknown,
        _options: unknown,
        _userId: string
      ) => void)
    | null = null;

  /** Expose the reactive actor for components that need the sheet ref. */
  get reactiveActor() {
    return this.#reactiveActor;
  }

  // ─── ApplicationV2 lifecycle ──────────────────────────────────────────────

  async _renderHTML(
    _context: unknown,
    _options: unknown
  ): Promise<Record<string, HTMLElement>> {
    // Create the reactive actor clone once.
    if (!this.#reactiveActor) {
      this.#reactiveActor = reactive(this.actor.clone());
    }

    const container = document.createElement("div");
    container.className = "dw-sheet-root";

    if (!this.#vueApp) {
      const app = createApp(this.vueComponent);
      // Provide reactive actor (for modifications)
      app.provide("reactiveActor", this.#reactiveActor);
      // Also provide as "reactiveSystem" for backwards compatibility
      app.provide("reactiveSystem", this.#reactiveActor.system);
      // Provide the real actor for calling methods, accessing collections, etc.
      app.provide("actor", this.actor);
      app.provide("sheet", this);
      app.mount(container);
      this.#vueApp = app;

      // Set up watchIgnorable for automatic syncing
      // Watch the reactive actor directly with deep tracking
      const { ignoreUpdates, stop } = watchIgnorable(
        this.#reactiveActor,
        async () => {
          // Store ignoreUpdates for use in syncReactiveActor()
          if (!this.#ignoreUpdates) {
            this.#ignoreUpdates = ignoreUpdates;
          }

          // Skip updates if the sheet is not editable (e.g., from a compendium)
          if (!this.isEditable) {
            return;
          }

          // Extract reactive values directly before serialization
          const newActorData = {
            _id: this.#reactiveActor!._id,
            name: this.#reactiveActor!.name,
            type: this.#reactiveActor!.type,
            img: this.#reactiveActor!.img,
            system: { ...this.#reactiveActor!.system },
            prototypeToken: { ...this.#reactiveActor!.prototypeToken }
          };

          const oldActorPlain = JSON.parse(JSON.stringify(this.actor));
          const newActorPlain = JSON.parse(JSON.stringify(newActorData));

          const diff = foundry.utils.diffObject(oldActorPlain, newActorPlain, {
            deletionKeys: true
          }) as any;

          // Remove _id from diff (never update the ID)
          const { _id, ...cleanDiff } = diff;

          // Skip if no real changes
          if (Object.keys(cleanDiff).length === 0) {
            return;
          }

          // Update dependent token names if actor is linked and name changed
          if (this.actor.prototypeToken.actorLink && cleanDiff.name) {
            try {
              const tokens = this.actor.getDependentTokens();
              for await (const token of tokens) {
                if (!token?._id || !token.parent) continue;
                if (this.#reactiveActor!.name !== token.name) {
                  try {
                    await token.update({
                      _id: token._id,
                      name: this.#reactiveActor!.name
                    });
                  } catch (e) {
                    // Token might have been deleted, skip silently
                    continue;
                  }
                }
              }
            } catch (e) {
              // getDependentTokens might fail, not critical
            }
          }

          // Update dependent token light/sight/other prototypeToken fields for linked actors
          if (this.actor.prototypeToken.actorLink && cleanDiff.prototypeToken) {
            try {
              const tokenUpdate = foundry.utils.flattenObject(
                cleanDiff.prototypeToken
              );
              const tokens = this.actor.getDependentTokens();
              for await (const token of tokens) {
                if (!token?._id || !token.parent) continue;
                try {
                  await token.update(tokenUpdate);
                } catch (e) {
                  continue;
                }
              }
            } catch (e) {
              // getDependentTokens might fail, not critical
            }
          }

          // Flatten to dot notation for reliable nested updates
          const updateData = foundry.utils.flattenObject(cleanDiff);

          await this.actor.update(updateData);
        },
        { deep: true }
      );

      this.#stopWatcher = stop;

      // Register for external updates.
      this.#updateActorCallback = (
        actor: Actor,
        _changed: unknown,
        _options: unknown,
        _userId: string
      ) => {
        if (actor.id === this.actor.id) this.#syncReactiveActor();
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
    this.#reactiveActor = null;
    if (this.#stopWatcher) {
      this.#stopWatcher();
      this.#stopWatcher = null;
    }
    this.#ignoreUpdates = null;
    if (this.#updateActorCallback !== null) {
      Hooks.off("updateActor", this.#updateActorCallback);
      this.#updateActorCallback = null;
    }
    return super.close(options) as Promise<this>;
  }

  // ─── Helpers ──────────────────────────────────────────────────────────────

  #syncReactiveActor() {
    if (!this.#reactiveActor) return;

    const doSync = () => {
      // Update all top-level properties
      this.#reactiveActor!.name = this.actor.name;
      this.#reactiveActor!.img = this.actor.img;
      this.#reactiveActor!.type = this.actor.type;

      // Deep update system data
      const freshSystem = JSON.parse(
        JSON.stringify((this.actor as SystemActor).system)
      ) as Record<string, unknown>;
      for (const key of Object.keys(freshSystem)) {
        (this.#reactiveActor!.system as Record<string, unknown>)[key] =
          freshSystem[key];
      }

      // Update prototypeToken
      const freshToken = JSON.parse(JSON.stringify(this.actor.prototypeToken));
      for (const key of Object.keys(freshToken)) {
        (this.#reactiveActor!.prototypeToken as any)[key] = freshToken[key];
      }
    };

    if (this.#ignoreUpdates) {
      this.#ignoreUpdates(doSync);
    } else {
      doSync();
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
