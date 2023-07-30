import { Category, RateLimit, TIME_UNIT } from "@discordx/utilities";
import type {
	ButtonInteraction,
	CommandInteraction,
	GuildBasedChannel,
	MessageContextMenuCommandInteraction,
	Role,
	User,
	UserContextMenuCommandInteraction
} from "discord.js";
import {
	ApplicationCommandOptionType,
	ApplicationCommandType
} from "discord.js";
import {
	ButtonComponent,
	ContextMenu,
	Discord,
	Guard,
	Slash,
	SlashGroup,
	SlashOption
} from "discordx";

import { findOrCreateServer } from "../../models/ServerModel.js";
import { logger } from "../../utils/logger.js";
import { moderationHierarchy } from "../../utils/moderationHierarchy.js";
import {
	ButtonComponentMoveSnowflake,
	PaginationSender
} from "../../utils/PaginationButtons.js";
import { AccessListBarrier, TargetClass } from "../../utils/type.js";

@Discord()
@Category("Admin Commands")
@SlashGroup({
	description: "Manage whitelist for the guild or in a specific command",
	name: "whitelist"
})
@SlashGroup("whitelist")
class Whitelist {
	@Slash({ description: "View the whitelist", name: "view" })
	@Guard(RateLimit(TIME_UNIT.seconds, 3, { ephemeral: true }))
	async view(
		@SlashOption({
			description: "The command name",
			name: "command",
			type: ApplicationCommandOptionType.String
		})
		commandName: string | undefined,
		interaction: CommandInteraction
	) {
		const server = await findOrCreateServer(interaction);

		PaginationSender({
			server,
			list: "whitelist",
			snowflakePluralType: "guilds",
			interaction,
			commandName
		});
	}
}

@Discord()
@SlashGroup({
	description: "User whitelist",
	name: "user",
	root: "whitelist"
})
@SlashGroup("user", "whitelist")
class UserWhitelist {
	@ButtonComponent({ id: "whitelist_user_move_target" })
	async moveUser(interaction: ButtonInteraction) {
		logger.info(
			"🚀 ~ file: whitelist.ts:95 ~ UserWhitelist ~ moveUser ~ moveUser:",
			Date.now()
		);
		ButtonComponentMoveSnowflake(interaction);
	}
	@Slash({ description: "Add a user to the whitelist", name: "add" })
	@Guard(RateLimit(TIME_UNIT.seconds, 3, { ephemeral: true }))
	async add(
		@SlashOption({
			name: "target",
			type: ApplicationCommandOptionType.User,
			required: true,
			description: "Add a user to the whitelist"
		})
		target: User,
		@SlashOption({
			description: "The command name",
			name: "command",
			type: ApplicationCommandOptionType.String
		})
		commandName: string | undefined,
		interaction: CommandInteraction
	) {
		const server = await findOrCreateServer(interaction);

		const fairCheck = await moderationHierarchy(target, interaction);
		if (fairCheck)
			return interaction.reply({ content: fairCheck, ephemeral: true });

		server.cases.whitelist.applicationModifySelection({
			type: target,
			commandName,
			interaction,
			list: AccessListBarrier.WHITELIST,
			action: "add"
		});
	}

	@ContextMenu({
		name: "Add to whitelist",
		type: ApplicationCommandType.User
	})
	@Guard(RateLimit(TIME_UNIT.seconds, 3, { ephemeral: true }))
	async contextUserAdd(interaction: UserContextMenuCommandInteraction) {
		const target = interaction.targetUser;

		await interaction.deferReply({ ephemeral: true });
		const server = await findOrCreateServer(interaction);

		const fairCheck = await moderationHierarchy(target, interaction);
		if (fairCheck) return interaction.editReply({ content: fairCheck });

		server.cases.whitelist.applicationModifySelection({
			type: target,
			interaction,
			list: AccessListBarrier.WHITELIST,
			action: "add"
		});
	}

	@ContextMenu({
		name: "Add to whitelist",
		type: ApplicationCommandType.Message
	})
	@Guard(RateLimit(TIME_UNIT.seconds, 3, { ephemeral: true }))
	async contextMessageAdd(interaction: MessageContextMenuCommandInteraction) {
		const target = interaction.targetMessage.author;

		await interaction.deferReply({ ephemeral: true });

		const server = await findOrCreateServer(interaction);

		const fairCheck = await moderationHierarchy(target, interaction);
		if (fairCheck) return interaction.editReply({ content: fairCheck });

		server.cases.whitelist.applicationModifySelection({
			type: target,
			interaction,
			list: AccessListBarrier.WHITELIST,
			action: "add"
		});
	}

