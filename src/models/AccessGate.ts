import {
  pre,
  post,
  prop,
  DocumentType,
  SubDocumentType,
  ArraySubDocumentType,
} from "@typegoose/typegoose";
import {
  User as DiscordUser,
  Role as DiscordRole,
  CommandInteraction,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
  Colors,
  ButtonInteraction,
  UserContextMenuCommandInteraction,
  MessageContextMenuCommandInteraction,
} from "discord.js";
import { Channel, Role, ServerModel, User } from "./ServerModel.js";
import {
  AccessGateSubGroupApplicationCommandOptionType,
  AccessListBarrier,
  ButtonIDFormat,
  ServerModelSelectionSnowflakeType,
  TargetClass,
  TargetClassSingular,
  TargetType,
} from "./typings.js";
import { capitalizeFirstLetter } from "../utils/casing.js";
import { TimeStamps } from "@typegoose/typegoose/lib/defaultClasses.js";
import { replyOrFollowUp } from "../utils/others.js";

export class AccessSelection extends TimeStamps {
  @prop({ type: () => [User], default: [] })
  public users!: ArraySubDocumentType<User>[];

  @prop({ type: () => [Role], default: [] })
  public roles!: ArraySubDocumentType<Role>[];

  @prop({ type: () => [Channel], default: [] })
  public channels!: ArraySubDocumentType<Channel>[];
}

/**
 * Command class
 * Represents a command in the system
 */
@pre<Command>("save", function (next: () => void) {
  console.log("A command document is going to be saved.");
  next();
})
@post<Command>("save", function (doc: DocumentType<Command>) {
  console.log("A command document has been saved.", doc.toJSON());
})
export class Command extends AccessSelection {
  @prop({ required: true })
  public commandName!: string;

  public async addToList(
    this: DocumentType<Command>,
    element: ServerModelSelectionSnowflakeType,
    interaction: CommandInteraction | ButtonInteraction
  ) {
    const strProp = interaction.guild!.members.cache.has(element.id)
      ? "users"
      : interaction.guild!.roles.cache.has(element.id)
      ? "roles"
      : "channels";

    (this[strProp] as ServerModelSelectionSnowflakeType[]).push(element);
    return await this.$parent()!.save();
  }

  public async removeFromList(
    this: DocumentType<Command>,
    element: ServerModelSelectionSnowflakeType,
    interaction: CommandInteraction | ButtonInteraction
  ) {
    const strProp = interaction.guild!.members.cache.has(element.id)
      ? "users"
      : interaction.guild!.roles.cache.has(element.id)
      ? "roles"
      : "channels";
    const selection = this[strProp] as ServerModelSelectionSnowflakeType[];

    (this[strProp] as ServerModelSelectionSnowflakeType[]) = selection.filter(
      (e) => e.id != element.id
    );

    return await this.$parent()!.save();
  }
}

/**
 * Blacklist class
 * Represents a blacklist in the system
 */
@pre<Blacklist>("save", function (next: () => void) {
  console.log("A blacklist document is going to be saved.");
  next();
})
@post<Blacklist>("save", function (doc: DocumentType<Blacklist>) {
  console.log("A blacklist document has been saved.", doc.toJSON());
})
export class Blacklist extends AccessSelection {
  @prop({ type: () => [Command], default: [] })
  public commands!: ArraySubDocumentType<Command>[];

  public async checkIfExists(
    target: AccessGateSubGroupApplicationCommandOptionType,
    targetClassStr: TargetClass,
    commandName?: string
  ) {
    return commandName
      ? this.commands!.findIndex(
          (cmd) =>
            cmd.commandName === commandName &&
            cmd[targetClassStr]!.find((v) => v.id == target.id)
        ) != -1
      : typeof this[targetClassStr]!.find((v) => v.id == target.id) !=
          "undefined";
  }

  public async addToList(
    this: DocumentType<Blacklist>,
    element: ServerModelSelectionSnowflakeType,
    interaction: CommandInteraction | ButtonInteraction
  ) {
    const strProp = interaction.guild!.members.cache.has(element.id)
      ? "users"
      : interaction.guild!.roles.cache.has(element.id)
      ? "roles"
      : "channels";
    (this[strProp]! as ServerModelSelectionSnowflakeType[]).push(element);
    return await this.$parent()!.save();
  }

