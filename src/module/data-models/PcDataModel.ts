import { BaseData } from "../types/base-data";
import {
  CharacterDataModel,
  CharacterSchema,
  defineSchemaCustoms
} from "./BaseDataModels";

const actorSchema = () => ({
  ...CharacterDataModel.defineSchema(),
  customs: defineSchemaCustoms()
});

interface ActorSchema extends CharacterSchema {
  customs: ReturnType<typeof defineSchemaCustoms>;
}

export class PcDataModel extends CharacterDataModel<ActorSchema, BaseData.pc> {
  static override defineSchema() {
    return {
      ...actorSchema(),
      customs: defineSchemaCustoms()
    };
  }
}
