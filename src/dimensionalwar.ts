// System entry point – Foundry loads this as the ESModule for the system.
import { SystemActor } from "./module/documents";
import { ActorType } from "./module/enums";
import {
  PcDataModel,
  NpcDataModel,
  AllyDataModel,
  EnemyDataModel,
  BossDataModel
} from "./module/data-models/index";
import {
  PcSheet,
  NpcSheet,
  AllySheet,
  EnemySheet,
  BossSheet
} from "./module/actor/ActorSheets";

const initHandler = () => {
  // Register the custom Actor document class
  CONFIG.Actor.documentClass = SystemActor as unknown as typeof Actor;

  // Register data models for each actor type
  CONFIG.Actor.dataModels = {
    [ActorType.Pc]: PcDataModel,
    [ActorType.Npc]: NpcDataModel,
    [ActorType.Ally]: AllyDataModel,
    [ActorType.Enemy]: EnemyDataModel,
    [ActorType.Boss]: BossDataModel
  } as unknown as typeof CONFIG.Actor.dataModels;

  // Register actor sheets
  foundry.documents.collections.Actors.unregisterSheet(
    "core",
    foundry.applications.sheets.ActorSheetV2
  );
  foundry.documents.collections.Actors.registerSheet(
    "dimensionalwar",
    PcSheet,
    { types: [ActorType.Pc], makeDefault: true, label: "PC" }
  );
  foundry.documents.collections.Actors.registerSheet(
    "dimensionalwar",
    NpcSheet,
    { types: [ActorType.Npc], makeDefault: true, label: "NPC" }
  );
  foundry.documents.collections.Actors.registerSheet(
    "dimensionalwar",
    AllySheet,
    { types: [ActorType.Ally], makeDefault: true, label: "Ally" }
  );
  foundry.documents.collections.Actors.registerSheet(
    "dimensionalwar",
    EnemySheet,
    { types: [ActorType.Enemy], makeDefault: true, label: "Enemy" }
  );
  foundry.documents.collections.Actors.registerSheet(
    "dimensionalwar",
    BossSheet,
    { types: [ActorType.Boss], makeDefault: true, label: "Boss" }
  );
};

if (import.meta.env.DEV) {
  initHandler();
} else {
  Hooks.once("init", initHandler);
}
