import {
  Discord,
  Slash,
  SlashGroup,
  SlashOption,
  ButtonComponent,
  Guard,
  ContextMenu,
} from "discordx";
import { Category, RateLimit, TIME_UNIT } from "@discordx/utilities";

import {
  CommandInteraction,
  ApplicationCommandOptionType,
  User,
  Role,
  ButtonInteraction,
  GuildBasedChannel,
  ApplicationCommandType,
  UserContextMenuCommandInteraction,
  MessageContextMenuCommandInteraction,
} from "discord.js";

import { ServerModel } from "../../models/ServerModel.js";
import { moderationHierachy } from "../../utils/moderationHierachy.js";
import {
  ButtonComponentMoveSnowflake,
  PaginationSender,
} from "../../utils/PaginationButtons.js";

@Discord()
@Category("Admin Commands")
@SlashGroup({
  description: "Manage blacklist for the guild or in a specific command",
  name: "blacklist",
})
@SlashGroup("blacklist")
class Blacklist {
  @Slash({ description: "View the blacklist", name: `view` })
  @Guard(RateLimit(TIME_UNIT.seconds, 3, { ephemeral: true }))
  async view(
    @SlashOption({
      description: `The command name`,
      name: "command",
      type: ApplicationCommandOptionType.String,
    })
    commandName: string | undefined,
    interaction: CommandInteraction
  ) {
    let server = await ServerModel.findOne({
      serverId: interaction.guildId!,
    });

    if (!server) {
      server = await new ServerModel({
        createdBy: {
          id: interaction.guild?.ownerId,
          name: (await interaction.guild?.fetchOwner())!.user.tag,
        },
        serverId: interaction.guildId,
        serverName: interaction.guild?.name,
      }).save();
    }

    PaginationSender({
      server,
      list: "blacklist",
      snowflakePluralType: "guilds",
      interaction,
      commandName,
    });
  }
}

@Discord()
@SlashGroup({
  description: "User blacklist",
  name: "user",
  root: "blacklist",
})
@SlashGroup("user", "blacklist")
class UserBlacklist {
  @ButtonComponent({ id: "blacklist_user_move_target" })
  async moveUser(interaction: ButtonInteraction) {
    console.log(
      "🚀 ~ file: blacklist.ts:95 ~ UserBlacklist ~ moveUser ~ moveUser:",
      Date.now()
    );
    ButtonComponentMoveSnowflake(interaction);
  }
  @Slash({ description: "Add a user to the blacklist", name: `add` })
  @Guard(RateLimit(TIME_UNIT.seconds, 3, { ephemeral: true }))
  async add(
    @SlashOption({
      name: `target`,
      type: ApplicationCommandOptionType.User,
      required: true,
      description: "Add a user to the blacklist",
    })
    target: User,
    @SlashOption({
      description: `The command name`,
      name: "command",
      type: ApplicationCommandOptionType.String,
    })
    commandName: string | undefined,
    interaction: CommandInteraction
  ) {
    let server = await ServerModel.findOne({
      serverId: interaction.guildId!,
    });

    if (!server) {
      server = await new ServerModel({
        createdBy: {
          id: interaction.guild?.ownerId,
          name: (await interaction.guild?.fetchOwner())!.user.tag,
        },
        serverId: interaction.guildId,
        serverName: interaction.guild?.name,
      }).save();
    }

    const fairCheck = await moderationHierachy(target, interaction).catch((e) =>
      console.log(e)
    );
    if (fairCheck)
      return interaction.reply({ content: fairCheck, ephemeral: true });

    server.cases.blacklist.applicationModifySelection({
      type: target,
      commandName,
      interaction,
      list: "blacklist",
      action: "add",
    });
  }

  @ContextMenu({
    name: `Add to blacklist`,
    type: ApplicationCommandType.User,
  })
  @Guard(RateLimit(TIME_UNIT.seconds, 3, { ephemeral: true }))
  async contextUserAdd(interaction: UserContextMenuCommandInteraction) {
    const target = interaction.targetUser;

    await interaction.deferReply({ ephemeral: true });

    let server = await ServerModel.findOne({
      serverId: interaction.guildId!,
    });

    if (!server) {
      server = await new ServerModel({
        createdBy: {
          id: interaction.guild?.ownerId,
          name: (await interaction.guild?.fetchOwner())!.user.tag,
        },
        serverId: interaction.guildId,
        serverName: interaction.guild?.name,
      }).save();
    }

    const fairCheck = await moderationHierachy(target, interaction).catch((e) =>
      console.log(e)
    );
    if (fairCheck) return interaction.editReply({ content: fairCheck });

    server.cases.blacklist.applicationModifySelection({
      type: target,
      interaction,
      list: "blacklist",
      action: "add",
    });
  }

