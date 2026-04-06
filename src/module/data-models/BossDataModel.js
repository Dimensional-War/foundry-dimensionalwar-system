const { HTMLField, NumberField, SchemaField, StringField } =
  foundry.data.fields;

import { CharacterDataModel } from "./BaseDataModels";

export class BossDataModel extends CharacterDataModel {
  static defineSchema() {
    return {
      ...super.defineSchema()
    };
  }
}
