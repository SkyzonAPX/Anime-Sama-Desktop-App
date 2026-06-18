// Gère la persistance des réglages, de l'historique et de la progression de lecture.
const fs = require('fs');
const path = require('path');
const { app } = require('electron');

const configPath = path.join(app.getPath('userData'), 'config-settings.json');

// Valeurs par défaut. Tout champ manquant dans le fichier sauvegardé est complété par ça.
const defaults = {
    width: 1200,
    height: 800,
    isRpcEnabled: true,
    isAdblockEnabled: true,
    isPrivacyModeEnabled: false, // masque le titre exact dans le RPC Discord
    autoSwitchDomain: true,      // bascule auto si le domaine actif tombe en cours d'usage
    customDomains: [],           // domaines ajoutés manuellement par l'utilisateur
    lastDomain: null,
    history: [],                 // liste des derniers épisodes regardés
    resumeData: {}                // { "titre|episode": currentTimeInSeconds }
};

let state = { ...defaults };

function load() {
    try {
        if (fs.existsSync(configPath)) {
            const raw = fs.readFileSync(configPath, 'utf8');
            state = { ...defaults, ...JSON.parse(raw) };
        }
    } catch (err) {
        console.error('[Store] Erreur de chargement, valeurs par défaut utilisées:', err);
        state = { ...defaults };
    }
    return state;
}

function save() {
    try {
        fs.writeFileSync(configPath, JSON.stringify(state, null, 2), 'utf8');
    } catch (err) {
        console.error('[Store] Erreur de sauvegarde:', err);
    }
}

function get(key) {
    return state[key];
}

function set(key, value) {
    state[key] = value;
    save();
}

function getAll() {
    return state;
}

// Ajoute une entrée d'historique (sans doublon consécutif), limité à 100 entrées
function pushHistory(entry) {
    const last = state.history[0];
    if (last && last.title === entry.title && last.episode === entry.episode) {
        return; // évite de spammer la même entrée toutes les 3s
    }
    state.history.unshift({ ...entry, watchedAt: Date.now() });
    if (state.history.length > 100) state.history.length = 100;
    save();
}

function clearHistory() {
    state.history = [];
    save();
}

// Sauvegarde le point de reprise pour un épisode donné
function setResumePoint(key, seconds) {
    state.resumeData[key] = seconds;
    save();
}

function getResumePoint(key) {
    return state.resumeData[key] || 0;
}

module.exports = {
    load,
    save,
    get,
    set,
    getAll,
    pushHistory,
    clearHistory,
    setResumePoint,
    getResumePoint
};
