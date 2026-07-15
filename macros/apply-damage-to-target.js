/**
 * Macro: Apply Damage to Target
 *
 * Opens the DW damage dialog pre-populated with the targeted token's soak
 * values. The GM or player enters raw damage, picks Physical / Magical, and
 * optionally sets a piercing amount that bypasses that much soak.
 *
 * Requirements:
 *  • One or more tokens must be targeted (use the Foundry targeting tool).
 *  • The Dimensional War system must be loaded (provides game.dimensionalwar).
 *
 * Usage:
 *  1. Target one or more tokens on the canvas.
 *  2. Run this macro.
 *  3. Fill in one dialog and apply the same damage to all targets.
 */

if (typeof game.dimensionalwar?.showDamageDialogForActors !== "function") {
  ui.notifications.error(
    "Dimensional War system API not found. Make sure the system is fully loaded."
  );
  return;
}

const targets = [...(game.user?.targets ?? [])];

if (!targets.length) {
  ui.notifications.warn("Target at least one token before running this macro.");
  return;
}

const actors = [];
for (const target of targets) {
  if (!target.actor) {
    ui.notifications.warn(
      `Token "${target.name}" has no linked actor — skipping.`
    );
    continue;
  }
  actors.push(target.actor);
}

if (!actors.length) return;

// Show one dialog and apply to all valid targeted actors.
await game.dimensionalwar.showDamageDialogForActors(actors);
