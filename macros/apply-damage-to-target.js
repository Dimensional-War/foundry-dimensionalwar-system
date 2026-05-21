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
 *  3. Fill in the dialog for each target and click "Apply Damage".
 */

if (typeof game.dimensionalwar?.showDamageDialog !== "function") {
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

for (const target of targets) {
  const actor = target.actor;

  if (!actor) {
    ui.notifications.warn(
      `Token "${target.name}" has no linked actor — skipping.`
    );
    continue;
  }

  // Show dialog and apply; dialogs are shown sequentially (one per target).
  await game.dimensionalwar.showDamageDialog(actor);
}
