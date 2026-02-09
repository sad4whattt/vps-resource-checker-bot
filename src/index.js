import { Client, GatewayIntentBits, REST, Routes, EmbedBuilder, Collection, PermissionFlagsBits } from 'discord.js';
import dotenv from 'dotenv';
import fs from 'fs/promises';
import path from 'path';
import { getSystemStats } from './utils/stats.js';

import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootPath = path.resolve(__dirname, '..');

dotenv.config({ path: path.join(rootPath, '.env') });

const TOKEN = process.env.DISCORD_TOKEN;
const CLIENT_ID = process.env.CLIENT_ID;
const GUILD_ID = process.env.GUILD_ID;
const CONFIG_PATH = path.join(rootPath, 'config.json');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

client.commands = new Collection();

let monitorInterval = null;
let config = {
    channelId: null,
    interval: 60000
};

async function loadCommands() {
    const commandsPath = path.join(rootPath, 'src', 'commands');
    const commandFiles = (await fs.readdir(commandsPath)).filter(file => file.endsWith('.js'));

    const commandsData = [];
    for (const file of commandFiles) {
        const filePath = `file://${path.join(commandsPath, file)}`;
        const command = await import(filePath);
        if ('data' in command && 'execute' in command) {
            client.commands.set(command.data.name, command);
            commandsData.push(command.data.toJSON());
        }
    }
    return commandsData;
}

async function loadConfig() {
    try {
        const data = await fs.readFile(CONFIG_PATH, 'utf8');
        config = JSON.parse(data);
        if (config.channelId) {
            startMonitoring();
        }
    } catch (err) {

    }
}

async function saveConfig() {
    await fs.writeFile(CONFIG_PATH, JSON.stringify(config, null, 2));
}

function startMonitoring() {
    if (monitorInterval) clearInterval(monitorInterval);
    sendUpdate();
    monitorInterval = setInterval(sendUpdate, config.interval);
    console.log(`Monitoring started. Updates every ${config.interval / 1000}s`);
}

function stopMonitoring() {
    if (monitorInterval) {
        clearInterval(monitorInterval);
        monitorInterval = null;
    }
    console.log('Monitoring stopped.');
}

async function sendUpdate() {
    if (!config.channelId) return;

    const stats = await getSystemStats();
    if (!stats) return;

    try {
        const channel = await client.channels.fetch(config.channelId);
        if (!channel) return;

        const embed = createStatsEmbed(stats);
        await channel.send({ embeds: [embed] });
    } catch (err) {
        console.error('Failed to send update:', err);
    }
}

function createStatsEmbed(stats) {
    const loadAvg = stats.loadAverages ? stats.loadAverages.map(l => l.toFixed(2)).join(' | ') : 'N/A';

    return new EmbedBuilder()
        .setAuthor({ name: 'Made by: hate.bio', url: 'https://hate.bio/' })
        .setTitle(`VPS Status: ${stats.hostname}`)
        .setColor(0x00ff00)
        .setDescription(`**Provider:** ${stats.manufacturer} ${stats.model}\n**OS:** ${stats.distro} ${stats.release} | **Kernel:** \`${stats.kernel}\``)
        .addFields(
            { name: 'Uptime', value: `\`${stats.uptime}\``, inline: true },
            { name: 'Server Time', value: `\`${stats.serverTime}\``, inline: true },
            { name: 'Network (I/O)', value: `\`IN: ${stats.netRx} KB/s\`\n\`OUT: ${stats.netTx} KB/s\``, inline: true },
            { name: 'CPU Load (1/5/15m)', value: `\`${stats.cpuLoad}%\` [ ${loadAvg} ]`, inline: true },
            { name: 'CPU Cores', value: `\`${stats.cpuCores} Cores\``, inline: true },
            { name: 'Processes', value: `\`${stats.procRunning} / ${stats.processes} Running\``, inline: true },
            { name: 'Memory (RAM)', value: `**Used:** \`${stats.memUsed} / ${stats.memTotal} GB\`\n**Usage:** \`${stats.memPercent}%\``, inline: true },
            { name: 'Mem Details', value: `**Available:** \`${stats.memAvailable} GB\`\n**Cached:** \`${stats.memCached} GB\``, inline: true },
            { name: 'Swap Space', value: `**Used:** \`${stats.swapUsed} / ${stats.swapTotal} GB\``, inline: true },
            { name: 'Disk Space', value: `**Used:** \`${stats.diskUsed} / ${stats.diskTotal} GB\`\n**Usage:** \`${stats.diskPercent}%\``, inline: true }
        )
        .setTimestamp()
        .setFooter({ text: 'VPS Resource Monitor' });
}

const rest = new REST({ version: '10' }).setToken(TOKEN);

async function registerCommands(commandsData) {
    try {
        if (GUILD_ID) {
            console.log(`Started refreshing guild (/) commands for guild: ${GUILD_ID}`);
            await rest.put(
                Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID),
                { body: commandsData },
            );
            console.log('Successfully reloaded guild (/) commands.');
        } else {
            console.log('Started refreshing global application (/) commands.');
            await rest.put(
                Routes.applicationCommands(CLIENT_ID),
                { body: commandsData },
            );
            console.log('Successfully reloaded global application (/) commands.');
            console.log('Tip: Global commands can take up to an hour to propagate. For instant updates, set GUILD_ID in your .env file.');
        }
    } catch (error) {
        console.error(error);
    }
}

client.once('ready', async () => {
    console.log(`Logged in as ${client.user.tag}!`);
    console.log('Prefix commands: Use "!" followed by the command name.');
    const commandsData = await loadCommands();
    await registerCommands(commandsData);
    await loadConfig();
});

client.on('messageCreate', async message => {
    if (message.author.bot || !message.content.startsWith('!')) return;

    if (!message.member.permissions.has(PermissionFlagsBits.Administrator)) {
        return message.reply('You must be an administrator to use this bot.');
    }

    const args = message.content.slice(1).trim().split(/ +/);
    const commandName = args.shift().toLowerCase();

    const command = client.commands.get(commandName);
    if (!command) return;

    const context = {
        config,
        saveConfig,
        startMonitoring,
        stopMonitoring,
        createStatsEmbed,
        isInteraction: false,
        args
    };

    try {
        await command.execute(message, context);
    } catch (error) {
        console.error(error);
        await message.reply('There was an error while executing this command!');
    }
});

client.on('interactionCreate', async interaction => {
    if (!interaction.isChatInputCommand()) return;

    const command = client.commands.get(interaction.commandName);
    if (!command) return;

    const context = {
        config,
        saveConfig,
        startMonitoring,
        stopMonitoring,
        createStatsEmbed,
        isInteraction: true
    };

    try {
        await command.execute(interaction, context);
    } catch (error) {
        console.error(error);
        if (interaction.replied || interaction.deferred) {
            await interaction.followUp({ content: 'There was an error while executing this command!', ephemeral: true });
        } else {
            await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
        }
    }
});

client.login(TOKEN);