	@Slash({ description: "Remove a user from the whitelist", name: "remove" })
	@Guard(RateLimit(TIME_UNIT.seconds, 3, { ephemeral: true }))
	async remove(
		@SlashOption({
			name: "target",
			type: ApplicationCommandOptionType.User,
			description: "Remove a user from the whitelist",
			required: true
		})
		target: User,
		@SlashOption({
			description: "The command name",
			name: "command",
			type: ApplicationCommandOptionType.String
		})
		commandName: string | undefined,
		interaction: CommandInteraction
	) {
		const server = await findOrCreateServer(interaction);

		const fairCheck = await moderationHierarchy(target, interaction);
		if (fairCheck)
			return interaction.reply({ content: fairCheck, ephemeral: true });

		server.cases.whitelist.applicationModifySelection({
			type: target,
			commandName,
			interaction,
			list: AccessListBarrier.WHITELIST,
			action: "remove"
		});
	}

	@ContextMenu({
		name: "Remove from whitelist",
		type: ApplicationCommandType.User
	})
	@Guard(RateLimit(TIME_UNIT.seconds, 3, { ephemeral: true }))
	async contextRemove(interaction: UserContextMenuCommandInteraction) {
		const target = interaction.targetUser;

		await interaction.deferReply({ ephemeral: true });

		const server = await findOrCreateServer(interaction);

		const fairCheck = await moderationHierarchy(target, interaction);
		if (fairCheck) return interaction.editReply({ content: fairCheck });

		server.cases.whitelist.applicationModifySelection({
			type: target,
			interaction,
			list: AccessListBarrier.WHITELIST,
			action: "remove"
		});
	}

	@ContextMenu({
		name: "Remove from whitelist",
		type: ApplicationCommandType.Message
	})
	@Guard(RateLimit(TIME_UNIT.seconds, 3, { ephemeral: true }))
	async contextMessageRemove(
		interaction: MessageContextMenuCommandInteraction
	) {
		const target = interaction.targetMessage.author;

		await interaction.deferReply({ ephemeral: true });

		const server = await findOrCreateServer(interaction);

		const fairCheck = await moderationHierarchy(target, interaction);
		if (fairCheck)
			return interaction.reply({ content: fairCheck, ephemeral: true });

		server.cases.whitelist.applicationModifySelection({
			type: target,
			interaction,
			list: AccessListBarrier.WHITELIST,
			action: "remove"
		});
	}

	@Slash({ description: "View the whitelist", name: "view" })
	@Guard(RateLimit(TIME_UNIT.seconds, 3, { ephemeral: true }))
	async view(
		@SlashOption({
			description: "The command name",
			name: "command",
			type: ApplicationCommandOptionType.String
		})
		commandName: string | undefined,
		interaction: CommandInteraction
	) {
		const server = await findOrCreateServer(interaction);

		PaginationSender({
			server,
			list: "whitelist",
			snowflakePluralType: TargetClass.USERS,
			interaction,
			commandName
		});
	}
}

@Discord()
@SlashGroup({
	description: "Role whitelist",
	name: "role",
	root: "whitelist"
})
@SlashGroup("role", "whitelist")
class RoleWhitelist {
	@ButtonComponent({ id: "whitelist_role_move_target" })
	async moveUser(interaction: ButtonInteraction) {
		logger.info(
			"🚀 ~ file: whitelist.ts:254 ~ RoleWhitelist ~ moveUser ~ moveUser:",
			Date.now()
		);
		ButtonComponentMoveSnowflake(interaction);
	}
	@Slash({ description: "Add a role to the whitelist", name: "add" })
	@Guard(RateLimit(TIME_UNIT.seconds, 3, { ephemeral: true }))
	async add(
		@SlashOption({
			name: "target",
			type: ApplicationCommandOptionType.Role,
			required: true,
			description: "Add a role to the whitelist"
		})
		target: Role,
		@SlashOption({
			description: "The command name",
			name: "command",
			type: ApplicationCommandOptionType.String
		})
		commandName: string | undefined,
		interaction: CommandInteraction
	) {
		const server = await findOrCreateServer(interaction);

		const fairCheck = await moderationHierarchy(target, interaction);
		if (fairCheck)
			return interaction.reply({ content: fairCheck, ephemeral: true });

		server.cases.whitelist.applicationModifySelection({
			type: target,
			commandName,
			interaction,
			list: AccessListBarrier.WHITELIST,
			action: "add"
		});
	}

