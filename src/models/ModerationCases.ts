import { SubDocumentType, prop } from "@typegoose/typegoose";
import { Whitelist, Blacklist } from "./AccessGate.js";

export class ModerationCases {
  @prop({ type: () => Whitelist, default: {} })
  public whitelist!: SubDocumentType<Whitelist>;

  @prop({ type: () => Blacklist, default: {} })
  public blacklist!: SubDocumentType<Blacklist>;
}
