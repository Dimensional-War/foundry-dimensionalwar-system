import type {
  DeepPartial,
  EmptyObject,
  InterfaceToObject,
  SimpleMerge
} from "fvtt-types/utils";
import { BaseData } from "../types/base-data";

const { ArrayField, BooleanField, NumberField, SchemaField, StringField } =
  foundry.data.fields;

const { TypeDataModel } = foundry.abstract;

type MilestoneEntry = [name: string, description: string];

type AnyDocument = foundry.abstract.Document.Any;

type SimpleSkillName = string;

interface SkillWithSpecifier {
  name: string;
  specifier: string;
  label?: string;
  choices?: string[];
  descriptor?: string;
}

type SkillWithStatistics = [name: string, statistics: string[]];

type SkillDefinition =
  | SimpleSkillName
  | SkillWithSpecifier
  | SkillWithStatistics;

function defineSchemaStatistic(milestones: MilestoneEntry[] = []) {
  return new SchemaField({
    value: new NumberField({
      required: true,
      integer: true,
      min: 0,
      initial: 0
    }),
    milestones: new SchemaField(
      milestones.reduce<
        Record<
          string,
          foundry.data.fields.SchemaField<foundry.data.fields.DataSchema>
        >
      >((carry, current) => {
        carry[current[0]] = new SchemaField({
          name: new StringField({ initial: current[0], readonly: true }),
          description: new StringField({ initial: current[1], readonly: true }),
          attribute: new StringField(),
          value: new NumberField({ min: 0 })
        });
        return carry;
      }, {})
    ),
    primaryCharacteristic: new SchemaField({
      name: new StringField(),
      description: new StringField(),
      effect: new StringField(),
      formula: new StringField()
    })
  });
}

function defineSchemaSkills(names: SkillDefinition[] = []) {
  return new SchemaField(
    names.reduce<Record<string, foundry.data.fields.DataField>>(
      (carry, name) => {
        const skillObj: Record<string, foundry.data.fields.DataField> = {
          level: new NumberField({
            required: true,
            integer: true,
            min: 0,
            initial: 0
          } as never),
          bonus: new NumberField({
            required: true,
            integer: true,
            initial: 0
          } as never)
        };

        if (Array.isArray(name)) {
          // SkillWithStatistics: [skillName, statistics[]]
          const [skillName, statistics] = name;
          skillObj.statistics = new ArrayField(
            new SchemaField({
              name: new StringField({ required: true, choices: statistics })
            })
          );
          carry[skillName] = new SchemaField(skillObj);
        } else if (typeof name === "object") {
          // SkillWithSpecifier
          const skillName = name.name;
          const stringFieldOptions: Record<string, unknown> = {
            required: true,
            label: name.label
          };
          if (name.choices) {
            stringFieldOptions.choices = name.choices;
          }
          skillObj.specifier = new StringField(stringFieldOptions as never);
          if (name.descriptor) {
            skillObj.descriptor = new StringField({
              required: true,
              label: name.descriptor
            } as never);
          }
          carry[skillName] = new ArrayField(new SchemaField(skillObj));
        } else {
          // SimpleSkillName
          carry[name] = new SchemaField(skillObj);
        }

        return carry;
      },
      {}
    )
  );
}

export function defineSchemaCustoms() {
  return new ArrayField(
    new SchemaField({
      name: new StringField(),
      specialAttributes: new SchemaField({
        elemental: new StringField({
          choices: [
            "no_element",
            "fire",
            "water",
            "earth",
            "air",
            "shadow",
            "light",
            "force",
            "time",
            "darkness",
            "holy"
          ]
        }),
        restorative: new BooleanField({
          required: false,
          initial: false
        })
      }),
      mpCost: new NumberField({
        min: 1
      })
    })
  );
}

