/**
 * Shared elemental data constants used by damage calculation and UI components.
 * Single source of truth — imported by apply-damage.ts, StatusTab.vue, and DamageDialog.vue.
 */

export const ELEMENT_CHOICES = [
  { key: "no_element", label: "No Element" },
  { key: "fire", label: "Fire" },
  { key: "water", label: "Water" },
  { key: "earth", label: "Earth" },
  { key: "wind", label: "Wind" },
  { key: "shadow", label: "Shadow" },
  { key: "light", label: "Light" },
  { key: "force", label: "Force" },
  { key: "time", label: "Time" },
  { key: "darkness", label: "Darkness" },
  { key: "holy", label: "Holy" }
] as const;

/** Maps each element to the element it is weak against (and vice-versa). */
export const ELEMENT_OPPOSITIONS: Record<string, string> = {
  fire: "water",
  water: "fire",
  earth: "wind",
  wind: "earth",
  shadow: "light",
  light: "shadow",
  force: "time",
  time: "force",
  darkness: "holy",
  holy: "darkness"
};

/**
 * Flat damage bonus added when an attack exploits an elemental weakness.
 * Index = (attacker element level) + (defender opposing element level), each capped at 5.
 * Combined score range: 0–10 (e.g. fire Lv.5 vs water Lv.5 → index 10).
 * Index 6 is intentionally absent and maps to 0 via fallback.
 */
export const ELEMENTAL_WEAKNESS_BONUS: Record<number, number> = {
  0: 0,
  1: 500,
  2: 1000,
  3: 1500,
  4: 2000,
  5: 2500,
  7: 3500,
  8: 4000,
  9: 4500,
  10: 5000
};

/**
 * Damage multiplier applied when the target resists the attack element.
 * Index = Math.abs(targetElementLevel - weaknessLevel).
 */
export const ELEMENTAL_RESISTANCE_MULT: Record<number, number> = {
  0: 1,
  1: 0.75,
  2: 0.5,
  3: 0.33,
  4: 0.2,
  5: 0
};
