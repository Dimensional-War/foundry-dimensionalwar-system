import { BaseData } from "../types/base-data";
import { CharacterDataModel, defineSchemaCustoms } from "./BaseDataModels";

const actorSchema = () => ({
  ...CharacterDataModel.defineSchema(),
  customs: defineSchemaCustoms()
});

type ActorSchema = ReturnType<typeof actorSchema>;

export class AllyDataModel extends CharacterDataModel<
  ActorSchema,
  BaseData.ally
> {
  static override defineSchema() {
    return {
      ...actorSchema(),
      customs: defineSchemaCustoms()
    };
  }
}
