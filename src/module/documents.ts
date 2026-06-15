import { markRaw } from "vue";
import { ActorType } from "./enums";

declare module "fvtt-types/configuration" {
  interface DocumentClassConfig {
    Actor: typeof SystemActor<Actor.SubType>;
  }
  interface ConfiguredActor<SubType extends Actor.SubType> {
    document: SystemActor<SubType>;
  }
}

export class SystemActor<
  SubType extends Actor.SubType = Actor.SubType
> extends Actor<SubType> {
  constructor(
    data: ConstructorParameters<typeof Actor>[0],
    context: ConstructorParameters<typeof Actor>[1]
  ) {
    super(data, context);
    markRaw(this.items);
    markRaw(this.effects);
  }
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

  override prepareBaseData(): void {
    super.prepareBaseData();
    const system = this.system as any;

    // Clear speeds so the getters below compute fresh from skills,
    // then seed system.speeds with those base values so Active Effects
    // (applied after prepareBaseData) can ADD/OVERRIDE them.
    system.speeds = undefined;
    system.speeds = {
      walking: this.walkingSpeed,
      acrobatics: this.acrobaticsSpeed,
      swimming: this.swimmingSpeed,
      burrowing: this.burrowingSpeed,
      flying: this.flyingSpeed
    };
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

  get walkingSpeed(): number {
    const speeds = (this.system as any)?.speeds;
    if (speeds?.walking !== undefined) return speeds.walking;
    return this.calculateSpeedFromLevel(
      this.getMovementSkillLevel("Athletics")
    );
  }
  set walkingSpeed(value: number) {
    (this.system as any).speeds.walking = value;
  }

  get acrobaticsSpeed(): number {
    const speeds = (this.system as any)?.speeds;
    if (speeds?.acrobatics !== undefined) return speeds.acrobatics;
    return this.calculateSpeedFromLevel(
      this.getMovementSkillLevel("Acrobatics")
    );
  }
  set acrobaticsSpeed(value: number) {
    (this.system as any).speeds.acrobatics = value;
  }

  get swimmingSpeed(): number {
    const speeds = (this.system as any)?.speeds;
    if (speeds?.swimming !== undefined) return speeds.swimming;
    return this.calculateSpeedFromLevel(this.getMovementSkillLevel("Swimming"));
  }
  set swimmingSpeed(value: number) {
    (this.system as any).speeds.swimming = value;
  }

  get burrowingSpeed(): number {
    const system = this.system as any;
    if (system?.speeds?.burrowing !== undefined) return system.speeds.burrowing;
    const burrowingLevel = system?.movementFlags?.burrowing ?? 0;
    return burrowingLevel > 0
      ? this.calculateSpeedFromLevel(burrowingLevel)
      : 0;
  }
  set burrowingSpeed(value: number) {
    (this.system as any).speeds.burrowing = value;
  }

  get flyingSpeed(): number {
    const speeds = (this.system as any)?.speeds;
    if (speeds?.flying !== undefined) return speeds.flying;
    return this.walkingSpeed;
  }
  set flyingSpeed(value: number) {
    (this.system as any).speeds.flying = value;
  }
}
