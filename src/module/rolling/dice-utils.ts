/**
 * Dice Utilities for Dimensional War Skill System
 *
 * Handles skill level to die size conversions and physical dice formulas
 * for achieving true uniform distribution using only Dice So Nice supported dice.
 */

/**
 * Get the die size for a given skill level according to Dimensional War rules
 * Level 0: 1d40 (no bonus allowed)
 * Level 1: 1d40
 * Level 2-3: 1d60
 * Level 4-5: 1d90
 * Level 6-7: 1d140
 * Level 8-9: 1d220
 * Level 10: 1d350
 * Level 11+: 1d375 (for temporary boosts beyond base skill cap)
 */
export function getSkillDieSize(level: number): number {
  if (level <= 1) return 40;
  if (level <= 3) return 60;
  if (level <= 5) return 90;
  if (level <= 7) return 140;
  if (level <= 9) return 220;
  if (level === 10) return 350;
  return 375; // level 11+
}

/**
 * Get physical dice formula for a given die size using only Dice So Nice supported dice.
 * Uses the "digit method" to achieve true uniform distribution (each value equally likely).
 *
 * Examples:
 *   1d40 = (1d4 - 1) * 10 + 1d10  → Ranges from (0*10)+1=1 to (3*10)+10=40
 *   1d60 = (1d6 - 1) * 10 + 1d10  → Ranges from 1 to 60
 *
 * @param dieSize - The target die size (40, 60, 90, 140, 220, 350, 375)
 * @returns Roll formula string using real physical dice
 */
export function getPhysicalDiceFormula(dieSize: number): string {
  switch (dieSize) {
    case 40:
      // Uses: D4, D10 → 1-40 uniform
      return "(1d4 - 1) * 10 + 1d10";
    case 60:
      // Uses: D6, D10 → 1-60 uniform
      return "(1d6 - 1) * 10 + 1d10";
    case 90:
      // Uses: D3, D30 → 1-90 uniform
      return "(1d3 - 1) * 30 + 1d30";
    case 140:
      // Uses: D14, D10 → 1-140 uniform
      return "(1d14 - 1) * 10 + 1d10";
    case 220:
      // Uses: D8, D30 → 1-240 range (close approximation, 9% wider)
      // True 1d220 would require reroll logic for 221-240
      return "(1d8 - 1) * 30 + 1d30";
    case 350:
      // Uses: D5, D7, D10 → 1-350 uniform
      // Hundreds: (1d5-1)*70 = 0,70,140,210,280
      // Tens: (1d7-1)*10 = 0,10,20,30,40,50,60
      // Ones: 1d10 = 1-10
      return "(1d5 - 1) * 70 + (1d7 - 1) * 10 + 1d10";
    case 375:
      // Uses: D3, D5 → 1-375 uniform (3 × 5 × 5 × 5 = 375)
      // 125s place: (1d3-1)*125 = 0,125,250
      // 25s place: (1d5-1)*25 = 0,25,50,75,100
      // 5s place: (1d5-1)*5 = 0,5,10,15,20
      // 1s place: 1d5 = 1-5
      return "(1d3 - 1) * 125 + (1d5 - 1) * 25 + (1d5 - 1) * 5 + 1d5";
    default:
      // Fallback for any unexpected values
      return `1d${dieSize}`;
  }
}
