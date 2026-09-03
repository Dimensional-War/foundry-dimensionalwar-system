import type { SystemActor } from "../documents";

/** Fields captured/restored when a transformation or alternate form toggles. */
const STAT_PATHS = [
  "statistics.health.value",
  "statistics.awareness.value",
  "statistics.dexterity.value",
  "statistics.strength.value",
  "statistics.spirit.value",
  "statistics.luck.value",
  "resources.hp.max",
  "resources.mp.max",
  "soak.physicalBase",
  "soak.magicalBase",
  "elements.element1Name",
  "elements.element1Level",
  "elements.element2Name",
  "elements.element2Level",
  "gauges.hasTrance",
  "gauges.hasLimitBreak"
] as const;

interface FormEntry {
  id: string;
  name: string;
  img?: string;
  tokenWidth?: number;
  tokenHeight?: number;
  statistics?: any;
  resources?: {
    hp?: { max?: number; current?: number | null };
    mp?: { max?: number; current?: number | null };
  };
  gauges?: {
    hasTrance?: boolean;
    hasLimitBreak?: boolean;
    trance?: number | null;
    limitBreak?: number | null;
  };
  soak?: any;
  elements?: any;
}

/** Explicit current-value overrides for a form; null/absent = auto-scale by percentage. */
interface FormOverrides {
  hpCurrent?: number | null;
  mpCurrent?: number | null;
  trance?: number | null;
  limitBreak?: number | null;
}

function overridesFromForm(form: FormEntry): FormOverrides {
  return {
    hpCurrent: form.resources?.hp?.current ?? null,
    mpCurrent: form.resources?.mp?.current ?? null,
    trance: form.gauges?.trance ?? null,
    limitBreak: form.gauges?.limitBreak ?? null
  };
}

function getByPath(obj: any, path: string): unknown {
  return path.split(".").reduce((o, k) => o?.[k], obj);
}

/**
 * Snapshot the current live values at STAT_PATHS as a genuinely nested object
 * (not one whose own keys are dot-path strings). Foundry's update pipeline
 * runs `mergeObject`/`expandObject` on stored values too, so a flat object
 * like `{"resources.hp.max": 500}` gets silently re-expanded into
 * `{resources: {hp: {max: 500}}}` the moment it's saved via an ObjectField -
 * storing it already-nested avoids that corruption. Use `flattenObject` on
 * the result when dot-path lookups are needed again.
 */
function snapshotStats(system: any): Record<string, unknown> {
  const flat: Record<string, unknown> = {};
  for (const path of STAT_PATHS) {
    flat[path] = getByPath(system, path);
  }
  return foundry.utils.expandObject(flat);
}

/** Flatten a form entry's stat block down to STAT_PATHS-relative dot paths (no `system.` prefix). */
function flattenFormStats(form: FormEntry): Record<string, unknown> {
  const flatForm = foundry.utils.flattenObject({
    statistics: form.statistics,
    resources: form.resources,
    gauges: form.gauges,
    soak: form.soak,
    elements: form.elements
  });
  const flat: Record<string, unknown> = {};
  for (const path of STAT_PATHS) {
    if (path in flatForm) flat[path] = flatForm[path];
  }
  return flat;
}

/** Preserve HP/MP percentage when max changes: same fraction remaining under the new max. */
function scaleResourceValue(value: number, fromMax: number, toMax: number): number {
  if (!fromMax) return value;
  const ratio = value / fromMax;
  return Math.max(0, Math.round(ratio * toMax));
}

/**
 * Return a shallow copy of `system` with its MP value reduced by `cost` -
 * used so the MP cost of transforming is deducted from the *current* form's
 * MP before percentage scaling into the new form's max, rather than after.
 */
function withMpDeducted(system: any, cost: number): any {
  if (!cost) return system;
  const currentMp = Number(system.resources?.mp?.value) || 0;
  return {
    ...system,
    resources: {
      ...system.resources,
      mp: { ...system.resources?.mp, value: Math.max(0, currentMp - cost) }
    }
  };
}

