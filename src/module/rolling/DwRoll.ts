import { DwSkillDiceTerm } from "./DwSkillDiceTerm";

/**
 * Custom Roll class for Dimensional War
 *
 * Critical override: instantiateAST() routes DwSkillDiceTerm nodes to the proper class.
 * Without this, Foundry creates StringTerms for "1s0" notation instead of DwSkillDiceTerms.
 */
export class DwRoll extends foundry.dice.Roll {
  /**
   * Override evaluate to strip bonuses from s0 rolls BEFORE evaluation
   * Per system rules: skill level 0 gets no bonus
   */
  async evaluate(
    options?: foundry.dice.Roll.Options
  ): Promise<foundry.dice.Roll.Evaluated<this>> {
    // Check if this roll contains a skill term with level 0
    const hasSkillLevelZero = this.terms.some(
      term => term instanceof DwSkillDiceTerm && term.skillLevel === 0
    );

    if (hasSkillLevelZero) {
      // Remove all numeric terms and their preceding operators from the roll
      this.terms = this.terms.filter((term, index) => {
        // Remove numeric terms (bonuses)
        if (term instanceof foundry.dice.terms.NumericTerm) {
          return false;
        }
        // Remove operators that precede numeric terms
        if (term instanceof foundry.dice.terms.OperatorTerm) {
          const nextTerm = this.terms[index + 1];
          if (nextTerm instanceof foundry.dice.terms.NumericTerm) {
            return false;
          }
        }
        return true;
      });

      // Reset formula to match the modified terms
      this.resetFormula();
    }

    // Now evaluate with the (potentially) modified terms
    return await super.evaluate(options);
  }

  /**
   * Override formula getter to show clean display for s0 rolls
   */
  get formula(): string {
    // Check if this roll contains a skill term with level 0
    const hasSkillLevelZero = this.terms.some(
      term => term instanceof DwSkillDiceTerm && term.skillLevel === 0
    );

    if (hasSkillLevelZero) {
      // For s0 rolls, only show the DwSkillDiceTerm itself
      return this.terms
        .filter(term => term instanceof DwSkillDiceTerm)
        .map(term => term.expression)
        .join("");
    }

    return super.formula;
  }

  /**
   * Instantiate the nodes in an AST sub-tree into RollTerm instances.
   * This is where we route DwSkillDiceTerm nodes to the proper class.
   */
  static instantiateAST(
    ast: foundry.dice.types.RollParseNode
  ): foundry.dice.terms.RollTerm[] {
    return CONFIG.Dice.parser.flattenTree(ast).map(node => {
      // Route DwSkillDiceTerm nodes to our custom class
      if (node?.class === "DwSkillDiceTerm") {
        return DwSkillDiceTerm.fromParseNode(node);
      }
      // Default handling for other terms
      const cls =
        // @ts-expect-error
        foundry.dice.terms[node?.class] ?? foundry.dice.terms.RollTerm;
      return cls.fromParseNode(node);
    });
  }
}
