// Exporte/importe les préférences (store.js), les cookies de session, et le
// localStorage de la page (où Anime-Sama garde historique + progression des épisodes)
// dans un seul fichier JSON, pour sauvegarder/restaurer la config sur une autre machine.
const fs = require('fs');
const { session } = require('electron');
const store = require('./store');

// Champs de préférences à exporter (on exclut history/resumeData : ce sont nos propres
// données d'usage internes, pas des "préférences" à transférer)
const PREF_KEYS = [
    'width', 'height', 'isRpcEnabled', 'isAdblockEnabled',
    'isPrivacyModeEnabled', 'autoSwitchDomain', 'customDomains'
];

// Lit tout le localStorage de la page actuellement chargée dans la fenêtre
async function readLocalStorage(win) {
    return win.webContents.executeJavaScript(`
        (() => {
            const data = {};
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                data[key] = localStorage.getItem(key);
            }
            return data;
        })();
    `);
}

// Réinjecte un objet clé/valeur dans le localStorage de la page actuellement chargée
async function writeLocalStorage(win, data) {
    await win.webContents.executeJavaScript(`
        (() => {
            const data = ${JSON.stringify(data)};
            Object.entries(data).forEach(([key, value]) => localStorage.setItem(key, value));
            return true;
        })();
    `);
}

async function exportToFile(filePath, mainWindow) {
    const settings = store.getAll();
    const preferences = {};
    PREF_KEYS.forEach(key => { preferences[key] = settings[key]; });

    const cookies = await session.defaultSession.cookies.get({});
    const localStorageData = mainWindow ? await readLocalStorage(mainWindow) : {};

    const payload = {
        exportedAt: new Date().toISOString(),
        preferences,
        cookies,
        localStorage: localStorageData
    };

    fs.writeFileSync(filePath, JSON.stringify(payload, null, 2), 'utf8');
    return { cookieCount: cookies.length, localStorageCount: Object.keys(localStorageData).length };
}

async function importFromFile(filePath, mainWindow) {
    const raw = fs.readFileSync(filePath, 'utf8');
    const payload = JSON.parse(raw);

    if (payload.preferences) {
        Object.entries(payload.preferences).forEach(([key, value]) => store.set(key, value));
    }

    let restoredCookies = 0;
    if (Array.isArray(payload.cookies)) {
        for (const cookie of payload.cookies) {
            try {
                // Reconstruit l'URL requise par cookies.set() à partir du domaine/path du cookie
                const protocol = cookie.secure ? 'https' : 'http';
                const domain = cookie.domain.startsWith('.') ? cookie.domain.slice(1) : cookie.domain;
                const url = `${protocol}://${domain}${cookie.path || '/'}`;

                await session.defaultSession.cookies.set({
                    url,
                    name: cookie.name,
                    value: cookie.value,
                    domain: cookie.domain,
                    path: cookie.path,
                    secure: cookie.secure,
                    httpOnly: cookie.httpOnly,
                    expirationDate: cookie.expirationDate
                });
                restoredCookies++;
            } catch (err) {
                console.error('[Import] Cookie ignoré :', cookie.name, err.message);
            }
        }
    }

    let restoredLocalStorage = 0;
    if (payload.localStorage && mainWindow) {
        await writeLocalStorage(mainWindow, payload.localStorage);
        restoredLocalStorage = Object.keys(payload.localStorage).length;
        mainWindow.reload(); // nécessaire pour que le site relise son localStorage à jour
    }

    return { restoredCookies, restoredLocalStorage, preferences: payload.preferences || {} };
}

module.exports = { exportToFile, importFromFile };
