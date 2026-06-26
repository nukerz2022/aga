import { InteractionType } from 'discord.js';
import { checkCooldown } from '../middlewares/cooldown.js';
import { upsertUser } from '../middlewares/premiumChecker.js';
import { getDb } from '../database/db.js';
import logger from '../utils/logger.js';
import { createErrorEmbed } from '../utils/embed.js';

export default {
  name: 'interactionCreate',
  once: false,
  async execute(interaction, client) {
    try {
      if (interaction.isChatInputCommand()) {
        await handleCommand(interaction, client);
      } else if (interaction.isButton()) {
        await handleButton(interaction, client);
      } else if (interaction.isStringSelectMenu()) {
        await handleSelectMenu(interaction, client);
      } else if (interaction.isModalSubmit()) {
        await handleModal(interaction, client);
      } else if (interaction.isAutocomplete()) {
        await handleAutocomplete(interaction, client);
      }
    } catch (err) {
      logger.error(`[InteractionCreate] Unhandled error: ${err.message}`, { stack: err.stack });
    }
  },
};

async function handleCommand(interaction, client) {
  const command = client.commands.get(interaction.commandName);
  if (!command) return;

  upsertUser(interaction.user.id, interaction.user.username);

  const { onCooldown, embed: cooldownEmbed } = checkCooldown(interaction, command);
  if (onCooldown) {
    return interaction.reply({ embeds: [cooldownEmbed], ephemeral: true });
  }

  const db = getDb();
  const logEntry = {
    discord_id: interaction.user.id,
    username: interaction.user.username,
    command: interaction.commandName,
    guild_id: interaction.guildId,
    args: JSON.stringify(interaction.options?.data ?? []),
    status: 'success',
  };

  try {
    await command.execute(interaction, client);
    db.prepare(`INSERT INTO logs (discord_id, username, command, args, guild_id, status) VALUES (?, ?, ?, ?, ?, ?)`)
      .run(logEntry.discord_id, logEntry.username, logEntry.command, logEntry.args, logEntry.guild_id, logEntry.status);
    logger.info(`[CMD] ${interaction.user.tag} → /${interaction.commandName}`);
  } catch (err) {
    logEntry.status = 'error';
    logEntry.error = err.message;
    db.prepare(`INSERT INTO logs (discord_id, username, command, args, guild_id, status, error) VALUES (?, ?, ?, ?, ?, ?, ?)`)
      .run(logEntry.discord_id, logEntry.username, logEntry.command, logEntry.args, logEntry.guild_id, logEntry.status, logEntry.error);
    logger.error(`[CMD Error] /${interaction.commandName}: ${err.message}`);

    const errorEmbed = createErrorEmbed('Terjadi Kesalahan', `Perintah gagal dieksekusi.\n\`\`\`${err.message}\`\`\``);
    if (interaction.replied || interaction.deferred) {
      await interaction.editReply({ embeds: [errorEmbed] }).catch(() => {});
    } else {
      await interaction.reply({ embeds: [errorEmbed], ephemeral: true }).catch(() => {});
    }
  }
}

async function handleButton(interaction, client) {
  const [baseId] = interaction.customId.split(':');
  const button = client.buttons?.get(baseId);
  if (!button) return;

  try {
    await button.execute(interaction, client);
  } catch (err) {
    logger.error(`[Button] ${interaction.customId}: ${err.message}`);
    const embed = createErrorEmbed('Button Error', err.message);
    if (!interaction.replied) await interaction.reply({ embeds: [embed], ephemeral: true }).catch(() => {});
  }
}

async function handleSelectMenu(interaction, client) {
  const [baseId] = interaction.customId.split(':');
  const menu = client.selectMenus?.get(baseId);
  if (!menu) return;

  try {
    await menu.execute(interaction, client);
  } catch (err) {
    logger.error(`[SelectMenu] ${interaction.customId}: ${err.message}`);
  }
}

async function handleModal(interaction, client) {
  const [baseId] = interaction.customId.split(':');
  const modal = client.modals?.get(baseId);
  if (!modal) return;

  try {
    await modal.execute(interaction, client);
  } catch (err) {
    logger.error(`[Modal] ${interaction.customId}: ${err.message}`);
  }
}

async function handleAutocomplete(interaction, client) {
  const command = client.commands.get(interaction.commandName);
  if (!command?.autocomplete) return;

  try {
    await command.autocomplete(interaction, client);
  } catch (err) {
    logger.error(`[Autocomplete] ${interaction.commandName}: ${err.message}`);
  }
}
