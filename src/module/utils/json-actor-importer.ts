import { ActorType } from "@/module/enums";

export interface JsonImportResult {
  success: boolean;
  actor?: Actor;
  error?: string;
  name?: string;
}

function getDocId(doc: unknown): string | null {
  if (!doc || typeof doc !== "object") return null;
  const maybeDoc = doc as { id?: unknown; _id?: unknown };
  if (typeof maybeDoc.id === "string" && maybeDoc.id.trim()) return maybeDoc.id;
  if (typeof maybeDoc._id === "string" && maybeDoc._id.trim())
    return maybeDoc._id;
  return null;
}

const VALID_ROLL_CATEGORIES = new Set([
  "Offensive",
  "Defensive",
  "Movement",
  "Perception",
  "Vehicle Operation",
  "Non-Combat",
  "Artisan"
]);

const TYPE_MAP: Record<string, ActorType> = {
  npc: ActorType.Npc,
  monster: ActorType.Enemy,
  enemy: ActorType.Enemy,
  boss: ActorType.Boss,
  ally: ActorType.Ally,
  pc: ActorType.Pc
};

function toNumber(value: unknown, fallback = 0): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function toInt(value: unknown, fallback = 0): number {
  return Math.trunc(toNumber(value, fallback));
}

function toBool(value: unknown, fallback = false): boolean {
  if (value === undefined || value === null) return fallback;
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value !== 0;
  if (typeof value === "string") {
    const v = value.trim().toLowerCase();
    if (["1", "true", "yes", "y", "on"].includes(v)) return true;
    if (["0", "false", "no", "n", "off"].includes(v)) return false;
  }
  return fallback;
}

function normalizeActorType(
  value: unknown,
  fallback = ActorType.Npc
): ActorType {
  const key = String(value ?? "")
    .trim()
    .toLowerCase();
  return TYPE_MAP[key] || fallback;
}

function inferActorType(raw: any): ActorType {
  if (raw && typeof raw === "object") {
    if (raw.monster || raw.enemy) return ActorType.Enemy;
    if (raw.npc) return ActorType.Npc;
  }
  const hinted =
    raw?.type ?? raw?.actorType ?? raw?.kind ?? raw?.format ?? raw?.category;
  return normalizeActorType(hinted, ActorType.Npc);
}

function sanitizeElementName(name: unknown): string {
  const raw = String(name ?? "")
    .trim()
    .toLowerCase();
  if (!raw || raw === "none") return "no_element";
  return raw;
}

function unwrapFormat(raw: any): { data: any; forcedType: ActorType } {
  if (!raw || typeof raw !== "object") {
    return { data: raw, forcedType: ActorType.Npc };
  }

  if (raw.npc && typeof raw.npc === "object") {
    return { data: raw.npc, forcedType: ActorType.Npc };
  }

  if (raw.monster && typeof raw.monster === "object") {
    return { data: raw.monster, forcedType: ActorType.Enemy };
  }

  if (raw.enemy && typeof raw.enemy === "object") {
    return { data: raw.enemy, forcedType: ActorType.Enemy };
  }

  return { data: raw, forcedType: inferActorType(raw) };
}

export function parseTopLevelActors(payload: any): any[] {
  if (Array.isArray(payload)) return payload;
  if (!payload || typeof payload !== "object") return [payload];

  if (Array.isArray(payload.actors)) return payload.actors;
  if (Array.isArray(payload.npcs)) return payload.npcs;
  if (Array.isArray(payload.monsters)) return payload.monsters;
  if (Array.isArray(payload.enemies)) return payload.enemies;

  return [payload];
}

function normalizeRollCategory(category: unknown): string {
  if (!category) return "Offensive";
  const value = String(category).trim();
  if (VALID_ROLL_CATEGORIES.has(value)) return value;
  const lower = value.toLowerCase();
  if (lower === "attacks" || lower === "attack") return "Offensive";
  return "Offensive";
}

