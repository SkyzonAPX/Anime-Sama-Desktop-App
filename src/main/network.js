// Recherche un domaine fonctionnel parmi une liste, et surveille la connexion en continu.
const fetch = require('cross-fetch');

const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';

// Teste un domaine unique avec timeout. 403 est accepté (mur Cloudflare = site vivant).
async function testUrl(url, timeoutMs = 5000) {
    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

        const response = await fetch(url, {
            signal: controller.signal,
            headers: { 'User-Agent': USER_AGENT }
        });
        clearTimeout(timeoutId);

        return response.ok || response.status === 403;
    } catch (err) {
        return false;
    }
}

// Parcourt la liste des urls dans l'ordre et retourne la première qui répond
async function findWorkingUrl(urls) {
    console.log('[Network] Recherche d\'un domaine actif...');
    for (const url of urls) {
        const isAlive = await testUrl(url);
        if (isAlive) {
            console.log(`[Network] Domaine actif trouvé : ${url}`);
            return url;
        }
        console.log(`[Network] Domaine mort ou inaccessible : ${url}`);
    }
    return null;
}

// Surveille en arrière-plan que le domaine courant répond toujours.
// Si non, cherche un nouveau domaine fonctionnel et appelle onSwitch(newUrl).
function watchConnection({ getCurrentUrl, urls, intervalMs, onSwitch }) {
    return setInterval(async () => {
        const current = getCurrentUrl();
        if (!current) return;

        const stillAlive = await testUrl(current, 4000);
        if (stillAlive) return;

        console.log('[Network] Le domaine actuel ne répond plus, recherche d\'un remplaçant...');
        const replacement = await findWorkingUrl(urls.filter(u => u !== current));
        if (replacement) onSwitch(replacement);
    }, intervalMs);
}

module.exports = { testUrl, findWorkingUrl, watchConnection, USER_AGENT };
