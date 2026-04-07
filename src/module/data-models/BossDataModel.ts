import { CharacterDataModel } from "./BaseDataModels";

export class BossDataModel extends CharacterDataModel {
  static override defineSchema(): foundry.data.fields.DataSchema {
    return {
      ...super.defineSchema()
    };
  }
}
