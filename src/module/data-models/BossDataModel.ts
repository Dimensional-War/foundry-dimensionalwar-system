import { BaseData } from "../types/base-data";
import { CharacterDataModel, CharacterSchema } from "./BaseDataModels";

export class BossDataModel extends CharacterDataModel<
  CharacterSchema,
  BaseData.boss
> {
  static override defineSchema() {
    return {
      ...super.defineSchema()
    };
  }
}
