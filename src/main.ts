import { dirname, importx } from "@discordx/importer";
import { NotBot } from "@discordx/utilities";
import type { Interaction } from "discord.js";
import {
  ActivityType,
  Colors,
  EmbedBuilder,
  IntentsBitField,
  Partials,
} from "discord.js";
import { Client } from "discordx";
import "dotenv/config";
import mongoose from "mongoose";
import { replyOrFollowUp } from "./utils/others.js";
export const bot = new Client({
  // To use only guild command
  // botGuilds: [(client) => client.guilds.cache.map((guild) => guild.id)],

  intents: [
    IntentsBitField.Flags.Guilds,
    IntentsBitField.Flags.GuildMembers,
    IntentsBitField.Flags.GuildMessages,
    IntentsBitField.Flags.GuildMessageReactions,
    IntentsBitField.Flags.GuildVoiceStates,
    IntentsBitField.Flags.MessageContent,
  ],
  partials: [Partials.Channel, Partials.GuildMember, Partials.User],

  silent: false,
  guards: [NotBot],
  presence: {
    activities: [
      {
        name: `Dev Mode`,
        type: ActivityType.Watching,
      },
    ],
    status: "online",
  },
});

bot.once("ready", async () => {
  // Make sure all guilds are cached
  // await bot.guilds.fetch();

  await bot.clearApplicationCommands();
  await bot.initApplicationCommands();

  console.log(`Logged in as ${bot.user!.tag}`);
});

bot.on("interactionCreate", (interaction: Interaction) => {
  if (interaction.isButton()) {
    if (interaction.customId.endsWith("cancel_move"))
      return replyOrFollowUp(interaction, {
        embeds: [
          EmbedBuilder.from(interaction.message.embeds[0])
            .setColor(Colors.Red)
            .setTitle("Cancelled")
            .setDescription(`Action cancelled.`),
        ],
        components: [],
        ephemeral: true,
      });
    if (interaction.customId.includes("pagination")) return;
  }

  bot.executeInteraction(interaction);
});

async function run() {
  await importx(`${dirname(import.meta.url)}/{events,commands}/**/*.{ts,js}`);

  if (!process.env.BOT_TOKEN) {
    throw Error("Could not find BOT_TOKEN in your environment");
  }
  await bot.login(process.env.BOT_TOKEN);
}

export const mongoClient = await mongoose.connect(process.env.mongoURI!);

console.log(`Connected to ${mongoClient.connection.db.databaseName} Database`);

run();
