export class SystemActor extends Actor {
  prepareDerivedData() {
    super.prepareDerivedData();

    // Clamp health within the appropriate range.
    const { hp, mp } = this.system.resources;

    hp.min = -(hp.max * 3);
    hp.value = Math.clamped(hp.value, hp.min, hp.max);

    mp.min = 0;
    mp.value = Math.clamped(mp.value, mp.min, mp.max);
  }
}
