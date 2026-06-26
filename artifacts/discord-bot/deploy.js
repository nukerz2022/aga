import 'dotenv/config';
import { REST, Routes } from 'discord.js';
import { readdirSync, statSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const TOKEN = process.env.DISCORD_TOKEN;
const CLIENT_ID = process.env.CLIENT_ID;
const GUILD_ID = process.env.GUILD_ID;

if (!TOKEN || !CLIENT_ID) {
  console.error('❌ DISCORD_TOKEN dan CLIENT_ID diperlukan di .env');
  process.exit(1);
}

const commands = [];
const commandsPath = path.join(__dirname, 'src/commands');

async function loadCommandsFromDir(dir) {
  const entries = readdirSync(dir);
  for (const entry of entries) {
    const fullPath = path.join(dir, entry);
    if (statSync(fullPath).isDirectory()) {
      await loadCommandsFromDir(fullPath);
    } else if (entry.endsWith('.js')) {
      try {
        const cmd = await import(`file://${fullPath}`);
        const command = cmd.default || cmd;
        if (command?.data) {
          commands.push(command.data.toJSON());
          console.log(`✅ Loaded: ${command.data.name}`);
        }
      } catch (err) {
        console.error(`❌ Failed to load ${entry}: ${err.message}`);
      }
    }
  }
}

async function deploy() {
  await loadCommandsFromDir(commandsPath);

  const rest = new REST({ version: '10' }).setToken(TOKEN);

  console.log(`\n🚀 Deploying ${commands.length} commands...`);

  try {
    if (GUILD_ID) {
      await rest.put(Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID), { body: commands });
      console.log(`✅ Guild commands deployed to ${GUILD_ID} (instant)`);
    } else {
      await rest.put(Routes.applicationCommands(CLIENT_ID), { body: commands });
      console.log('✅ Global commands deployed (up to 1 hour to propagate)');
    }
    console.log(`\n🎉 Successfully deployed ${commands.length} slash commands!`);
  } catch (err) {
    console.error('❌ Deploy failed:', err.message);
    process.exit(1);
  }
}

deploy();