function toRollEntries(sourceRolls: any[]): any[] {
  if (!Array.isArray(sourceRolls)) return [];
  return sourceRolls.map(roll => ({
    category: normalizeRollCategory(roll?.category),
    bonusFormula: String(roll?.bonusFormula ?? roll?.formula ?? "1d20"),
    bonusNumber: toInt(roll?.bonusNumber ?? roll?.bonus, 0),
    reasonBase: String(roll?.reasonBase ?? roll?.name ?? "Attack")
  }));
}

function makeElementData(source: any): Record<string, any> {
  const out = {
    element1Name: "no_element",
    element1Level: 0,
    element2Name: "no_element",
    element2Level: 0,
    selectedElement1Name: "no_element",
    selectedElement1Level: 0,
    selectedElement2Name: "no_element",
    selectedElement2Level: 0
  };

  if (!source) return out;

  if (Array.isArray(source)) {
    const e1 = source[0] || null;
    const e2 = source[1] || null;
    if (e1) {
      out.element1Name = sanitizeElementName(e1.name ?? e1.element ?? e1.type);
      out.element1Level = toInt(e1.level, 0);
      out.selectedElement1Name = out.element1Name;
      out.selectedElement1Level = out.element1Level;
    }
    if (e2) {
      out.element2Name = sanitizeElementName(e2.name ?? e2.element ?? e2.type);
      out.element2Level = toInt(e2.level, 0);
      out.selectedElement2Name = out.element2Name;
      out.selectedElement2Level = out.element2Level;
    }
    return out;
  }

  if (typeof source === "string") {
    const name = sanitizeElementName(source);
    out.element1Name = name;
    out.element1Level = name === "no_element" ? 0 : 1;
    out.selectedElement1Name = out.element1Name;
    out.selectedElement1Level = out.element1Level;
    return out;
  }

  if (typeof source === "object") {
    if (source.element1Name || source.element2Name) {
      return {
        ...out,
        element1Name: sanitizeElementName(source.element1Name),
        element1Level: toInt(source.element1Level, 0),
        element2Name: sanitizeElementName(source.element2Name),
        element2Level: toInt(source.element2Level, 0),
        selectedElement1Name: sanitizeElementName(
          source.selectedElement1Name ?? source.element1Name
        ),
        selectedElement1Level: toInt(
          source.selectedElement1Level ?? source.element1Level,
          0
        ),
        selectedElement2Name: sanitizeElementName(
          source.selectedElement2Name ?? source.element2Name
        ),
        selectedElement2Level: toInt(
          source.selectedElement2Level ?? source.element2Level,
          0
        )
      };
    }

    const e1 = source.element1 ?? source.primary;
    const e2 = source.element2 ?? source.secondary;
    if (e1) {
      out.element1Name = sanitizeElementName(
        e1.name ?? e1.element ?? e1.type ?? e1
      );
      out.element1Level = toInt(e1.level, 0);
      out.selectedElement1Name = out.element1Name;
      out.selectedElement1Level = out.element1Level;
    }
    if (e2) {
      out.element2Name = sanitizeElementName(
        e2.name ?? e2.element ?? e2.type ?? e2
      );
      out.element2Level = toInt(e2.level, 0);
      out.selectedElement2Name = out.element2Name;
      out.selectedElement2Level = out.element2Level;
    }
  }

  return out;
}

function applySkills(targetSkills: any, sourceSkills: any): void {
  if (!targetSkills || !sourceSkills || typeof sourceSkills !== "object")
    return;

  const applySkillValue = (target: any, source: any) => {
    if (Array.isArray(target)) {
      if (!Array.isArray(source)) return;
      target.length = 0;
      for (const entry of source) {
        if (!entry || typeof entry !== "object") continue;
        target.push({
          level: toInt(entry.level, 0),
          bonus: toInt(entry.bonus, 0),
          specifier: String(entry.specifier ?? ""),
          descriptor:
            entry.descriptor === undefined
              ? undefined
              : String(entry.descriptor)
        });
      }
      return;
    }

    if (!target || typeof target !== "object") return;

    if (typeof source === "number") {
      target.level = toInt(source, target.level ?? 0);
      return;
    }

    if (!source || typeof source !== "object") return;
    if (source.level !== undefined)
      target.level = toInt(source.level, target.level ?? 0);
    if (source.bonus !== undefined)
      target.bonus = toInt(source.bonus, target.bonus ?? 0);
    if (Array.isArray(source.statistics)) {
      target.statistics = source.statistics
        .filter((stat: unknown) => typeof stat === "string")
        .map((name: unknown) => ({ name }));
    }
    if (source.specifier !== undefined)
      target.specifier = String(source.specifier);
    if (source.descriptor !== undefined)
      target.descriptor = String(source.descriptor);
  };

  for (const [categoryName, categoryData] of Object.entries(sourceSkills)) {
    const targetCategory = targetSkills[categoryName];
    if (!targetCategory || typeof categoryData !== "object" || !categoryData)
      continue;

    for (const [skillName, skillData] of Object.entries(categoryData)) {
      if (!(skillName in targetCategory)) continue;
      applySkillValue(targetCategory[skillName], skillData);
    }
  }
}

