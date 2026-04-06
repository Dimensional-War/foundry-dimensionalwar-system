const {
  ArrayField,
  BooleanField,
  HTMLField,
  NumberField,
  ObjectField,
  SchemaField,
  StringField
} = foundry.data.fields;

const { TypeDataModel } = foundry.abstract;

function defineSchemaStatistic(milestones = []) {
  return new SchemaField({
    value: new NumberField({
      required: true,
      integer: true,
      min: 0,
      initial: 0
    }),
    milestones: new SchemaField(
      milestones.reduce((carry, current) => {
        carry[current[0]] = new SchemaField({
          name: new StringField({ initial: current[0], readonly: true }),
          description: new StringField({ initial: current[1], readonly: true }),
          attribute: new StringField(),
          value: new NumberField({
            min: 0
          })
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

function defineSchemaSkills(names = []) {
  return new SchemaField(
    names.reduce((carry, name) => {
      let skillName = name;
      if (typeof name === "object") {
        skillName = name.name;
      }
      const skillObj = {
        level: new NumberField({
          required: true,
          integer: true,
          min: 0,
          max: 10,
          initial: 0
        })
      };
      if (!Array.isArray(name) && typeof name === "object" && name.specifier) {
        const stringFieldObj = {
          required: true,
          label: name.label
        };
        if (name.choices) {
          stringFieldObj.choices = name.choices;
        }
        skillObj.specifier = new StringField(stringFieldObj);
        if (name.descriptor) {
          skillObj.descriptor = new StringField({
            required: true,
            label: name.descriptor
          });
        }
        carry[skillName] = new ArrayField(new SchemaField(skillObj));
      } else if (Array.isArray(name)) {
        const [skillName, statistics] = name;
        skillObj.statistics = new ArrayField(
          new SchemaField({
            name: new StringField({ required: true, choices: statistics })
          })
        );
        carry[skillName] = new SchemaField(skillObj);
      } else {
        carry[skillName] = new SchemaField(skillObj);
      }
      return carry;
    }, {})
  );
}

export function defineSchemaCustoms() {
  return new ArrayField(
    new SchemaField({
      name: new StringField(),
      specialAttributes: new SchemaField({
        elemental: new StringField({
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
            "Holy"
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

export class ActorDataModel extends TypeDataModel {
  static defineSchema() {
    return {
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
          [
            "Eyes in the Back",
            "Reduces the 'roll outcome' of Sneak Attacks by -10"
          ]
        ]),
        dexterity: defineSchemaStatistic([
          ["Improved Block", "+5 Dexterity bonus when blocking a melee attack"],
          ["Improved Dodge", "+5 Dexterity bonus when dodging an attack"],
          [
            "Improved Agility",
            "+5 Dexterity bonus when performing skill checks"
          ],
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
          [
            "Improved Magic Defense",
            "+5 Spirit roll bonus when resisting magic"
          ],
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
      resouces: new SchemaField({
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
          amount: new NumberField({ min: 1 }),
          type: new StringField({ choices: ["die", "skill"] }),
          bonusFormula: new StringField(),
          bonusNumber: new NumberField(),
          reasonBase: new StringField()
        })
      )
    };
  }
}

export class CharacterDataModel extends ActorDataModel {
  static defineSchema() {
    return {
      ...super.defineSchema(),
      skills: new SchemaField({
        movement: defineSchemaSkills([
          ["Acrobatics", ["strength", "dexterity"]],
          ["Athletics", ["strength", "dexterity"]],
          ["Reaction", ["awareness"]],
          ["Swimming", ["strength", "dexterity"]]
        ]),
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
    };
  }
}
