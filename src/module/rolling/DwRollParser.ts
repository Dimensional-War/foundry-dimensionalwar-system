// @ts-nocheck

import { StringParseNode } from "node_modules/fvtt-types/src/foundry/client/dice/_types.d.mts";

/**
 * Custom RollParser for Dimensional War
 * Routes skill notation (1s5) to use DwSkillDiceTerm instead of standard Die
 */
export class DwRollParser extends foundry.dice.RollParser {
  protected _onStringTerm(
    term: string,
    flavor: string | null
  ): StringParseNode {
    // Match pure NsN skill notation only — do NOT include operator+bonus here.
    // e.g. "1s5" or "1s5[flavor]" (Foundry may pass flavor as part of the string).
    // Any "+30" bonus must remain as a separate NumericTerm handled by Foundry;
    // if we captured it here it would be silently dropped by fromParseNode.
    const skillNotationRegex = /^(\d*)s(\d+)(?:\[[^\]]*\])?$/i;
    const match = term.replace(/\[[^\]]*\]/g, "").match(skillNotationRegex);
    if (match) {
      const number = match[1] ? parseInt(match[1]) : 1; // Default to 1 die if not specified
      const skillLevel = parseInt(match[2]);

      return {
        class: "DwSkillDiceTerm",
        formula: term,
        modifiers: "",
        number,
        faces: skillLevel, // Pass skill level as faces so fromParseNode can extract it
        evaluated: false,
        options: { flavour: flavor }
      };
    }

    // Default handling for non-skill notation strings
    return super._onStringTerm(term, flavor);
  }

  /**
   * Handle a dice term and return the appropriate DiceTerm class
   * When we see "s" denomination, route to DwSkillDiceTerm
   * @param {NumericRollParseNode|ParentheticalRollParseNode|null} number  The number of dice.
   * @param {string|NumericRollParseNode|ParentheticalRollParseNode|null} faces  The die faces or denomination.
   * @param {string|null} modifiers  The matched modifiers string.
   * @param {string|null} flavor  Associated flavor text.
   * @param {string} formula  The original matched text.
   * @returns {DiceRollParseNode}
   * @internal
   * @protected
   */
  _onDiceTerm(number, faces, modifiers, flavor, formula) {
    if (CONFIG.debug.rollParsing) {
      console.debug(
        this.constructor.formatDebug(
          "onDiceTerm",
          number,
          faces,
          modifiers,
          flavor,
          formula
        )
      );
    }

    const sanitisedModifiers = modifiers === null ? "" : modifiers;

    // Check if this is skill notation (denomination "s")
    const isSkillNotation = typeof faces === "string" && faces === "s";

    if (isSkillNotation) {
      // Extract skill level from the formula (e.g., "1s5" -> skillLevel = 5)
      const skillMatch = formula.match(/(\d+)s(\d+)/i);
      const skillLevel = skillMatch ? parseInt(skillMatch[2]) : 0;

      return {
        class: "DwSkillDiceTerm",
        formula,
        modifiers: sanitisedModifiers,
        number,
        faces: skillLevel, // Pass skill level as faces so fromParseNode can extract it
        evaluated: false,
        options: { flavour: flavor }
      };
    }

    // Default: delegate to parent so it returns the correct Foundry-native class
    // name ("Die", not "DiceTerm") and options format.
    return super._onDiceTerm(number, faces, modifiers, flavor, formula);
  }
}
