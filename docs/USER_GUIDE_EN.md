# Password Manager — user guide

Version 1.1. Russian and English interfaces are included in the same app.

## 1. What is included

Password Manager keeps usernames, passwords, websites and notes encrypted in your browser. It includes search, a password generator, Chrome CSV import, encrypted backup files, PWA installation and optional Google Drive backups.

The package contains the source files, Russian and English guides, a printable docs/guide.html page, Windows launchers and automated tests. Click Help in the app to open the guide. No programming is required for everyday use.

This is an early release without an independent security audit. Start with test entries. A forgotten master password cannot be recovered. Signing into Google cannot decrypt a backup without its master password either.

## 2. First launch on a computer

### Everyday use from a link

Users do not need to install Node.js or keep a server window open. The owner hosts the app once; users then open its address.

**A public version has not been hosted yet.** These steps become available after publication, for example on GitHub Pages. The repository itself contains source code.

1. Open the app's HTTPS address in Chrome, Edge or Safari.
2. Choose your language and create a vault as described below.
3. Click **Install**, wait for **Offline mode is ready**, and install from the browser menu.
4. Launch from its icon. After successful caching, it works offline while the browser retains the app's data.
5. Save an encrypted backup after adding important entries.

Use the same HTTPS address on a phone, then transfer the vault with an encrypted backup: data does not synchronize automatically. See section 10 for installation details.

### Local development or a self-managed copy

