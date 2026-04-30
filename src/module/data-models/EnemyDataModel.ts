import { CharacterDataModel } from "./BaseDataModels";

export class EnemyDataModel extends CharacterDataModel {
  static override defineSchema(): foundry.data.fields.DataSchema {
    return {
      ...super.defineSchema()
    };
  }
}
