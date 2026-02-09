# VPS Resource Monitor Discord Bot

A lightweight Discord bot designed to be hosted on your VPS to monitor resources (CPU, RAM, Disk) and send periodic updates to a Discord channel.

## Features

- **Automatic Updates**: Configure a channel to receive periodic status reports.
- **Manual Status**: Use `/status` to get real-time stats at any time.
- **Admin Only**: All commands are restricted to server Administrators.
- **Persistent Config**: Remembers your settings across bot restarts.
- **Lightweight**: Uses minimal dependencies and readable ES module code.

## Prerequisites

- [Node.js](https://nodejs.org/) (v16.11.0 or higher)
- A Discord Bot Token (from the [Discord Developer Portal](https://discord.com/developers/applications))

## Installation

1. Clone or download this project to your VPS.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file (you can copy `.env.example`):
   ```bash
   cp .env.example .env
   ```
4. Fill in your `DISCORD_TOKEN` and `CLIENT_ID` (Application ID) in the `.env` file.

## Usage

### Starting the Bot

```bash
npm start
```
*Tip: Use a process manager like `pm2` to keep the bot running in the background:*
```bash
npm install -g pm2
pm2 start src/index.js --name "vps-monitor"
```

### Discord Commands

| Command | Description |
| --- | --- |
| `/status` | Manually fetch and display current VPS resources. |
| `/setup` | Configure automatic updates (requires channel and optional interval). |
| `/stop` | Stop automatic updates. |

**Note**: You must have "Administrator" permissions in the Discord server to see or use these commands.

## Requirements for Bot Permissions

When inviting the bot to your server, ensure it has the following permissions:
- `Send Messages`
- `Embed Links`
- `Use Slash Commands`

The commands themselves are restricted to "Administrator" role members by default.
