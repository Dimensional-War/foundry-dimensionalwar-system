/**
 * Custom DiceTerm for Dimensional War skill checks
 * Allows notation like "1s5" where 5 is the skill level
 * Automatically converts skill level to appropriate die size
 */

import { getSkillDieSize } from "../utils/token-hud";

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
   * Override expression to show skill notation
   */
  get expression() {
    if (typeof this.skillLevel === "number") {
      return `${this.number}s${this.skillLevel}${this.modifiers.join("")}`;
    }
    return super.expression;
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
    data.skillLevel = this.skillLevel;
    return data;
  }
}
