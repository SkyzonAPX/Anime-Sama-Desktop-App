# Anime Sama Desktop

![Electron](https://img.shields.io/badge/Electron-191970?style=for-the-badge&logo=Electron&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-43853D?style=for-the-badge&logo=node.js&logoColor=white)
![Open Source](https://img.shields.io/badge/Open_Source-100000?style=for-the-badge&logo=github&logoColor=white)

**Anime Sama Desktop** est une application de bureau légère, optimisée et non officielle pour le site de streaming d'animes et de scans *Anime Sama*. 

Conçue pour offrir l'expérience de visionnage ultime, elle supprime les distractions, contourne automatiquement les blocages de fournisseurs d'accès (FAI) et s'intègre parfaitement à votre statut Discord.

---

## ✨ Fonctionnalités

* 🎮 **Discord Rich Presence (RPC) Avancé** * Détection automatique de l'anime, du film ou de la saison regardée.
  * Récupération précise du numéro de l'épisode et de la langue (drapeaux VO/VF).
  * Affichage dynamique de la progression de l'épisode `[Temps actuel / Temps total]`.
  * Changement de statut intelligent selon les onglets visités (Catalogue, Planning, Profil...).
* 🛡️ **Adblocker Natif & Anti-Popups** * Bloqueur de publicités intégré (propulsé par les listes Ghostery) agissant directement sur les requêtes réseau.
  * Interdiction stricte d'ouverture de nouvelles fenêtres (les faux clics sur les lecteurs vidéo sont neutralisés).
* 🌐 **Smart Domain Switcher (Anti-Censure)** * L'application teste silencieusement une liste de miroirs connus au démarrage (`.fr`, `.to`, `.vc`, etc.). 
  * Elle se connecte automatiquement au premier domaine fonctionnel, rendant les blocages DNS obsolètes.
* ⚙️ **Paramètres & Persistance** * Menu système natif permettant de désactiver le RPC ou l'Adblock à la volée.
  * Sauvegarde locale des préférences utilisateur et de la taille de la fenêtre.
* 🔌 **Gestion des Crashs** * Interface locale de secours élégante en cas de perte de connexion réseau ou d'indisponibilité des serveurs.

---

## 🛠️ Prérequis

Pour exécuter ou compiler ce projet, vous devez avoir installé sur votre machine :
* [Node.js](https://nodejs.org/) (version 16 ou supérieure recommandée)
* Git

---

## 🚀 Installation & Utilisation

1. **Cloner le dépôt :**
```bash
git clone https://github.com/SkyzonAPX/Anime-Sama-Desktop-App.git
cd Anime-Sama-Desktop-App
```

2. **Installer les dépendances :**
```bash
npm install

```


3. **Lancer l'application (Mode Développement) :**
```bash
npm start

```



---

## ⚙️ Configuration (`package.json`)

Toute la configuration critique de l'application est centralisée dans le bloc `appConfig` du fichier `package.json`. Vous n'avez pas besoin de toucher au code JavaScript pour mettre à jour le site :

```json
  "appConfig": {
    "urls": [
      "https://anime-sama.fr/",
      "https://anime-sama.to/",
      "https://anime-sama.org/"
    ],
    "clientId": "VOTRE_ID_DISCORD_ICI"
  }

```

* **`urls`** : L'ordre est important. L'application tentera de se connecter au premier lien, puis au second en cas d'échec, etc.
* **`clientId`** : Votre ID d'application Discord (généré sur le portail développeur Discord) pour que le Rich Presence affiche vos propres icônes (`logo`, `vf`, `vo`, `catalog`, etc.).

---

## 📦 Compiler l'application (Build)

Pour générer un exécutable `.exe` prêt à être installé et distribué (avec icône et raccourcis de bureau) :

```bash
npm run build
```