function applyFlatSkills(targetSkills: any, sourceFlatSkills: any): void {
  if (
    !targetSkills ||
    !sourceFlatSkills ||
    typeof sourceFlatSkills !== "object"
  )
    return;

  const categoryNames = Object.keys(targetSkills);
  for (const [skillName, skillData] of Object.entries(sourceFlatSkills)) {
    for (const categoryName of categoryNames) {
      const category = targetSkills[categoryName];
      if (!category || !(skillName in category)) continue;
      if (typeof skillData === "number") {
        if (!Array.isArray(category[skillName])) {
          category[skillName].level = toInt(
            skillData,
            category[skillName].level ?? 0
          );
        }
      } else if (
        skillData &&
        typeof skillData === "object" &&
        !Array.isArray(category[skillName])
      ) {
        const skillObject = skillData as Record<string, unknown>;
        if (skillObject.level !== undefined) {
          category[skillName].level = toInt(
            skillObject.level,
            category[skillName].level ?? 0
          );
        }
        if (skillObject.bonus !== undefined) {
          category[skillName].bonus = toInt(
            skillObject.bonus,
            category[skillName].bonus ?? 0
          );
        }
      }
      break;
    }
  }
}

function buildActorCreateData(rawEntry: any): {
  actorData: any;
  sourceData: any;
} {
  const { data, forcedType } = unwrapFormat(rawEntry);

  if (!data || typeof data !== "object") {
    throw new Error("Entry is not an object.");
  }

  const actorType = normalizeActorType(
    data.type ?? data.actorType ?? forcedType,
    forcedType
  );
  const name = String(data.name ?? data.actorName ?? "").trim();
  if (!name) throw new Error("Missing actor name.");

  const hpData = data.hp ?? data.resources?.hp ?? {};
  const maxHp = toInt(hpData.max ?? data.maxHp ?? data.hpMax, 0);
  const currentHp =
    hpData.current ?? hpData.value ?? data.currentHp ?? data.hpCurrent ?? maxHp;
  const hpValue = toInt(currentHp, maxHp);

  const mpData = data.mp ?? data.resources?.mp ?? {};
  const maxMpRaw = mpData.max ?? data.maxMp ?? data.mpMax;
  const hasMaxMp = maxMpRaw !== undefined && maxMpRaw !== null;
  const maxMp = hasMaxMp ? toInt(maxMpRaw, 0) : 0;
  const currentMpRaw =
    mpData.current ?? mpData.value ?? data.currentMp ?? data.mpCurrent;
  const mpValue =
    currentMpRaw === undefined || currentMpRaw === null
      ? maxMp
      : toInt(currentMpRaw, maxMp);

  const soakSource = data.soak ?? {};
  const basePhysicalSoak = toInt(
    soakSource.physicalBase ?? soakSource.basePhysical ?? data.basePhysicalSoak,
    0
  );
  const baseMagicalSoak = toInt(
    soakSource.magicalBase ?? soakSource.baseMagical ?? data.baseMagicalSoak,
    0
  );

  const armorPhysical = toInt(
    soakSource.armoredPhysical ??
      soakSource.armorPhysical ??
      data.armorPhysicalSoak ??
      data.armorPSoak,
    0
  );
  const armorMagical = toInt(
    soakSource.armoredMagical ??
      soakSource.armorMagical ??
      data.armorMagicalSoak ??
      data.armorMSoak,
    0
  );
  const shieldSoak = toInt(
    soakSource.shieldSoak ?? soakSource.shield ?? data.shieldSoak,
    0
  );
  const shieldHitsMax = toInt(
    soakSource.shieldHitsMax ?? data.shieldHitsMax,
    0
  );
  const shieldHitsLeft = toInt(
    soakSource.shieldHitsLeft ?? data.shieldHitsLeft ?? shieldHitsMax,
    shieldHitsMax
  );

  const movementSource = data.movement ?? data.movementFlags ?? {};
  const hasFlight = toBool(
    movementSource.flight ?? movementSource.hasFlight ?? data.flight,
    false
  );
  const hasParkour = toBool(
    movementSource.parkour ?? movementSource.hasParkour ?? data.parkour,
    false
  );
  const hasTeleport = toBool(
    movementSource.teleport ?? movementSource.hasTeleport ?? data.teleport,
    false
  );
  const hasCrossCountry = toBool(
    movementSource.running ??
      movementSource.hasCrossCountry ??
      movementSource.crossCountry ??
      data.running,
    false
  );
  const burrowing = toInt(movementSource.burrowing ?? data.burrowing, 0);

  const sensesBonuses = data.sensesBonuses ?? data.bonuses?.senses ?? {};
  const perceptionValue = data.perception ?? data.perceptionLevel;

  const rollSource = Array.isArray(data.rolls)
    ? data.rolls
    : Array.isArray(data.attacks)
      ? data.attacks
      : [];

  const actorSystem: Record<string, unknown> = {
    resources: {
      hp: {
        min: -(Math.max(0, maxHp) * 3),
        value: hpValue,
        max: Math.max(0, maxHp)
      },
      mp: {
        min: 0,
        value: Math.max(0, mpValue),
        max: Math.max(0, maxMp)
      }
    },
    soak: {
      physicalBase: Math.max(0, basePhysicalSoak),
      magicalBase: Math.max(0, baseMagicalSoak),
      armoredPhysical: Math.max(0, armorPhysical),
      armoredMagical: Math.max(0, armorMagical),
      shield: Math.max(0, shieldSoak),
      shieldSoak: Math.max(0, shieldSoak),
      shieldHitsMax: Math.max(0, shieldHitsMax),
      shieldHitsLeft: Math.max(0, shieldHitsLeft)
    },
    elements: makeElementData(data.elements),
    movementFlags: {
      hasFlight,
      hasParkour,
      hasTeleport,
      hasCrossCountry,
      burrowing: Math.max(0, burrowing)
    },
    bonuses: {
      senses: {
        sight: toInt(sensesBonuses.sight, 0),
        hearing: toInt(sensesBonuses.hearing, 0),
        smell: toInt(sensesBonuses.smell, 0),
        taste: toInt(sensesBonuses.taste, 0),
        touch: toInt(sensesBonuses.touch, 0)
      }
    },
    rolls: toRollEntries(rollSource)
  };

  if (perceptionValue !== undefined) {
    const perceptionLevel = toInt(perceptionValue, 0);
    actorSystem.skills = {
      senses: {
        Perception: {
          level: perceptionLevel,
          bonus: 0
        }
      },
      utility: {
        Perception: {
          level: perceptionLevel,
          bonus: 0
        }
      }
    };
  }

  const actorData = {
    name,
    type: actorType,
    img: data.img || "icons/svg/mystery-man.svg",
    system: actorSystem
  };

  return { actorData, sourceData: data };
}

