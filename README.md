# Anime Sama Desktop

![Electron](https://img.shields.io/badge/Electron-191970?style=for-the-badge&logo=Electron&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-43853D?style=for-the-badge&logo=node.js&logoColor=white)
![Open Source](https://img.shields.io/badge/Open_Source-100000?style=for-the-badge&logo=github&logoColor=white)

**Anime Sama Desktop** is a lightweight, optimized, and unofficial desktop application for the *Anime Sama* streaming and manga reading website.

Designed to provide the ultimate viewing experience, it removes distractions, automatically bypasses ISP (Internet Service Provider) blocks, and seamlessly integrates with your Discord status.

---

## ✨ Features & Improvements

* 🎮 **Advanced & Secure Discord Rich Presence (RPC)** 
  * Automatic detection of the anime, movie, or season being watched.
  * Accurate retrieval of the episode number and language (VO/VF flags).
  * Secure extraction of video timestamps from cross-origin iframes.
  * Dynamic display of episode progress `[Current Time / Total Time]`.
  * Smart status changes based on visited tabs (Catalog, Schedule, Profile...).
* 🛡️ **Native Adblocker & Anti-Popups** 
  * Built-in ad blocker (powered by Ghostery lists) acting directly on network requests.
  * Strict prohibition of opening new windows (fake clicks on video players are neutralized).
* 🌐 **Smart Domain Switcher & Cloudflare Support** 
  * The app silently tests a list of known mirrors on startup (`.fr`, `.to`, `.org`, etc.). 
  * Fast and reliable detection system that supports Cloudflare checks (HTTP 403).
  * Automatic connection to the first working domain, making DNS blocks obsolete.
* ⚙️ **Settings & Persistence** 
  * Native system menu allowing you to toggle RPC or Adblock on the fly.
  * Local saving of user preferences and window size.
* 🔌 **Stability & Crash Management** 
  * **Auto-recovery**: Silent recovery logic that automatically reloads the app if the render process crashes.
  * Resolution of fatal IPC crashes related to Web security (site isolation maintained).
  * Elegant local fallback interface in case of network connection loss.

---

## 🛠️ Prerequisites

To run or build this project, you need to have the following installed on your machine:
* [Node.js](https://nodejs.org/) (version 16 or higher recommended)
* Git

---

## 🚀 Installation & Usage

1. **Clone the repository:**
```bash
git clone https://github.com/SkyzonAPX/Anime-Sama-Desktop-App.git
cd Anime-Sama-Desktop-App
```

2. **Install dependencies:**
```bash
npm install
```

3. **Start the application (Development Mode):**
```bash
npm start
```

---

## ⚙️ Configuration (`package.json`)

All critical application configuration is centralized in the `appConfig` block of the `package.json` file. You do not need to touch the JavaScript code to update the site:

```json
  "appConfig": {
    "urls": [
      "https://anime-sama.fr/",
      "https://anime-sama.to/",
      "https://anime-sama.org/"
    ],
    "clientId": "YOUR_DISCORD_ID_HERE"
  }
```

* **`urls`**: The order is important. The app will attempt to connect to the first link, then the second if it fails, and so on.
* **`clientId`**: Your Discord application ID (generated on the Discord Developer Portal) so that the Rich Presence displays your own icons (`logo`, `vf`, `vo`, `catalog`, etc.).

---

## 📦 Build the Application

To generate a ready-to-install `.exe` executable (with icon and desktop shortcuts):

```bash
npm run build
```