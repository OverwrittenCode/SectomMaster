import type {
	CommandInteraction,
	MessageContextMenuCommandInteraction,
	Role,
	User,
	UserContextMenuCommandInteraction
} from "discord.js";
import { GuildMember } from "discord.js";

import { logger } from "./logger.js";
import type { ModerationHierarchy } from "./type.js";

async function checkRoleHierarchy(
	interactionAuthor: GuildMember,
	interactionTarget: GuildMember | Role
): Promise<ModerationHierarchy | void> {
	if (interactionTarget instanceof GuildMember && interactionTarget.user.bot) {
		return "You cannot select a bot";
	}

	const targetPosition =
		interactionTarget instanceof GuildMember
			? interactionTarget.roles.highest.position
			: interactionTarget.position;

	if (targetPosition >= interactionAuthor.roles.highest.position) {
		return `You cannot select that ${
			interactionTarget instanceof GuildMember ? "user" : "role"
		} as they are higher or equal to your target in the role hierarchy`;
	}
}

export async function moderationHierarchy(
	target: User | Role,
	interaction:
		| CommandInteraction
		| UserContextMenuCommandInteraction
		| MessageContextMenuCommandInteraction
): Promise<ModerationHierarchy | void> {
	try {
		if (target.id == interaction.user.id) return "You cannot select yourself";

		const guildMember = await interaction.guild?.members.fetch(target.id);

		const interactionTarget = interaction.guild?.[
			guildMember instanceof GuildMember ? "members" : "roles"
		].cache.get(target.id);

		const interactionAuthor = interaction.guild?.members.cache.get(
			interaction.user.id
		);

		if (!interactionTarget || !interactionAuthor) return;

		return checkRoleHierarchy(interactionAuthor, interactionTarget);
	} catch (error) {
		logger.error(error);
	}
}
