const DiscordRPC = require('discord-rpc');
const packageJson = require('./package.json');

const clientId = packageJson.appConfig.clientId;

class RPCManager {
    constructor() {
        this.rpc = new DiscordRPC.Client({ transport: 'ipc' });
        this.startTimestamp = new Date();
        this.isConnected = false;
        
        this.rpc.on('ready', () => {
            this.isConnected = true;
            console.log('\x1b[32m[RPC]\x1b[0m Successfully connected to Discord!');
            this.setBrowsing('Exploring the Home page', 'logo');
        });

        this.rpc.on('disconnected', () => {
            this.isConnected = false;
            console.log('\x1b[31m[RPC]\x1b[0m Disconnected from Discord.');
        });
    }

    login() {
        this.rpc.login({ clientId }).catch(err => {
            console.error('\x1b[31m[RPC]\x1b[0m Connection error:', err.message);
            setTimeout(() => this.login(), 10000);
        });
    }

    // Watching status with progress
    setWatchingProgress(animeName, episodeInfo, langAsset, timeString) {
        if (!this.isConnected) return;

        this.rpc.setActivity({
            details: `Watching: ${animeName}`,
            state: `${episodeInfo} ${timeString}`, 
            largeImageKey: 'logo',
            largeImageText: 'Anime Sama Desktop',
            smallImageKey: langAsset,
            smallImageText: langAsset === 'vf' ? 'French Version' : 'Original Version',
            instance: false,
        }).catch(console.error);
    }

    // Browsing status
    setBrowsing(stateText, assetKey = 'logo') {
        if (!this.isConnected) return;
        
        this.rpc.setActivity({
            details: 'Exploring the website',
            state: stateText,
            startTimestamp: this.startTimestamp,
            largeImageKey: 'logo',
            largeImageText: 'Anime Sama',
            smallImageKey: assetKey === 'logo' ? undefined : assetKey, 
            smallImageText: stateText,
            instance: false,
        }).catch(console.error);
    }

    // Watching status
    setWatching(animeName, episodeInfo = 'Current episode', langAsset = 'vo') {
        if (!this.isConnected) return;

        this.rpc.setActivity({
            details: `Watching: ${animeName}`,
            state: episodeInfo,
            startTimestamp: new Date(),
            largeImageKey: 'logo',
            largeImageText: 'Anime Sama Desktop',
            smallImageKey: langAsset,
            smallImageText: langAsset === 'vf' ? 'French Version' : 'Original Version',
            instance: false,
        }).catch(console.error);
    }

    clear() {
        if (!this.isConnected) return;
        this.rpc.clearActivity().catch(console.error);
    }
}

module.exports = new RPCManager();