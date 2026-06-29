import { BaseData } from "../types/base-data";
import { CharacterDataModel, CharacterSchema } from "./BaseDataModels";

export class EnemyDataModel extends CharacterDataModel<
  CharacterSchema,
  BaseData.enemy
> {
  static override defineSchema() {
    return {
      ...super.defineSchema()
    };
  }
}
