/**
 * CSB Importer - Converts Custom System Builder actor files to Dimensional War format
 */

import JSZip from "jszip";
import { ActorType } from "../enums";

interface CSBHiddenField {
  name: string;
  value: string;
}

interface CSBActorData {
  name: string;
  type: string;
  _id?: string;
  img?: string;
  system: {
    hidden?: CSBHiddenField[];
    props?: {
      [key: string]: any;
    };
    [key: string]: unknown;
  };
}

interface ImportResult {
  success: boolean;
  actor?: Actor;
  error?: string;
  name?: string;
}

/**
 * Safely extract a value from CSB props
 */
function getPropValue(
  props: Record<string, any> | undefined,
  key: string,
  defaultValue: any = undefined
): any {
  if (!props || !(key in props)) return defaultValue;
  const value = props[key];

  // Convert string numbers to actual numbers
  if (typeof value === "string" && !isNaN(Number(value))) {
    return Number(value);
  }

  return value !== undefined ? value : defaultValue;
}

/**
 * Extract numeric value from CSB formula string
 * Handles formulas like "${20+(ceil((athletics / 3)) * 5)}$"
 */
function extractNumericValue(formula: string): number {
  // Remove ${} wrapper
  const cleaned = formula.replace(/\$\{|\}\$/g, "").trim();

  // If it's just a number, return it
  if (!isNaN(Number(cleaned))) {
    return Number(cleaned);
  }

  // For complex formulas, try to evaluate safely
  try {
    // Replace variable names with default values for initial evaluation
    let evalStr = cleaned
      .replace(/\b(athletics|acrobatics|swimming|burrowing|hasFlight)\b/g, "0")
      .replace(/ceil/g, "Math.ceil");

    // Use Function constructor for safer eval (still isolated)
    const result = new Function(`return ${evalStr}`)();
    return isNaN(result) ? 0 : Math.floor(result);
  } catch (e) {
    console.warn(`Failed to evaluate CSB formula: ${formula}`, e);
    return 0;
  }
}

/**
 * Find a value in CSB hidden fields by name
 */
function findHiddenValue(
  hidden: CSBHiddenField[] | undefined,
  name: string
): string | undefined {
  if (!hidden) return undefined;
  const field = hidden.find(f => f.name === name);
  return field?.value;
}

/**
 * Determine actor type based on CSB template name and folder path
 */
function determineActorType(
  csbTemplateName: string,
  actorName: string,
  folderPath?: string
): "pc" | "npc" | "ally" | "enemy" | "boss" {
  const lowerActorName = actorName.toLowerCase();
  const lowerFolderPath = folderPath?.toLowerCase() || "";

  // Split folder path into individual segments for exact matching
  const folderSegments = lowerFolderPath
    .split("/")
    .map(s => s.trim())
    .filter(s => s.length > 0);

  // Helper function to check if any folder segment matches keywords
  const hasSegment = (...keywords: string[]): boolean => {
    return folderSegments.some(segment =>
      keywords.some(keyword => segment === keyword || segment === keyword + "s")
    );
  };

  // Check folder path first (most reliable for bulk imports)
  // Check in order of specificity: boss > enemy > ally > pc > npc
  // (More specific types first to avoid false matches)
  if (hasSegment("boss", "bosses")) {
    return "boss";
  }
  if (hasSegment("enemy", "enemies")) {
    return "enemy";
  }
  if (hasSegment("ally", "allies")) {
    return "ally";
  }
  if (hasSegment("pc", "pcs", "player", "players")) {
    return "pc";
  }
  if (hasSegment("npc", "npcs", "non-player")) {
    return "npc";
  }

  // Check actor name patterns for boss/enemy
  if (
    lowerActorName.includes("boss") ||
    lowerActorName.includes("lord") ||
    lowerActorName.includes("king")
  ) {
    return "boss";
  }

  // Check CSB template name (stored in csbData.type field for template files)
  if (csbTemplateName === "_dwpc") {
    return "pc";
  }

  if (csbTemplateName === "_dwnpc") {
    return "npc";
  }

  // Default to pc for unrecognized folders. Real CSB exports file NPCs,
  // enemies, allies, and bosses under explicit folder names, while PCs are
  // typically organized by player nickname (e.g. "aj/", "cody/"), which
  // can't be pattern-matched — so anything not explicitly flagged above is
  // almost always a PC.
  return "pc";
}

