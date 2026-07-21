/**
 * Perception Overlay
 *
 * Renders a floating HUD badge directly above a token on the Foundry canvas
 * whenever a perception check is rolled. The badge shows an icon (eye, ear, nose, tongue, hand)
 * and the roll total, then fades out after a configurable duration.
 *
 * Driven by the `createChatMessage` hook so ALL clients (not just the roller)
 * see the overlay whenever a perception check message is created.
 */

// ─── Internal State ────────────────────────────────────────────────────────────

interface OverlayEntry {
  container: PIXI.Container;
  /** null when this overlay was triggered by hover (no auto-dismiss) */
  timeoutId: ReturnType<typeof setTimeout> | null;
  /** true when the overlay was created purely by hovering, not a fresh roll */
  isHoverOverlay: boolean;
}

/** Active overlays keyed by tokenId */
const activeOverlays = new Map<string, OverlayEntry>();

/**
 * Remembers the last perception roll total and type per token so the overlay can be
 * re-shown on hover even after the timed overlay has expired.
 */
const lastPerceptionRolls = new Map<
  string,
  { total: number; senseType: string }
>();

/** Whether the Foundry hoverToken hook has been registered */
let hoverListenerRegistered = false;

// ─── Public API ────────────────────────────────────────────────────────────────

/**
 * Register the hoverToken hook so the last perception roll is shown/hidden
 * as the user mouses over tokens. Safe to call multiple times (no-ops after
 * the first call). Call this once canvas is ready.
 */
export function initPerceptionHoverListener(): void {
  if (hoverListenerRegistered) return;
  hoverListenerRegistered = true;

  Hooks.on("hoverToken", (token: any, hovered: boolean) => {
    const tokenId: string | undefined = token?.id;
    if (!tokenId) return;

    if (hovered) {
      // If a timed overlay is already visible, leave it alone.
      if (activeOverlays.has(tokenId)) return;

      // Read the setting; 0 means hover overlays are disabled.
      const hoverDurationMs: number =
        ((game as any).settings?.get(
          "dimensionalwar",
          "perceptionHoverDuration"
        ) as number) * 1000;
      if (hoverDurationMs <= 0) return;

      // Show the last roll (if any) as a hover-only overlay with no timeout.
      const lastRoll = lastPerceptionRolls.get(tokenId);
      if (!lastRoll) return;

      const timeoutId = setTimeout(() => {
        removePerceptionOverlay(tokenId);
        lastPerceptionRolls.delete(tokenId); // ← prevent re-trigger on future hovers
      }, hoverDurationMs);

      _showOverlay(
        tokenId,
        token,
        lastRoll.total,
        lastRoll.senseType,
        timeoutId,
        true
      );
    } else {
      // Mouse left: only dismiss if it was a hover overlay AND its timeout
      // hasn't fired yet — but per spec we let it count down, so do nothing.
      // A non-hover (timed roll) overlay is also left alone.
      //
      // Remove the overlay only if it was hover-triggered; leave timed ones.
      // const entry = activeOverlays.get(tokenId);
      // if (entry?.isHoverOverlay) {
      //   removePerceptionOverlay(tokenId);
      // }
    }
  });
}

/**
 * Returns true if the current user should see the perception overlay for this
 * chat message, taking roll visibility (blind / whisper / public) into account.
 *
 * | Roll mode   | message.blind | message.whisper          | Who sees overlay          |
 * |-------------|---------------|--------------------------|---------------------------|
 * | publicroll  | false         | []                       | Everyone                  |
 * | gmroll      | false         | [gmId, rollerId]         | GM + roller only          |
 * | blindroll   | true          | [gmId]                   | GM only                   |
 * | selfroll    | false         | [rollerId]               | Roller only               |
 */
export function isMessageVisibleToCurrentUser(
  message: foundry.documents.ChatMessage
): boolean {
  const user = (game as any).user;
  if (!user) return false;

  // Blind rolls: only the GM sees the overlay
  if (message.blind) {
    return user.isGM;
  }

  // Whispered rolls (gmroll / selfroll / explicit whisper):
  // show only to recipients (Foundry always includes the GM in whisper arrays)
  const whisper: string[] = (message.whisper as string[]) ?? [];
  if (whisper.length > 0) {
    return user.isGM || whisper.includes(user.id);
  }

  // Public roll — everyone sees it
  return true;
}

/**
 * Show (or replace) a perception result badge above the given token.
 * @param tokenId   The canvas token's id
 * @param total     The dice roll total to display
 * @param senseType Which sense was used (Sight, Hearing, Smell, Taste, Touch)
 * @param durationMs How long to show the badge in milliseconds
 */
export function showPerceptionOverlay(
  tokenId: string,
  total: number,
  senseType: string,
  durationMs: number
): void {
  // Persist the roll so it can be re-shown on hover after the timed overlay expires.
  lastPerceptionRolls.set(tokenId, { total, senseType });

  // Ensure the hover listener is active
  initPerceptionHoverListener();

  // Clean up any existing overlay for this token first
  removePerceptionOverlay(tokenId);

  // Resolve the live canvas token
  const token: any = (canvas as any)?.tokens?.get(tokenId);
  if (!token) {
    console.warn(
      "[PerceptionOverlay] Token not found on current canvas:",
      tokenId
    );
    return;
  }

  const timeoutId = setTimeout(() => {
    removePerceptionOverlay(tokenId);
  }, durationMs);

  _showOverlay(tokenId, token, total, senseType, timeoutId, false);
}

