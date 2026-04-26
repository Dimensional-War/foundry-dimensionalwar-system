/**
 * Token HUD Utilities
 *
 * Adds custom buttons to the token HUD for Dimensional War actions.
 */

import type { SystemActor } from "../documents";

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
 * Parse a skill check formula in the format: (x)s(y)(+|-|*)(z)
 * Examples:
 *   "1s5+10" = 1 die at skill level 5, plus 10
 *   "2s3-5" = 2 dice at skill level 3, minus 5
 *   "1s7*2" = 1 die at skill level 7, times 2
 *   "3s10" = 3 dice at skill level 10, no modifier
 *
 * @returns Roll formula string like "1d140 + 10" or "2d60 - 5"
 */
export function parseSkillFormula(input: string): string {
  // Match pattern: (number)s(number)(optional: +|-|* and number)
  const match = input.match(/^(\d+)s(\d+)([+\-*]?)(\d*)$/);

  if (!match) {
    throw new Error(`Invalid skill formula: ${input}`);
  }

  const numDice = parseInt(match[1]);
  const skillLevel = parseInt(match[2]);
  const operation = match[3] || "";
  const modifier = match[4] ? parseInt(match[4]) : 0;

  const dieSize = getSkillDieSize(skillLevel);

  let formula = `${numDice}d${dieSize}`;

  if (operation && modifier !== 0) {
    if (operation === "+") {
      formula += ` + ${modifier}`;
    } else if (operation === "-") {
      formula += ` - ${modifier}`;
    } else if (operation === "*") {
      formula += ` * ${modifier}`;
    }
  }

  return formula;
}

/**
 * Roll a skill check using the Dimensional War skill system
 * @param actor The actor performing the check
 * @param skillName Name of the skill (for flavor text)
 * @param skillLevel The skill level (0-10)
 * @param bonus Additional bonus to add
 * @param numDice Number of dice to roll (default 1)
 * @param bonusDetails Optional breakdown of bonus components for display
 */
export async function rollSkillCheck(
  actor: SystemActor,
  skillName: string,
  skillLevel: number,
  bonus: number,
  numDice: number = 1,
  bonusDetails?: string
): Promise<Roll> {
  // Level 0 has no bonus allowed
  const effectiveBonus = skillLevel === 0 ? 0 : bonus;

  // Build formula using skill notation: (numDice)s(skillLevel)+(bonus)
  // The custom DwSkillDiceTerm will handle converting this to the correct die size
  const formula =
    effectiveBonus !== 0
      ? `${numDice}s${skillLevel} + ${effectiveBonus}`
      : `${numDice}s${skillLevel}`;

  const roll = await Roll.create(formula);
  const evaluated = await roll.evaluate();

  // Find the actor's current canvas token id
  const tokenObj = (canvas as any)?.tokens?.placeables?.find(
    (t: any) => t.actor?.id === actor.id
  ) as any;
  const tokenId: string | undefined = tokenObj?.id;

  // Build flavor text with optional bonus details
  let flavor = `${skillName} Skill Check`;
  if (bonusDetails && effectiveBonus !== 0) {
    flavor += ` ${bonusDetails}`;
  }

  await evaluated.toMessage({
    flavor,
    flags: {
      // @ts-ignore
      dimensionalwar: {
        skillCheck: true,
        tokenId,
        skillName,
        skillLevel,
        bonus: effectiveBonus
      }
    },
    speaker: ChatMessage.getSpeaker({ actor })
  });

  return evaluated;
}

/**
 * Roll a perception check for the given sense type
 */
export async function rollPerceptionCheck(
  actor: SystemActor,
  senseType: string
): Promise<void> {
  const system = actor.system as any;

  // Get the sense level and bonus from system.skills.senses
  const senses = system.skills?.senses as
    | Record<string, { level: number; bonus: number }>
    | undefined;
  const senseData = senses?.[senseType];
  const senseLevel = senseData?.level ?? 0;
  const senseBonus = senseData?.bonus ?? 0;

  // Get awareness statistic bonus (if it exists in your system)
  const awareness = system.statistics?.awareness?.level ?? 0;

  // Calculate total bonus (awareness + sense bonus)
  // Note: sense level determines the die size, not added to bonus
  // Level 0 skills have no bonus allowed
  const totalBonus = senseLevel === 0 ? 0 : awareness + senseBonus;

  // Build bonus details string for display
  const bonusDetails =
    senseLevel === 0
      ? ""
      : `(Awareness +${awareness}, Sense Bonus +${senseBonus})`;

  // Use the Dimensional War skill check system
  const roll = await rollSkillCheck(
    actor,
    `${senseType} Perception`,
    senseLevel,
    totalBonus,
    1, // Always roll 1 die for perception
    bonusDetails
  );

  // Find the token for overlay
  const tokenObj = (canvas as any)?.tokens?.placeables?.find(
    (t: any) => t.actor?.id === actor.id
  ) as any;
  const tokenId: string | undefined = tokenObj?.id;

  // Update the message flags to include perception-specific data
  const messages = game.messages?.contents || [];
  const lastMessage = messages[messages.length - 1];

  if (lastMessage && tokenId) {
    await lastMessage.update({
      flags: {
        dimensionalwar: {
          perceptionCheck: true,
          senseType: senseType,
          tokenId: tokenId
        }
      }
    } as any);
  }
}
