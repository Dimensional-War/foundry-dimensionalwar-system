import {
  AllyDataModel,
  BossDataModel,
  EnemyDataModel,
  NpcDataModel,
  PcDataModel
} from "./module/data-models";
import { ActorType } from "./module/enums";
import { SystemActor } from "./module/documents";

declare global {
  interface DataModelConfig {
    Actor: {
      [ActorType.Pc]: typeof PcDataModel;
      [ActorType.Npc]: typeof NpcDataModel;
      [ActorType.Ally]: typeof AllyDataModel;
      [ActorType.Enemy]: typeof EnemyDataModel;
      [ActorType.Boss]: typeof BossDataModel;
    };
  }
}

declare module "fvtt-types/configuration" {
  interface SystemNameConfig {
    name: "dimensionalwar";
  }

  interface SystemConfig {
    Item: {
      discriminate: "all";
    };
    Actor: {
      discriminate: "all";
    };
  }

  interface AssumeHookRan {
    ready: true;
  }

  interface DataModelConfig {
    Actor: {
      [ActorType.Pc]: typeof PcDataModel;
      [ActorType.Npc]: typeof NpcDataModel;
      [ActorType.Ally]: typeof AllyDataModel;
      [ActorType.Enemy]: typeof EnemyDataModel;
      [ActorType.Boss]: typeof BossDataModel;
    };
  }

  interface DocumentClassConfig {
    Actor: typeof SystemActor;
  }
  interface ConfiguredActor<SubType extends Actor.SubType> {
    document: SystemActor<SubType>;
  }
}
