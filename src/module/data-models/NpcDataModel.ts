import { BaseData } from "../types/base-data";
import { CharacterDataModel, CharacterSchema } from "./BaseDataModels";

export class NpcDataModel extends CharacterDataModel<
  CharacterSchema,
  BaseData.ActorUniversal
> {
  static override defineSchema() {
    return {
      ...super.defineSchema()
    };
  }
}
