// Gère la Rich Presence Discord. Refactor : une seule fonction interne construit l'activité,
// les méthodes publiques ne font que fournir les champs qui changent.
const DiscordRPC = require('discord-rpc');

// Libellés affichés sur Discord selon la langue détectée.
// 'va' = doublage anglais. L'asset image correspondant (smallImageKey: 'va')
// doit être uploadé dans les Rich Presence Assets du Discord Developer Portal.
const LANG_LABELS = {
    vf: 'Version Française',
    va: 'Doublage Anglais',
    vo: 'Version Originale'
};

class RPCManager {
    constructor(clientId) {
        this.clientId = clientId;
        this.rpc = new DiscordRPC.Client({ transport: 'ipc' });
        this.startTimestamp = new Date();
        this.isConnected = false;
        this.privacyMode = false;

        this.rpc.on('ready', () => {
            this.isConnected = true;
            console.log('[RPC] Connecté à Discord.');
            this.setBrowsing('Explore la page d\'accueil', 'logo');
        });

        this.rpc.on('disconnected', () => {
            this.isConnected = false;
            console.log('[RPC] Déconnecté de Discord.');
        });
    }

    setPrivacyMode(enabled) {
        this.privacyMode = enabled;
    }

    login() {
        this.rpc.login({ clientId: this.clientId }).catch(err => {
            console.error('[RPC] Erreur de connexion :', err.message);
            setTimeout(() => this.login(), 10000);
        });
    }

    // Construit et envoie l'activité. Centralise les champs communs.
    _push(activity) {
        if (!this.isConnected) return;
        this.rpc.setActivity({
            largeImageKey: 'logo',
            largeImageText: 'Anime Sama Desktop',
            instance: false,
            ...activity
        }).catch(console.error);
    }

    // Statut "en train de regarder", avec ou sans horodatage de progression.
    // episodeUrl (optionnel) ajoute un bouton Discord "Regarder aussi" qui ouvre
    // l'épisode dans le navigateur de la personne qui consulte le profil.
    setWatching(animeName, episodeInfo = 'Épisode en cours', langAsset = 'vo', timeString = null, episodeUrl = null) {
        if (this.privacyMode) {
            this._push({
                details: 'Regarde un anime',
                state: 'Détails masqués',
                startTimestamp: new Date()
            });
            return;
        }

        this._push({
            details: `Regarde : ${animeName}`,
            state: timeString ? `${episodeInfo} ${timeString}` : episodeInfo,
            startTimestamp: timeString ? undefined : new Date(),
            smallImageKey: langAsset,
            smallImageText: LANG_LABELS[langAsset] || LANG_LABELS.vo,
            buttons: episodeUrl ? [{ label: 'Regarder aussi', url: episodeUrl }] : undefined
        });
    }

    // Statut "navigation sur le site" (catalogue, planning, etc.)
    setBrowsing(stateText, assetKey = 'logo') {
        this._push({
            details: 'Explore le site',
            state: stateText,
            startTimestamp: this.startTimestamp,
            smallImageKey: assetKey === 'logo' ? undefined : assetKey,
            smallImageText: stateText
        });
    }

    clear() {
        if (!this.isConnected) return;
        this.rpc.clearActivity().catch(console.error);
    }
}

module.exports = RPCManager;
