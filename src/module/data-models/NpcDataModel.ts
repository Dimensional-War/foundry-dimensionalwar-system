import { CharacterDataModel } from "./BaseDataModels";

export class NpcDataModel extends CharacterDataModel {
  static override defineSchema(): foundry.data.fields.DataSchema {
    return {
      ...super.defineSchema()
    };
  }
}
