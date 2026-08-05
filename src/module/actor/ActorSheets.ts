import { type Component } from "vue";
import { DwBaseSheet } from "./DwBaseSheet";
import ActorSheet from "./shared/ActorSheet.vue";

export class PcSheet extends DwBaseSheet {
  get vueComponent(): Component {
    return ActorSheet;
  }

  static DEFAULT_OPTIONS = {
    classes: ["dw-sheet", "actor-sheet", "pc"],
    window: { resizable: true },
    position: { width: 700, height: 601 }
  };
}

export class NpcSheet extends DwBaseSheet {
  get vueComponent(): Component {
    return ActorSheet;
  }

  static DEFAULT_OPTIONS = {
    classes: ["dw-sheet", "actor-sheet", "npc"],
    window: { resizable: true },
    position: { width: 700, height: 601 }
  };
}

export class AllySheet extends DwBaseSheet {
  get vueComponent(): Component {
    return ActorSheet;
  }

  static DEFAULT_OPTIONS = {
    classes: ["dw-sheet", "actor-sheet", "ally"],
    window: { resizable: true },
    position: { width: 700, height: 601 }
  };
}

export class EnemySheet extends DwBaseSheet {
  get vueComponent(): Component {
    return ActorSheet;
  }

  static DEFAULT_OPTIONS = {
    classes: ["dw-sheet", "actor-sheet", "enemy"],
    window: { resizable: true },
    position: { width: 700, height: 601 }
  };
}

export class BossSheet extends DwBaseSheet {
  get vueComponent(): Component {
    return ActorSheet;
  }

  static DEFAULT_OPTIONS = {
    classes: ["dw-sheet", "actor-sheet", "boss"],
    window: { resizable: true },
    position: { width: 700, height: 601 }
  };
}
