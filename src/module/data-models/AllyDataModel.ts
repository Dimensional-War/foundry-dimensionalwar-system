import { CharacterDataModel, defineSchemaCustoms } from "./BaseDataModels";

export class AllyDataModel extends CharacterDataModel {
  static override defineSchema(): foundry.data.fields.DataSchema {
    return {
      ...super.defineSchema(),
      customs: defineSchemaCustoms()
    };
  }
}
