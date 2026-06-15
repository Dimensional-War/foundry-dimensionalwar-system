import { ActorType } from "./module/enums";

declare global {
  interface DataModelConfig {
    Actor: {
      [ActorType.Pc]: typeof PcDataModel;
      [ActorType.Npc]: typeof NpcDataModel;
    };
  }
}