  public async removeFromList(
    this: DocumentType<Blacklist>,
    element: ServerModelSelectionSnowflakeType,
    interaction: CommandInteraction | ButtonInteraction
  ) {
    const strProp = interaction.guild!.members.cache.has(element.id)
      ? "users"
      : interaction.guild!.roles.cache.has(element.id)
      ? "roles"
      : "channels";
    const selection = this[strProp] as ServerModelSelectionSnowflakeType[];
    (this[strProp] as ServerModelSelectionSnowflakeType[]) = selection.filter(
      (e) => e.id != element.id
    );

    return await this.$parent()!.save();
  }

  public async applicationModifySelection(params: {
    type: AccessGateSubGroupApplicationCommandOptionType;
    interaction:
      | CommandInteraction
      | ButtonInteraction
      | UserContextMenuCommandInteraction
      | MessageContextMenuCommandInteraction;
    list: AccessListBarrier;
    action: "add" | "remove";
    commandName?: string;
    transfering?: boolean;
  }) {
    const { type, commandName, interaction, list, action, transfering } =
      params;
    console.log("🚀 ~ file: AccessGate.ts:163 ~ Blacklist ~ params:");

    const targetClassStr: TargetClass = interaction.guild?.members.cache.has(
      type.id
    )
      ? `users`
      : interaction.guild?.roles.cache.has(type.id)
      ? `roles`
      : `channels`;

    console.log(
      "🚀 ~ file: AccessGate.ts:174 ~ Blacklist ~ targetClassStr:",
      targetClassStr
    );

    const targetTypeStr = capitalizeFirstLetter(
      targetClassStr.slice(0, -1)
    ) as TargetType;

    const targetMention = `<${
      interaction.guild!.members.cache.has(type.id)
        ? "@"
        : interaction.guild!.roles.cache.has(type.id)
        ? "@&"
        : "#"
    }${type!.id}>`;

    let server = await ServerModel.findOne({
      serverId: interaction.guildId,
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

    const targetObj = {
      id: type.id,
      name:
        interaction.guild!.members.cache.get(type.id)?.user.tag ??
        (type as DiscordRole).name,
    };

    const oppositeList = list === "whitelist" ? "blacklist" : "whitelist";

    const serverListObj = server.cases[list] as DocumentType<Blacklist>;
    const serverOppositeListObj = server.cases[
      oppositeList
    ] as DocumentType<Whitelist>;

    if (
      action == "add" &&
      (await this.checkIfExists(type, targetClassStr, commandName))
    ) {
      await replyOrFollowUp(interaction, {
        content: `${targetMention} is already in the ${list}.`,
        ephemeral: true,
      });
      return;
    }

    if (
      action == "remove" &&
      !(await serverListObj.checkIfExists(type, targetClassStr, commandName))
    ) {
      await replyOrFollowUp(interaction, {
        content: `${targetMention} does not exist in the ${list}.`,
        ephemeral: true,
      });
      return;
    }

    if (
      !transfering &&
      action == "add" &&
      (await serverOppositeListObj.checkIfExists(
        type,
        targetClassStr,
        commandName
      ))
    ) {
      const snowflakeSingular = targetClassStr.slice(
        0,
        -1
      ) as TargetClassSingular;
      const buttonIdPrefix: ButtonIDFormat = `${list}_${snowflakeSingular}_`;

      let row = new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder()
          .setCustomId(`${buttonIdPrefix}move_target`)
          .setLabel("Yes")
          .setStyle(ButtonStyle.Success),
        new ButtonBuilder()
          .setCustomId(`${buttonIdPrefix}cancel_move`)
          .setLabel("No")
          .setStyle(ButtonStyle.Danger)
      );
      console.log("#    🚀 ~ file: AccessGate.ts:253 ~ Blacklist ~ row:");

      let confirmationEmbed = new EmbedBuilder()
        .setTitle("Confirmation")
        .setDescription(
          `${targetMention} exists in the ${oppositeList} ${
            commandName ?? "guild"
          } database. Do you want to move this data to the ${list}?`
        )
        .setColor(Colors.Gold) // Yellow color for confirmation
        .setAuthor({
          name: targetObj.name,
        })
        .setFooter({
          text: `${targetTypeStr} ID: ${targetObj.id}`,
        });

      if (interaction.guild!.members.cache.has(type.id))
        confirmationEmbed.toJSON().author!.icon_url = (
          type as DiscordUser
        ).displayAvatarURL();
      await replyOrFollowUp(interaction, {
        embeds: [confirmationEmbed],
        ephemeral: true,
        components: [row],
      });

      return;
    } else {
      const functionStr = action == "add" ? "addToList" : "removeFromList";
      const embedDirectionStr = action == "add" ? "added to" : "removed from";
      await serverListObj[functionStr](targetObj, interaction);
      if (!transfering) {
        const successEmbed = new EmbedBuilder()
          .setTitle("Success")
          .setDescription(
            `${targetMention} has been ${embedDirectionStr} the ${list}`
          )
          .setColor(Colors.Green) // Green color for success
          .setAuthor({
            name: targetObj.name,
          })
          .setFooter({ text: `${targetTypeStr} ID: ${targetObj.id}` })
          .setTimestamp();

        if (interaction.guild!.members.cache.has(type.id))
          successEmbed.toJSON().author!.icon_url = (
            type as DiscordUser
          ).displayAvatarURL();

        await replyOrFollowUp(interaction, {
          embeds: [successEmbed],
          ephemeral: true,
        });

        return;
      }
    }
  }
}

/**
 * Whitelist class
 * Represents a whitelist in the system
 */
@pre<Whitelist>("save", function (next: () => void) {
  console.log("A whitelist document is going to be saved.");
  next();
})
@post<Whitelist>("save", function (doc: DocumentType<Whitelist>) {
  console.log("A whitelist document has been saved.", doc.toJSON());
})
export class Whitelist extends AccessSelection {
  @prop({ type: () => [Command], default: [] })
  public commands!: ArraySubDocumentType<Command>[];