export async function ensureActorFolderPath(
  folderPath: string
): Promise<Folder | null> {
  if (!folderPath) return null;
  const parts = String(folderPath)
    .split(/[\\/]+/)
    .map(p => p.trim())
    .filter(Boolean);
  if (!parts.length) return null;

  let current: Folder | null = null;
  for (const part of parts) {
    const parentId = getDocId(current);
    const existing = game.folders?.find(
      f =>
        f.type === "Actor" &&
        f.name === part &&
        ((parentId && getDocId(f.folder) === parentId) ||
          (!parentId && !f.folder))
    );

    if (existing) {
      current = existing as Folder;
      continue;
    }

    current = (await Folder.create({
      name: part,
      type: "Actor",
      folder: parentId
    })) as Folder;
  }

  return current;
}

function pickFolderPathValue(value: unknown): string {
  if (typeof value !== "string") return "";
  return value.trim();
}

function resolveEntryFolderPath(
  rawEntry: any,
  sourceData: any,
  defaultFolderPath: string
): string {
  const candidates = [
    rawEntry?.folderPath,
    rawEntry?.folderpath,
    rawEntry?.folder_path,
    rawEntry?.folder,
    rawEntry?.path,
    rawEntry?.destinationFolder,
    sourceData?.folderPath,
    sourceData?.folderpath,
    sourceData?.folder_path,
    sourceData?.folder,
    sourceData?.path,
    sourceData?.destinationFolder
  ];

  for (const candidate of candidates) {
    const path = pickFolderPathValue(candidate);
    if (path) return path;
  }

  return defaultFolderPath.trim();
}