const actorSchema = () => ({
  statistics: new SchemaField({
    health: defineSchemaStatistic([
      ["Improved HP", "+500 Max HP"],
      ["Improved Soak", "+25 Phys/Mag Soak"],
      [
        "Improved Resistance",
        "+5% resistance to negative Status Effects (Capts at 50%)"
      ],
      ["Implacable", "+500 Death Threshold"],
      [
        "Endure",
        "+1% chance (1d100) that an attack that would KO instead leave the character at 1 HP"
      ],
      ["Improved Survival", "+10 to final result of survival roll"]
    ]),
    awareness: defineSchemaStatistic([
      ["Improved Melee", "+5 awareness bonus on melee attacks"],
      ["Improved Ranged", "+5 awareness bonus on ranged attacks"],
      ["Improved Magic", "+5 awareness bonus on magic attacks"],
      ["True Sight", "-10 to Illusion or Invisibility detection DCs"],
      ["Combat Reflexes", "Reduces DC for Grenade-like weapons by -10"],
      ["Eyes in the Back", "Reduces the 'roll outcome' of Sneak Attacks by -10"]
    ]),
    dexterity: defineSchemaStatistic([
      ["Improved Block", "+5 Dexterity bonus when blocking a melee attack"],
      ["Improved Dodge", "+5 Dexterity bonus when dodging an attack"],
      ["Improved Agility", "+5 Dexterity bonus when performing skill checks"],
      [
        "Improved Reaction",
        "+5 Dexterity Bonus when performing Flat Foot or Reaction-based dodges"
      ],
      ["Stylish", "+25 Style Points"]
    ]),
    strength: defineSchemaStatistic([
      ["Improved Physical Damage", "+100 damage"],
      ["Improved Slots", "+2 Inventory Slots"],
      [
        "Improved Momentum",
        "+5 Strength roll bonus when performing skill checks"
      ],
      ["Improved Item Effect", "+100 damage when using one-use items"],
      ["Pierce", "50 of character's physical damage ignores armor"],
      ["Juggernaut", "-100 damage reduction when bracing an attack"]
    ]),
    spirit: defineSchemaStatistic([
      ["Improved Spell Points", "+25 Spell Points"],
      ["Improved MP", "+200 Max MP"],
      ["Improved Crafting", "+5 Spirit roll bonus when crafting"],
      ["Improved Magic Damage", "+250 magic damage"],
      ["Improved Magic Defense", "+5 Spirit roll bonus when resisting magic"],
      ["Improved Item Use", "Raises DCs to avoid one-use items by +10"]
    ]),
    luck: defineSchemaStatistic([
      ["Improved Critical", "+500 damage when inflicting a critical hit"],
      ["Improved Luck", "+5 luck roll result"],
      ["Improved Luck Points", "+1 Luck Point"],
      ["Draw!", "+2% chance to draw a second Critical card"],
      ["Critical Defense", "-500 damage when struck by a Critical hit"],
      [
        "No-Sell",
        "+2% chance to nullify an opponent's Critical card when struck"
      ]
    ])
  }),
  resources: new SchemaField({
    hp: new SchemaField({
      min: new NumberField({
        required: true,
        integer: true,
        initial: 0
      }),
      value: new NumberField({
        required: true,
        integer: true,
        initial: 0
      }),
      max: new NumberField({
        required: true,
        integer: true,
        min: 0,
        initial: 0
      })
    }),
    mp: new SchemaField({
      min: new NumberField({
        required: true,
        integer: true,
        min: 0,
        initial: 0
      }),
      value: new NumberField({
        required: true,
        integer: true,
        min: 0,
        initial: 0
      }),
      max: new NumberField({
        required: true,
        integer: true,
        min: 0,
        initial: 0
      })
    })
  }),
  combat: new SchemaField({
    emp: new BooleanField({ required: true, initial: false }),
    defenseEffect: new StringField({
      required: true,
      initial: "no_effect",
      choices: ["no_effect", "protect", "shell", "wall", "shield"]
    }),
    braceType: new StringField({
      required: true,
      initial: "no_brace",
      choices: ["no_brace", "brace", "half_brace"]
    }),
    unsoakable: new BooleanField({ required: true, initial: false }),
    damageType: new StringField({
      required: true,
      initial: "0",
      choices: ["0", "1"]
    }),
    damage: new StringField({ required: false, initial: "0" })
  }),
  soak: new SchemaField({
    physicalBase: new NumberField({
      required: true,
      integer: true,
      min: 0,
      initial: 0
    }),
    magicalBase: new NumberField({
      required: true,
      integer: true,
      min: 0,
      initial: 0
    }),
    armoredPhysical: new NumberField({
      required: true,
      integer: true,
      min: 0,
      initial: 0
    }),
    armoredMagical: new NumberField({
      required: true,
      integer: true,
      min: 0,
      initial: 0
    }),
    shield: new NumberField({
      required: true,
      integer: true,
      min: 0,
      initial: 0
    }),
    shieldSoak: new NumberField({
      required: true,
      integer: true,
      min: 0,
      initial: 0
    }),
    shieldHitsLeft: new NumberField({
      required: true,
      integer: true,
      min: 0,
      initial: 0
    }),
    shieldHitsMax: new NumberField({
      required: true,
      integer: true,
      min: 0,
      initial: 0
    }),
    resolveOfAges: new BooleanField({ required: false, initial: false })
  }),
  gauges: new SchemaField({
    hasTrance: new BooleanField({ required: true, initial: false }),
    trance: new NumberField({
      required: true,
      integer: true,
      min: 0,
      initial: 0
    }),
    hasLimitBreak: new BooleanField({ required: true, initial: false }),
    limitBreak: new NumberField({
      required: true,
      integer: true,
      min: 0,
      initial: 0
    }),
    multiplier: new NumberField({ required: true, min: 0, initial: 1 })
  }),
  elements: new SchemaField({
    element1Name: new StringField({
      required: true,
      initial: "no_element"
    }),
    element1Level: new NumberField({
      required: true,
      integer: true,
      min: 0,
      max: 5,
      initial: 0
    }),
    element2Name: new StringField({
      required: true,
      initial: "no_element"
    }),
    element2Level: new NumberField({
      required: true,
      integer: true,
      min: 0,
      max: 5,
      initial: 0
    }),
    selectedElement1Name: new StringField({
      required: true,
      initial: "no_element"
    }),
    selectedElement1Level: new NumberField({
      required: true,
      integer: true,
      min: 0,
      max: 10,
      initial: 0
    }),
    selectedElement2Name: new StringField({
      required: true,
      initial: "no_element"
    }),
    selectedElement2Level: new NumberField({
      required: true,
      integer: true,
      min: 0,
      max: 10,
      initial: 0
    })
  }),
  armors: new ArrayField(
    new SchemaField({
      name: new StringField({ required: true, initial: "" }),
      physicalSoak: new NumberField({
        required: true,
        integer: true,
        min: 0,
        initial: 0
      }),
      magicalSoak: new NumberField({
        required: true,
        integer: true,
        min: 0,
        initial: 0
      }),
      shield: new NumberField({
        required: true,
        integer: true,
        min: 0,
        initial: 0
      }),
      shieldHitsMax: new NumberField({
        required: true,
        integer: true,
        min: 0,
        initial: 0
      }),
      shieldSoak: new NumberField({
        required: true,
        integer: true,
        min: 0,
        initial: 0
      }),
      hasEmp: new BooleanField({ required: true, initial: false }),
      equipped: new BooleanField({ required: true, initial: false })
    })
  ),
  actionHistory: new ArrayField(
    new SchemaField({
      name: new StringField({ required: true, initial: "" }),
      changes: new StringField({ required: true, initial: "[]" })
    })
  ),
  movementFlags: new SchemaField({
    hasFlight: new BooleanField({ required: true, initial: false }),
    hasParkour: new BooleanField({ required: true, initial: false }),
    hasTeleport: new BooleanField({ required: true, initial: false }),
    hasCrossCountry: new BooleanField({ required: true, initial: false }),
    burrowing: new NumberField({
      required: true,
      integer: true,
      min: 0,
      initial: 0
    })
  }),
  rolls: new ArrayField(
    new SchemaField({
      category: new StringField({
        choices: [
          "Offensive",
          "Defensive",
          "Movement",
          "Perception",
          "Vehicle Operation",
          "Non-Combat",
          "Artisan"
        ]
      }),
      bonusFormula: new StringField(),
      bonusNumber: new NumberField(),
      mpCost: new NumberField({
        required: true,
        integer: true,
        min: 0,
        initial: 0
      }),
      reasonBase: new StringField()
    })
  ),
  bonuses: new SchemaField({
    senses: new SchemaField({
      sight: new NumberField({ required: true, initial: 0 }),
      hearing: new NumberField({ required: true, initial: 0 }),
      smell: new NumberField({ required: true, initial: 0 }),
      taste: new NumberField({ required: true, initial: 0 }),
      touch: new NumberField({ required: true, initial: 0 })
    })
  })
});

