import {
  ButtonInteraction,
  ButtonStyle,
  Colors,
  EmbedBuilder,
  Role as DiscordRole,
  GuildMember,
  GuildBasedChannel,
  CommandInteraction,
} from "discord.js";
import { DocumentType } from "@typegoose/typegoose";
import { Blacklist, Command, Whitelist } from "../models/AccessGate.js";
import { Server, ServerModel } from "../models/ServerModel.js";
import {
  AccessListBarrier,
  ButtonIDFormat,
  MongooseDocType,
  ServerModelSelectionSnowflakeType,
  TargetClass,
  TargetClassSingular,
  TargetType,
} from "../models/typings.js";
import {
  Pagination,
  PaginationOptions,
  PaginationType,
} from "@discordx/pagination";
import { ClassPropertyNames } from "./types.js";
import { ModerationCases } from "../models/ModerationCases.js";

export class PaginationButtons {}

export async function paginateData(
  data: (Command | ServerModelSelectionSnowflakeType)[],
  interaction: CommandInteraction
): Promise<string[]> {
  const maxEmbedDescriptionLength = 2048;
  const descriptions: string[] = [];

  const getMention = async (snowflake: ServerModelSelectionSnowflakeType) => {
    if (interaction.guild!.channels.cache.has(snowflake.id))
      return `<#${snowflake.id}>`;
    else if (interaction.guild!.roles.cache.has(snowflake.id))
      return `<@&${snowflake.id}>`;

    try {
      return (
        (await interaction.guild!.members.fetch(snowflake.id)) ||
        (await interaction.guild!.channels.fetch(snowflake.id)) ||
        (await interaction.guild!.roles.fetch(snowflake.id))
      )?.toString();
    } catch (error) {
      return `undefined`;
    }
  };

  let listIndex = 1;

  while (data && data.length > 0) {
    let description = "";
    let index = 0;
    let info = "";

    while (index < data.length) {
      if (data[index] instanceof Command) {
        const command = data[index] as Command;

        const { commandName, users, roles, channels } = command;

        for (const group of [users, roles, channels].filter(
          async (v, i) => typeof (await getMention(v[i])) != "undefined"
        )) {
          for (const item of group) {
            info = `\`${commandName}\`: ${item.name} (${item.id})`;
            const entry = `\`${listIndex}\` ${info}\n`;

            if (description.length + entry.length > maxEmbedDescriptionLength) {
              break;
            }

            description += entry;
            listIndex++;
            index++;
          }
        }
      } else {
        const snowflake = data[index] as ServerModelSelectionSnowflakeType;

        info = await getMention(snowflake);

        const entry = `\`${listIndex}\` ${info}\n`;

        if (description.length + entry.length > maxEmbedDescriptionLength) {
          break;
        }

        description += entry;
        listIndex++;
        index++;
      }

      if (description.length + info.length > maxEmbedDescriptionLength) {
        break;
      }
    }

    descriptions.push(description);
    data = data.slice(index);
  }

  return descriptions;
}

export function paginationButtonsRow(
  list: AccessListBarrier,
  snowflakePlural: TargetClass | "guilds" = "guilds"
) {
  const snowflakeSingular = snowflakePlural.slice(0, -1) as TargetClassSingular;

  const prefix: ButtonIDFormat<"pagination"> = `${list}_${snowflakeSingular}_pagination`;

  const positionData: PaginationOptions = {
    type: PaginationType.Button,
    start: {
      emoji: {
        name: "⏮️",
      },
      id: `${prefix}_beginning`,
      label: " ",
      style: ButtonStyle.Secondary,
    },
    previous: {
      emoji: {
        name: "⬅️",
      },
      id: `${prefix}_previous`,
      label: " ",
      style: ButtonStyle.Secondary,
    },
    next: {
      emoji: {
        name: "➡️",
      },
      id: `${prefix}_next`,
      label: " ",
      style: ButtonStyle.Secondary,
    },

    end: {
      emoji: {
        name: "⏭️",
      },
      id: `${prefix}_end`,
      label: " ",
      style: ButtonStyle.Secondary,
    },
    ephemeral: true,
  };

  return positionData;
}

