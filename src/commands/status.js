import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';
import { getSystemStats } from '../utils/stats.js';

export const data = new SlashCommandBuilder()
    .setName('status')
    .setDescription('Get current VPS resource usage')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator);

export async function execute(source, context) {
    const { createStatsEmbed, isInteraction } = context;

    if (isInteraction) await source.deferReply();

    const stats = await getSystemStats();
    if (stats) {
        const payload = { embeds: [createStatsEmbed(stats)] };
        if (isInteraction) {
            await source.editReply(payload);
        } else {
            await source.reply(payload);
        }
    } else {
        const errorMsg = 'Failed to fetch system stats.';
        if (isInteraction) {
            await source.editReply(errorMsg);
        } else {
            await source.reply(errorMsg);
        }
    }
}