/**
 * Convert CSB actor data to Dimensional War system format
 */
function convertCSBToActor(
  csbData: CSBActorData,
  folderPath?: string
): Partial<Actor.UpdateData> {
  const actorType = determineActorType(csbData.type, csbData.name, folderPath);
  const props = csbData.system.props || {};

  // Extract values from CSB props
  const curHp = getPropValue(props, "cur_hp", 0);
  const maxHp = getPropValue(props, "max_hp", 0);
  const curMp = getPropValue(props, "cur_mp", 0);
  const maxMp = getPropValue(props, "max_mp", 0);

  // Calculate HP min (negative HP = death threshold = -(max × 3))
  const hpMin = -(maxHp * 3);

  // Base actor data (let data model initialize statistics with proper schema)
  const actorData: Partial<Actor.UpdateData> = {
    name: csbData.name,
    // @ts-expect-error - Custom actor type
    type: actorType,
    img: csbData.img || "icons/svg/mystery-man.svg",
    system: {
      resources: {
        hp: {
          min: hpMin,
          value: curHp,
          max: maxHp
        },
        mp: {
          min: 0,
          value: curMp,
          max: maxMp
        }
      },
      combat: {
        emp: getPropValue(props, "emp", false),
        defenseEffect: getPropValue(props, "defense_effect", "no_effect"),
        braceType: getPropValue(props, "brace_type", "no_brace"),
        unsoakable: getPropValue(props, "unsoakable", false),
        damageType: getPropValue(props, "damage_type", "0"),
        damage: getPropValue(props, "damage", "0")
      },
      soak: {
        physicalBase: getPropValue(props, "base_psoak", 0),
        magicalBase: getPropValue(props, "base_msoak", 0),
        armoredPhysical: getPropValue(props, "cur_armor_psoak", 0),
        armoredMagical: getPropValue(props, "cur_armor_msoak", 0),
        shield: getPropValue(props, "cur_armor_shield", 0),
        shieldSoak: getPropValue(props, "cur_armor_shield", 0),
        shieldHitsLeft: getPropValue(props, "shield_hits_left", 0),
        shieldHitsMax: getPropValue(props, "cur_armor_shield_hits_max", 0)
      },
      gauges: {
        hasTrance: getPropValue(props, "has_trance", false),
        trance: getPropValue(props, "cur_trance", 0),
        hasLimitBreak: getPropValue(props, "has_limitbreak", false),
        limitBreak: getPropValue(props, "cur_limitbreak", 0),
        multiplier: getPropValue(props, "gauge_mult", 1)
      },
      elements: {
        element1Name: getPropValue(props, "element_1_name", "no_element"),
        element1Level: getPropValue(props, "element_1_level", 0),
        element2Name: getPropValue(props, "element_2_name", "no_element"),
        element2Level: getPropValue(props, "element_2_level", 0),
        selectedElement1Name: getPropValue(
          props,
          "selected_element_1_name",
          "no_element"
        ),
        selectedElement1Level: getPropValue(
          props,
          "selected_element_1_level",
          0
        ),
        selectedElement2Name: getPropValue(
          props,
          "selected_element_2_name",
          "no_element"
        ),
        selectedElement2Level: getPropValue(
          props,
          "selected_element_2_level",
          0
        )
      },
      armors: [],
      actionHistory: [],
      movementFlags: {
        hasFlight: getPropValue(props, "hasFlight", false),
        hasParkour: getPropValue(props, "hasParkour", false),
        hasTeleport: getPropValue(props, "hasTeleport", false),
        hasCrossCountry: false,
        burrowing: getPropValue(props, "burrowing", 0)
      },
      rolls: []
    }
  };

  // Convert CSB armors to Dimensional War format
  const csbArmors = props.armors || {};

  // For enemies: Set soak values directly (simplified armor interface)
  if (actorType === "enemy") {
    let armorValues: any = null;

    // Try to find armor from armors object first (more detailed)
    if (typeof csbArmors === "object" && Object.keys(csbArmors).length > 0) {
      armorValues = Object.values(csbArmors).find(
        (armor: any) => armor && !armor.$deleted
      ) as any;
    }

    // Apply armor values to enemy soak fields (from armors object OR direct props)
    if (actorData.system) {
      // @ts-expect-error - soak exists in system data
      actorData.system.soak.armoredPhysical = armorValues
        ? Number(armorValues.armor_psoak || 0)
        : getPropValue(props, "cur_armor_psoak", 0);
      // @ts-expect-error - soak exists in system data
      actorData.system.soak.armoredMagical = armorValues
        ? Number(armorValues.armor_msoak || 0)
        : getPropValue(props, "cur_armor_msoak", 0);
      // @ts-expect-error - soak exists in system data
      actorData.system.soak.shield = armorValues
        ? Number(armorValues.armor_shield || 0)
        : getPropValue(props, "cur_armor_shield", 0);
      // @ts-expect-error - soak exists in system data
      actorData.system.soak.shieldSoak = armorValues
        ? Number(armorValues.armor_shield || 0)
        : getPropValue(props, "cur_armor_shield", 0);
      // @ts-expect-error - soak exists in system data
      actorData.system.soak.shieldHitsMax = armorValues
        ? Number(armorValues.armor_shield_hits_max || 0)
        : getPropValue(props, "cur_armor_shield_hits_max", 0);
      // @ts-expect-error - soak exists in system data
      actorData.system.soak.shieldHitsLeft = getPropValue(
        props,
        "shield_hits_left",
        0
      );
      // @ts-expect-error - combat exists in system data
      actorData.system.combat.emp = armorValues
        ? Boolean(armorValues.armor_emp)
        : Boolean(props.armor_emp || props.cur_armor_emp || props.emp);
    }
  } else if (
    typeof csbArmors === "object" &&
    Object.keys(csbArmors).length > 0
  ) {
    // For other actor types: Create armor array entries from armors object
    // @ts-expect-error - armors exists in system data
    actorData.system.armors = Object.values(csbArmors)
      .filter((armor: any) => armor && !armor.$deleted)
      .map((armor: any) => ({
        name: armor.armor_name || "Unnamed Armor",
        physicalSoak: Number(armor.armor_psoak || 0),
        magicalSoak: Number(armor.armor_msoak || 0),
        shield: Number(armor.armor_shield || 0),
        shieldHitsMax: Number(armor.armor_shield_hits_max || 0),
        shieldSoak: Number(armor.armor_shield || 0),
        emp: Boolean(armor.armor_emp),
        equipped: armor.armor_equip === "Unequip" // CSB uses "Unequip" when equipped
      }));
  }

  // Add skills for character types (pc, npc, ally, boss)
  if (
    actorType === ActorType.Pc ||
    actorType === ActorType.Npc ||
    actorType === ActorType.Ally ||
    actorType === ActorType.Boss
  ) {
    // @ts-expect-error - skills exists in character actor types
    actorData.system!.skills = {
      movement: {
        Acrobatics: {
          level: getPropValue(props, "acrobatics", 0),
          bonus: 0,
          statistics: []
        },
        Athletics: {
          level: getPropValue(props, "athletics", 0),
          bonus: 0,
          statistics: []
        },
        Reaction: { level: 0, bonus: 0, statistics: [] },
        Swimming: {
          level: getPropValue(props, "swimming", 0),
          bonus: 0,
          statistics: []
        }
      },
      senses: {
        Sight: { level: 0, bonus: 0, statistics: [] },
        Hearing: { level: 0, bonus: 0, statistics: [] },
        Smell: { level: 0, bonus: 0, statistics: [] },
        Taste: { level: 0, bonus: 0, statistics: [] },
        Touch: { level: 0, bonus: 0, statistics: [] }
      },
      utility: {
        "Computer Use": { level: 0, bonus: 0, statistics: [] },
        Concentration: { level: 0, bonus: 0, statistics: [] },
        Disguise: { level: 0, bonus: 0, statistics: [] },
        "Gather Info": { level: 0, bonus: 0, statistics: [] },
        Intimidate: { level: 0, bonus: 0, statistics: [] },
        Investigate: { level: 0, bonus: 0, statistics: [] },
        Stealth: { level: 0, bonus: 0, statistics: [] },
        "Streetwise/Intrigue": { level: 0, bonus: 0, statistics: [] },
        "Sleight of Hand": { level: 0, bonus: 0, statistics: [] }
      },
      combat: {
        Demolitions: { level: 0, bonus: 0, statistics: [] },
        Weapon: []
      },
      magic: {
        "Arcane Lore": { level: 0, bonus: 0, statistics: [] },
        Enchanting: { level: 0, bonus: 0, statistics: [] },
        "Spell Lore": { level: 0, bonus: 0, statistics: [] }
      },
      artisan: {
        Alchemy: { level: 0, bonus: 0, statistics: [] },
        Carpentry: { level: 0, bonus: 0, statistics: [] },
        Cooking: { level: 0, bonus: 0, statistics: [] },
        Leatherworking: { level: 0, bonus: 0, statistics: [] },
        Metalworking: { level: 0, bonus: 0, statistics: [] },
        Tailoring: { level: 0, bonus: 0, statistics: [] }
      }
    };
  }

  // Add customs array for pc/ally
  if (actorType === "pc" || actorType === "ally") {
    // @ts-expect-error - customs exists in pc/ally actor types
    actorData.system!.customs = [];
  }

  return actorData;
}

