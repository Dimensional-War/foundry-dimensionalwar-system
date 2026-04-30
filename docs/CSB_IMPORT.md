# CSB Actor Import System

This system provides tools to import actor data from Custom System Builder (CSB) JSON files into the Dimensional War system.

## Features

- **Individual Actor Import**: Import a single CSB actor JSON file
- **Bulk ZIP Import**: Import multiple actors from a ZIP file containing CSB JSON files
- **Actor Type Detection**: Automatically determines actor type (PC, NPC, Ally, Enemy, Boss) based on template name and actor name
- **Data Conversion**: Converts CSB data format to Dimensional War system format with proper schema

## How to Use

### Method 1: Actors Directory Button

1. Open the **Actors Directory** in Foundry VTT
2. Look for the **"Import CSB"** button next to the Create Actor button
3. Click the button to open the import dialog

### Method 2: Game Settings Menu

1. Open **Game Settings** (click the gear icon)
2. Select **Configure Settings**
3. Find **"Import CSB Actors"** in the system settings
4. Click to open the import dialog

## Import Dialog

The import dialog provides two options:

### Import Individual Actor

1. Click **"Choose File"** under "Import Individual Actor"
2. Select a `.json` file exported from Custom System Builder
3. Click **"Import Actor"**
4. The actor will be created in your Actors directory

### Bulk Import from ZIP

1. Click **"Choose File"** under "Bulk Import from ZIP"
2. Select a `.zip` file containing multiple CSB actor JSON files
3. Click **"Import from ZIP"**
4. All valid actors will be imported
5. View the results summary showing successful and failed imports

## Data Conversion

The importer converts CSB data to the Dimensional War format:

### Supported Fields

- **Actor Name**: Preserved from CSB file
- **Actor Image**: Defaults to mystery-man icon if not specified
- **Actor Type**: Auto-detected using multiple strategies (in order of priority):
  1. **Folder Path** (most reliable for bulk imports):
     - Folder named `boss` or `bosses` → Boss
     - Folder named `enemy` or `enemies` → Enemy
     - Folder named `ally` or `allies` → Ally
     - Folder named `pc`, `pcs`, `player`, or `players` → PC
     - Folder named `npc`, `npcs`, or `non-player` → NPC
  2. **Actor Name Patterns**:
     - Names containing "boss", "lord", or "king" → Boss
  3. **CSB Template Name**:
     - `_dwpc` → PC
     - `_dwnpc` → NPC
  4. **Default**: NPC (if no matches found)

**Note**: Folder detection uses exact segment matching, so a path like `monsters/npcs/dragon.json` correctly detects "npc" without false matches from "pc" substring.

### Movement Flags

The importer extracts movement data from CSB hidden fields:

- **Flight**: Detected from `hasFlight` field
- **Burrowing**: Detected from `burrowingSpeed` field

### Default Values

All actors are created with default values for:

- Resources (HP, MP)
- Statistics (Health, Awareness, Dexterity, Strength, Spirit, Luck)
- Combat settings
- Soak values
- Gauges (Trance, Limit Break)
- Elements
- Skills (for character types)

## File Format Requirements

### Individual JSON Files

- Must be valid JSON format
- Must have a `name` field
- Should have a `type` field (e.g., `_template`, `_dwpc`, `_dwnpc`)
- Can include CSB `system.hidden` fields for additional data

### ZIP Files

- Must be a valid ZIP archive
- Can contain JSON files in subdirectories for automatic type detection
- **Recommended folder structure**:
  ```
  actors.zip
  ├── pcs/
  │   ├── John.json
  │   └── Sarah.json
  ├── npcs/
  │   ├── Merchant.json
  │   └── Guard.json
  ├── enemies/
  │   ├── Goblin.json
  │   └── Orc.json
  ├── bosses/
  │   └── Dragon.json
  └── allies/
      └── Companion.json
  ```
- Files starting with `__MACOSX` are ignored
- Only `.json` files are processed
- Nested folders are supported (e.g., `monsters/enemies/undead/zombie.json` → Enemy)

## Troubleshooting

### Import Failed

If an import fails, check the error message in the results panel:

- **"Invalid CSB file: missing actor name"**: The JSON file doesn't have a required `name` field
- **"Failed to create actor"**: Foundry couldn't create the actor (check permissions)
- JSON parsing errors: The file is not valid JSON format

### Actors Not Appearing

- Refresh the Actors Directory (F5)
- Check that you have permission to create actors
- Verify the actor type is supported (PC, NPC, Ally, Enemy, Boss)

## Technical Details

### Files

- **Importer Utility**: `src/module/utils/csb-importer.ts`
- **Import Dialog**: `src/module/actor/shared/ImportCSBDialog.vue`
- **Dialog Launcher**: `src/module/utils/csb-import-dialog.ts`
- **System Registration**: `src/dimensionalwar.ts`

### Dependencies

- **jszip**: Required for ZIP file handling
- **Vue 3**: For dialog UI components

## Future Enhancements

Potential improvements for future versions:

- [ ] Import items (weapons, armor, abilities) from CSB actors
- [ ] Preserve more CSB-specific data (action history, rolls)
- [ ] Custom field mapping configuration
- [ ] Import preview before creating actors
- [ ] Batch actor editing after import
- [ ] Export actors back to CSB format