/** Clamp a resolved current value into [0, max]. */
function clampToMax(value: number, max: number): number {
  return Math.max(0, Math.min(max, value));
}

/**
 * Build a fully `system.`-prefixed actor update from a target stat block
 * (either a form's stats, replacing current values, or a restore snapshot).
 * HP/MP and, where enabled, Trance/Limit Break are resolved either from an
 * explicit override (if given) or by rescaling so the percentage of the
 * relevant max is preserved across the max change - Trance/Limit Break maxes
 * scale with HP max the same way StatusTab.vue derives them (×2 and ×4).
 */
function buildStatUpdate(
  system: any,
  targetFlat: Record<string, unknown>,
  overrides?: FormOverrides
): Record<string, unknown> {
  const update: Record<string, unknown> = {};
  for (const path of STAT_PATHS) {
    if (path in targetFlat) update[`system.${path}`] = targetFlat[path];
  }

  const oldHpMax = Number(system.resources?.hp?.max) || 0;
  const oldHpValue = Number(system.resources?.hp?.value) || 0;
  const newHpMax = Number(targetFlat["resources.hp.max"] ?? oldHpMax) || 0;
  const newHpValue =
    overrides?.hpCurrent != null
      ? clampToMax(Number(overrides.hpCurrent), newHpMax)
      : scaleResourceValue(oldHpValue, oldHpMax, newHpMax);
  update["system.resources.hp.value"] = newHpValue;

  const oldMpMax = Number(system.resources?.mp?.max) || 0;
  const oldMpValue = Number(system.resources?.mp?.value) || 0;
  const newMpMax = Number(targetFlat["resources.mp.max"] ?? oldMpMax) || 0;
  const newMpValue =
    overrides?.mpCurrent != null
      ? clampToMax(Number(overrides.mpCurrent), newMpMax)
      : scaleResourceValue(oldMpValue, oldMpMax, newMpMax);
  update["system.resources.mp.value"] = newMpValue;

  // Trance/Limit Break: mirrors StatusTab.vue (tranceMax = hp.max*2, limitBreakMax = hp.max*4).
  // The target's own hasTrance/hasLimitBreak (if specified) decides whether the
  // form has access to the gauge at all, overriding the base actor's flag while active.
  const hadTrance = Boolean(system.gauges?.hasTrance);
  const hasTrance = Boolean(
    "gauges.hasTrance" in targetFlat ? targetFlat["gauges.hasTrance"] : hadTrance
  );
  if (hasTrance) {
    const oldTranceMax = oldHpMax * 2;
    const newTranceMax = newHpMax * 2;
    const oldTrance = hadTrance ? Number(system.gauges?.trance) || 0 : 0;
    update["system.gauges.trance"] =
      overrides?.trance != null
        ? clampToMax(Number(overrides.trance), newTranceMax)
        : scaleResourceValue(oldTrance, oldTranceMax, newTranceMax);
  }

  const hadLimitBreak = Boolean(system.gauges?.hasLimitBreak);
  const hasLimitBreak = Boolean(
    "gauges.hasLimitBreak" in targetFlat
      ? targetFlat["gauges.hasLimitBreak"]
      : hadLimitBreak
  );
  if (hasLimitBreak) {
    const oldLimitBreakMax = oldHpMax * 4;
    const newLimitBreakMax = newHpMax * 4;
    const oldLimitBreak = hadLimitBreak ? Number(system.gauges?.limitBreak) || 0 : 0;
    update["system.gauges.limitBreak"] =
      overrides?.limitBreak != null
        ? clampToMax(Number(overrides.limitBreak), newLimitBreakMax)
        : scaleResourceValue(oldLimitBreak, oldLimitBreakMax, newLimitBreakMax);
  }

  return update;
}