/**
 * Ensure a folder path exists, creating it and parent folders if needed
 */
async function ensureFolderPath(
  folderPath: string
): Promise<Folder | undefined> {
  if (!folderPath || folderPath === "") return undefined;

  const parts = folderPath.split("/").filter(p => p.length > 0);
  let currentFolder: Folder | undefined = undefined;

  for (let i = 0; i < parts.length; i++) {
    const folderName = parts[i];
    const parentId = currentFolder?._id;

    // Check if folder already exists
    const existing = game.folders?.find(
      f =>
        f.type === "Actor" &&
        f.name === folderName &&
        (parentId ? f.folder?._id === parentId : !f.folder)
    );

    if (existing) {
      currentFolder = existing as Folder;
    } else {
      // Create new folder
      const newFolder = await Folder.create({
        name: folderName,
        type: "Actor",
        folder: parentId
      });
      currentFolder = newFolder as Folder;
    }
  }

  return currentFolder;
}

/**
 * Import a single CSB actor file
 */
export async function importCSBActor(
  fileContent: string,
  fileName: string,
  folderId?: string,
  folderPath?: string
): Promise<ImportResult> {
  try {
    const csbData: CSBActorData = JSON.parse(fileContent);

    if (!csbData.name) {
      return {
        success: false,
        error: "Invalid CSB file: missing actor name",
        name: fileName
      };
    }

    const actorData = convertCSBToActor(csbData, folderPath);

    // Add folder if provided
    if (folderId) {
      actorData.folder = folderId;
    }

    // Create the actor
    // @ts-expect-error - actorData is compatible with Actor.create
    const actor = await Actor.create(actorData);

    if (!actor) {
      return {
        success: false,
        error: "Failed to create actor",
        name: csbData.name
      };
    }

    return {
      success: true,
      actor,
      name: csbData.name
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
      name: fileName
    };
  }
}