export async function importJsonActors(
  payload: any,
  folderPath = ""
): Promise<JsonImportResult[]> {
  const folderCache = new Map<string, Folder | null>();

  const getFolderForPath = async (path: string): Promise<Folder | null> => {
    if (!path) return null;
    const key = path.trim();
    if (!key) return null;

    if (folderCache.has(key)) return folderCache.get(key) ?? null;
    const folder = await ensureActorFolderPath(key);
    folderCache.set(key, folder);
    return folder;
  };

  const entries = parseTopLevelActors(payload);
  const results: JsonImportResult[] = [];

  for (const entry of entries) {
    try {
      const { actorData, sourceData } = buildActorCreateData(entry);

      const entryFolderPath = resolveEntryFolderPath(
        entry,
        sourceData,
        folderPath
      );
      const entryFolder = await getFolderForPath(entryFolderPath);
      const entryFolderId = getDocId(entryFolder);
      if (entryFolderId) {
        actorData.folder = entryFolderId;
      }

      const actor = await Actor.create(actorData);
      if (!actor) throw new Error("Actor.create returned null/undefined.");

      const updateData: Record<string, unknown> = {};

      const perceptionValue =
        sourceData.perception ??
        sourceData.skills?.senses?.Perception?.level ??
        sourceData.skills?.utility?.Perception?.level;
      const perceptionBonus =
        sourceData.perceptionBonus ??
        sourceData.skills?.senses?.Perception?.bonus ??
        sourceData.skills?.utility?.Perception?.bonus;

      if (perceptionValue !== undefined) {
        updateData["system.skills.senses.Perception.level"] = toInt(
          perceptionValue,
          0
        );
        updateData["system.skills.utility.Perception.level"] = toInt(
          perceptionValue,
          0
        );
      }

      if (perceptionBonus !== undefined) {
        updateData["system.skills.senses.Perception.bonus"] = toInt(
          perceptionBonus,
          0
        );
        updateData["system.skills.utility.Perception.bonus"] = toInt(
          perceptionBonus,
          0
        );
      }

      if (
        (sourceData.skills && typeof sourceData.skills === "object") ||
        (sourceData.skillLevels && typeof sourceData.skillLevels === "object")
      ) {
        const systemObject =
          typeof actor.system?.toObject === "function"
            ? actor.system.toObject()
            : actor.system;
        const sysClone = foundry.utils.deepClone(systemObject);
        applySkills(sysClone.skills, sourceData.skills);
        applyFlatSkills(sysClone.skills, sourceData.skillLevels);
        updateData["system.skills"] = sysClone.skills;
      }

      if (Object.keys(updateData).length) {
        await actor.update(updateData);
      }

      results.push({ success: true, actor, name: actor.name });
    } catch (error) {
      results.push({
        success: false,
        error: error instanceof Error ? error.message : String(error),
        name: entry?.name || "Unknown"
      });
    }
  }

  return results;
}
