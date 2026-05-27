const { app, BrowserWindow, session, Menu } = require('electron');
const { ElectronBlocker } = require('@ghostery/adblocker-electron');
const fetch = require('cross-fetch');
const fs = require('fs');
const path = require('path');
const rpc = require('./rpc');
const packageJson = require('./package.json');

const startUrl = packageJson.appConfig.url;

const configPath = path.join(app.getPath('userData'), 'config-settings.json');

let settings = {
    width: 1200,
    height: 800,
    isRpcEnabled: true,
    isAdblockEnabled: true
};

// Loads settings from the configuration file
function loadSettings() {
    try {
        if (fs.existsSync(configPath)) {
            const data = fs.readFileSync(configPath, 'utf8');
            settings = { ...settings, ...JSON.parse(data) };
            console.log('\x1b[32m[Config]\x1b[0m Settings loaded successfully.');
        }
    } catch (err) {
        console.error('Error loading settings:', err);
    }
}

// Saves settings to the configuration file
function saveSettings() {
    try {
        fs.writeFileSync(configPath, JSON.stringify(settings, null, 2), 'utf8');
    } catch (err) {
        console.error('Error saving settings:', err);
    }
}

loadSettings();

let adblockerInstance = null;
let win = null;

// Creates the application menu
function createCustomMenu() {
    const template = [
        {
            label: 'Settings',
            submenu: [
                {
                    label: 'Enable Discord RPC',
                    type: 'checkbox',
                    checked: settings.isRpcEnabled,
                    click: (menuItem) => {
                        settings.isRpcEnabled = menuItem.checked;
                        saveSettings();
                        
                        if (!settings.isRpcEnabled) {
                            rpc.clear();
                            console.log('\x1b[33m[RPC]\x1b[0m Disabled.');
                        } else {
                            rpc.login();
                            console.log('\x1b[32m[RPC]\x1b[0m Enabled.');
                        }
                    }
                },
                {
                    label: 'Enable AdBlock',
                    type: 'checkbox',
                    checked: settings.isAdblockEnabled,
                    click: (menuItem) => {
                        settings.isAdblockEnabled = menuItem.checked;
                        saveSettings();
                        
                        if (adblockerInstance) {
                            if (settings.isAdblockEnabled) {
                                adblockerInstance.enableBlockingInSession(session.defaultSession);
                                console.log('\x1b[32m[AdBlock]\x1b[0m Enabled.');
                            } else {
                                adblockerInstance.disableBlockingInSession(session.defaultSession);
                                console.log('\x1b[33m[AdBlock]\x1b[0m Disabled.');
                            }
                        }
                    }
                }
            ]
        },
        { label: 'View', role: 'viewMenu' }
    ];

    const menu = Menu.buildFromTemplate(template);
    Menu.setApplicationMenu(menu);
}

// Searches for the first working domain from a list
async function findWorkingUrl(urls) {
    console.log('\x1b[36m[Network]\x1b[0m Searching for a working domain...');
    
    for (const url of urls) {
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 5000);

            const response = await fetch(url, { 
                signal: controller.signal,
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36'
                }
            });
            clearTimeout(timeoutId);

            if (response.ok || response.status === 403) {
                console.log(`\x1b[32m[Network]\x1b[0m Active domain detected: ${url}`);
                return url;
            }
        } catch (error) {
            console.log(`\x1b[33m[Network]\x1b[0m Dead or unreachable domain: ${url}`);
        }
    }
    
    return null;
}

