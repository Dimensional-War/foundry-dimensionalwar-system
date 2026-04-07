// @ts-nocheck - Legacy file, pre-existing errors, not used by new sheet system
/**
 * FVTT-Genesys
 * Unofficial implementation of the Genesys RPG for Foundry
 *
 * @author Mezryss
 * @file Mixin for empowering Applications with Sheets!
 */

import { createApp, reactive, type App, type Component } from "vue";

type Constructor<T = object> = abstract new (...args: unknown[]) => T;

interface VueSheetBase {
  actor?: Actor;
  close(options?: Record<string, unknown>): Promise<void>;
  activateListeners(html: JQuery): void;
}

export default function VueSheet<TBase extends Constructor<VueSheetBase>>(
  base: TBase
) {
  abstract class VueSheetMixin extends base {
    form: HTMLFormElement | null = null;

    /** Handle for the active Vue app. */
    vueApp: App | undefined;

    /** Reactive context data that is injected into the active Vue app. */
    vueContext: Record<string, unknown> | undefined;

    /** This component must be implemented by children to define the Vue component to use for the sheet. */
    abstract get vueComponent(): Component;

    /** Similar in purpose to Application.getData, but with some potentially Vue-specific context data. */
    async getVueContext(): Promise<Record<string, unknown> | undefined> {
      return undefined;
    }

    async _renderInner(
      _data: unknown,
      options?: { classes?: string[] }
    ): Promise<JQuery> {
      const vueContext = await this.getVueContext();

      if (!this.form) {
        const form = document.createElement("form");
        const cssClass =
          (vueContext?.data as { cssClass?: string } | undefined)?.cssClass ??
          options?.classes?.join(" ") ??
          "";

        form.className = `${cssClass} vue-app`;
        form.setAttribute("autocomplete", "off");
        this.form = form;
      }

      if (!this.vueContext && vueContext) {
        this.vueContext = reactive(vueContext);
      }

      if (!this.vueApp) {
        this.vueApp = createApp(this.vueComponent);
        this.vueApp.provide("root", this.vueContext);
        this.vueApp.provide("sheet", this);
        this.vueApp.provide("actor", this.actor);
        this.vueApp.mount(this.form);
      } else if (this.vueContext && vueContext) {
        for (const key of Object.keys(vueContext)) {
          this.vueContext[key] = vueContext[key];
        }
      }

      return $(this.form);
    }

    /** Unmount and destroy the vue app for this sheet on close. */
    override async close(options: Record<string, unknown> = {}): Promise<void> {
      this.vueApp?.unmount();
      this.vueApp = undefined;
      this.vueContext = undefined;
      await super.close(options);
    }

    /** Deactivate JQuery event listeners to prevent them triggering multiple times. */
    deactivateListeners(html: JQuery): void {
      html.find("img[data-edit]").off("click");
      html.find("input,select,textarea").off("change");
      html.find("button.file-picker").off("click");
    }

    override activateListeners(html: JQuery): void {
      this.deactivateListeners(html);
      super.activateListeners(html);
    }

    _activateEditor(_: unknown): void {}

    async saveEditor(
      _name: string,
      _options: Record<string, unknown> = {}
    ): Promise<void> {}
  }

  return VueSheetMixin;
}
