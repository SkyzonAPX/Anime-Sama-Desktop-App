const { app, BrowserWindow, session, Menu } = require('electron');
const { ElectronBlocker } = require('@ghostery/adblocker-electron');
const fetch = require('cross-fetch');
const fs = require('fs');
const path = require('path');
const rpc = require('./rpc');
const packageJson = require('./package.json');

const startUrl = packageJson.appConfig.url;

app.commandLine.appendSwitch('disable-site-isolation-trials'); 

// Chemin du fichier de configuration
const configPath = path.join(app.getPath('userData'), 'config-settings.json');

// Valeurs par défaut
let settings = {
    width: 1200,
    height: 800,
    isRpcEnabled: true,
    isAdblockEnabled: true
};

// Chargement des paramètres
function loadSettings() {
    try {
        if (fs.existsSync(configPath)) {
            const data = fs.readFileSync(configPath, 'utf8');
            settings = { ...settings, ...JSON.parse(data) };
            console.log('\x1b[32m[Config]\x1b[0m Parametres charges avec succes.');
        }
    } catch (err) {
        console.error('Erreur au chargement des parametres:', err);
    }
}

// Sauvegarde des paramètres
function saveSettings() {
    try {
        fs.writeFileSync(configPath, JSON.stringify(settings, null, 2), 'utf8');
    } catch (err) {
        console.error('Erreur a la sauvegarde des parametres:', err);
    }
}

loadSettings();

let adblockerInstance = null;
let win = null;

function createCustomMenu() {
    const template = [
        {
            label: 'Settings',
            submenu: [
                {
                    label: 'Activer Discord RPC',
                    type: 'checkbox',
                    checked: settings.isRpcEnabled,
                    click: (menuItem) => {
                        settings.isRpcEnabled = menuItem.checked;
                        saveSettings();
                        
                        if (!settings.isRpcEnabled) {
                            rpc.clear();
                            console.log('\x1b[33m[RPC]\x1b[0m Desactive.');
                        } else {
                            rpc.login();
                            console.log('\x1b[32m[RPC]\x1b[0m Reactive.');
                        }
                    }
                },
                {
                    label: 'Activer AdBlock',
                    type: 'checkbox',
                    checked: settings.isAdblockEnabled,
                    click: (menuItem) => {
                        settings.isAdblockEnabled = menuItem.checked;
                        saveSettings();
                        
                        if (adblockerInstance) {
                            if (settings.isAdblockEnabled) {
                                adblockerInstance.enableBlockingInSession(session.defaultSession);
                                console.log('\x1b[32m[AdBlock]\x1b[0m Active.');
                            } else {
                                adblockerInstance.disableBlockingInSession(session.defaultSession);
                                console.log('\x1b[33m[AdBlock]\x1b[0m Desactive.');
                            }
                        }
                    }
                }
            ]
        },
        { label: 'Edit', role: 'editMenu' },
        { label: 'View', role: 'viewMenu' },
        { label: 'Window', role: 'windowMenu' }
    ];

    const menu = Menu.buildFromTemplate(template);
    Menu.setApplicationMenu(menu);
}

// Vérifications des urls
async function findWorkingUrl(urls) {
    console.log('\x1b[36m[Network]\x1b[0m Recherche d\'un domaine fonctionnel...');
    
    for (const url of urls) {
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 5000);

            const response = await fetch(url, { signal: controller.signal });
            clearTimeout(timeoutId);

            if (response.ok) {
                const html = await response.text();
                if (html.toLowerCase().includes('anime-sama')) {
                    console.log(`\x1b[32m[Network]\x1b[0m Domaine valide trouvé : ${url}`);
                    return url;
                }
            }
        } catch (error) {
            console.log(`\x1b[33m[Network]\x1b[0m Domaine injoignable : ${url}`);
        }
    }
    
    return null;
}

