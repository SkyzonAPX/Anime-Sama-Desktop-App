// Crée et pilote la fenêtre principale : navigation, détection de lecture vidéo,
// mise à jour du RPC Discord, sauvegarde de la progression et de l'historique.
const { BrowserWindow } = require('electron');
const path = require('path');
const store = require('./store');

function formatTime(seconds) {
    if (!seconds || isNaN(seconds)) return '00:00';
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

// Détermine si l'URL correspond à une page de lecture (saison/film en VF, VOSTFR ou VA)
function isWatchPage(url) {
    const isSaisonOrFilm = url.includes('/saison') || url.includes('/film');
    const hasLangMarker = url.includes('/vostfr') || url.includes('/vf') || url.includes('/va');
    return isSaisonOrFilm && hasLangMarker;
}

// Renvoie 'vf' (français), 'va' (doublage anglais) ou 'vo' (japonais sous-titré) selon l'URL
function getLangFromUrl(url) {
    if (url.includes('/vf')) return 'vf';
    if (url.includes('/va')) return 'va';
    return 'vo';
}

function createWindow({ startUrl, rpc, allowedDomains }) {
    const settings = store.getAll();

    const win = new BrowserWindow({
        width: settings.width,
        height: settings.height,
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true
        }
    });

    win.on('resize', () => {
        const bounds = win.getBounds();
        store.set('width', bounds.width);
        store.set('height', bounds.height);
    });

    // Bloque toute tentative d'ouverture de nouvelle fenêtre (pop-ups, faux clics lecteur)
    win.webContents.setWindowOpenHandler(() => {
        console.log('[Shield] Pop-up bloquée.');
        return { action: 'deny' };
    });

    // Empêche la navigation vers un domaine hors liste blanche (sécurité)
    win.webContents.on('will-navigate', (event, url) => {
        const isAllowed = allowedDomains.some(domain => url.startsWith(domain));
        if (!isAllowed) {
            console.log(`[Shield] Navigation bloquée vers domaine non autorisé : ${url}`);
            event.preventDefault();
        }
    });

    win.webContents.on('render-process-gone', (event, details) => {
        console.log(`[Crash] Render process perdu (${details.reason}). Tentative de récupération...`);
        if (details.reason === 'crashed' || details.reason === 'killed') {
            setTimeout(() => win.reload(), 1000);
        }
    });

    win.webContents.on('did-fail-load', (event, errorCode, errorDescription) => {
        if (errorCode === -3) return; // ignore les annulations de chargement (navigation rapide)
        console.log(`[Network] Erreur de chargement : ${errorDescription}`);
        win.loadFile(path.join(__dirname, '../../assets/html/error.html'));
        if (store.get('isRpcEnabled')) rpc.setBrowsing('Perdu dans les limbes', 'error');
    });

    if (startUrl === 'local-error') {
        win.loadFile(path.join(__dirname, '../../assets/html/error.html'));
    } else {
        win.loadURL(startUrl);
    }

    // --- Raccourcis clavier pour le lecteur vidéo ---
    // IMPORTANT : on utilise before-input-event (local à CETTE fenêtre) plutôt que
    // globalShortcut, qui capte la touche au niveau du système même quand l'app
    // est minimisée ou en arrière-plan — ça cassait l'espace dans les autres applis.
    // Ici, le handler ne se déclenche que si la fenêtre est focus et visible.
    async function runOnVideoFrame(script) {
        for (const frame of win.webContents.mainFrame.frames) {
            try {
                const result = await frame.executeJavaScript(script);
                if (result !== null && result !== undefined) return result;
            } catch (e) { /* frame inaccessible, on continue */ }
        }
        return null;
    }

    win.webContents.on('before-input-event', (event, input) => {
        if (input.type !== 'keyDown') return;
        if (!win.isFocused() || win.isMinimized()) return; // pas le focus => on n'intercepte rien

        if (input.key === ' ' || input.code === 'Space') {
            runOnVideoFrame(`
                (() => { const v = document.querySelector('video'); if (v) { v.paused ? v.play() : v.pause(); } return true; })();
            `);
        } else if (input.key === 'ArrowRight') {
            runOnVideoFrame(`(() => { const v = document.querySelector('video'); if (v) v.currentTime += 10; return true; })();`);
        } else if (input.key === 'ArrowLeft') {
            runOnVideoFrame(`(() => { const v = document.querySelector('video'); if (v) v.currentTime -= 10; return true; })();`);
        }
    });

    // --- Détection de page pour le RPC (catalogue, planning, etc.) ---
    let lastEpisodeStr = '';

    win.on('page-title-updated', (event, title) => {
        if (!store.get('isRpcEnabled')) return;
        const lowerTitle = title.toLowerCase();
        const url = win.webContents.getURL().toLowerCase();

        if (isWatchPage(url)) return; // géré par le polling ci-dessous

        lastEpisodeStr = '';

        if (url.includes('/catalogue')) rpc.setBrowsing('Dans le catalogue', 'catalog');
        else if (url.includes('/planning')) rpc.setBrowsing('Consulte le planning', 'planning');
        else if (url.includes('/contact')) rpc.setBrowsing('Sur la page Contact', 'contact');
        else if (url.includes('/aide') || url.includes('/faq')) rpc.setBrowsing('Consulte l\'aide', 'help');
        else if (lowerTitle.includes('erreur') || lowerTitle.includes('404')) rpc.setBrowsing('Perdu dans les limbes (404)', 'error');
        else rpc.setBrowsing('Explore la page d\'accueil', 'logo');
    });

    // --- Polling lecture vidéo : RPC + historique + sauvegarde de la reprise ---
    const pollInterval = setInterval(async () => {
        if (win.isDestroyed()) return;
        if (win.webContents.isLoadingMainFrame()) return;

        const url = win.webContents.getURL().toLowerCase();
        const title = win.getTitle();

        if (!isWatchPage(url) || title.toLowerCase().includes('just a moment')) return;

        try {
            const episodeText = await win.webContents.executeJavaScript(`
                (() => {
                    const select = document.getElementById('selectEpisodes');
                    return (select && select.options[select.selectedIndex]) ? select.options[select.selectedIndex].text : 'Épisode en cours';
                })();
            `);

            const mediaData = await runOnVideoFrame(`
                (() => {
                    const video = document.querySelector('video');
                    if (video && video.duration > 0) {
                        return { currentTime: video.currentTime, duration: video.duration, paused: video.paused };
                    }
                    return null;
                })();
            `);

            const cleanTitle = title.split('|')[0].split('- Anime-Sama')[0].trim();
            const langAsset = getLangFromUrl(url);
            const episodeUrl = win.webContents.getURL(); // URL exacte de l'épisode, utilisée pour le bouton Discord
            const resumeKey = `${cleanTitle}|${episodeText}`;

            if (mediaData) {
                // Sauvegarde la progression pour permettre la reprise plus tard
                store.setResumePoint(resumeKey, mediaData.currentTime);

                if (!mediaData.paused && store.get('isRpcEnabled')) {
                    const timeString = `[${formatTime(mediaData.currentTime)} / ${formatTime(mediaData.duration)}]`;
                    rpc.setWatching(cleanTitle, episodeText, langAsset, timeString, episodeUrl);
                }
            }

            if (episodeText !== lastEpisodeStr) {
                lastEpisodeStr = episodeText;
                store.pushHistory({ title: cleanTitle, episode: episodeText, lang: langAsset, url: episodeUrl });
                if (store.get('isRpcEnabled') && (!mediaData || mediaData.paused)) {
                    rpc.setWatching(cleanTitle, episodeText, langAsset, null, episodeUrl);
                }
            }
        } catch (err) { /* page pas encore prête, on retentera au prochain tick */ }
    }, 3000);

    win.on('closed', () => {
        clearInterval(pollInterval);
    });

    return win;
}

module.exports = { createWindow, isWatchPage, getLangFromUrl, formatTime };
