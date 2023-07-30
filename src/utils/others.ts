import type {
	CommandInteraction,
	MessageComponentInteraction
} from "discord.js";

import { NO_DATA_MESSAGE } from "./config.js";
import type { FilteredKeys, ReplyOptions } from "./type.js";

export async function replyOrFollowUp(
	interaction: CommandInteraction | MessageComponentInteraction,
	replyOptions: ReplyOptions | string
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

export async function replyNoData(interaction: CommandInteraction) {
	await replyOrFollowUp(interaction, {
		content: NO_DATA_MESSAGE,
		ephemeral: true
	});
}

export function typegooseClassProps<T extends object>(obj: T) {
	const result: {
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