function createWindow(startUrl) {
    win = new BrowserWindow({
        width: settings.width,
        height: settings.height,
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            webSecurity: false
        }
    });

    win.on('resize', () => {
        const bounds = win.getBounds();
        settings.width = bounds.width;
        settings.height = bounds.height;
        saveSettings();
    });

    win.webContents.setWindowOpenHandler(() => {
        console.log('\x1b[33m[Shield]\x1b[0m Pop-up bloque !');
        return { action: 'deny' };
    });

    // Gestion des erreurs de chargements
    win.webContents.on('did-fail-load', (event, errorCode, errorDescription) => {
        if (errorCode !== -3) {
            console.log(`\x1b[31m[Network]\x1b[0m Erreur de chargement: ${errorDescription}`);
            win.loadFile(path.join(__dirname, '/assets/html/error.html'));
            
            if (settings.isRpcEnabled) {
                rpc.setBrowsing('Perdu dans les limbes', 'error');
            }
        }
    });

    if (startUrl === 'local-error') {
        win.loadFile(path.join(__dirname, 'error.html'));
    } else {
        win.loadURL(startUrl);
    }

    let lastEpisodeStr = "";
    
    function formatTime(seconds) {
        if (!seconds || isNaN(seconds)) return "00:00";
        const m = Math.floor(seconds / 60);
        const s = Math.floor(seconds % 60);
        return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    }

    win.on('page-title-updated', (event, title) => {
        if (!settings.isRpcEnabled) return;
        const lowerTitle = title.toLowerCase();
        const url = win.webContents.getURL().toLowerCase();
        const isWatching = (url.includes('/saison') || url.includes('/film')) && (url.includes('vostfr') || url.includes('vf'));

        if (isWatching) return;

        lastEpisodeStr = "";

        if (url.includes('/catalogue')) rpc.setBrowsing('Dans le Catalogue', 'catalog');
        else if (url.includes('/planning')) rpc.setBrowsing('Regarde le Planning', 'planning');
        else if (url.includes('/contact')) rpc.setBrowsing('Sur la page Contact', 'contact');
        else if (url.includes('/aide') || url.includes('/faq')) rpc.setBrowsing('Consulte l\'Aide', 'help');
        else if (lowerTitle.includes('erreur') || lowerTitle.includes('404')) rpc.setBrowsing('Perdu dans les limbes (Erreur 404)', 'error');
        else rpc.setBrowsing('Explore l\'Accueil', 'logo');
    });

    setInterval(async () => {
        if (!settings.isRpcEnabled) return;
        
        const url = win.webContents.getURL().toLowerCase();
        const title = win.getTitle();
        const isWatching = (url.includes('/saison') || url.includes('/film')) && (url.includes('vostfr') || url.includes('vf'));

        if (isWatching) {
            try {
                const data = await win.webContents.executeJavaScript(`
                    (() => {
                        let episodeText = 'Épisode en cours';
                        const select = document.getElementById('selectEpisodes');
                        if (select && select.options[select.selectedIndex]) {
                            episodeText = select.options[select.selectedIndex].text;
                        }
                        let mediaData = null;
                        const iframes = [window, ...document.querySelectorAll('iframe')];
                        for (let frame of iframes) {
                            try {
                                const doc = frame.document || frame.contentWindow.document;
                                const video = doc.querySelector('video');
                                if (video && video.duration > 0) {
                                    mediaData = { currentTime: video.currentTime, duration: video.duration, paused: video.paused };
                                    break;
                                }
                            } catch(e) {}
                        }
                        return { episodeText, mediaData };
                    })();
                `);

                let cleanTitle = title.split('|')[0].split('- Anime-Sama')[0].trim();
                let langAsset = url.includes('/vf') ? 'vf' : 'vo';

                if (data.mediaData && !data.mediaData.paused) {
                    const currentStr = formatTime(data.mediaData.currentTime);
                    const totalStr = formatTime(data.mediaData.duration);
                    const timeString = `[${currentStr} / ${totalStr}]`;
                    rpc.setWatchingProgress(cleanTitle, data.episodeText, langAsset, timeString);
                } else {
                    if (data.episodeText !== lastEpisodeStr) {
                        lastEpisodeStr = data.episodeText;
                        rpc.setWatching(cleanTitle, data.episodeText, langAsset);
                    }
                }
            } catch (err) {
                console.error("Erreur de scan :", err);
            }
        }
    }, 3000);
}

app.whenReady().then(async () => {
    createCustomMenu();

    ElectronBlocker.fromPrebuiltAdsAndTracking(fetch).then((blocker) => {
        adblockerInstance = blocker;
        if (settings.isAdblockEnabled) {
            blocker.enableBlockingInSession(session.defaultSession);
            console.log('\x1b[32m[AdBlock]\x1b[0m Moteur active !');
        }
    }).catch(err => {
        console.error('Erreur Adblocker :', err);
    });

    const packageJson = require('./package.json');
    const urlsToTest = packageJson.appConfig.urls;
    
    const workingUrl = await findWorkingUrl(urlsToTest);

    if (workingUrl) {
        createWindow(workingUrl);
        if (settings.isRpcEnabled) {
            rpc.login();
        }
    } else {
        console.log('\x1b[31m[Network]\x1b[0m Aucun domaine Anime Sama ne repond.');
        createWindow('local-error');
        
        if (settings.isRpcEnabled) {
            rpc.login();
            setTimeout(() => rpc.setBrowsing('Perdu dans les limbes', 'error'), 2000);
        }
    }
});

app.on('window-all-closed', () => {
    rpc.clear();
    if (process.platform !== 'darwin') app.quit();
});