export async function ButtonComponentMoveSnowflake(
  interaction: ButtonInteraction
) {
  await interaction.deferReply({ ephemeral: true });
  const server = (await ServerModel.findOne({
    serverId: interaction.guild?.id!,
  }))!;

  const fetchedMessage = interaction.message;
  const confirmationEmbed = fetchedMessage.embeds[0];
  const messageContentArray = confirmationEmbed.description!.split(" ");
  const footerWordArr = confirmationEmbed.footer!.text.split(" ");

  let commandName: string | undefined;

  if (messageContentArray.indexOf("guild") == -1)
    commandName =
      messageContentArray[messageContentArray.indexOf("database") - 1];

  const targetTypeStr = footerWordArr[0] as TargetType;
  const targetGuildPropertyStr =
    targetTypeStr == `User`
      ? `members`
      : (`${targetTypeStr.toLowerCase()}s` as `roles` | `channels`);

  const target = (await interaction.guild?.[targetGuildPropertyStr].fetch(
    confirmationEmbed.footer!.text!.split(" ").at(-1)!
  ))!;

  const targetMention = `<${
    interaction.guild!.members.cache.has(target.id)
      ? "@"
      : interaction.guild!.roles.cache.has(target.id)
      ? "@&"
      : "#"
  }${target!.id}>`;

  const list = messageContentArray.pop()?.slice(0, -1) as AccessListBarrier; // do you want to move this data to the [whitelist | blacklist] -> the one to add to database

  const listInstance = server.cases[list] as DocumentType<
    Blacklist | Whitelist
  >;

  const oppositeList = list === "whitelist" ? "blacklist" : "whitelist"; // the one to remove from the database

  const oppositeListInstance = server.cases[
    oppositeList
  ] as typeof listInstance;

  await oppositeListInstance.applicationModifySelection({
    action: "remove",
    commandName,
    interaction,
    type: interaction.guild!.members.cache.has(target.id)
      ? (target as GuildMember).user
      : (target as DiscordRole | GuildBasedChannel),
    list: oppositeList,
    transfering: true,
  });

  // in case the bot shutdown unexpectedly, it's better to remove the data first than to have the target in both whitelist and blacklsit

  await listInstance.applicationModifySelection({
    action: "add",
    commandName,
    interaction,
    type: interaction.guild!.members.cache.has(target.id)
      ? (target as GuildMember).user
      : (target as DiscordRole | GuildBasedChannel),
    list,
    transfering: true,
  });

  let confirmedEmbed = new EmbedBuilder()
    .setTitle("Success")
    .setDescription(
      `${targetMention} has been moved from the ${oppositeList} to the ${list}  ${
        commandName ?? "guild"
      }`
    )
    .setColor(Colors.Green)
    .setAuthor(confirmationEmbed.author)
    .setFooter(confirmationEmbed.footer)
    .setTimestamp();

  await interaction.editReply({
    embeds: [confirmedEmbed],
    components: [],
  });
}

export async function PaginationSender(params: {
  server: MongooseDocType<Server>;
  list: ClassPropertyNames<ModerationCases>;
  snowflakePluralType: TargetClass | "guilds";
  interaction: CommandInteraction;
  commandName?: string;
}) {
  const { server, list, snowflakePluralType, commandName, interaction } =
    params;

  let data: string[];
  if (commandName)
    data = await paginateData(
      server.cases[list].commands.filter((v) => (v.commandName = commandName)),
      interaction
    );
  else
    data = await paginateData(
      snowflakePluralType == "guilds"
        ? [
            ...server.cases[list].channels,
            ...server.cases[list].roles,
            ...server.cases[list].users,
          ]
        : server.cases[list][snowflakePluralType],
      interaction
    );

  if (data.length == 0)
    return await interaction.reply({
      content: `Nothing to view yet in this query selection.`,
      ephemeral: true,
    });

  let pages = data.map((d, i) => {
    return {
      embeds: [
        new EmbedBuilder()
          .setTitle(`${interaction.guild!.name} Cases`)
          .setDescription(d)
          .setColor(Colors.Gold)
          .setFooter({
            text: `Page ${i + 1}/${data.length}`,
          }),
      ],
    };
  });

  const buttons = paginationButtonsRow(list, snowflakePluralType);

  return await new Pagination(interaction, pages, buttons).send();
}
