import { GuildMember, Role } from "discord.js";
import { Server } from "../models/ServerModel";

export type FunctionPropertyNames<T> = {
  [K in keyof T]: T[K] extends Function ? K : never;
}[keyof T];
export type FunctionProperties<T> = Pick<T, FunctionPropertyNames<T>>;

export type NonFunctionPropertyNames<T> = {
  [K in keyof T]: T[K] extends Function ? never : K;
}[keyof T];
export type NonFunctionProperties<T> = Pick<T, NonFunctionPropertyNames<T>>;

export type ModerationHierachy =
  | `You cannot select yourself`
  | `You cannot select a bot`
  | `You cannot select that ${
      | `user`
      | `role`} as they are higher or equal to your target in the role hierachy`;

export type ClassPropertyNames<T> = {
  [K in keyof T]: T[K] extends Function ? never : K;
}[keyof T] extends infer U
  ? U
  : never;
