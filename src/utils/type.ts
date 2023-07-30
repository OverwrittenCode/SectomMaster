import type {
	BeAnObject,
	IObjectWithTypegooseFunction
} from "@typegoose/typegoose/lib/types";
import type {
	APIMessageComponentEmoji,
	ButtonStyle,
	GuildBasedChannel,
	InteractionReplyOptions,
	Role,
	User
} from "discord.js";
import mongoose, { Types } from "mongoose";

import type {
	Channel as ChannelObj,
	Role as RoleObj,
	User as UserObj
} from "../models/ServerModel.js";

// General types
export type ModelUpdateProperties<I> = {
	[K in keyof Omit<I, "_id" | "__v">]?: I[K];
};

export type MongooseDocumentType<T = any> = mongoose.Document<
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

export type ClassPropertyNames<T> = {
	[K in keyof T]: T[K] extends Function ? never : K;
}[keyof T] extends infer U
	? U
	: never;

export type FunctionPropertyNames<T> = {
	[K in keyof T]: T[K] extends Function ? K : never;
}[keyof T];

export type NonFunctionPropertyNames<T> = {
	[K in keyof T]: T[K] extends Function ? never : K;
}[keyof T];

export type FilteredKeys<T> = {
	[K in keyof T as T[K] extends Function ? never : K]: T[K];
};

// Access types
export type AccessGateSubGroupApplicationCommandOptionType =
	| User
	| Role
	| GuildBasedChannel;

export type ServerModelSelectionSnowflakeType = UserObj | RoleObj | ChannelObj;

export enum TargetClass {
	USERS = "users",
	ROLES = "roles",
	CHANNELS = "channels"
}

export enum TargetClassSingular {
	USER = "user",
	ROLE = "role",
	CHANNEL = "channel"
}

export enum SecondaryTargetClass {
	GUILD = "guild"
}

export type CombinedTargetClass = TargetClass | SecondaryTargetClass;

export enum TargetType {
	USER = "User",
	CHANNEL = "Channel",
	ROLE = "Role"
}

export enum AccessListBarrier {
	BLACKLIST = "blacklist",
	WHITELIST = "whitelist"
}

export enum PaginationIDBarrier {
	ACTIONS = "actions",
	BLACKLIST = AccessListBarrier.BLACKLIST,
	WHITELIST = AccessListBarrier.WHITELIST
}

type ButtonIDPrefix = `${PaginationIDBarrier}_${CombinedTargetClass}_`;

export type ButtonIDFormat<T extends string = string> = T extends string
	? `${ButtonIDPrefix}${T}`
	: ButtonIDPrefix;

// Button types
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

// Action types
export enum ActionType {
	MUTE = "mute",
	KICK = "kick",
	BAN = "ban"
}

export type ModerationHierarchy =
	| "You cannot select yourself"
	| "You cannot select a bot"
	| `You cannot select that ${
			| TargetClassSingular.USER
			| TargetClassSingular.ROLE} as they are higher or equal to your target in the role hierarchy`;

export type ReplyOptions = InteractionReplyOptions & { ephemeral?: boolean };