/** Build a `system.`-prefixed update adding a form entry's block on top of current live values. */
function addUpdateFromForm(system: any, form: FormEntry): Record<string, unknown> {
  const flatForm = flattenFormStats(form);
  const update: Record<string, unknown> = {};
  for (const [path, bonus] of Object.entries(flatForm)) {
    const base = Number(getByPath(system, path)) || 0;
    update[`system.${path}`] = base + (Number(bonus) || 0);
  }
  return update;
}

function tokenUpdateFromForm(form: FormEntry): Record<string, unknown> {
  const update: Record<string, unknown> = {};
  if (form.img) update["prototypeToken.texture.src"] = form.img;
  if (form.tokenWidth) update["prototypeToken.width"] = form.tokenWidth;
  if (form.tokenHeight) update["prototypeToken.height"] = form.tokenHeight;
  return update;
}

async function applyTokenUpdate(
  actor: SystemActor,
  update: Record<string, unknown>
): Promise<void> {
  if (Object.keys(update).length === 0) return;

  const tokenFlat = foundry.utils.flattenObject({
    texture: (update["prototypeToken.texture.src"] as string | undefined)
      ? { src: update["prototypeToken.texture.src"] }
      : undefined,
    width: update["prototypeToken.width"],
    height: update["prototypeToken.height"]
  });
  if (Object.keys(tokenFlat).length === 0) return;

  // Actor opened from a specific unlinked token: the sheet's actor is that
  // token's synthetic actor. Synthetic actors don't have a real
  // prototypeToken to update, so update the token instance directly.
  if ((actor as any).isToken && (actor as any).token) {
    await (actor as any).token.update(tokenFlat).catch(() => {});
    return;
  }

  // Base actor: update the prototype (affects future-placed tokens).
  await actor.update(update).catch(() => {});

  // Linked actor: propagate to every already-placed token, since changing
  // the prototype doesn't retroactively update tokens already on a scene.
  // getDependentTokens() alone can miss tokens on scenes that haven't
  // registered as dependents, so also sweep every scene directly.
  if (actor.prototypeToken.actorLink) {
    const updated = new Set<string>();
    for (const token of actor.getDependentTokens()) {
      if (!token?.id || updated.has(token.id)) continue;
      updated.add(token.id);
      await token.update(tokenFlat).catch(() => {});
    }
    for (const scene of game.scenes?.contents ?? []) {
      for (const token of scene.tokens) {
        if (token.actorId !== actor.id || !token.actorLink) continue;
        if (updated.has(token.id)) continue;
        updated.add(token.id);
        await token.update(tokenFlat).catch(() => {});
      }
    }
  }
}

/** Activate a transformation form, snapshotting current stats for later restoration. */
export async function activateTransformation(
  actor: SystemActor,
  formId: string
): Promise<void> {
  const system = actor.system as any;
  const form = (system.transformations ?? []).find(
    (f: FormEntry) => f.id === formId
  );
  if (!form) return;

  if (system.formState?.activeTransformationId) {
    await deactivateTransformation(actor);
  }

  const mpCost = Math.ceil((Number(system.resources?.mp?.max) || 0) * 0.05);
  if (mpCost > 0 && (Number(system.resources?.mp?.value) || 0) < mpCost) {
    ui.notifications?.warn(`Not enough MP to transform (requires ${mpCost}).`);
    return;
  }

  const baseSnapshot = snapshotStats(system);
  const baseToken = {
    src: actor.prototypeToken.texture.src,
    width: actor.prototypeToken.width,
    height: actor.prototypeToken.height
  };

  const statUpdate = buildStatUpdate(
    withMpDeducted(system, mpCost),
    flattenFormStats(form),
    overridesFromForm(form)
  );

  await actor.update({
    ...statUpdate,
    "system.formState.activeTransformationId": formId,
    "system.formState.baseSnapshot": baseSnapshot,
    "system.formState.baseToken": baseToken
  });

  await applyTokenUpdate(actor, tokenUpdateFromForm(form));
}

