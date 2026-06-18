// Renderer de la fenêtre Paramètres. Utilise window.settingsAPI exposé par preload.js.

// --- Navigation par onglets ---
document.querySelectorAll('.tab').forEach(tab => {
    tab.addEventListener('click', () => {
        document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
        document.querySelectorAll('.panel').forEach(p => p.classList.remove('active'));
        tab.classList.add('active');
        document.getElementById(tab.dataset.tab).classList.add('active');
    });
});

// --- Onglet Général : toggles synchronisés avec le store ---
async function loadGeneralSettings() {
    const settings = await window.settingsAPI.getSettings();
    document.getElementById('rpcToggle').checked = settings.isRpcEnabled;
    document.getElementById('privacyToggle').checked = settings.isPrivacyModeEnabled;
    document.getElementById('adblockToggle').checked = settings.isAdblockEnabled;
    document.getElementById('autoSwitchToggle').checked = settings.autoSwitchDomain;
}

function bindToggle(id, key) {
    document.getElementById(id).addEventListener('change', (e) => {
        window.settingsAPI.setSetting(key, e.target.checked);
    });
}

bindToggle('rpcToggle', 'isRpcEnabled');
bindToggle('privacyToggle', 'isPrivacyModeEnabled');
bindToggle('adblockToggle', 'isAdblockEnabled');
bindToggle('autoSwitchToggle', 'autoSwitchDomain');

// --- Export / Import des préférences et cookies ---
const dataTransferStatus = document.getElementById('dataTransferStatus');

document.getElementById('exportBtn').addEventListener('click', async () => {
    dataTransferStatus.textContent = 'Export en cours...';
    const result = await window.settingsAPI.exportData();

    if (result.canceled) { dataTransferStatus.textContent = ''; return; }
    dataTransferStatus.textContent = result.error
        ? `Erreur : ${result.error}`
        : `Export réussi (${result.cookieCount} cookies, ${result.localStorageCount} données de progression).`;
});

document.getElementById('importBtn').addEventListener('click', async () => {
    dataTransferStatus.textContent = 'Import en cours...';
    const result = await window.settingsAPI.importData();

    if (result.canceled) { dataTransferStatus.textContent = ''; return; }
    if (result.error) {
        dataTransferStatus.textContent = `Erreur : ${result.error}`;
        return;
    }

    dataTransferStatus.textContent = `Import réussi (${result.restoredCookies} cookies, ${result.restoredLocalStorage} données de progression). Rechargement...`;
    loadGeneralSettings(); // recharge les toggles avec les préférences importées
});

// --- Onglet Domaines ---
async function renderDomainList() {
    const settings = await window.settingsAPI.getSettings();
    const list = document.getElementById('domainList');
    list.innerHTML = '';

    if (settings.customDomains.length === 0) {
        list.innerHTML = '<li class="empty-state">Aucun domaine personnalisé.</li>';
        return;
    }

    settings.customDomains.forEach(domain => {
        const li = document.createElement('li');
        li.className = 'list-item';
        li.innerHTML = `<span class="title">${domain}</span><button class="remove-btn">Retirer</button>`;
        li.querySelector('.remove-btn').addEventListener('click', async () => {
            await window.settingsAPI.removeCustomDomain(domain);
            renderDomainList();
        });
        list.appendChild(li);
    });
}

document.getElementById('addDomainBtn').addEventListener('click', async () => {
    const input = document.getElementById('domainInput');
    const url = input.value.trim();
    if (!url) return;
    await window.settingsAPI.addCustomDomain(url);
    input.value = '';
    renderDomainList();
});

// --- Onglet Historique ---
async function renderHistory() {
    const history = await window.settingsAPI.getHistory();
    const list = document.getElementById('historyList');
    list.innerHTML = '';

    if (history.length === 0) {
        list.innerHTML = '<li class="empty-state">Aucun historique pour le moment.</li>';
        return;
    }

    history.slice(0, 50).forEach(entry => {
        const date = new Date(entry.watchedAt).toLocaleString('fr-FR');
        const li = document.createElement('li');
        li.className = 'list-item';
        li.innerHTML = `
            <div>
                <div class="title">${entry.title}</div>
                <div class="meta">${entry.episode} · ${entry.lang.toUpperCase()}</div>
            </div>
            <span class="meta">${date}</span>
        `;
        list.appendChild(li);
    });
}

document.getElementById('clearHistoryBtn').addEventListener('click', async () => {
    await window.settingsAPI.clearHistory();
    renderHistory();
});

// --- Onglet À propos ---
document.getElementById('checkUpdateBtn').addEventListener('click', async () => {
    const status = document.getElementById('updateStatus');
    status.textContent = 'Recherche en cours...';
    const result = await window.settingsAPI.checkForUpdates();
    status.textContent = result && result.error
        ? `Erreur : ${result.error}`
        : 'Vérification terminée.';
});

// --- Initialisation ---
loadGeneralSettings();
renderDomainList();
renderHistory();
