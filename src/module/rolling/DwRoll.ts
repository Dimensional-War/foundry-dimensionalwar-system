import { DwSkillDiceTerm } from "./DwSkillDiceTerm";
import { parseMults } from "./dice-utils";

/**
 * Custom Roll class for Dimensional War
 *
 * Critical override: instantiateAST() routes DwSkillDiceTerm nodes to the proper class.
 * Without this, Foundry creates StringTerms for "1s0" notation instead of DwSkillDiceTerms.
 */
export class DwRoll extends foundry.dice.Roll {
  // Pinned so minification can't rename this class build-to-build. Roll.fromData
  // matches stored ChatMessage roll data by this name, so a build-specific mangled
  // name (e.g. "Zd") breaks deserialization of every roll saved under a prior build.
  static override name = "DwRoll";

  /**
   * Preprocess the formula to extract *N[c/f] crit/fail range multipliers before
   * Foundry's parser sees the `*` as arithmetic multiplication.
   * Multipliers are stored in options so they survive serialization into ChatMessage.
   *
   * Syntax examples:  1s5*2   1s5*2c   1s5*2f   1s5*2c,3f   1s5*2c3f
   */
  constructor(
    formula: string,
    data?: object,
    options?: foundry.dice.Roll.Options
  ) {
    const { cleanFormula, critMult, failMult } = parseMults(formula);

    // Normalize: when a [flavor] bracket follows a numeric bonus on a skill die,
    // Foundry's tokenizer sees the whole "1s20+30" as one undivided string expression
    // (with the flavor as its annotation) and passes it to _onStringTerm, where the
    // "+30" cannot be represented as a separate NumericTerm.
    //
    // Fix: move the [flavor] to sit immediately after the skill die notation so that
    // the tokenizer can correctly split the bonus into its own OperatorTerm+NumericTerm.
    //   Before: 1s20+30[first attack]   After: 1s20[first attack]+30
    const normalizedFormula = cleanFormula.replace(
      /(\d*s\d+(?:[a-z]+\d*)*)([+\-]\d+)(\[[^\]]*\])/g,
      "$1$3$2"
    );

    const enrichedOptions: Record<string, unknown> = {
      critMult: 1,
      failMult: 1,
      ...options
    };
    if (critMult !== 1 || failMult !== 1) {
      enrichedOptions.critMult = critMult;
      enrichedOptions.failMult = failMult;
      enrichedOptions.originalFormula = formula;
    }
    // Preserve the original formula (with flavors in their original positions) so
    // the IRC echo can reconstruct per-die flavor labels from the raw user input.
    if (
      normalizedFormula !== cleanFormula &&
      !enrichedOptions.originalFormula
    ) {
      enrichedOptions.originalFormula = formula;
    }
    // @ts-expect-error - enrichedOptions extends Roll.Options
    super(normalizedFormula, data, enrichedOptions);
  }

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
      // Default handling for other terms.
      // "DiceTerm" is the abstract base; Foundry v13 uses "Die" as the concrete class.
      // Alias it so compound formulas with standard dice (e.g. 1d3) still work.
      const className = node?.class === "DiceTerm" ? "Die" : node?.class;
      const cls =
        // @ts-expect-error
        foundry.dice.terms[className] ?? foundry.dice.terms.RollTerm;
      return cls.fromParseNode(node);
    });
  }
}