export type ActorSchema = typeof actorSchema;

export class ActorDataModel<
  Schema extends foundry.data.fields.DataSchema,
  Parent extends AnyDocument,
  BaseData extends object = EmptyObject,
  DerivedData extends object = EmptyObject
> extends TypeDataModel<
  Schema,
  Parent,
  InterfaceToObject<BaseData>,
  InterfaceToObject<DerivedData>
> {
  static override defineSchema(): foundry.data.fields.DataSchema {
    return actorSchema();
  }
}

const characterSchema = () => ({
  ...ActorDataModel.defineSchema(),
  skills: new SchemaField({
    movement: defineSchemaSkills([
      ["Acrobatics", ["strength", "dexterity"]],
      ["Athletics", ["strength", "dexterity"]],
      ["Reaction", ["awareness"]],
      ["Swimming", ["strength", "dexterity"]]
    ]),
    senses: defineSchemaSkills([["Perception", ["awareness"]]]),
    utility: defineSchemaSkills([
      ["Computer Use", ["spirit"]],
      ["Concentration", ["spirit"]],
      ["Disguise", ["awareness", "spirit"]],
      ["Gather Info", ["awareness", "spirit"]],
      ["Linguistics / Decryption", ["spirit"]],
      ["Perception", ["awareness"]],
      ["Search", ["awareness"]],
      ["Speechcraft", ["spirit"]],
      ["Stealth", ["dexterity"]],
      ["Subterfuge", ["dexterity"]],
      ["Monster Training", ["spirit"]]
    ]),
    combat: defineSchemaSkills([
      "Assault Rifles",
      "Axes / Hammers",
      "Bows",
      {
        name: "Breath Weapon",
        specifier: "Element",
        descriptor: "Descriptor",
        choices: [
          "Fire",
          "Water",
          "Earth",
          "Air",
          "Shadow",
          "Light",
          "Force",
          "Time",
          "Darkness",
          "Holy",
          "Negative",
          "Void"
        ]
      },
      "Chakram",
      "Clubs / Maces",
      "Daggers",
      "Heavy Weapons",
      "Martial Arts",
      "Pistols",
      "Polearms",
      "Scythes",
      "Shields",
      "Shotguns",
      "Sniper Rifles",
      "Staves / Swallows",
      "Submachine Guns / Carbines",
      "Swords",
      "Throwing Weapons",
      "Whips / Flails"
    ]),
    magic: defineSchemaSkills([
      "Alchemy",
      "Arcana",
      "Assisted Magic",
      "Bardic Arcana",
      "Blue Magic",
      "Divine Arcana",
      "Druidic Arcana",
      "Ether / Technomancy",
      "Force Sensitivity",
      "Necromancy",
      "Runic Arcana",
      "Summoning",
      "Weapon Arcana",
      "Cryokinesis",
      "Electrokinesis",
      "Geokinesis",
      "Gyrokinesis",
      "Ipsokinesis",
      "Photokinesis",
      "Pyrokinesis",
      "Sonokinesis",
      "Telekinesis",
      "Telepathy / Psychokinesis"
    ]),
    artisan: defineSchemaSkills([
      "Arcane Science",
      "Blacksmithing",
      "Botany",
      "Cooking",
      "Engineering",
      "Medicine",
      "Performance",
      "Writing"
    ]),
    fieldTraining: defineSchemaSkills([
      "First Aid",
      "Survival",
      {
        name: "Vehicle Operation",
        specifier: "Type",
        choices: [
          "Light Ground",
          "Heavy Ground",
          "Light Water/Underwater",
          "Heavy Water/Underwater",
          "Light Aircraft/Spacecraft",
          "Heavy Aircraft/Spacecraft",
          "Light Mecha",
          "Heavy Mecha"
        ]
      }
    ])
  })
});

export type CharacterSchema = ReturnType<typeof characterSchema>;

export class CharacterDataModel<
  Schema extends CharacterSchema,
  Data extends BaseData.ActorUniversal
> extends ActorDataModel<Schema, Actor.Implementation, Data> {
  static override defineSchema() {
    return characterSchema();
  }
}