1. Download the GitHub repository ZIP using Code → Download ZIP, then extract it into a separate folder.
2. You need Node.js 22 or later from the [official website](https://nodejs.org/).
3. On Windows, open Start.cmd / Запустить.cmd; on other systems, run npm start in the project folder.
4. Open **http://localhost:4173**. Keep the server running for the first load and offline cache preparation. Press Ctrl+C to stop it.
5. Once offline mode is ready, test reopening with the server stopped and dummy entries. Restart the server when updating your local copy.

You do not need npm install or additional package dependencies. Opening index.html by double-click is unsupported: modules, encryption and PWA features require localhost or HTTPS.

The server listens only on your computer. On a phone, localhost refers to that phone, so your computer’s local app will not be reachable there at the same address. Installing on a phone requires a separately hosted HTTPS version. Hosting is not enabled automatically.

## 3. Choose your language

Click **English** in the header to switch to English. Click **Русский** to return to Russian. The browser remembers the selection. Changing the language does not change your master password or translate your saved entry names, usernames or notes.

The installed PWA’s icon name is chosen at installation. Changing an existing icon’s name may require reinstalling, depending on the browser. Save an encrypted backup before removing any installed app.

## 4. Create and unlock a vault

1. On the first screen, enter your master password twice.
2. Use at least 12 characters; a long, unique phrase of random words is preferable. Do not reuse your Google or another account password.
3. Click **Create vault**. Key derivation may take a moment; the button shows Please wait….
4. Your vault opens. On later visits, enter the same master password and click **Unlock vault**.

The master password is neither saved nor transmitted. Keep it separately in a way you consider secure. This version does not provide a master-password change feature.

Storage belongs to a browser profile and an exact origin. localhost:4173 and 127.0.0.1:4173 are different storage locations. A different browser, profile, port, domain or phone installation may start with an empty vault. Use encrypted export/import to move data. There is no automatic device synchronization.

## 5. Add and use entries

1. Click **Add entry**.
2. Enter a name and password; both are required.
3. Optionally add a username/email, website and note.
4. Enter a full website address or omit https://; the app adds it when saving. Android app addresses imported from Chrome are also preserved.
5. Click **Save entry**. Wait for the successful-save message before treating the entry as saved.

Search matches names, usernames and websites, not passwords or notes. The buttons next to an entry copy its username, copy its password, open the editor or delete it. Hover to see a label.

Click **Show** inside the editor to reveal the password for 15 seconds. **Hide** conceals it sooner. Deleting an entry requires a separate confirmation; Cancel leaves it unchanged. A deleted entry can only be recovered from an earlier backup.

The clipboard is not cleared automatically. Your operating system’s clipboard history or sync may retain copied passwords. If clipboard access is denied, open the entry and copy the value manually.

## 6. Generate passwords

Open **Password generator**. Choose a length from 12–64 characters and select lowercase letters, uppercase letters, digits and/or symbols. At least one character set is required. **Generate again** creates a new password; **Copy** copies it.

The entry editor’s **Generate password** button inserts a random 20-character password. Save the entry and set that password on the relevant website yourself. This app does not change third-party account passwords.

## 7. Import from Chrome

1. In Chrome, open the menu → **Passwords and autofill → Google Password Manager → Settings**.
2. Under **Export passwords**, choose **Download file**. Complete any operating-system password/PIN prompt yourself.
3. Create or unlock your vault in this app.
4. Click **Import from Chrome** and choose the exported CSV.
5. Review the counts: found, new, duplicate and skipped without a password. Nothing is saved until you click **Import**.
6. Click **Import**, check several entries, then download an encrypted backup.
7. Remove the original CSV using a method appropriate for your device. It contains unencrypted passwords; do not upload it to GitHub or send it in a chat.

CSV processing is local. Required columns: url, username, password. Optional columns: name, note, notes. UTF-8, BOM, quoted fields, commas and embedded newlines are supported. The limit is 4 MB and 2,000 records per file. Exact duplicates are skipped; different versions of an account are preserved separately. Empty passwords are skipped. Invalid formatting or an oversized field cancels the entire import. Passkeys, payment cards and addresses are not imported.

Official help: [exporting Chrome passwords](https://support.google.com/chrome/answer/13068232?hl=en).

## 8. Save an encrypted backup to your device

Unlock your vault and click **Download encrypted backup**. Keep the JSON file somewhere secure. It uses the master password in effect when the backup was created. Make a new backup after important changes and periodically test restoration.

An earlier copy does not update automatically. It may contain entries you have since deleted. Keep historical versions intentionally, and do not store a plaintext master password next to the backup.

## 9. Restore or move your vault

**On a new device or in an empty browser:** click **Restore from a backup** on the first screen. Choose the encrypted JSON and enter that backup’s master password. The restored vault uses the backup’s password.

**Into an existing vault:** unlock it first, then click **Import encrypted backup**. Choose the JSON and enter its password. The app merges entries, skips exact duplicates and keeps changed versions separately. The destination vault retains its existing master password.

An incorrect password or damaged file does not replace existing data. Backups are limited to 4 MB and vaults to 2,000 entries; browser storage quotas may be smaller. An encrypted JSON is not a readable spreadsheet of passwords; this is expected.

## 10. Install as a PWA and use offline

1. Start your local app or open its hosted HTTPS address.
2. Let the first load complete. Click **Install** to see the status. Wait for **Offline mode is ready**.
3. In Chrome/Edge, use **Install** in the dialog if offered, or install the app from the browser menu.
4. On iPhone/iPad, open the HTTPS app in Safari → **Share → Add to Home Screen**. Labels may vary by browser version.
5. Launch it from its icon. Once cached successfully, a local installation may also reopen after the local server stops, as long as the browser keeps its offline cache. Verify this on your device with test data first.

Installation depends on browser support. Embedded browsers in other apps may not offer it; use regular Chrome, Edge or Safari instead. Installing does not publish the app or synchronize your vault with a phone.

The offline cache stores only app files and guides. Vault entries, passwords, the master key, CSV files, Google tokens and Drive responses are never written into it. The encrypted vault stays in localStorage.

Local entries, search, generation and file backups work offline. Google Drive requires an internet connection. Clearing site data or removing an installed app with its data may remove both the vault and offline cache. PWA installation is not a backup.

## 11. Update the app

First download an encrypted backup and save any open forms. Replace the local application files or wait for an update to the hosted site. Your local server must be running to obtain updated local files.

When a new version is detected, **Update app** appears in the Install dialog. It locks the vault and reloads the page. If it does not appear, reopen the app with its server/network available; the browser checks for updates on navigation. The first visit may still use the older cached version. App files are not automatically pulled from GitHub.

## 12. Google Drive prerequisites

Having Google Drive does not mean you already have an OAuth Client ID. A Client ID is a public identifier for an application in Google, not a password or secret.

**For a hosted application,** its owner configures the Client ID once for the app’s address. Each user then clicks **Connect Google Drive**, chooses their own account and grants permission. Every customer does not need a separate Google Cloud project.

**For your own local copy or a different hosted address,** that copy’s owner may need a separate configuration. A Client ID registered for another domain does not automatically work.

The supplied configuration intentionally has no Client ID. Creating a Google Cloud project and authorizing a real account have not been completed. Drive cannot connect until configured; local encrypted file backups work independently.

## 13. One-time Google Drive setup by the app owner

Complete these steps once for the app, not for every backup.

1. Open [Google Cloud Console](https://console.cloud.google.com/). Select an existing project or create a separate project for the app. Do not modify an unrelated production project without its owner’s agreement.
2. Under **APIs & Services → Library**, find and enable **Google Drive API**.
3. In **Google Auth Platform**, complete Branding, Audience and contact details. For personal testing with a regular Google account, select External and add your account under Test users while the app is in Testing mode.
4. Under Data Access, request **https://www.googleapis.com/auth/drive.file**. This covers files used by this app, rather than your entire Drive. For public distribution, complete Google’s publishing/verification requirements if requested by the console.
5. In **Clients** or **APIs & Services → Credentials**, create **OAuth Client ID → Web application**.
6. Add **http://localhost** and **http://localhost:4173** as Authorized JavaScript origins for the local app. Add the exact HTTPS origin for a hosted build, such as https://passwords.example.com. Origins do not contain a path, fragment or page route. A GitHub Pages subfolder uses an origin such as https://username.github.io.
7. This browser popup flow does not need a client secret or a server redirect callback. Never put a client secret into application code or GitHub.
8. Copy the Client ID ending in .apps.googleusercontent.com.
9. Unlock the vault, open **Google Drive → Set up Google Drive**, paste the ID and choose **Save configuration**. This stores the public Client ID in this browser.
10. For a shared hosted build, the developer can put that ID in config.mjs so users do not have to enter it individually. Changing config.mjs requires a new offline-cache version before releasing the update.

Console labels may change. Follow Google’s current guidance and do not bypass security warnings. Configuration changes may need time to propagate; reopen the app and try again afterward.

## 14. Back up and restore using Google Drive

1. Unlock your vault and open **Google Drive**. With a configured Client ID and internet connection, the official Google authorization library loads.
2. Click **Connect Google Drive**, choose your account and grant the requested permission. Allow the popup for this app if your browser blocks it.
3. Moving to Google’s window may lock the vault; this is normal. Return, unlock the vault again and reopen Google Drive.
4. Click **Save backup to Drive**. The app creates a **Password Manager Backups** folder if needed and saves a new encrypted JSON with a timestamp. Earlier backups are neither overwritten nor deleted.
5. Wait for the success message. **Show backups** lists up to 50 recent backups created by this app and accessible to the current OAuth client.
6. Click a backup’s name to open it in Drive and download it. Restore it using section 9. This release does not directly restore from Drive or synchronize automatically.

Google receives the encrypted envelope, filename, timestamp and application metadata. The master password, plaintext entries and Chrome CSV are not included. Google authorization itself uses Google’s official service. Access tokens remain only in page memory, never in localStorage, source files or the offline cache. Reconnect after the page closes or the token expires. Connecting does not grant the app access to all your older Drive files.

**Disconnect Google Drive** clears the in-memory token and attempts to revoke Google permission. If it fails or you are offline, revoke the permission in your Google Account’s third-party connections settings. Saved backups remain on Drive; manage or delete them in Drive itself.

If an upload result is unclear, check Drive before clicking again: it might have completed before the connection was lost. Quotas, access errors and configuration problems may require the Cloud project owner. Automated tests cannot replace a real sign-in/upload check using a configured Client ID.

## 15. Locking, deletion and data safety

**Lock vault** immediately hides entries. The app also locks after 5 minutes of inactivity, when the tab is hidden/closed, or when moving to another window causes the browser to hide the page. Unsaved forms are cleared. Saved data remains encrypted.

**Reset local vault** on the unlock screen deletes the vault for this browser origin. Type DELETE to confirm in English, or УДАЛИТЬ in Russian. Without a backup, this is irreversible. It does not delete JSON files from your disk or Google Drive. After a reset, restore a backup or create a new vault.

Data in an unlocked application’s memory is not protected against an infected operating system, malicious browser extensions or modified application code. JavaScript cannot guarantee complete erasure of strings from memory. A strong master passphrase, updated OS and trustworthy browser remain necessary. Consider how your OS backs up browser profiles and files.

## 16. Troubleshooting

- **Empty vault after reinstalling:** check the exact browser, profile, address and port. Do not reset storage blindly; restore your backup at the intended origin.
- **Incorrect master password:** check keyboard layout, Caps Lock and the password for this specific backup. There is no password bypass or recovery service.
- **Data changed in another tab:** unlock again. Use one active tab to reduce conflicts. Browsers without Web Locks cannot fully guarantee atomic simultaneous writes.
- **Storage full or blocked:** allow site storage, avoid private mode and download an encrypted backup. Reduce notes or move to a browser with available space. Do not clear data before exporting it.
- **No installation option:** use a supported regular browser on localhost/HTTPS, wait for offline readiness and check whether the app is already installed.
- **App will not open offline:** its cache may not be ready or may have been removed. Start the local server or reconnect to the hosted app and load it again.
- **Google origin_mismatch:** the owner must add the exact app origin to its OAuth Client ID. Do not include a page path.
- **Google access_denied:** check the account, Test users, publishing status, organization policy and requested scope.
- **Google API disabled:** enable Drive API in the project belonging to the Client ID used by the app.
- **Google 401/session expired:** connect your account again.
- **Google 403/storage full:** check permissions and available Drive space. The project owner may need to inspect Google Console to resolve the exact cause.
- **Backups are missing:** check the Google account and Client ID. Manually uploaded files or files owned by another app may be outside the drive.file permission; download those directly from Drive and import them locally.

## 17. Technical reference

AES-256-GCM, PBKDF2-HMAC-SHA-256 with 600,000 iterations, 16-byte salt, a new random 12-byte IV per save, and a 128-bit authentication tag. Format/version are authenticated through additionalData. The key is non-extractable. The encrypted local format remains compatible with version 1.0.

Normal local use loads no external scripts. Opening Google Drive on demand loads Google Identity Services. Network access is limited by policy to the app origin and required Google domains. The local server prohibits form submission, objects and framing; configure equivalent headers on your own HTTPS host. User values are rendered as text, not HTML.

Developer checks: npm run check and npm test. These are functional tests, not an independent security audit.

References: [PWA installation](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Guides/Making_PWAs_installable), [Google token model](https://developers.google.com/identity/oauth2/web/guides/use-token-model), [Drive file uploads](https://developers.google.com/workspace/drive/api/guides/manage-uploads).
