const { HTMLField, NumberField, SchemaField, StringField } =
  foundry.data.fields;

import { CharacterDataModel, defineSchemaCustoms } from "./BaseDataModels";

export class NpcDataModel extends CharacterDataModel {
  static defineSchema() {
    return {
      ...super.defineSchema(),
      customs: defineSchemaCustoms()
    };
  }
}
