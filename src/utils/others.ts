import {
  CommandInteraction,
  MessageComponentInteraction,
  InteractionReplyOptions,
} from "discord.js";
import { FilteredKeys, MongooseDocType } from "../models/typings";
import {
  SubDocumentType,
  DocumentType,
  ReturnModelType,
} from "@typegoose/typegoose";
import { Document, Types } from "mongoose";
import {
  AnyParamConstructor,
  BeAnObject,
  IObjectWithTypegooseFunction,
} from "@typegoose/typegoose/lib/types";

export async function replyOrFollowUp(
  interaction: CommandInteraction | MessageComponentInteraction,
  replyOptions:
    | (InteractionReplyOptions & {
        ephemeral?: boolean;
      })
    | string
) {
  // if interaction is already replied
  if (interaction.replied) {
    await interaction.followUp(replyOptions);
    return;
  }

  // if interaction is deferred but not replied
  if (interaction.deferred) {
    await interaction.editReply(replyOptions);
    return;
  }

  // if interaction is not handled yet
  await interaction.reply(replyOptions);
  return;
}

export function typegooseClassProps<T extends object>(obj: T) {
  let result: {
    [key: string]: any;
  } = {};

  for (const key in obj) {
    const typedKey = key as keyof T;

    if (!key.startsWith("_") && typeof obj[typedKey] !== "function") {
      result[typedKey as any] = obj[typedKey];
    }
  }

  return result as Omit<FilteredKeys<T>, "_id">;
}