/**
 * Remove the perception overlay from a specific token (if any).
 */
export function removePerceptionOverlay(tokenId: string): void {
  const entry = activeOverlays.get(tokenId);
  if (!entry) return;
  if (entry.timeoutId !== null) clearTimeout(entry.timeoutId);
  if (!entry.container.destroyed) {
    entry.container.destroy({ children: true });
  }
  activeOverlays.delete(tokenId);
}

/**
 * Remove all active perception overlays (call on scene/canvas change).
 * Also clears stored roll history since the token objects are no longer valid.
 */
export function cleanupAllPerceptionOverlays(): void {
  for (const [, entry] of activeOverlays) {
    if (entry.timeoutId !== null) clearTimeout(entry.timeoutId);
    if (!entry.container.destroyed) {
      entry.container.destroy({ children: true });
    }
  }
  activeOverlays.clear();
  lastPerceptionRolls.clear();
}

/**
 * Returns true if there is already an active overlay for the given token.
 */
export function hasPerceptionOverlay(tokenId: string): boolean {
  return activeOverlays.has(tokenId);
}

// ─── Internal helpers ─────────────────────────────────────────────────────────

/**
 * Low-level: build the PIXI container, position it on the token and register
 * the entry. Shared by both the timed and hover-only paths.
 */
function _showOverlay(
  tokenId: string,
  token: any,
  total: number,
  senseType: string,
  timeoutId: ReturnType<typeof setTimeout> | null,
  isHoverOverlay: boolean
): void {
  const container = buildOverlayContainer(total, senseType);

  // Position the container horizontally centred and just above the token.
  const tokenW: number = token.w ?? (canvas as any)?.grid?.size ?? 100;
  const bounds = container.getLocalBounds();
  container.x = (tokenW - bounds.width) / 2 - bounds.x;
  container.y = -(bounds.height + 8);

  // Anchor to the token so it moves with it
  token.addChild(container);

  activeOverlays.set(tokenId, { container, timeoutId, isHoverOverlay });
}

// ─── PIXI Badge Builder ────────────────────────────────────────────────────────

const FONT_SIZE = 28;
const PADDING_H = 15;
const PADDING_V = 9;
const GAP = 9; // gap between icon and number text
const ICON_SIZE = FONT_SIZE;
const TEXT_COLOR = "#e0f0ff";

function buildOverlayContainer(
  total: number,
  senseType: string
): PIXI.Container {
  const container = new PIXI.Container();

  // Build the icon based on sense type
  const icon = buildSenseIcon(senseType);

  // Build the text showing the roll total
  const text = new PIXI.Text(String(total), {
    fontSize: FONT_SIZE,
    fill: TEXT_COLOR,
    fontWeight: "bold"
  });

  // Measure so we can size the background pill
  const iconBounds = icon.getLocalBounds();
  const textBounds = text.getLocalBounds();
  const totalWidth = PADDING_H * 2 + iconBounds.width + GAP + textBounds.width;
  const totalHeight =
    PADDING_V * 2 + Math.max(iconBounds.height, textBounds.height);

  // Background pill
  const bg = new PIXI.Graphics();
  bg.beginFill(0x1a1a2e, 0.9);
  bg.drawRoundedRect(0, 0, totalWidth, totalHeight, totalHeight / 2);
  bg.endFill();

  // Position the icon on the left
  icon.x = PADDING_H - iconBounds.x;
  icon.y =
    PADDING_V +
    (totalHeight - PADDING_V * 2 - iconBounds.height) / 2 -
    iconBounds.y;

  // Position the text to the right of the icon
  text.x = PADDING_H + iconBounds.width + GAP - textBounds.x;
  text.y =
    PADDING_V +
    (totalHeight - PADDING_V * 2 - textBounds.height) / 2 -
    textBounds.y;

  container.addChild(bg, icon, text);

  return container;
}

/**
 * Build the appropriate icon based on the sense type using Font Awesome Pro
 */
function buildSenseIcon(senseType: string): PIXI.Text {
  const color = 0x64b5f6;

  // Map sense types to Font Awesome unicode characters
  const iconMap: Record<string, string> = {
    sight: "\uf06e", // fa-eye
    hearing: "\uf2a2", // fa-ear-listen
    smell: "\uf72e", // fa-wind
    taste: "\uf2e7", // fa-utensils
    touch: "\uf256" // fa-hand
  };

  const unicode = iconMap[senseType.toLowerCase()] ?? "\uf06e"; // Default to eye

  const icon = new PIXI.Text(unicode, {
    fontFamily: "Font Awesome 6 Pro",
    fontSize: ICON_SIZE,
    fill: color,
    fontWeight: "900" // Solid style
  });

  return icon;
}