  @ContextMenu({
    name: `Add to blacklist`,
    type: ApplicationCommandType.Message,
  })
  @Guard(RateLimit(TIME_UNIT.seconds, 3, { ephemeral: true }))
  async contextMessageAdd(interaction: MessageContextMenuCommandInteraction) {
    const target = interaction.targetMessage.author;

    await interaction.deferReply({ ephemeral: true });

    let server = await ServerModel.findOne({
      serverId: interaction.guildId!,
    });

    if (!server) {
      server = await new ServerModel({
        createdBy: {
          id: interaction.guild?.ownerId,
          name: (await interaction.guild?.fetchOwner())!.user.tag,
        },
        serverId: interaction.guildId,
        serverName: interaction.guild?.name,
      }).save();
    }

    const fairCheck = await moderationHierachy(target, interaction).catch((e) =>
      console.log(e)
    );
    if (fairCheck) return interaction.editReply({ content: fairCheck });

    server.cases.blacklist.applicationModifySelection({
      type: target,
      interaction,
      list: "blacklist",
      action: "add",
    });
  }

  @Slash({ description: "Remove a user from the blacklist", name: `remove` })
  @Guard(RateLimit(TIME_UNIT.seconds, 3, { ephemeral: true }))
  async remove(
    @SlashOption({
      name: `target`,
      type: ApplicationCommandOptionType.User,
      description: `Remove a user from the blacklist`,
      required: true,
    })
    target: User,
    @SlashOption({
      description: `The command name`,
      name: "command",
      type: ApplicationCommandOptionType.String,
    })
    commandName: string | undefined,
    interaction: CommandInteraction
  ) {
    let server = await ServerModel.findOne({
      serverId: interaction.guildId!,
    });

    if (!server) {
      server = await new ServerModel({
        createdBy: {
          id: interaction.guild?.ownerId,
          name: (await interaction.guild?.fetchOwner())!.user.tag,
        },
        serverId: interaction.guildId,
        serverName: interaction.guild?.name,
      }).save();
    }

    const fairCheck = await moderationHierachy(target, interaction).catch((e) =>
      console.log(e)
    );
    if (fairCheck)
      return interaction.reply({ content: fairCheck, ephemeral: true });

    server.cases.blacklist.applicationModifySelection({
      type: target,
      commandName,
      interaction,
      list: "blacklist",
      action: "remove",
    });
  }

  @ContextMenu({
    name: `Remove from blacklist`,
    type: ApplicationCommandType.User,
  })
  @Guard(RateLimit(TIME_UNIT.seconds, 3, { ephemeral: true }))
  async contextUserRemove(interaction: UserContextMenuCommandInteraction) {
    const target = interaction.targetUser;

    await interaction.deferReply({ ephemeral: true });

    let server = await ServerModel.findOne({
      serverId: interaction.guildId!,
    });

    if (!server) {
      server = await new ServerModel({
        createdBy: {
          id: interaction.guild?.ownerId,
          name: (await interaction.guild?.fetchOwner())!.user.tag,
        },
        serverId: interaction.guildId,
        serverName: interaction.guild?.name,
      }).save();
    }

    const fairCheck = await moderationHierachy(target, interaction).catch((e) =>
      console.log(e)
    );
    if (fairCheck) return interaction.editReply({ content: fairCheck });

    server.cases.blacklist.applicationModifySelection({
      type: target,
      interaction,
      list: "blacklist",
      action: "remove",
    });
  }

  @ContextMenu({
    name: `Remove from blacklist`,
    type: ApplicationCommandType.Message,
  })
  @Guard(RateLimit(TIME_UNIT.seconds, 3, { ephemeral: true }))
  async contextMessageRemove(
    interaction: MessageContextMenuCommandInteraction
  ) {
    const target = interaction.targetMessage.author;

    await interaction.deferReply({ ephemeral: true });

    let server = await ServerModel.findOne({
      serverId: interaction.guildId!,
    });

    if (!server) {
      server = await new ServerModel({
        createdBy: {
          id: interaction.guild?.ownerId,
          name: (await interaction.guild?.fetchOwner())!.user.tag,
        },
        serverId: interaction.guildId,
        serverName: interaction.guild?.name,
      }).save();
    }

    const fairCheck = await moderationHierachy(target, interaction).catch((e) =>
      console.log(e)
    );
    if (fairCheck) return interaction.editReply({ content: fairCheck });

    server.cases.blacklist.applicationModifySelection({
      type: target,
      interaction,
      list: "blacklist",
      action: "remove",
    });
  }

