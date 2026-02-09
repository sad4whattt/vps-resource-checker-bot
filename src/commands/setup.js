import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';

export const data = new SlashCommandBuilder()
    .setName('setup')
    .setDescription('Configure automatic updates')
    .addChannelOption(option =>
        option.setName('channel')
            .setDescription('The channel to send updates to')
            .setRequired(true))
    .addIntegerOption(option =>
        option.setName('interval')
            .setDescription('Update interval in minutes (default 1)')
            .setMinValue(1))
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator);

export async function execute(source, context) {
    const { config, saveConfig, startMonitoring, isInteraction, args } = context;

    let channelId;
    let intervalMins = 1;

    if (isInteraction) {
        const channel = source.options.getChannel('channel');
        channelId = channel.id;
        intervalMins = source.options.getInteger('interval') || 1;
    } else {
        if (!args || args.length === 0) {
            return source.reply('Usage: `!setup <#channel_or_id> [interval_minutes]`');
        }

        const channelMatch = args[0].match(/<#(\d+)>/) || [null, args[0]];
        channelId = channelMatch[1];

        if (args[1]) {
            intervalMins = parseInt(args[1]);
            if (isNaN(intervalMins) || intervalMins < 1) intervalMins = 1;
        }
    }

    try {
        const channel = await source.client.channels.fetch(channelId);
        if (!channel) throw new Error();

        config.channelId = channelId;
        config.interval = intervalMins * 60000;

        await saveConfig();
        startMonitoring();

        await source.reply(`Setup complete! Automatic updates will be sent to <#${channelId}> every ${intervalMins} minute(s).`);
    } catch (err) {
        await source.reply('Invalid channel. Please provide a valid channel mention or ID.');
    }
}
