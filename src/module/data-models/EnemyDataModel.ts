import { ActorDataModel } from "./BaseDataModels";

const { ArrayField, SchemaField, StringField } = foundry.data.fields;

export class EnemyDataModel extends ActorDataModel {
  static override defineSchema(): foundry.data.fields.DataSchema {
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