  @Slash({ description: "View the blacklist", name: `view` })
  @Guard(RateLimit(TIME_UNIT.seconds, 3, { ephemeral: true }))
  async view(
    @SlashOption({
      description: `The command name`,
      name: "command",
      type: ApplicationCommandOptionType.String,
    })
    commandName: string | undefined,
    interaction: CommandInteraction
  ) {
    let server = await ServerModel.findOne({
      serverId: interaction.guildId!,
    });

    if (!server) {
      server = await new ServerModel({
        createdBy: {
          id: interaction.guild?.ownerId,
          name: (await interaction.guild?.fetchOwner())!.user.tag,
        },
        serverId: interaction.guildId,
        serverName: interaction.guild?.name,
      }).save();
    }

    PaginationSender({
      server,
      list: "blacklist",
      snowflakePluralType: "users",
      interaction,
      commandName,
    });
  }
}

@Discord()
@SlashGroup({
  description: "Role blacklist",
  name: "role",
  root: "blacklist",
})
@SlashGroup("role", "blacklist")
class RoleBlacklist {
  @ButtonComponent({ id: "blacklist_role_move_target" })
  async moveUser(interaction: ButtonInteraction) {
    console.log(
      "🚀 ~ file: blacklist.ts:255 ~ RoleBlacklist ~ moveUser ~ moveUser:",
      Date.now()
    );
    ButtonComponentMoveSnowflake(interaction);
  }
  @Slash({ description: "Add a role to the blacklist", name: `add` })
  @Guard(RateLimit(TIME_UNIT.seconds, 3, { ephemeral: true }))
  async add(
    @SlashOption({
      name: `target`,
      type: ApplicationCommandOptionType.Role,
      required: true,
      description: "Add a role to the blacklist",
    })
    target: Role,
    @SlashOption({
      description: `The command name`,
      name: "command",
      type: ApplicationCommandOptionType.String,
    })
    commandName: string | undefined,
    interaction: CommandInteraction
  ) {
    let server = await ServerModel.findOne({
      serverId: interaction.guildId!,
    });

    if (!server) {
      server = await new ServerModel({
        createdBy: {
          id: interaction.guild?.ownerId,
          name: (await interaction.guild?.fetchOwner())!.user.tag,
        },
        serverId: interaction.guildId,
        serverName: interaction.guild?.name,
      }).save();
    }

    const fairCheck = await moderationHierachy(target, interaction).catch((e) =>
      console.log(e)
    );
    if (fairCheck)
      return interaction.reply({ content: fairCheck, ephemeral: true });

    server.cases.blacklist.applicationModifySelection({
      type: target,
      commandName,
      interaction,
      list: "blacklist",
      action: "add",
    });
  }

  @Slash({ description: "Remove a role from the blacklist", name: `remove` })
  @Guard(RateLimit(TIME_UNIT.seconds, 3, { ephemeral: true }))
  async remove(
    @SlashOption({
      name: `target`,
      type: ApplicationCommandOptionType.Role,
      description: `Remove a role from the blacklist`,
      required: true,
    })
    target: Role,
    @SlashOption({
      description: `The command name`,
      name: "command",
      type: ApplicationCommandOptionType.String,
    })
    commandName: string | undefined,
    interaction: CommandInteraction
  ) {
    let server = await ServerModel.findOne({
      serverId: interaction.guildId!,
    });

    if (!server) {
      server = await new ServerModel({
        createdBy: {
          id: interaction.guild?.ownerId,
          name: (await interaction.guild?.fetchOwner())!.user.tag,
        },
        serverId: interaction.guildId,
        serverName: interaction.guild?.name,
      }).save();
    }

    const fairCheck = await moderationHierachy(target, interaction).catch((e) =>
      console.log(e)
    );
    if (fairCheck)
      return interaction.reply({ content: fairCheck, ephemeral: true });

    server.cases.blacklist.applicationModifySelection({
      type: target,
      commandName,
      interaction,
      list: "blacklist",
      action: "remove",
    });
  }

