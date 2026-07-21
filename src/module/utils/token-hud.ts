/**
 * Token HUD Utilities
 *
 * Adds custom buttons to the token HUD for Dimensional War actions.
 */

import { type SystemActor, isSystemActor } from "../documents";
import { ActorType } from "../enums";
import { getSkillDieSize } from "../rolling/dice-utils";

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
  senseType: "sight" | "hearing" | "smell" | "taste" | "touch"
): Promise<void> {
  if (actor.is_character()) {
    const system = actor.system;

    // Get the sense level and bonus from system.skills.senses
    const senseData = system.bonuses?.senses?.[senseType] ?? 0;
    const senseLevel = system.skills?.utility.Perception?.level ?? 0;
    const senseBonus = senseData ?? 0;

    // Get awareness statistic bonus (if it exists in your system)
    const awareness = system.statistics?.awareness.value ?? 0;

    // Calculate total bonus (awareness + sense bonus)
    // Note: sense level determines the die size, not added to bonus
    // Level 0 skills have no bonus allowed
    const totalBonus = senseLevel === 0 ? 0 : awareness + senseBonus;

    // Build bonus details string for display
    const bonusDetails = "";

    // Build formula using skill notation
    const effectiveBonus = senseLevel === 0 ? 0 : totalBonus;
    const formula =
      effectiveBonus !== 0
        ? `1s${senseLevel} + ${effectiveBonus}`
        : `1s${senseLevel}`;

    const roll = await Roll.create(formula);
    const evaluated = await roll.evaluate();

    // Find the token for overlay
    const tokenObj = (canvas as any)?.tokens?.placeables?.find(
      (t: any) => t.actor?.id === actor.id
    ) as any;
    const tokenId: string | undefined = tokenObj?.id;

    // Build flavor text with optional bonus details
    let flavor = `${senseType} Perception Skill Check`;
    if (bonusDetails && effectiveBonus !== 0) {
      flavor += ` ${bonusDetails}`;
    }

    // Create message with perception-specific flags from the start
    await evaluated.toMessage({
      flavor,
      flags: {
        // @ts-ignore
        dimensionalwar: {
          perceptionCheck: true,
          skillCheck: true,
          tokenId,
          senseType,
          skillName: `${senseType} Perception`,
          skillLevel: senseLevel,
          bonus: effectiveBonus
        }
      },
      speaker: ChatMessage.getSpeaker({ actor })
    });
  }
}
