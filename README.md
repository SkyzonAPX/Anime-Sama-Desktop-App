# Anime Sama Desktop

Une application de bureau fluide, optimisée et non officielle pour le site de streaming **Anime Sama**. 
Développée avec [Electron](https://www.electronjs.org/), cette application offre une expérience de visionnage premium en supprimant les publicités, en contournant les blocages de domaine et en s'intégrant parfaitement à Discord.

---

## ✨ Fonctionnalités Principales

* **🎮 Discord Rich Presence Ultra-Complet :** * Détection automatique de l'anime, de la saison et du numéro de l'épisode.
    * Affichage de la langue (drapeau VO ou VF) et du temps de visionnage dynamique `[Actuel / Total]`.
    * Icônes dynamiques selon les onglets visités (Catalogue, Planning, Profil, etc.).
* **🛡️ Adblocker Intégré :** Moteur antipub propulsé par Ghostery bloquant nativement les bannières, les traqueurs et interdisant strictement l'ouverture de fenêtres pop-up par les lecteurs vidéo.
* **🌐 Smart Domain Switcher :** Contournement automatique des blocages FAI. L'application teste silencieusement une liste de domaines miroirs au démarrage et se connecte au premier disponible en quelques secondes.
* **⚙️ Paramètres Persistants :** Menu natif permettant d'activer/désactiver le RPC et l'Adblock à la volée. L'application mémorise vos choix et la taille de votre fenêtre d'une session à l'autre.
* **🔌 Gestion des Crashs :** Interface de secours locale élégante en cas de perte de connexion ou de serveurs inaccessibles.

---

## 🛠️ Prérequis

Pour exécuter ce projet, vous devez avoir installé :
* [Node.js](https://nodejs.org/) (version 16 ou supérieure recommandée)
* NPM (inclus avec Node.js)

---

## 🚀 Installation

1.  **Cloner ou télécharger le projet :**
    Ouvrez votre terminal et placez-vous dans le dossier de votre choix.
    ```bash
    git clone [https://github.com/SkyzonAPX/Anime-Sama-Desktop-App.git](https://github.com/SkyzonAPX/Anime-Sama-Desktop-App.git)
    cd anime-sama-desktop
    ```

2.  **Installer les dépendances :**
    ```bash
    npm install
    ```

3.  **Configuration Discord (Optionnel) :**
    Si vous souhaitez utiliser votre propre application Discord pour le statut :
    * Créez une application sur le [Discord Developer Portal](https://discord.com/developers/applications).
    * Récupérez votre **Application ID**.
    * Ouvrez le fichier `package.json` et remplacez la valeur `"clientId"` par le vôtre.
    * Uploadez les icones du dossier assets (logo, catalog, help, vf, vo, etc.) dans l'onglet *Rich Presence > Art Assets* de votre portail développeur.

---

## 💻 Utilisation

Pour lancer l'application, exécutez simplement :

```bash
npm start

```

### ⚙️ Le Menu "Settings"

Une fois l'application lancée, un menu système est disponible en haut à gauche de la fenêtre. Il vous permet de :

* **Activer/Désactiver le Discord RPC** (mise à jour instantanée).
* **Activer/Désactiver l'AdBlock** (nécessite un rechargement de la page pour prendre effet sur les scripts déjà chargés).