// Initializes and configures the main application window
function createWindow(startUrl) {
    win = new BrowserWindow({
        width: settings.width,
        height: settings.height,
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true
        }
    });

    win.on('resize', () => {
        const bounds = win.getBounds();
        settings.width = bounds.width;
        settings.height = bounds.height;
        saveSettings();
    });

    win.webContents.setWindowOpenHandler(() => {
        console.log('\x1b[33m[Shield]\x1b[0m Pop-up blocked!');
        return { action: 'deny' };
    });

    win.webContents.on('render-process-gone', (event, details) => {
        console.log(`\x1b[31m[Crash]\x1b[0m Render process crashed (${details.reason}). Attempting recovery...`);
        if (details.reason === 'crashed' || details.reason === 'killed') {
            setTimeout(() => win.reload(), 1000);
        }
    });

    win.webContents.on('did-fail-load', (event, errorCode, errorDescription) => {
        if (errorCode !== -3) {
            console.log(`\x1b[31m[Network]\x1b[0m Loading error: ${errorDescription}`);
            win.loadFile(path.join(__dirname, '/assets/html/error.html'));
            
            if (settings.isRpcEnabled) {
                rpc.setBrowsing('Lost in limbo', 'error');
            }
        }
    });

    if (startUrl === 'local-error') {
        win.loadFile(path.join(__dirname, '/assets/html/error.html'));
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

        if (url.includes('/catalogue')) rpc.setBrowsing('In the Catalog', 'catalog');
        else if (url.includes('/planning')) rpc.setBrowsing('Looking at the Schedule', 'planning');
        else if (url.includes('/contact')) rpc.setBrowsing('On the Contact page', 'contact');
        else if (url.includes('/aide') || url.includes('/faq')) rpc.setBrowsing('Consulting Help', 'help');
        else if (lowerTitle.includes('erreur') || lowerTitle.includes('404')) rpc.setBrowsing('Lost in limbo (Error 404)', 'error');
        else rpc.setBrowsing('Exploring the Home page', 'logo');
    });

    setInterval(async () => {
        if (!settings.isRpcEnabled) return;
        if (win.isDestroyed()) return;
        
        if (win.webContents.isLoadingMainFrame()) return;
        
        const url = win.webContents.getURL().toLowerCase();
        const title = win.getTitle();
        const isWatching = (url.includes('/saison') || url.includes('/film')) && (url.includes('vostfr') || url.includes('vf'));

        if (isWatching && !title.toLowerCase().includes('just a moment')) {
            try {
                let episodeText = await win.webContents.executeJavaScript(`
                    (() => {
                        const select = document.getElementById('selectEpisodes');
                        return (select && select.options[select.selectedIndex]) ? select.options[select.selectedIndex].text : 'Current episode';
                    })();
                `);

                let mediaData = null;
                const frames = win.webContents.mainFrame.frames;
                
                for (const frame of frames) {
                    try {
                        const videoInfo = await frame.executeJavaScript(`
                            (() => {
                                const video = document.querySelector('video');
                                if (video && video.duration > 0) {
                                    return { currentTime: video.currentTime, duration: video.duration, paused: video.paused };
                                }
                                return null;
                            })();
                        `);
                        
                        if (videoInfo) {
                            mediaData = videoInfo;
                            break;
                        }
                    } catch (e) {
                    }
                }

                let cleanTitle = title.split('|')[0].split('- Anime-Sama')[0].trim();
                let langAsset = url.includes('/vf') ? 'vf' : 'vo';

                if (mediaData && !mediaData.paused) {
                    const currentStr = formatTime(mediaData.currentTime);
                    const totalStr = formatTime(mediaData.duration);
                    const timeString = `[${currentStr} / ${totalStr}]`;
                    rpc.setWatchingProgress(cleanTitle, episodeText, langAsset, timeString);
                } else {
                    if (episodeText !== lastEpisodeStr) {
                        lastEpisodeStr = episodeText;
                        rpc.setWatching(cleanTitle, episodeText, langAsset);
                    }
                }
            } catch (err) {
            }
        }
    }, 3000);
}

app.whenReady().then(async () => {
    app.userAgentFallback = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36';

    createCustomMenu();

    ElectronBlocker.fromPrebuiltAdsAndTracking(fetch).then((blocker) => {
        adblockerInstance = blocker;
        if (settings.isAdblockEnabled) {
            blocker.enableBlockingInSession(session.defaultSession);
            console.log('\x1b[32m[AdBlock]\x1b[0m Engine enabled!');
        }
    }).catch(err => {
        console.error('Adblocker error:', err);
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
        console.log('\x1b[31m[Network]\x1b[0m No Anime Sama domain is responding.');
        createWindow('local-error');
        
        if (settings.isRpcEnabled) {
            rpc.login();
            setTimeout(() => rpc.setBrowsing('Lost in limbo', 'error'), 2000);
        }
    }
});

app.on('window-all-closed', () => {
    rpc.clear();
    if (process.platform !== 'darwin') app.quit();
});