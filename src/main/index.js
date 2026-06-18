// Point d'entrée de l'application. Orchestre store, réseau, fenêtre, menu, RPC et auto-update.
const { app, session } = require('electron');
const { ElectronBlocker } = require('@ghostery/adblocker-electron');
const fetch = require('cross-fetch');

const store = require('./store');
const { findWorkingUrl, watchConnection, USER_AGENT } = require('./network');
const { createWindow } = require('./window');
const { buildMenu } = require('./menu');
const updater = require('./updater');
const { registerSettingsIPC } = require('../settings/settings-ipc');

const RPCManager = require('../rpc/rpc');
const packageJson = require('../../package.json');

store.load();

const rpc = new RPCManager(packageJson.appConfig.clientId);
rpc.setPrivacyMode(store.get('isPrivacyModeEnabled'));

let adblockerInstance = null;
let mainWindow = null;
let connectionWatcher = null;

function getAllConfiguredDomains() {
    return [...packageJson.appConfig.urls, ...store.get('customDomains')];
}

function switchDomain(newUrl) {
    if (!mainWindow || mainWindow.isDestroyed()) return;
    store.set('lastDomain', newUrl);
    mainWindow.loadURL(newUrl);
    console.log(`[Network] Basculé vers : ${newUrl}`);
}

app.whenReady().then(async () => {
    app.userAgentFallback = USER_AGENT;

    registerSettingsIPC({ rpc, getMainWindow: () => mainWindow });

    // --- Adblocker ---
    ElectronBlocker.fromPrebuiltAdsAndTracking(fetch)
        .then((blocker) => {
            adblockerInstance = blocker;
            if (store.get('isAdblockEnabled')) {
                blocker.enableBlockingInSession(session.defaultSession);
                console.log('[AdBlock] Activé.');
            }
        })
        .catch(err => console.error('[AdBlock] Erreur :', err));

    // --- Recherche du domaine de départ ---
    const allDomains = getAllConfiguredDomains();
    const workingUrl = await findWorkingUrl(allDomains);

    mainWindow = createWindow({
        startUrl: workingUrl || 'local-error',
        rpc,
        allowedDomains: allDomains
    });

    if (!workingUrl) {
        console.log('[Network] Aucun domaine ne répond.');
        if (store.get('isRpcEnabled')) {
            rpc.login();
            setTimeout(() => rpc.setBrowsing('Perdu dans les limbes', 'error'), 2000);
        }
    } else if (store.get('isRpcEnabled')) {
        rpc.login();
    }

    // --- Surveillance continue de la connexion (bascule auto si coupure) ---
    if (store.get('autoSwitchDomain')) {
        connectionWatcher = watchConnection({
            getCurrentUrl: () => store.get('lastDomain') || workingUrl,
            urls: allDomains,
            intervalMs: 60000,
            onSwitch: switchDomain
        });
    }

    // --- Menu natif ---
    buildMenu({
        rpc,
        getAdblocker: () => adblockerInstance,
        onManualDomainSwitch: switchDomain,
        getAllDomains: getAllConfiguredDomains
    });

    // --- Auto-update ---
    updater.init();
});

app.on('window-all-closed', () => {
    rpc.clear();
    if (connectionWatcher) clearInterval(connectionWatcher);
    if (process.platform !== 'darwin') app.quit();
});
