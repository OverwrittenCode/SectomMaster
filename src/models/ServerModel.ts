import {
  prop,
  getModelForClass,
  pre,
  post,
  DocumentType,
  modelOptions,
  SubDocumentType,
} from "@typegoose/typegoose";
import { Blacklist, Whitelist } from "./AccessGate.js";
import { TimeStamps } from "@typegoose/typegoose/lib/defaultClasses.js";
import { ModerationCases } from "./ModerationCases.js";

@modelOptions({
  schemaOptions: {
    timestamps: true,
  },
})
export class SnowflakeLog {
  @prop({ required: true })
  public readonly id!: string;

  @prop()
  public expired?: boolean;
}

/**
 * User class
 * Represents a user in the system
 */
@pre<User>("save", function () {
  // This pre-save hook will run before a document is saved
  if (this.name.endsWith("#0")) this.name = this.name.slice(0, -2);
})
export class User extends SnowflakeLog {
  /** Discord's new username system means username is from
   * ```ts
   * <User>.tag
   * ```
   */
  @prop({ required: true })
  public name!: string;
}

export class Role extends SnowflakeLog {
  @prop({ required: true })
  public name!: string;
}

export class Channel extends Role {}

@pre<Server>("save", function (next: () => void) {
  // This pre-save hook will run before a document is saved
  console.log("A server document is going to be saved.");
  next();
})
@post<Server>("save", function (doc: DocumentType<Server>) {
  // This post-save hook will run after a document is saved
  console.log("A server document has been saved.", doc.toJSON());
})
export class Server extends TimeStamps {
  @prop({ required: true })
  public serverId!: string;

  @prop({ type: () => ModerationCases, default: {} })
  public cases!: SubDocumentType<ModerationCases>;

  @prop({ required: true })
  public serverName!: string;

  @prop({ required: true })
  public createdBy!: User;
}

export const ServerModel = getModelForClass(Server);
export const UserModel = getModelForClass(User);
export const BlacklistModel = getModelForClass(Blacklist);
export const WhitelistModel = getModelForClass(Whitelist);
