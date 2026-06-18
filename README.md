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
  * Accurate retrieval of the episode number and language (VF / VA / VO flags).
  * Secure extraction of video timestamps from cross-origin iframes.
  * Dynamic display of episode progress `[Current Time / Total Time]`.
  * Smart status changes based on visited tabs (Catalog, Schedule, Profile...).
  * **"Watch too" button**: friends viewing your Discord profile can jump straight to the exact episode you're watching.
  * **Privacy mode**: optionally hide the exact title/episode and show a generic status instead.
* ▶️ **Smart Playback**
  * **Resume watching**: automatically remembers your timestamp per episode, even across restarts.
  * **Keyboard shortcuts** for the player — Space (play/pause), ← / → (seek -10s / +10s) — active only while the app window is focused, so they never interfere with other apps when minimized.
  * **Local watch history**: browse your last watched episodes from the Settings window.
* 🛡️ **Native Adblocker & Anti-Popups**
  * Built-in ad blocker (powered by Ghostery lists) acting directly on network requests.
  * Strict prohibition of opening new windows (fake clicks on video players are neutralized).
* 🌐 **Smart Domain Switcher & Cloudflare Support**
  * The app silently tests a list of known mirrors on startup (`.fr`, `.to`, `.org`, etc.).
  * Fast and reliable detection system that supports Cloudflare checks (HTTP 403).
  * Automatic connection to the first working domain, making DNS blocks obsolete.
  * **Background monitoring**: automatically switches to a backup domain if the active one goes down mid-session.
  * **Manual override**: pick a specific mirror anytime from the native menu.
  * Add your own custom mirrors directly from the Settings window.
  * Navigation is restricted to the configured domain whitelist for safety.
* ⚙️ **Custom Settings Window**
  * A dedicated, tabbed Settings window (General / Domains / History / About) — no more digging through the native menu for everything.
  * Toggle RPC, Adblock, Privacy mode, and auto domain-switching on the fly.
  * **Backup & restore**: export your preferences, login cookies, *and* your Anime-Sama browsing progress (watch history stored in the site's local storage) into a single file — and re-import it on another machine in one click.
* 🔄 **Auto-Update**
  * Checks for new releases in the background and prompts you to restart once a new version is downloaded.
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

* **`urls`**: The order is important. The app will attempt to connect to the first link, then the second if it fails, and so on. You can also add personal mirrors later from the Settings window without editing this file.
* **`clientId`**: Your Discord application ID (generated on the Discord Developer Portal) so that the Rich Presence displays your own icons (`logo`, `vf`, `va`, `vo`, `catalog`, etc.).

Everything else — RPC, Adblock, privacy mode, auto domain-switching, custom mirrors — is configurable live from the in-app **Settings** window (`File > Settings...`), no restart required.

---

## 📦 Build the Application

To generate a ready-to-install `.exe` executable (with icon and desktop shortcuts):

```bash
npm run build
```

---

## 📁 Project Structure

```
src/
  main/       → app entry point, settings storage, network logic, main window, menu, updater
  rpc/        → Discord Rich Presence
  settings/   → custom Settings window (HTML/CSS/JS + IPC bridge)
assets/html/  → local fallback page shown on connection loss
```