  public async checkIfExists(
    target: AccessGateSubGroupApplicationCommandOptionType,
    targetClassStr: TargetClass,
    commandName?: string
  ) {
    return commandName
      ? this.commands!.findIndex(
          (cmd) =>
            cmd.commandName === commandName &&
            cmd[targetClassStr]!.find((v) => v.id == target.id)
        ) != -1
      : this[targetClassStr]!.find((v) => v.id == target.id);
  }

  public async addToList(
    this: DocumentType<Whitelist>,
    element: ServerModelSelectionSnowflakeType,
    interaction: CommandInteraction | ButtonInteraction
  ) {
    const strProp = interaction.guild!.members.cache.has(element.id)
      ? "users"
      : interaction.guild!.roles.cache.has(element.id)
      ? "roles"
      : "channels";
    (this[strProp]! as ServerModelSelectionSnowflakeType[]).push(element);
    return await this.$parent()!.save();
  }

  public async removeFromList(
    this: DocumentType<Whitelist>,
    element: ServerModelSelectionSnowflakeType,
    interaction: CommandInteraction | ButtonInteraction
  ) {
    const strProp = interaction.guild!.members.cache.has(element.id)
      ? "users"
      : interaction.guild!.roles.cache.has(element.id)
      ? "roles"
      : "channels";
    const selection = this[strProp] as ServerModelSelectionSnowflakeType[];
    (this[strProp] as ServerModelSelectionSnowflakeType[]) = selection.filter(
      (e) => e.id != element.id
    );

    return await this.$parent()!.save();
  }

