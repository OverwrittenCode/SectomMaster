import {
  BeAnObject,
  IObjectWithTypegooseFunction,
} from "@typegoose/typegoose/lib/types";
import {
  APIMessageComponentEmoji,
  ButtonStyle,
  GuildBasedChannel,
  Role,
  User,
} from "discord.js";
import {
  User as UserObj,
  Role as RoleObj,
  Channel as ChannelObj,
} from "./ServerModel.js";
import mongoose, { Types } from "mongoose";

export type ModelUpdate<I> = {
  [K in keyof Omit<I, "_id" | "__v">]?: I[K];
};

export type AccessGateSubGroupApplicationCommandOptionType =
  | User
  | Role
  | GuildBasedChannel;

export type ServerModelSelectionSnowflakeType = UserObj | RoleObj | ChannelObj;
export type TargetClass = `users` | `roles` | `channels`;
export type TargetType = `User` | `Channel` | `Role`;

export type MongooseDocType<T = any> = mongoose.Document<
  unknown,
  BeAnObject,
  T
> &
  Omit<
    T & {
      _id: Types.ObjectId;
    },
    "typegooseName"
  > &
  IObjectWithTypegooseFunction;

export type FilteredKeys<T> = {
  [K in keyof T as T[K] extends Function ? never : K]: T[K];
};

export type AccessListBarrier = `blacklist` | `whitelist`;
export type TargetClassSingular = `user` | `role` | `channel`;

type ButtonIDPrefix = `${AccessListBarrier}_${TargetClassSingular | `guild`}_`;

export type ButtonIDFormat<T extends string = string> = T extends string
  ? `${ButtonIDPrefix}${T}`
  : ButtonIDPrefix;

export interface ButtonOptions {
  /**
   * Button emoji
   */
  emoji?: APIMessageComponentEmoji;
  /**
   * Button id
   */
  id?: string;
  /**
   * Button label
   */
  label?: string;
  /**
   * Button style
   */
  style?: ButtonStyle;
}

export type ButtonPaginationPositions = {
  start: ButtonOptions;
  next: ButtonOptions;
  previous: ButtonOptions;
  end: ButtonOptions;
  exit: ButtonOptions;
};
