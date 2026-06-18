// Déclare les handlers IPC utilisés par la fenêtre Paramètres (process main).
const { ipcMain, dialog } = require('electron');
const store = require('./../main/store');
const { autoUpdater } = require('electron-updater');
const dataTransfer = require('./../main/data-transfer');

function registerSettingsIPC({ rpc, getMainWindow }) {
    ipcMain.handle('settings:get', () => store.getAll());

    ipcMain.handle('settings:set', (event, key, value) => {
        store.set(key, value);

        // Applique immédiatement certains effets de bord
        if (key === 'isRpcEnabled') {
            value ? rpc.login() : rpc.clear();
        }
        if (key === 'isPrivacyModeEnabled') {
            rpc.setPrivacyMode(value);
        }
        return true;
    });

    ipcMain.handle('settings:get-history', () => store.get('history'));

    ipcMain.handle('settings:clear-history', () => {
        store.clearHistory();
        return true;
    });

    ipcMain.handle('settings:add-domain', (event, url) => {
        const domains = store.get('customDomains');
        if (!domains.includes(url)) domains.push(url);
        store.set('customDomains', domains);
        return domains;
    });

    ipcMain.handle('settings:remove-domain', (event, url) => {
        const domains = store.get('customDomains').filter(d => d !== url);
        store.set('customDomains', domains);
        return domains;
    });

    ipcMain.handle('settings:check-updates', () => {
        return autoUpdater.checkForUpdates().catch(err => ({ error: err.message }));
    });

    // Export : ouvre une boîte "Enregistrer", écrit préférences + cookies + localStorage dans un .json
    ipcMain.handle('settings:export-data', async () => {
        const { filePath, canceled } = await dialog.showSaveDialog({
            title: 'Exporter préférences, cookies et progression',
            defaultPath: 'anime-sama-backup.json',
            filters: [{ name: 'Fichier JSON', extensions: ['json'] }]
        });
        if (canceled || !filePath) return { canceled: true };

        try {
            const result = await dataTransfer.exportToFile(filePath, getMainWindow());
            return { success: true, ...result };
        } catch (err) {
            return { error: err.message };
        }
    });

    // Import : ouvre une boîte "Ouvrir", restaure préférences + cookies + localStorage depuis le .json choisi
    ipcMain.handle('settings:import-data', async () => {
        const { filePaths, canceled } = await dialog.showOpenDialog({
            title: 'Importer préférences, cookies et progression',
            filters: [{ name: 'Fichier JSON', extensions: ['json'] }],
            properties: ['openFile']
        });
        if (canceled || filePaths.length === 0) return { canceled: true };

        try {
            const result = await dataTransfer.importFromFile(filePaths[0], getMainWindow());
            return { success: true, ...result };
        } catch (err) {
            return { error: err.message };
        }
    });
}

module.exports = { registerSettingsIPC };
