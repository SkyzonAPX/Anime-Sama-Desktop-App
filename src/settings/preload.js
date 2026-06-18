// Preload : expose une API restreinte et sûre au renderer de la fenêtre Paramètres.
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('settingsAPI', {
    getSettings: () => ipcRenderer.invoke('settings:get'),
    setSetting: (key, value) => ipcRenderer.invoke('settings:set', key, value),
    getHistory: () => ipcRenderer.invoke('settings:get-history'),
    clearHistory: () => ipcRenderer.invoke('settings:clear-history'),
    addCustomDomain: (url) => ipcRenderer.invoke('settings:add-domain', url),
    removeCustomDomain: (url) => ipcRenderer.invoke('settings:remove-domain', url),
    checkForUpdates: () => ipcRenderer.invoke('settings:check-updates'),
    exportData: () => ipcRenderer.invoke('settings:export-data'),
    importData: () => ipcRenderer.invoke('settings:import-data')
});
