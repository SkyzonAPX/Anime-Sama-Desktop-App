// Crée la fenêtre Paramètres (singleton : un seul exemplaire à la fois).
const { BrowserWindow } = require('electron');
const path = require('path');

let settingsWin = null;

function openSettingsWindow() {
    if (settingsWin && !settingsWin.isDestroyed()) {
        settingsWin.focus();
        return settingsWin;
    }

    settingsWin = new BrowserWindow({
        width: 560,
        height: 640,
        title: 'Paramètres',
        resizable: false,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            nodeIntegration: false,
            contextIsolation: true
        }
    });

    settingsWin.setMenuBarVisibility(false);
    settingsWin.loadFile(path.join(__dirname, 'index.html'));

    settingsWin.on('closed', () => {
        settingsWin = null;
    });

    return settingsWin;
}

module.exports = { openSettingsWindow };