/**
 * Import multiple CSB actor files from a zip
 */
export async function importCSBActorsFromZip(
  file: File
): Promise<ImportResult[]> {
  const results: ImportResult[] = [];

  try {
    const zip = await JSZip.loadAsync(file);

    const jsonFiles = Object.keys(zip.files).filter(
      name => name.endsWith(".json") && !name.startsWith("__MACOSX")
    );

    for (const fileName of jsonFiles) {
      // Extract folder path from file name (e.g., "Enemies/Bosses/Dragon.json" -> "Enemies/Bosses")
      const pathParts = fileName.split("/");
      const folderPath =
        pathParts.length > 1 ? pathParts.slice(0, -1).join("/") : "";

      // Ensure folder exists
      const folder = folderPath
        ? await ensureFolderPath(folderPath)
        : undefined;

      // Import actor
      const fileContent = await zip.files[fileName].async("string");
      const result = await importCSBActor(
        fileContent,
        fileName,
        folder?._id ?? undefined,
        folderPath
      );
      results.push(result);
    }

    return results;
  } catch (error) {
    return [
      {
        success: false,
        error: error instanceof Error ? error.message : String(error),
        name: file.name
      }
    ];
  }
}

/**
 * Import CSB actors from individual JSON file
 */
export async function importCSBActorFromFile(
  file: File
): Promise<ImportResult> {
  try {
    const fileContent = await file.text();
    return await importCSBActor(fileContent, file.name);
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
      name: file.name
    };
  }
}