/** Revert an active transformation, restoring the stats/token captured before it activated. */
export async function deactivateTransformation(actor: SystemActor): Promise<void> {
  const system = actor.system as any;
  if (!system.formState?.activeTransformationId) return;

  if (system.formState?.activeAlternateFormId) {
    await deactivateAlternateForm(actor);
  }

  const mpCost = Math.ceil((Number(system.resources?.mp?.max) || 0) * 0.05);
  if (mpCost > 0 && (Number(system.resources?.mp?.value) || 0) < mpCost) {
    ui.notifications?.warn(`Not enough MP to untransform (requires ${mpCost}).`);
    return;
  }

  const snapshot = foundry.utils.flattenObject(
    system.formState.baseSnapshot ?? {}
  ) as Record<string, unknown>;
  const baseToken = (system.formState.baseToken ?? {}) as {
    src?: string;
    width?: number;
    height?: number;
  };

  const statUpdate = buildStatUpdate(withMpDeducted(system, mpCost), snapshot);

  await actor.update({
    ...statUpdate,
    "system.formState.activeTransformationId": "",
    "system.formState.baseSnapshot": {},
    "system.formState.baseToken": {}
  });

  await applyTokenUpdate(actor, {
    ...(baseToken.src ? { "prototypeToken.texture.src": baseToken.src } : {}),
    ...(baseToken.width ? { "prototypeToken.width": baseToken.width } : {}),
    ...(baseToken.height ? { "prototypeToken.height": baseToken.height } : {})
  });
}

/** Apply an alternate form's bonuses on top of the currently active stat block (base or transformation). */
export async function activateAlternateForm(
  actor: SystemActor,
  formId: string
): Promise<void> {
  const system = actor.system as any;
  const form = (system.alternateForms ?? []).find(
    (f: FormEntry) => f.id === formId
  );
  if (!form) return;

  if (system.formState?.activeAlternateFormId) {
    await deactivateAlternateForm(actor);
  }

  const preAlternateSnapshot = snapshotStats(system);

  await actor.update({
    ...addUpdateFromForm(system, form),
    "system.formState.activeAlternateFormId": formId,
    "system.formState.preAlternateSnapshot": preAlternateSnapshot
  });

  await applyTokenUpdate(actor, tokenUpdateFromForm(form));
}

/** Revert an active alternate form, restoring the stats captured before it activated. */
export async function deactivateAlternateForm(actor: SystemActor): Promise<void> {
  const system = actor.system as any;
  if (!system.formState?.activeAlternateFormId) return;

  const snapshot = foundry.utils.flattenObject(
    system.formState.preAlternateSnapshot ?? {}
  ) as Record<string, unknown>;
  const baseToken = (system.formState.baseToken ?? {}) as {
    src?: string;
    width?: number;
    height?: number;
  };
  const transformation = system.formState.activeTransformationId
    ? (system.transformations ?? []).find(
        (f: FormEntry) => f.id === system.formState.activeTransformationId
      )
    : null;

  const restoreUpdate: Record<string, unknown> = {};
  for (const path of STAT_PATHS) {
    if (path in snapshot) restoreUpdate[`system.${path}`] = snapshot[path];
  }

  await actor.update({
    ...restoreUpdate,
    "system.formState.activeAlternateFormId": "",
    "system.formState.preAlternateSnapshot": {}
  });

  // Restore the token to whatever was active before the alternate form
  // (the transformation's token if one is active, otherwise the true base token).
  const restoreToken = transformation
    ? tokenUpdateFromForm(transformation)
    : {
        ...(baseToken.src
          ? { "prototypeToken.texture.src": baseToken.src }
          : {}),
        ...(baseToken.width ? { "prototypeToken.width": baseToken.width } : {}),
        ...(baseToken.height
          ? { "prototypeToken.height": baseToken.height }
          : {})
      };
  await applyTokenUpdate(actor, restoreToken);
}
