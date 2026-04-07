export class SystemActor extends Actor {
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
}
