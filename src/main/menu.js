// Construit le menu natif de l'application.
const { Menu, dialog } = require('electron');
const store = require('./store');
const { openSettingsWindow } = require('../settings/settings-window');

function buildMenu({ rpc, getAdblocker, onManualDomainSwitch, getAllDomains }) {
    const template = [
        {
            label: 'Fichier',
            submenu: [
                { label: 'Paramètres...', click: () => openSettingsWindow() },
                { type: 'separator' },
                { role: 'quit', label: 'Quitter' }
            ]
        },
        {
            label: 'Réseau',
            submenu: [
                {
                    label: 'Changer de domaine...',
                    click: async () => {
                        const domains = getAllDomains();
                        const { response } = await dialog.showMessageBox({
                            type: 'question',
                            title: 'Changer de domaine',
                            message: 'Choisissez le domaine à utiliser :',
                            buttons: [...domains, 'Annuler']
                        });
                        if (response < domains.length) onManualDomainSwitch(domains[response]);
                    }
                }
            ]
        },
        {
            label: 'Affichage',
            submenu: [
                {
                    label: 'Activer le RPC Discord',
                    type: 'checkbox',
                    checked: store.get('isRpcEnabled'),
                    click: (item) => {
                        store.set('isRpcEnabled', item.checked);
                        item.checked ? rpc.login() : rpc.clear();
                    }
                },
                {
                    label: 'Activer le bloqueur de pub',
                    type: 'checkbox',
                    checked: store.get('isAdblockEnabled'),
                    click: (item) => {
                        store.set('isAdblockEnabled', item.checked);
                        const adblocker = getAdblocker();
                        if (!adblocker) return;
                        const { session } = require('electron');
                        item.checked
                            ? adblocker.enableBlockingInSession(session.defaultSession)
                            : adblocker.disableBlockingInSession(session.defaultSession);
                    }
                },
                { role: 'viewMenu', label: 'Vue' }
            ]
        }
    ];

    Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}

module.exports = { buildMenu };
