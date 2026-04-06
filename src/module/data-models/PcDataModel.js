const {
  ArrayField,
  BooleanField,
  HTMLField,
  NumberField,
  SchemaField,
  StringField
} = foundry.data.fields;

import { CharacterDataModel, defineSchemaCustoms } from "./BaseDataModels";

export class PcDataModel extends CharacterDataModel {
  static defineSchema() {
    return {
      ...super.defineSchema(),
      customs: defineSchemaCustoms()
    };
  }
}