	@Slash({ description: "Remove a role from the whitelist", name: "remove" })
	@Guard(RateLimit(TIME_UNIT.seconds, 3, { ephemeral: true }))
	async remove(
		@SlashOption({
			name: "target",
			type: ApplicationCommandOptionType.Role,
			description: "Remove a role from the whitelist",
			required: true
		})
		target: Role,
		@SlashOption({
			description: "The command name",
			name: "command",
			type: ApplicationCommandOptionType.String
		})
		commandName: string | undefined,
		interaction: CommandInteraction
	) {
		const server = await findOrCreateServer(interaction);

		const fairCheck = await moderationHierarchy(target, interaction);
		if (fairCheck)
			return interaction.reply({ content: fairCheck, ephemeral: true });

		server.cases.whitelist.applicationModifySelection({
			type: target,
			commandName,
			interaction,
			list: AccessListBarrier.WHITELIST,
			action: "remove"
		});
	}

	@Slash({ description: "View the whitelist", name: "view" })
	@Guard(RateLimit(TIME_UNIT.seconds, 3, { ephemeral: true }))
	async view(
		@SlashOption({
			description: "The command name",
			name: "command",
			type: ApplicationCommandOptionType.String
		})
		commandName: string | undefined,
		interaction: CommandInteraction
	) {
		const server = await findOrCreateServer(interaction);

		PaginationSender({
			server,
			list: "whitelist",
			snowflakePluralType: TargetClass.ROLES,
			interaction,
			commandName
		});
	}
}

@Discord()
@SlashGroup({
	description: "Channel whitelist",
	name: "channel",
	root: "whitelist"
})
@SlashGroup("channel", "whitelist")
class ChannelWhitelist {
	@ButtonComponent({ id: "whitelist_channel_move_target" })
	async moveUser(interaction: ButtonInteraction) {
		logger.info(
			"🚀 ~ file: whitelist.ts:411 ~ ChannelWhitelist ~ moveUser ~ interaction:",
			Date.now()
		);
		ButtonComponentMoveSnowflake(interaction);
	}
	@Slash({ description: "Add a channel to the whitelist", name: "add" })
	@Guard(RateLimit(TIME_UNIT.seconds, 3, { ephemeral: true }))
	async add(
		@SlashOption({
			name: "target",
			type: ApplicationCommandOptionType.Channel,
			required: true,
			description: "Add a channel to the whitelist"
		})
		target: GuildBasedChannel,
		@SlashOption({
			description: "The command name",
			name: "command",
			type: ApplicationCommandOptionType.String
		})
		commandName: string | undefined,
		interaction: CommandInteraction
	) {
		const server = await findOrCreateServer(interaction);

		server.cases.whitelist.applicationModifySelection({
			type: target,
			commandName,
			interaction,
			list: AccessListBarrier.WHITELIST,
			action: "add"
		});
	}

	@Slash({
		description: "Remove a channel from the whitelist",
		name: "remove"
	})
	@Guard(RateLimit(TIME_UNIT.seconds, 3, { ephemeral: true }))
	async remove(
		@SlashOption({
			name: "target",
			type: ApplicationCommandOptionType.Channel,
			description: "Remove a channel from the whitelist",
			required: true
		})
		target: GuildBasedChannel,
		@SlashOption({
			description: "The command name",
			name: "command",
			type: ApplicationCommandOptionType.String
		})
		commandName: string | undefined,
		interaction: CommandInteraction
	) {
		const server = await findOrCreateServer(interaction);

		server.cases.whitelist.applicationModifySelection({
			type: target,
			commandName,
			interaction,
			list: AccessListBarrier.WHITELIST,
			action: "remove"
		});
	}

	@Slash({ description: "View the whitelist", name: "view" })
	@Guard(RateLimit(TIME_UNIT.seconds, 3, { ephemeral: true }))
	async view(
		@SlashOption({
			description: "The command name",
			name: "command",
			type: ApplicationCommandOptionType.String
		})
		commandName: string | undefined,
		interaction: CommandInteraction
	) {
		const server = await findOrCreateServer(interaction);

		PaginationSender({
			server,
			list: "whitelist",
			snowflakePluralType: TargetClass.CHANNELS,
			interaction,
			commandName
		});
	}
}
