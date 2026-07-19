# JSON Actor Import Format

This document describes the JSON format supported by the Dimensional War JSON Actor Importer.

4. Optionally set a default destination folder.

## Supported top-level payload shapes

The importer accepts any of these:

1. Single actor object.
2. Array of actor objects.
3. Object containing one of these arrays:
   - `actors`
   - `npcs`
   - `monsters`
   - `enemies`

Examples:

```json
{
  "actors": [
      { "name": "Goblin", "type": "npc" },
      { "name": "Ogre", "type": "monster" }
      { "name": "Bandit", "type": "npc" },
      { "name": "Wyrm", "type": "enemy" }
   ]
}
```

## Supported entry wrappers

Each entry can be either direct actor data or wrapped in one of these keys:


- `npc`
   ```json
      "bonuses": {
        "senses": {
          "sight": 7,
          "hearing": 3,
          "smell": 0,
          "taste": 0,
          "touch": 0
        }
      },
   ```

Example:

```json
{
  "folderPath": "Enemies/Bandits",
  "npc": {
    "name": "Highwayman",
    "hp": { "max": 140 }
  }
}
````

## Type mapping

These values are accepted for actor type:

- `npc` -> npc
- `monster` -> enemy
- `enemy` -> enemy
- `boss` -> boss
- `ally` -> ally
- `pc` -> pc

If omitted, type defaults based on wrapper or falls back to npc.

## Folder routing

There are two ways to set destination folder:

1. Global default folder from the import dialog field.
2. Per-entry override in JSON.

Per-entry keys checked (first non-empty wins):

1. `folderPath`
2. `folder`
3. `path`
4. `destinationFolder`

These can exist on the outer entry object or inside wrapped data (`npc`, `monster`, `enemy`).

Nested folders use `/` separator and are created automatically.

## Core fields

Minimum required field:

- `name` (string)

Common optional fields:

- `type` or `actorType`
- `img`

### HP and MP

Supported inputs:

- `hp.max`, `hp.current` or `hp.value`
- `maxHp`, `currentHp`, `hpMax`, `hpCurrent`
- `mp.max`, `mp.current` or `mp.value`
- `maxMp`, `currentMp`, `mpMax`, `mpCurrent`

Defaults:

- HP current defaults to HP max.
- MP max defaults to 0 if omitted.
- MP current defaults to MP max.
- HP min is computed as `-(maxHp * 3)`.

### Soak and armor

Supported under `soak` and aliases:

- `physicalBase` or `basePhysical`
- `magicalBase` or `baseMagical`
- `armoredPhysical` or `armorPhysical`
- `armoredMagical` or `armorMagical`
- `shield` or `shieldSoak`
- `shieldHitsMax`, `shieldHitsLeft`

Missing values default to 0.

### Elements

Supported formats:

1. String (applies to element 1)
2. Array of up to two element objects
3. Object using:
   - `element1Name`, `element1Level`, `element2Name`, `element2Level`
   - optional `selectedElement*` fields
   - or `primary` / `secondary`

Defaults to no elements (`no_element`).

### Movement flags

Supported under `movement` or `movementFlags`:

- `flight` / `hasFlight`
- `parkour` / `hasParkour`
- `teleport` / `hasTeleport`
- `running` / `crossCountry` / `hasCrossCountry`
- `burrowing`

### Perception level

Use `perception` for the Perception skill level. The importer applies it to both:

- `system.skills.senses.Perception.level`
- `system.skills.utility.Perception.level`

### Sense bonuses

Use the nested shape that matches `system.bonuses.senses`:

```json
{
  "bonuses": {
    "senses": {
      "sight": 4,
      "hearing": 0,
      "smell": 0,
      "taste": 0,
      "touch": 0
    }
  }
}
```

Supported keys under `bonuses.senses`:

- `sight`
- `hearing`
- `smell`
- `taste`
- `touch`

### Skills

Supported in two styles:

1. Structured categories in `skills` matching system categories.
2. Flat map in `skillLevels` where importer tries to match skill keys across categories.

Perception is also supported as a top-level value:

- `perception`

That value sets both Perception skill entries listed above.

## Rolls and attacks

Yes. The importer can import attack roll entries.

Input sources:

1. `rolls` array
2. `attacks` array (used if `rolls` is not present)

Each entry supports:

- `category` (defaults to `Offensive`; `attack`/`attacks` maps to `Offensive`)
- `bonusFormula` (or alias `formula`; optional, defaults to `1d20`)
- `bonusNumber` (or alias `bonus`)
- `reasonBase` (or alias `name`, default `Attack`)

The formula defines the dice count. For normal rolls, use `1d20`, `2d6`, etc.
For skill-style rolls, use explicit skill notation such as `1s5`.

Valid categories:

- `Offensive`
- `Defensive`
- `Movement`
- `Perception`
- `Vehicle Operation`
- `Non-Combat`
- `Artisan`

Example:

```json
{
  "name": "Ghoul Brute",
  "type": "monster",
  "folderPath": "Enemies/Undead",
  "hp": { "max": 320 },
  "attacks": [
    {
      "name": "Claw",
      "category": "Offensive",
      "formula": "1d20",
      "bonus": 7
    },
    {
      "name": "Bite",
      "category": "attack",
      "bonusNumber": 5,
      "reasonBase": "Bite"
    }
  ]
}
```

## Error behavior

- An entry without a valid object or missing `name` fails.
- Import continues for other entries.
- Results show success/failure per entry.

## Full multi-actor example (2 enemies, 1 boss)

```json
{
  "actors": [
    {
      "name": "Bone Stalker",
      "type": "enemy",
      "folderPath": "Enemies/Undead",
      "img": "icons/creatures/undead/skeleton-warrior.webp",
      "hp": { "max": 180, "current": 180 },
      "mp": { "max": 20 },
      "soak": {
        "physicalBase": 2,
        "magicalBase": 1,
        "armoredPhysical": 3,
        "armoredMagical": 1,
        "shieldSoak": 0
      },
      "movement": {
        "hasCrossCountry": true
      },
      "perception": 7,
      "bonuses": {
        "senses": {
          "sight": 1,
          "hearing": 2,
          "smell": 0,
          "taste": 0,
          "touch": 0
        }
      },
      "attacks": [
        {
          "name": "Rusty Cleaver",
          "category": "Offensive",
          "bonus": 5
        }
      ]
    },
    {
      "monster": {
        "name": "Ash Hound",
        "folderPath": "Enemies/Beasts",
        "hp": { "max": 220 },
        "maxMp": 0,
        "elements": [{ "name": "fire", "level": 2 }],
        "movementFlags": {
          "hasCrossCountry": true,
          "hasParkour": true,
          "burrowing": 0
        },
        "rolls": [
          {
            "reasonBase": "Pounce",
            "category": "Offensive",
            "formula": "1d20",
            "bonusNumber": 6
          },
          {
            "reasonBase": "Track",
            "category": "Perception",
            "formula": "1d20",
            "bonusNumber": 4
          }
        ]
      }
    },
    {
      "name": "Warden of the Rift",
      "type": "boss",
      "folderPath": "Bosses/Chapter 1",
      "hp": { "max": 1600, "current": 1600 },
      "mp": { "max": 350, "current": 350 },
      "soak": {
        "physicalBase": 8,
        "magicalBase": 10,
        "armoredPhysical": 12,
        "armoredMagical": 14,
        "shieldSoak": 6,
        "shieldHitsMax": 5,
        "shieldHitsLeft": 5
      },
      "elements": {
        "element1Name": "darkness",
        "element1Level": 4,
        "element2Name": "holy",
        "element2Level": 3
      },
      "perception": 7,
      "bonuses": {
        "senses": {
          "sight": 7,
          "hearing": 3,
          "smell": 0,
          "taste": 0,
          "touch": 0
        }
      },
      "attacks": [
        {
          "name": "Rift Lance",
          "category": "attack",
          "formula": "1d20",
          "bonus": 11
        },
        {
          "name": "Gravity Crush",
          "category": "Offensive",
          "formula": "1d20",
          "bonusNumber": 9
        },
        {
          "name": "Void Sense",
          "category": "Perception",
          "formula": "1d20",
          "bonusNumber": 8
        }
      ]
    }
  ]
}
```
