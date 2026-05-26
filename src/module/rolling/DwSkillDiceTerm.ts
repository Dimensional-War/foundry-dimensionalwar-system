/**
 * Custom DiceTerm for Dimensional War skill checks
 * Allows notation like "1s5" where 5 is the skill level
 * Automatically converts skill level to appropriate die size using physical dice formulas
 */

import { getSkillDieSize, getPhysicalDiceFormula } from "./dice-utils";

// @ts-expect-error
export class DwSkillDiceTerm extends foundry.dice.terms.Die {
  static override DENOMINATION = "s";
  static override name = "Die"; // Must be "Die" to properly extend Die class
  static baseClassName = "DwSkillDiceTerm";

  skillLevel: number | undefined;

  constructor({
    number = 1,
    faces = 40,
    skillLevel,
    modifiers = [],
    results = [],
    options = {}
  }: {
    number?: number;
    faces?: number | foundry.dice.terms.RollTerm;
    skillLevel?: number;
    modifiers?: string[];
    results?: foundry.dice.terms.DiceTerm.Result[];
    options?: Record<string, unknown>;
  }) {
    // If skillLevel is provided, convert it to the appropriate die size
    let actualFaces: number = 40;
    if (typeof skillLevel === "number") {
      actualFaces = getSkillDieSize(skillLevel);
    } else if (typeof faces === "number") {
      actualFaces = faces as number;
    }

    // @ts-expect-error - Foundry types don't match implementation perfectly
    super({ number, faces: actualFaces, modifiers, results, options });
    this.skillLevel = skillLevel;
  }

  get baseName() {
    return DwSkillDiceTerm.baseClassName;
  }

  /**
   * Override evaluate to use physical dice formulas for true uniform distribution.
   * This is called once per term (not per die) during roll evaluation.
   */
  async evaluate({
    minimize = false,
    maximize = false
  }: {
    minimize?: boolean;
    maximize?: boolean;
  } = {}): Promise<this> {
    // Check if physical dice formulas are enabled
    const usePhysicalFormulas = // @ts-expect-error - Custom system namespace
    game.settings?.get("dimensionalwar", "usePhysicalDiceFormulas");

    // If disabled or setting not found, use default evaluation
    if (!usePhysicalFormulas) {
      return await super.evaluate({ minimize, maximize });
    }

    const dieSize = this.faces ?? 40;
    const formula = getPhysicalDiceFormula(dieSize);

    // If the formula is just "1dX" (fallback), use default evaluation
    if (
      formula.startsWith("1d") &&
      !formula.includes("+") &&
      !formula.includes("-") &&
      !formula.includes("*")
    ) {
      return await super.evaluate({ minimize, maximize });
    }

    // Roll all physical dice formulas without awaiting Dice So Nice
    const physicalRolls: Roll[] = [];
    const numDice = this.number ?? 1;

    for (let i = 0; i < numDice; i++) {
      const physicalRoll = await Roll.create(formula);
      await physicalRoll.evaluate({ minimize, maximize });
      physicalRolls.push(physicalRoll);

      const result = physicalRoll.total ?? 0;
      this.results.push({
        result,
        active: true
      });
    }

    // Show ALL dice to Dice So Nice at once (don't await - let them animate together)
    if ((game as any).dice3d && physicalRolls.length > 0) {
      // Fire all animations simultaneously
      const promises = physicalRolls.map(roll =>
        (game as any).dice3d.showForRoll(roll, game.user, true)
      );
      // Wait for all animations to start (but they'll run in parallel)
      await Promise.all(promises);
    }

    this._evaluated = true;
    return this;
  }

  /**
   * Override expression to show skill notation (e.g., "1s3")
   * Note: Cannot include physical formula here as it breaks Foundry's parser
   */
  get expression() {
    if (typeof this.skillLevel === "number") {
      return `${this.number}s${this.skillLevel}${this.modifiers.join("")}`;
    }
    return super.expression;
  }

  /**
   * Get the physical dice formula for display purposes
   */
  get physicalFormula() {
    if (typeof this.skillLevel === "number") {
      return getPhysicalDiceFormula(this.faces ?? 40);
    }
    return "";
  }

  /**
   * Determine the result category for a given roll result
   * @param result The roll result value
   * @returns Category label or null if not a special result
   */
  getResultCategory(result: number): string | null {
    const dieSize = this.faces ?? 40;

    // Calculate thresholds
    const bottom1Percent = Math.ceil(dieSize * 0.01);
    const bottom5Percent = Math.ceil(dieSize * 0.05);
    const top5Percent = Math.floor(dieSize * 0.95) + 1;
    const top1Percent = Math.floor(dieSize * 0.99) + 1;

    // Check categories from most extreme to least extreme
    if (result >= top1Percent) return "Divine";
    if (result >= top5Percent) return "Critical";
    if (result <= bottom1Percent) return "Divine Botch";
    if (result <= bottom5Percent) return "Botch";

    return null;
  }

  /**
   * Override the tooltip formula to show die size instead of skill level
   * This changes "10s3" to "10d60" in the tooltip
   */
  getTooltipData(): any {
    const data = super.getTooltipData();
    if (typeof this.skillLevel === "number") {
      // Replace the formula with the actual die size notation
      data.formula = `${this.number}d${this.faces}`;
    }
    return data;
  }

  /* -------------------------------------------- */
  /*  Factory Methods                             */
  /* -------------------------------------------- */

  /**
   * Parse a skill notation like "1s5" into a DwSkillDiceTerm
   * @override
   */
  static fromParseNode<Type>(node: Type): foundry.dice.terms.DiceTerm {
    const diceNode = node as foundry.dice.types.DiceRollParseNode;

    let number = diceNode.number ?? 1;
    let faces = diceNode.faces ?? 40;
    let skillLevel: number | undefined;

    // If faces is a number, treat it as the skill level
    if (typeof faces === "number") {
      skillLevel = faces;
      faces = getSkillDieSize(skillLevel);
    }

    const modifiers = Array.from(
      ((node as Type & { modifiers: string }).modifiers || "").matchAll(
        this.MODIFIER_REGEXP
      )
    ).map(([m]) => m);

    const cls = CONFIG.Dice.terms.s as unknown as typeof DwSkillDiceTerm;

    const data = {
      ...node,
      number,
      faces,
      skillLevel,
      modifiers,
      class: cls.baseClassName
    };

    return this.fromData(data);
  }

  /**
   * Construct a DwSkillDiceTerm from a provided data object
   */
  static fromData(data: Record<string, any>): foundry.dice.terms.DiceTerm {
    let cls = CONFIG.Dice.termTypes[data.class];
    if (!cls) {
      cls =
        Object.values(CONFIG.Dice.terms).find(
          c =>
            (c as unknown as typeof DwSkillDiceTerm).baseClassName ===
              data.class || c.name === data.class
        ) || foundry.dice.terms.Die;
    }
    return cls._fromData(data) as foundry.dice.terms.DiceTerm;
  }

  static _fromData(data: Record<string, any>): foundry.dice.terms.DiceTerm {
    if (data._number) data.number = Roll.fromData(data._number);
    if (data._faces) data.faces = Roll.fromData(data._faces);

    const term = new this(data);
    term._evaluated = data.evaluated ?? true;
    return term;
  }

  /**
   * Serialize the DwSkillDiceTerm to a data object
   */
  toJSON(): Record<string, any> {
    const data = super.toJSON();
    data.class = DwSkillDiceTerm.baseClassName; // Ensure correct class name for reconstruction
    data.skillLevel = this.skillLevel;
    return data;
  }
}
