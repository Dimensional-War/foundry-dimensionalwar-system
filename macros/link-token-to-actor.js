/**
 * Macro: Link Token to Actor & Sync Data
 *
 * For tokens that were placed BEFORE actorLink was enabled by default (PCs/Allies),
 * this macro:
 *  1. Captures the unlinked token's current actor data
 *  2. Enables actorLink on the placed token
 *  3. Enables actorLink on the actor's prototype token (so future placements are linked)
 *  4. Writes the captured data back to the now-linked base actor
 *
 * Usage: Select one or more tokens on the canvas, then run this macro.
 */

const tokens = [token];

if (!tokens.length) {
  ui.notifications.warn("Select at least one token before running this macro.");
  return;
}

for (const token of tokens) {
  const tokenDoc = token.document;

  if (tokenDoc.actorLink) {
    ui.notifications.info(`"${tokenDoc.name}" is already linked — skipping.`);
    continue;
  }

  const baseActor = game.actors.get(tokenDoc.actorId);
  if (!baseActor) {
    ui.notifications.error(
      `Could not find the owning actor for token "${tokenDoc.name}".`
    );
    continue;
  }

  // Step 1: Capture the token's current actor data from the synthetic (unlinked) actor.
  // Must happen BEFORE enabling actorLink, after which the synthetic actor is gone.
  const savedSystem = JSON.parse(JSON.stringify(tokenDoc.actor.system));
  const savedName = tokenDoc.name ?? baseActor.name;

  console.log(`[Link Macro] Capturing data for "${savedName}"`, savedSystem);

  // Step 2: Enable actorLink on the placed token document.
  await tokenDoc.update({ actorLink: true });

  // Step 3: Enable actorLink on the prototype token so future placements are linked.
  await baseActor.update({ "prototypeToken.actorLink": true });

  // Step 4: Write the captured system data back to the now-linked base actor.
  // flattenObject converts nested keys to dot-notation paths (e.g. "system.resources.hp.value")
  // so that arrays and nested objects are fully replaced rather than shallow-merged.
  const updateData = foundry.utils.flattenObject({
    name: savedName,
    system: savedSystem
  });
  await baseActor.update(updateData);

  ui.notifications.info(
    `✔ "${baseActor.name}" is now linked and data has been synced.`
  );
}
