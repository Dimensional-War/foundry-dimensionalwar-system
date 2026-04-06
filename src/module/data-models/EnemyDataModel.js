const { ArrayField, HTMLField, NumberField, SchemaField, StringField } =
  foundry.data.fields;

import { ActorDataModel } from "./BaseDataModels";

export class EnemyDataModel extends ActorDataModel {
  static defineSchema() {
    return {
      ...super.defineSchema(),
      rolls: new ArrayField(
        new SchemaField({
          name: new StringField(),
          roll: new StringField()
        })
      )
    };
  }
}
