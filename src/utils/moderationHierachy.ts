import { ModerationHierachy } from "./types.js";
import {
  User,
  Role,
  CommandInteraction,
  GuildMember,
  UserContextMenuCommandInteraction,
  MessageContextMenuCommandInteraction,
} from "discord.js";

export async function moderationHierachy(
  target: User | Role,
  interaction:
    | CommandInteraction
    | UserContextMenuCommandInteraction
    | MessageContextMenuCommandInteraction
): Promise<ModerationHierachy | void> {
  const interactionAuthor = interaction.guild?.members.cache.get(
    interaction.user.id
  );

  const guildMember = await interaction.guild?.members.fetch(target.id);
  if (guildMember instanceof GuildMember) {
    if (target.id == interaction.user.id) return "You cannot select yourself";

    const interactionTarget = interaction.guild?.members.cache.get(target.id)!;

    if (
      !(
        interactionAuthor instanceof GuildMember &&
        interactionTarget instanceof GuildMember
      )
    )
      throw new TypeError(
        `The target and interaction must be from the current interaction?.guild`
      );

    if (interactionTarget.user.bot) return "You cannot select a bot";
    if (
      interactionTarget.roles.highest.position >=
      interactionAuthor.roles.highest.position
    )
      return "You cannot select that user as they are higher or equal to your target in the role hierachy";
  } else {
    const interactionTarget = interaction.guild?.roles.cache.get(target.id)!;

    if (
      !(
        interactionAuthor instanceof GuildMember &&
        interactionTarget instanceof Role
      )
    )
      throw new TypeError(
        `The author of the interaction, which must be an instanceof GuildMember, and the target, which must be an instanceof Role were not passed properly `
      );

    if (interactionTarget.position >= interactionAuthor.roles.highest.position)
      return "You cannot select that role as they are higher or equal to your target in the role hierachy";
  }
}
