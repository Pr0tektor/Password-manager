# Password Manager

**Your passwords. Your key. Your control.**

[Русский](README.md) | **English** · [Full user guide](docs/USER_GUIDE_EN.md) · [Printable bilingual guide](docs/guide.html)

**[Open the app →](https://pr0tektor.github.io/Password-manager/)** · [Online user guide](https://pr0tektor.github.io/Password-manager/docs/guide.html#en)

A personal home for your logins, passwords and notes. Encryption happens in your browser, with a master password only you know. Import your saved Chrome passwords, find an account quickly and generate stronger passwords without creating another account.

## What you get

- **Local encrypted storage:** AES-256-GCM; your master password is never saved or sent.
- **Multiple API keys per entry:** named, concealed values with a two-sheet copy icon. Keys can be stored without an account password.
- **Russian and English:** switch the interface language without changing your entries.
- **Installable PWA:** an app icon, a standalone window and offline access after the first successful cache setup.
- **Chrome import:** CSV preview, duplicate detection and support for notes.
- **Everyday tools:** search, edit, copy, a 12–64 character password generator and automatic locking.
- **Backups you control:** encrypted JSON files and optional manual upload to your own Google Drive.
- **Help included:** detailed Russian/English guides for setup, daily use, recovery and troubleshooting.

No subscription, analytics or package installation is required. Google authorization loads only when you open the Drive feature after configuring it. Offline mode stores the app files, never passwords or Google tokens, in its cache.

## Quick start

Open **[Password Manager](https://pr0tektor.github.io/Password-manager/)** and install it from your browser. **Users do not need Node.js or a running local server.** The app is hosted on GitHub Pages over HTTPS; your passwords stay encrypted in your browser.

1. Open the app address in Chrome, Edge or Safari.
2. Choose your language and create a vault.
3. Click **Install** and wait for **Offline mode is ready**.
4. Install through the browser menu; on iPhone/iPad, use **Share → Add to Home Screen**.
5. Launch from its icon. After successful caching, it can reopen offline while the browser retains its data. Save encrypted backups after important changes.

### Local development

Download and extract the repository. With Node.js 22 or later installed, open **Start.cmd** / **Запустить.cmd**, or run:

```sh
npm start
```

Open **http://localhost:4173**. The server is needed for the initial local load and updates. Once the offline cache is ready, test reopening without it using dummy entries.

Opening index.html directly is unsupported. Localhost is accessible only on that device. On a phone, use the [public HTTPS version](https://pr0tektor.github.io/Password-manager/). To move local entries to the hosted address, export and import an encrypted backup: storage does not move between addresses automatically.

## Google Drive: one setup for the application

The app owner configures a public **Google OAuth Client ID** once. End users then connect their own Google account; they do not each need a Cloud project. The supplied config.mjs intentionally has an empty ID. Owners can configure the shared build there, or enter an ID in the app’s Google Drive setup dialog for a local copy.

Only encrypted JSON backups are uploaded, into **Password Manager Backups**. Each upload creates a new file; automatic synchronization is not included. Access uses the limited **drive.file** permission. Tokens stay only in page memory. Download a copy from Drive and use the normal backup import to restore it.

[Google setup steps and troubleshooting](docs/USER_GUIDE_EN.md#13-one-time-google-drive-setup-by-the-app-owner)

Real Google sign-in/upload requires your Client ID and account authorization. No real-account end-to-end verification is claimed for an unconfigured build.

## Read before using important passwords

This is an early release **without an independent security audit**. Start with test data. A forgotten master password cannot be recovered. Clearing site data, removing a browser profile or removing an app with its data can destroy the vault. Installation and Google connection are not substitutes for verified backups.

Data belongs to the exact browser profile and origin. Changing host, port or browser does not move your vault; export/import it first. The clipboard is not cleared automatically. Malicious extensions, a compromised operating system and modified app code are outside this app’s protection.

[Detailed safety and recovery guidance](docs/USER_GUIDE_EN.md#15-locking-deletion-and-data-safety)

## Technical notes

Buildless HTML/CSS/JavaScript, no npm dependencies. Web Crypto uses AES-256-GCM and PBKDF2-HMAC-SHA-256 with 600,000 iterations, a random 16-byte salt and a fresh 12-byte IV per save. Existing 1.0/1.1 backups can still be imported. Backups containing API keys use format 2 and require app version 1.2.0 or later; older versions reject them rather than discard key fields. A service worker caches an explicit public-asset allowlist; Google requests and vault files are excluded.

```sh
npm run check
npm test
```

Functional checks cover cryptography, CRUD, backup merging, CSV import, storage failures, lock cancellation, localization, PWA behavior and mocked Drive API requests. They are not a security audit. See [the full guide](docs/USER_GUIDE_EN.md) for limitations, deployment headers and update behavior.

References: [MDN PWA installation](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Guides/Making_PWAs_installable), [MDN AES-GCM](https://developer.mozilla.org/en-US/docs/Web/API/AesGcmParams), [OWASP PBKDF2](https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html), [Google authorization](https://developers.google.com/identity/oauth2/web/guides/use-token-model).