  public async applicationModifySelection(params: {
    type: AccessGateSubGroupApplicationCommandOptionType;
    interaction:
      | CommandInteraction
      | ButtonInteraction
      | UserContextMenuCommandInteraction
      | MessageContextMenuCommandInteraction;
    list: AccessListBarrier;
    action: "add" | "remove";
    commandName?: string;
    transfering?: boolean;
  }) {
    const { type, commandName, interaction, list, action, transfering } =
      params;
    console.log("🚀 ~ file: AccessGate.ts:163 ~ Whitelist ~ params:");

    const targetClassStr: TargetClass = interaction.guild!.members.cache.has(
      type.id
    )
      ? `users`
      : interaction.guild!.roles.cache.has(type.id)
      ? `roles`
      : `channels`;

    const targetTypeStr = capitalizeFirstLetter(
      targetClassStr.slice(0, -1)
    ) as TargetType;

    const targetMention = `<${
      interaction.guild!.members.cache.has(type.id)
        ? "@"
        : interaction.guild!.roles.cache.has(type.id)
        ? "@&"
        : "#"
    }${type!.id}>`;

    let server = await ServerModel.findOne({
      serverId: interaction.guildId,
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

    const targetObj = {
      id: type.id,
      name: interaction.guild!.members.cache.has(type.id)
        ? (type as DiscordUser).tag
        : (type as DiscordRole).name,
    };

    const oppositeList = list === "whitelist" ? "blacklist" : "whitelist";

    const serverListObj = server.cases[list] as DocumentType<Whitelist>;
    const serverOppositeListObj = server.cases[
      oppositeList
    ] as DocumentType<Blacklist>;

    if (
      action == "add" &&
      (await this.checkIfExists(type, targetClassStr, commandName))
    ) {
      await replyOrFollowUp(interaction, {
        content: `${targetMention} is already in the ${list}.`,
        ephemeral: true,
      });
      return;
    }

    if (
      action == "remove" &&
      !(await this.checkIfExists(type, targetClassStr, commandName))
    ) {
      await replyOrFollowUp(interaction, {
        content: `${targetMention} does not exist in the ${list}.`,
        ephemeral: true,
      });

      return;
    }

    if (
      !transfering &&
      action == "add" &&
      (await serverOppositeListObj.checkIfExists(
        type,
        targetClassStr,
        commandName
      ))
    ) {
      const buttonIdPrefix = `${list}_${targetClassStr.slice(0, -1)}`;

      let row = new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder()
          .setCustomId(`${buttonIdPrefix}_move_target`)
          .setLabel("Yes")
          .setStyle(ButtonStyle.Success),
        new ButtonBuilder()
          .setCustomId(`${buttonIdPrefix}_cancel_move`)
          .setLabel("No")
          .setStyle(ButtonStyle.Danger)
      );
      console.log("#    🚀 ~ file: AccessGate.ts:472 ~ Whitelist ~ row:");

      let confirmationEmbed = new EmbedBuilder()
        .setTitle("Confirmation")
        .setDescription(
          `${targetMention} exists in the ${oppositeList} ${
            commandName ?? "guild"
          } database. Do you want to move this data to the ${list}?`
        )
        .setColor(Colors.Gold) // Yellow color for confirmation
        .setAuthor({
          name: targetObj.name,
        })
        .setFooter({
          text: `${targetTypeStr} ID: ${targetObj.id}`,
        });

      if (interaction.guild!.members.cache.has(type.id))
        confirmationEmbed.toJSON().author!.icon_url = (
          type as DiscordUser
        ).displayAvatarURL();

      await replyOrFollowUp(interaction, {
        embeds: [confirmationEmbed],
        ephemeral: true,
        components: [row],
      });

      return;
    } else {
      const functionStr = action == "add" ? "addToList" : "removeFromList";
      const embedDirectionStr = action == "add" ? "added to" : "removed from";

      await serverListObj[functionStr](targetObj, interaction);
      if (!transfering) {
        const successEmbed = new EmbedBuilder()
          .setTitle("Success")
          .setDescription(
            `${targetMention} has been ${embedDirectionStr} the ${list}`
          )
          .setColor(Colors.Green) // Green color for success
          .setAuthor({
            name: targetObj.name,
          })
          .setFooter({ text: `${targetTypeStr} ID: ${targetObj.id}` })
          .setTimestamp();

        if (interaction.guild!.members.cache.has(type.id))
          successEmbed.toJSON().author!.icon_url = (
            type as DiscordUser
          ).displayAvatarURL();

        await replyOrFollowUp(interaction, {
          embeds: [successEmbed],
          ephemeral: true,
        });

        return;
      }
    }
  }
}
