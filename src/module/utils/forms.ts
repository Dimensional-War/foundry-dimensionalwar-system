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
 *
 * `resources.hp.value` is deliberately left out of the returned update (see
 * `hpValue`/`oldHpValue`) - it's applied as its own follow-up actor update by
 * the caller so third-party wound-tracking modules (e.g.
 * tokenmagic-automatic-wounds), which key off `system.resources.hp.value` in
 * the `preUpdateActor` diff to detect damage/healing, see an isolated HP
 * change measured against the form's *already-applied* new max rather than a
 * combined max+value diff that would make the percentage lost look wrong.
 */
function buildStatUpdate(
  system: any,
  targetFlat: Record<string, unknown>,
  overrides?: FormOverrides
): { update: Record<string, unknown>; oldHpValue: number; hpValue: number } {
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
  // Rescale the stored value with HP-max changes on every transition, even
  // while the gauge is hidden (hasTrance/hasLimitBreak false) - otherwise its
  // percentage basis silently drifts against the max of whatever form was
  // active while it was hidden, and re-entering a form with the gauge
  // inflates or deflates it against the wrong max.
  const hasTrance = Boolean(
    "gauges.hasTrance" in targetFlat
      ? targetFlat["gauges.hasTrance"]
      : system.gauges?.hasTrance
  );
  {
    const oldTranceMax = oldHpMax * 2;
    const newTranceMax = newHpMax * 2;
    const oldTrance = Number(system.gauges?.trance) || 0;
    update["system.gauges.trance"] =
      hasTrance && overrides?.trance != null
        ? clampToMax(Number(overrides.trance), newTranceMax)
        : scaleResourceValue(oldTrance, oldTranceMax, newTranceMax);
  }

  const hasLimitBreak = Boolean(
    "gauges.hasLimitBreak" in targetFlat
      ? targetFlat["gauges.hasLimitBreak"]
      : system.gauges?.hasLimitBreak
  );
  {
    const oldLimitBreakMax = oldHpMax * 4;
    const newLimitBreakMax = newHpMax * 4;
    const oldLimitBreak = Number(system.gauges?.limitBreak) || 0;
    update["system.gauges.limitBreak"] =
      hasLimitBreak && overrides?.limitBreak != null
        ? clampToMax(Number(overrides.limitBreak), newLimitBreakMax)
        : scaleResourceValue(oldLimitBreak, oldLimitBreakMax, newLimitBreakMax);
  }

  return { update, oldHpValue, hpValue: newHpValue };
}

/**
 * Apply a form-switch stat update in two steps so wound-tracking modules see
 * an isolated HP diff: the max/stat update lands first, then - only if the
 * HP value actually changed - a second update carries just
 * `resources.hp.value`, mirroring how normal damage/heal updates
 * (StatusTab.vue, apply-damage.ts) already send that field on its own.
 */
async function applyStatUpdate(
  actor: SystemActor,
  { update, oldHpValue, hpValue }: ReturnType<typeof buildStatUpdate>,
  extra: Record<string, unknown> = {}
): Promise<void> {
  await actor.update({ ...update, ...extra });
  if (hpValue !== oldHpValue) {
    await actor.update({ "system.resources.hp.value": hpValue });
  }
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

/**
 * The token whose current size/texture reflects this actor right now: the
 * synthetic actor's own token if opened from a specific unlinked token,
 * otherwise a single already-placed instance (its size may have diverged
 * from the prototype, e.g. a boss resized by hand after placement), falling
 * back to the prototype when there's no single unambiguous instance.
 */
function currentLiveToken(
  actor: SystemActor
): { texture?: { src?: string }; width?: number; height?: number } | null {
  if ((actor as any).isToken && (actor as any).token) return (actor as any).token;

  const instances = new Map<string, any>();
  for (const token of actor.getDependentTokens()) {
    if (token?.id) instances.set(token.id, token);
  }
  for (const scene of game.scenes?.contents ?? []) {
    for (const token of scene.tokens) {
      if (token.actorId === actor.id) instances.set(token.id, token);
    }
  }
  return instances.size === 1 ? [...instances.values()][0] : null;
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

  // Propagate to every already-placed token derived from this actor, linked
  // or not: changing the prototype doesn't retroactively update tokens
  // already on a scene, and width/height live on the TokenDocument itself
  // (not on actor data), so unlinked instances never inherit the change
  // otherwise. getDependentTokens() alone can miss tokens on scenes that
  // haven't registered as dependents, so also sweep every scene directly.
  const updated = new Set<string>();
  for (const token of actor.getDependentTokens()) {
    if (!token?.id || updated.has(token.id)) continue;
    updated.add(token.id);
    await token.update(tokenFlat).catch(() => {});
  }
  for (const scene of game.scenes?.contents ?? []) {
    for (const token of scene.tokens) {
      if (token.actorId !== actor.id) continue;
      if (updated.has(token.id)) continue;
      updated.add(token.id);
      await token.update(tokenFlat).catch(() => {});
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
  const liveToken = currentLiveToken(actor);
  const baseToken = {
    src: liveToken?.texture?.src ?? actor.prototypeToken.texture.src,
    width: liveToken?.width ?? actor.prototypeToken.width,
    height: liveToken?.height ?? actor.prototypeToken.height
  };

  const statUpdate = buildStatUpdate(
    withMpDeducted(system, mpCost),
    flattenFormStats(form),
    overridesFromForm(form)
  );

  await applyStatUpdate(actor, statUpdate, {
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

  await applyStatUpdate(actor, statUpdate, {
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
