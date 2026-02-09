import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';

export const data = new SlashCommandBuilder()
    .setName('stop')
    .setDescription('Stop automatic updates')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator);

export async function execute(source, { config, saveConfig, stopMonitoring }) {
    config.channelId = null;
    await saveConfig();
    stopMonitoring();
    await source.reply('Automatic updates have been stopped.');
}