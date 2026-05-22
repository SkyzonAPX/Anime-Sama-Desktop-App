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
            console.log('\x1b[32m[RPC]\x1b[0m Connecte a Discord avec succes !');
            this.setBrowsing('Explore l\'Accueil', 'logo');
        });

        this.rpc.on('disconnected', () => {
            this.isConnected = false;
            console.log('\x1b[31m[RPC]\x1b[0m Deconnecte de Discord.');
        });
    }

    login() {
        this.rpc.login({ clientId }).catch(err => {
            console.error('\x1b[31m[RPC]\x1b[0m Erreur de connexion:', err.message);
            setTimeout(() => this.login(), 10000);
        });
    }

    // Statut de visionnage avec progression
    setWatchingProgress(animeName, episodeInfo, langAsset, timeString) {
        if (!this.isConnected) return;

        this.rpc.setActivity({
            details: `Regarde : ${animeName}`,
            state: `${episodeInfo} ${timeString}`, 
            largeImageKey: 'logo',
            largeImageText: 'Anime Sama Desktop',
            smallImageKey: langAsset,
            smallImageText: langAsset === 'vf' ? 'Version Française' : 'Version Originale',
            instance: false,
        }).catch(console.error);
    }

    // Statut de navigation
    setBrowsing(stateText, assetKey = 'logo') {
        if (!this.isConnected) return;
        
        this.rpc.setActivity({
            details: 'Explore le site',
            state: stateText,
            startTimestamp: this.startTimestamp,
            largeImageKey: 'logo',
            largeImageText: 'Anime Sama',
            smallImageKey: assetKey === 'logo' ? undefined : assetKey, 
            smallImageText: stateText,
            instance: false,
        }).catch(console.error);
    }

    // Statut de visionnage
    setWatching(animeName, episodeInfo = 'Épisode en cours', langAsset = 'vo') {
        if (!this.isConnected) return;

        this.rpc.setActivity({
            details: `Regarde : ${animeName}`,
            state: episodeInfo,
            startTimestamp: new Date(),
            largeImageKey: 'logo',
            largeImageText: 'Anime Sama Desktop',
            smallImageKey: langAsset,
            smallImageText: langAsset === 'vf' ? 'Version Française' : 'Version Originale',
            instance: false,
        }).catch(console.error);
    }

    clear() {
        if (!this.isConnected) return;
        this.rpc.clearActivity().catch(console.error);
    }
}

module.exports = new RPCManager();