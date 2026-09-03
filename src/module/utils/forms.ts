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
  "elements.element2Level"
] as const;

interface FormEntry {
  id: string;
  name: string;
  img?: string;
  tokenWidth?: number;
  tokenHeight?: number;
  statistics?: any;
  resources?: any;
  soak?: any;
  elements?: any;
}

function getByPath(obj: any, path: string): unknown {
  return path.split(".").reduce((o, k) => o?.[k], obj);
}

/** Snapshot the current live values at STAT_PATHS into a flat dot-path object. */
function snapshotStats(system: any): Record<string, unknown> {
  const snapshot: Record<string, unknown> = {};
  for (const path of STAT_PATHS) {
    snapshot[path] = getByPath(system, path);
  }
  return snapshot;
}

/** Build a flat dot-path update replacing live values with a form entry's block. */
function replaceUpdateFromForm(form: FormEntry): Record<string, unknown> {
  const flatForm = foundry.utils.flattenObject({
    statistics: form.statistics,
    resources: form.resources,
    soak: form.soak,
    elements: form.elements
  });
  const update: Record<string, unknown> = {};
  for (const path of STAT_PATHS) {
    if (path in flatForm) update[path] = flatForm[path];
  }
  return update;
}

/** Build a flat dot-path update adding a form entry's block on top of current live values. */
function addUpdateFromForm(system: any, form: FormEntry): Record<string, unknown> {
  const flatForm = foundry.utils.flattenObject({
    statistics: form.statistics,
    resources: form.resources,
    soak: form.soak
  });
  const update: Record<string, unknown> = {};
  for (const path of Object.keys(flatForm)) {
    if (!STAT_PATHS.includes(path as (typeof STAT_PATHS)[number])) continue;
    const base = Number(getByPath(system, path)) || 0;
    const bonus = Number(flatForm[path]) || 0;
    update[path] = base + bonus;
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

  await actor.update({
    ...replaceUpdateFromForm(form),
    "system.resources.mp.value":
      (Number(system.resources?.mp?.value) || 0) - mpCost,
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

  const snapshot = (system.formState.baseSnapshot ?? {}) as Record<
    string,
    unknown
  >;
  const baseToken = (system.formState.baseToken ?? {}) as {
    src?: string;
    width?: number;
    height?: number;
  };

  await actor.update({
    ...snapshot,
    "system.resources.mp.value":
      (Number(system.resources?.mp?.value) || 0) - mpCost,
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

  const snapshot = (system.formState.preAlternateSnapshot ?? {}) as Record<
    string,
    unknown
  >;
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

  await actor.update({
    ...snapshot,
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