  @Slash({ description: "View the blacklist", name: `view` })
  @Guard(RateLimit(TIME_UNIT.seconds, 3, { ephemeral: true }))
  async view(
    @SlashOption({
      description: `The command name`,
      name: "command",
      type: ApplicationCommandOptionType.String,
    })
    commandName: string | undefined,
    interaction: CommandInteraction
  ) {
    let server = await ServerModel.findOne({
      serverId: interaction.guildId!,
    });

    if (!server) {
      server = await new ServerModel({
        createdBy: {
          id: interaction.guild?.ownerId,
          name: (await interaction.guild?.fetchOwner())!.user.tag,
        },
        serverId: interaction.guildId,
        serverName: interaction.guild?.name,
      }).save();
    }

    PaginationSender({
      server,
      list: "blacklist",
      snowflakePluralType: "roles",
      interaction,
      commandName,
    });
  }
}

@Discord()
@SlashGroup({
  description: "Channel blacklist",
  name: "channel",
  root: "blacklist",
})
@SlashGroup("channel", "blacklist")
class ChannelBlacklist {
  @ButtonComponent({ id: "blacklist_channel_move_target" })
  async moveUser(interaction: ButtonInteraction) {
    console.log(
      "🚀 ~ file: blacklist.ts:410 ~ ChannelBlacklist ~ moveUser ~ interaction:",
      Date.now()
    );

    ButtonComponentMoveSnowflake(interaction);
  }
  @Slash({ description: "Add a channel to the blacklist", name: `add` })
  @Guard(RateLimit(TIME_UNIT.seconds, 3, { ephemeral: true }))
  async add(
    @SlashOption({
      name: `target`,
      type: ApplicationCommandOptionType.Channel,
      required: true,
      description: "Add a channel to the blacklist",
    })
    target: GuildBasedChannel,
    @SlashOption({
      description: `The command name`,
      name: "command",
      type: ApplicationCommandOptionType.String,
    })
    commandName: string | undefined,
    interaction: CommandInteraction
  ) {
    let server = await ServerModel.findOne({
      serverId: interaction.guildId!,
    });

    if (!server) {
      server = await new ServerModel({
        createdBy: {
          id: interaction.guild?.ownerId,
          name: (await interaction.guild?.fetchOwner())!.user.tag,
        },
        serverId: interaction.guildId,
        serverName: interaction.guild?.name,
      }).save();
    }

    server.cases.blacklist.applicationModifySelection({
      type: target,
      commandName,
      interaction,
      list: "blacklist",
      action: "add",
    });
  }

  @Slash({ description: "Remove a channel from the blacklist", name: `remove` })
  @Guard(RateLimit(TIME_UNIT.seconds, 3, { ephemeral: true }))
  async remove(
    @SlashOption({
      name: `target`,
      type: ApplicationCommandOptionType.Channel,
      description: `Remove a channel from the blacklist`,
      required: true,
    })
    target: GuildBasedChannel,
    @SlashOption({
      description: `The command name`,
      name: "command",
      type: ApplicationCommandOptionType.String,
    })
    commandName: string | undefined,
    interaction: CommandInteraction
  ) {
    let server = await ServerModel.findOne({
      serverId: interaction.guildId!,
    });

    if (!server) {
      server = await new ServerModel({
        createdBy: {
          id: interaction.guild?.ownerId,
          name: (await interaction.guild?.fetchOwner())!.user.tag,
        },
        serverId: interaction.guildId,
        serverName: interaction.guild?.name,
      }).save();
    }

    server.cases.blacklist.applicationModifySelection({
      type: target,
      commandName,
      interaction,
      list: "blacklist",
      action: "remove",
    });
  }

  @Slash({ description: "View the blacklist", name: `view` })
  @Guard(RateLimit(TIME_UNIT.seconds, 3, { ephemeral: true }))
  async view(
    @SlashOption({
      description: `The command name`,
      name: "command",
      type: ApplicationCommandOptionType.String,
    })
    commandName: string | undefined,
    interaction: CommandInteraction
  ) {
    let server = await ServerModel.findOne({
      serverId: interaction.guildId!,
    });

    if (!server) {
      server = await new ServerModel({
        createdBy: {
          id: interaction.guild?.ownerId,
          name: (await interaction.guild?.fetchOwner())!.user.tag,
        },
        serverId: interaction.guildId,
        serverName: interaction.guild?.name,
      }).save();
    }

    PaginationSender({
      server,
      list: "blacklist",
      snowflakePluralType: "channels",
      interaction,
      commandName,
    });
  }
}
