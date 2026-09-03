export declare namespace BaseData {
  interface Statistic {
    value: number;
    milestones: {
      [name: string]: {
        name: string;
        description: string;
        attribute: string;
        value: number;
      };
    };
    primaryCharacteristic: {
      name: string;
      description: string;
      effect: string;
      formula: string;
    };
  }
  interface Skill {
    level: number;
    bonus: number;
    statistics?: { name: string }[];
    specifier?: string;
    descriptor?: string;
  }
  interface Custom {
    name: string;
    specialAttributes: {
      elemental: string;
      restorative: boolean;
    };
    mpCost: number;
  }
  interface ActorUniversal {
    statistics: {
      health: Statistic;
      awareness: Statistic;
      dexterity: Statistic;
      strength: Statistic;
      spirit: Statistic;
      luck: Statistic;
    };
    resources: {
      hp: {
        min: number;
        value: number;
        max: number;
      };
      mp: {
        min: number;
        value: number;
        max: number;
      };
    };
    combat: {
      emp: boolean;
      defenseEffect: "no_effect" | "protect" | "shell" | "wall" | "shield";
      braceType: "no_brace" | "brace" | "half_brace";
      unsoakable: boolean;
      damageType: "0" | "1";
      damage: number;
    };
    soak: {
      soak: number;
      physicalBase: number;
      magicalBase: number;
      armoredPhysical: number;
      armoredMagical: number;
      shield: number;
      shieldSoak: number;
      shieldHitsLeft: number;
      shieldHitsMax: number;
      resolveOfAges: boolean;
    };
    gauges: {
      hasTrance: boolean;
      trance: number;
      hasLimitBreak: boolean;
      limitBreak: number;
      multiplier: number;
    };
    elements: {
      element1Name: string;
      element1Level: number;
      element2Name: string;
      element2Level: number;
      selectedElement1Name: string;
      selectedElement1Level: number;
      selectedElement2Name: string;
      selectedElement2Level: number;
    };
    armors: {
      name: string;
      physicalSoak: number;
      magicalSoak: number;
      shield: number;
      shieldHitsMax: number;
      shieldSoak: number;
      hasEmp: boolean;
      equipped: boolean;
    };
    actionHistory: {
      name: string;
      changes: string;
    }[];
    movementFlags: {
      hasFlight: boolean;
      hasImprovedFlight: boolean;
      hasParkour: boolean;
      hasTeleport: boolean;
      hasCrossCountry: boolean;
      burrowing: number;
    };
    rolls: {
      category:
        | "Offensive"
        | "Defensive"
        | "Movement"
        | "Perception"
        | "Vehicle Operation"
        | "Non-Combat"
        | "Artisan";
      bonusFormula: string;
      bonusNumber: number;
      mpCost: number;
      reasonBase: string;
    }[];
    skills: {
      movement: {
        Acrobatics: Skill;
        Athletics: Skill;
        Reaction: Skill;
        Swimming: Skill;
      };
      utility: {
        "Computer Use": Skill;
        Concentration: Skill;
        Disguise: Skill;
        "Gather Info": Skill;
        "Linguistics / Decryption": Skill;
        Perception: Skill;
        Search: Skill;
        Speechcraft: Skill;
        Stealth: Skill;
        Subterfuge: Skill;
        "Monster Training": Skill;
      };
      combat: {
        "Assault Rifles": Skill;
        "Axes / Hammers": Skill;
        Bows: Skill;
        "Breath Weapon": Skill;
        Chakram: Skill;
        "Clubs / Maces": Skill;
        Daggers: Skill;
        "Heavy Weapons": Skill;
        "Martial Arts": Skill;
        Pistols: Skill;
        Polearms: Skill;
        Scythes: Skill;
        Shields: Skill;
        Shotguns: Skill;
        "Sniper Rifles": Skill;
        "Staves / Swallows": Skill;
        "Submachine Guns / Carbines": Skill;
        Swords: Skill;
        "Throwing Weapons": Skill;
        "Whips / Flails": Skill;
      };
      magic: {
        Alchemy: Skill;
        Arcana: Skill;
        "Assisted Magic": Skill;
        "Bardic Arcana": Skill;
        "Blue Magic": Skill;
        "Divine Arcana": Skill;
        "Druidic Arcana": Skill;
        "Ether / Technomancy": Skill;
        "Force Sensitivity": Skill;
        Necromancy: Skill;
        "Runic Arcana": Skill;
        Summoning: Skill;
        "Weapon Arcana": Skill;
        Cryokinesis: Skill;
        Electrokinesis: Skill;
        Geokinesis: Skill;
        Gyrokinesis: Skill;
        Ipsokinesis: Skill;
        Photokinesis: Skill;
        Pyrokinesis: Skill;
        Sonokinesis: Skill;
        Telekinesis: Skill;
        "Telepathy / Psychokinesis": Skill;
      };
      artisan: {
        "Arcane Science": Skill;
        Blacksmithing: Skill;
        Botany: Skill;
        Cooking: Skill;
        Engineering: Skill;
        Medicine: Skill;
        Performance: Skill;
        Writing: Skill;
      };
      fieldTraining: {
        "First Aid": Skill;
        Survival: Skill;
        "Vehicle Operation": Skill;
      };
    };
    bonuses: {
      senses: {
        sight: number;
        hearing: number;
        smell: number;
        taste: number;
        touch: number;
      };
    };
  }
  interface pc extends ActorUniversal {
    customs: Custom[];
  }
  interface npc extends ActorUniversal {}
  interface ally extends ActorUniversal {
    customs: Custom[];
  }
  interface enemy extends ActorUniversal {}
  interface boss extends ActorUniversal {}

  type RollEntry = {
    category: string;
    bonusFormula: string;
    bonusNumber: number;
    mpCost: number;
    reasonBase: string;
    /** Restricts this roll to a specific transformation form's id; blank = always available. */
    formId?: string;
  };

  type DwSystem = {
    rolls: RollEntry[];
    resources: {
      hp: { value: number; max: number; min: number };
      mp: { value: number; max: number; min: number };
    };
    skills?: {
      movement?: Record<string, any>;
      senses?: Record<string, any>;
      utility?: Record<string, any>;
    };
    bonuses?: {
      senses?: Record<string, number>;
    };
    combat: {
      emp: boolean;
      defenseEffect: string;
      braceType: string;
      unsoakable: boolean;
      damageType: string;
      damage: string;
    };
    movementFlags?: {
      hasFlight: boolean;
      hasParkour: boolean;
      hasTeleport: boolean;
      hasCrossCountry: boolean;
      burrowing: number;
    };
    soak: {
      physicalBase: number;
      magicalBase: number;
      armoredPhysical: number;
      armoredMagical: number;
      shield: number;
      shieldSoak: number;
      shieldHitsLeft: number;
      shieldHitsMax: number;
      resolveOfAges?: boolean;
    };
    gauges: {
      hasTrance: boolean;
      trance: number;
      hasLimitBreak: boolean;
      limitBreak: number;
      multiplier: number;
    };
    elements: {
      element1Name: string;
      element1Level: number;
      element2Name: string;
      element2Level: number;
      selectedElement1Name: string;
      selectedElement1Level: number;
      selectedElement2Name: string;
      selectedElement2Level: number;
    };
    armors?: {
      name: string;
      physicalSoak: number;
      magicalSoak: number;
      shieldSoak: number;
      shield: number;
      shieldHitsMax: number;
      hasEmp: boolean;
      equipped: boolean;
    }[];
    actionHistory: { name: string; changes: string }[];
    transformations?: FormEntry[];
    alternateForms?: FormEntry[];
    formState?: {
      activeTransformationId?: string;
      activeAlternateFormId?: string;
      baseSnapshot?: Record<string, unknown>;
      preAlternateSnapshot?: Record<string, unknown>;
      baseToken?: { src?: string; width?: number; height?: number };
    };
  };

  type FormEntry = {
    id: string;
    name: string;
    img?: string;
    tokenWidth?: number;
    tokenHeight?: number;
    statistics?: Record<string, { value: number }>;
    resources?: { hp?: { max: number }; mp?: { max: number } };
    soak?: { physicalBase?: number; magicalBase?: number };
    elements?: {
      element1Name?: string;
      element1Level?: number;
      element2Name?: string;
      element2Level?: number;
    };
  };
}
