// Vérifie et installe les mises à jour automatiquement via electron-updater.
// Nécessite que le build soit publié sur un provider supporté (GitHub Releases ici).
const { autoUpdater } = require('electron-updater');
const { dialog } = require('electron');

function init() {
    autoUpdater.autoDownload = true;

    autoUpdater.on('update-available', (info) => {
        console.log(`[Update] Nouvelle version disponible : ${info.version}`);
    });

    autoUpdater.on('update-downloaded', (info) => {
        dialog.showMessageBox({
            type: 'info',
            title: 'Mise à jour disponible',
            message: `La version ${info.version} a été téléchargée. Redémarrer maintenant pour l'installer ?`,
            buttons: ['Redémarrer', 'Plus tard']
        }).then(({ response }) => {
            if (response === 0) autoUpdater.quitAndInstall();
        });
    });

    autoUpdater.on('error', (err) => {
        console.error('[Update] Erreur auto-updater :', err.message);
    });

    // Premier check au lancement, puis toutes les 4 heures
    autoUpdater.checkForUpdates().catch(() => {});
    setInterval(() => autoUpdater.checkForUpdates().catch(() => {}), 4 * 60 * 60 * 1000);
}

module.exports = { init };
