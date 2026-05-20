import { ActorType } from "./enums";

export class SystemActor extends Actor {
  /**
   * Pre-create hook to set default token settings for actors
   */
  protected override async _preCreate(
    data: any,
    options: any,
    user: any
  ): Promise<boolean | void> {
    await super._preCreate(data, options, user);

    // Set default token settings based on actor type
    const prototypeToken = {
      bar1: { attribute: "resources.hp" },
      bar2: { attribute: "resources.mp" }
    };

    // PC and Ally: bars always visible, linked to owning actor (player-controlled characters)
    if (data.type === ActorType.Pc || data.type === ActorType.Ally) {
      this.updateSource({
        prototypeToken: {
          ...prototypeToken,
          displayBars: CONST.TOKEN_DISPLAY_MODES.ALWAYS,
          actorLink: true
        }
      });
    }

    // NPC, Enemy, Boss: bars visible to GM only
    if (data.type === "npc" || data.type === "enemy" || data.type === "boss") {
      this.updateSource({
        prototypeToken: {
          ...prototypeToken,
          displayBars: CONST.TOKEN_DISPLAY_MODES.OWNER
        }
      });
    }
  }

  override prepareDerivedData(): void {
    super.prepareDerivedData();

    // Clamp health within the appropriate range.
    const system = this.system as unknown as {
      resources: {
        hp: { min: number; value: number; max: number };
        mp: { min: number; value: number; max: number };
      };
    };
    if (!system.resources) return;
    const { hp, mp } = system.resources;

    hp.min = -(hp.max * 3);
    hp.value = Math.clamp(hp.value, hp.min, hp.max);

    mp.min = 0;
    mp.value = Math.clamp(mp.value, mp.min, mp.max);
  }

  /**
   * Get the skill level from actor.system.skills.movement[skillName]
   * Handles both simple structure {level, bonus} and complex structure with statistics array
   */
  getMovementSkillLevel(skillName: string): number {
    const system = this.system as any;
    const skill = system?.skills?.movement?.[skillName];
    if (!skill) return 0;

    // Handle both simple structure {level, bonus} and complex structure with statistics array
    if (Array.isArray(skill)) {
      return skill[0]?.level ?? 0;
    }
    return skill.level ?? 0;
  }

  /**
   * Calculate speed from skill level using the formula: 20 + (ceil(level / 3) * 5)
   */
  calculateSpeedFromLevel(skillLevel: number): number {
    return 20 + Math.ceil(skillLevel / 3) * 5;
  }

  /**
   * Get the walking speed based on Athletics skill level
   */
  get walkingSpeed(): number {
    const athleticsLevel = this.getMovementSkillLevel("Athletics");
    return this.calculateSpeedFromLevel(athleticsLevel);
  }

  /**
   * Get the acrobatics movement speed based on Acrobatics skill level
   */
  get acrobaticsSpeed(): number {
    const acrobaticsLevel = this.getMovementSkillLevel("Acrobatics");
    return this.calculateSpeedFromLevel(acrobaticsLevel);
  }

  /**
   * Get the swimming speed based on Swimming skill level
   */
  get swimmingSpeed(): number {
    const swimmingLevel = this.getMovementSkillLevel("Swimming");
    return this.calculateSpeedFromLevel(swimmingLevel);
  }

  /**
   * Get the burrowing speed based on the burrowing flag level
   */
  get burrowingSpeed(): number {
    const system = this.system as any;
    const burrowingLevel = system?.movementFlags?.burrowing ?? 0;
    return burrowingLevel > 0
      ? this.calculateSpeedFromLevel(burrowingLevel)
      : 0;
  }

  /**
   * Get the flying speed (same as walking speed)
   */
  get flyingSpeed(): number {
    return this.walkingSpeed;
  }
}
