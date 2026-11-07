export const LOCALE_KEY = 'password-manager.locale';
const pairs = `
К содержимому	Skip to content
Менеджер паролей, главная	Password Manager, home
Менеджер паролей	Password Manager
Личное хранилище	Personal vault
Установить	Install
Заблокировать	Lock vault
На вашем устройстве	On your device
Для шифрования и работы хранилища включите JavaScript.	Enable JavaScript to use your encrypted vault.
Ваши пароли.	Your passwords.
Под вашим ключом.	Under your key.
Одно место для важных доступов. Шифрование в браузере, без регистрации и облака.	One place for your important logins. Encrypted in your browser, with no account required.
Мастер-пароль знаете только вы.	Only you know your master password.
Он не сохраняется и не отправляется в сеть.	It is never saved or sent over the network.
Создайте хранилище	Create your vault
Придумайте длинную фразу, которую сможете запомнить.	Choose a long passphrase you can remember.
Мастер-пароль	Master password
Показать мастер-пароль	Show master password
Показать	Show
Не менее 12 символов. Лучше несколько случайных слов.	At least 12 characters. Several random words work well.
Повторите мастер-пароль	Confirm master password
Создать хранилище	Create vault
Без мастер-пароля восстановить доступ невозможно. Очистка данных браузера удалит хранилище — сохраняйте резервные копии.	Your master password cannot be recovered. Clearing browser data removes your vault — keep encrypted backups.
Восстановить из резервной копии	Restore from a backup
Сбросить локальное хранилище	Reset local vault
Личное пространство	Your private space
Мои пароли	My passwords
Всё важное — под рукой и под замком.	Your important logins, close at hand and under lock.
Добавить запись	Add entry
Инструменты хранилища	Vault tools
Хранилище	Vault
Все записи	All entries
Инструменты	Tools
Генератор паролей	Password generator
Скачать резервную копию	Download encrypted backup
Импортировать копию	Import encrypted backup
Только на этом устройстве	Stored on this device
Скачивайте копию после изменений. Автоблокировка через 5 минут бездействия, включая время выбора файла.	Back up after making changes. Locks after 5 minutes of inactivity, including time spent choosing a file.
Найти по названию, логину или сайту	Search by name, username or website
Поиск записей	Search entries
Сервис / аккаунт	Service / account
Действия	Actions
Записи хранилища	Vault entries
Здесь начнётся порядок	A place for every login
Добавьте первый аккаунт — остальное запомним за вас.	Add your first account to start organizing your passwords.
Добавить первую запись	Add your first entry
Данные сохраняются в зашифрованном виде в этом браузере.	Vault data is stored encrypted in this browser.
Ваше устройство. Ваш ключ. Ваш доступ.	Your device. Your key. Your access.
Версия 1.1.1	Version 1.1.1
Установить приложение	Install app
Закрыть	Close
Приложение откроется в отдельном окне с иконкой на вашем устройстве.	Launch the app in its own window from an icon on your device.
В Chrome или Edge откройте меню браузера и выберите установку приложения. На iPhone или iPad в Safari нажмите «Поделиться», затем «На экран Домой».	In Chrome or Edge, open the browser menu and choose to install this app. On iPhone or iPad, open Safari, tap Share, then Add to Home Screen.
Обновить приложение	Update app
Резервная копия в Google Drive	Google Drive backup
В Google Drive будет сохранена только зашифрованная копия. Мастер-пароль остаётся на этом устройстве.	Only an encrypted backup is sent to Google Drive. Your master password stays on this device.
Первичная настройка Google Drive	Set up Google Drive
Один раз создайте OAuth Client ID для веб-приложения в Google Cloud. Подробные шаги приведены в руководстве из комплекта.	Create a Web application OAuth Client ID in Google Cloud once. Follow the detailed steps in the included user guide.
Сохранить настройку	Save configuration
Приложение запрашивает доступ только к файлам, которые вы создадите или выберете через него. Копии сохраняются вручную; автоматическая синхронизация не включена.	The app requests access only to files you create or select through it. Backups are manual; automatic synchronization is not enabled.
Подключить Google Drive	Connect Google Drive
Сохранить копию в Drive	Save backup to Drive
Показать резервные копии	Show backups
Отключить Google Drive	Disconnect Google Drive
Для восстановления скачайте копию из Google Drive и используйте «Импортировать копию» в хранилище.	To restore, download a backup from Google Drive and use Import encrypted backup in your vault.
Новая запись	New entry
Название	Name
(обязательно)	(required)
Например, почта	For example, personal email
Логин или email	Username or email
Пароль	Password
Показать пароль	Show password
Сгенерировать пароль	Generate password
Адрес сайта	Website address
Заметка	Note
Дополнительная информация	Additional information
Отмена	Cancel
Сохранить запись	Save entry
Случайный пароль для нового аккаунта.	A random password for your next account.
Ваш пароль	Your password
Длина пароля	Password length
Ещё вариант	Generate again
Копировать	Copy
Удалить запись?	Delete this entry?
Вернуть её можно только из ранее сохранённой резервной копии.	It can only be recovered from an earlier backup.
Удалить запись	Delete entry
Импорт резервной копии	Import encrypted backup
Записи будут добавлены в хранилище. Существующие записи сохранятся.	Imported entries will be added to your vault. Existing entries are preserved.
Зашифрованный файл .json	Encrypted backup file (.json)
Мастер-пароль от этой копии	Master password for this backup
Импортировать	Import
Импорт из Chrome	Import from Chrome
В Chrome откройте «Менеджер паролей Google» → «Настройки» → «Экспортировать пароли» и скачайте файл CSV.	In Chrome, open Google Password Manager → Settings → Export passwords, then download the CSV file.
Файл паролей Chrome (.csv)	Chrome passwords file (.csv)
Выберите файл, чтобы проверить записи перед импортом.	Choose a file to review the entry counts before importing.
Файл обрабатывается только в браузере. Существующие записи сохранятся, точные дубликаты пропустим.	The file is processed in your browser. Existing entries are preserved and exact duplicates are skipped.
CSV содержит незашифрованные пароли. После проверки импорта удалите этот файл с устройства и сохраните зашифрованную резервную копию.	CSV contains unencrypted passwords. After checking your imported entries, remove the CSV from your device and save an encrypted backup.
Сбросить хранилище?	Reset this vault?
Все записи на этом устройстве будут безвозвратно удалены. Доступ к ним сохранится только в ранее скачанной резервной копии.	All vault entries on this device will be permanently deleted. Only a previously saved backup can restore them.
Чтобы сохранить копию, отмените сброс, откройте хранилище и скачайте её.	To keep a backup, cancel, unlock your vault and download a copy first.
Введите УДАЛИТЬ для подтверждения	Type DELETE to confirm
Удалить хранилище	Delete vault
С возвращением	Welcome back
Введите мастер-пароль, чтобы открыть ваши записи.	Enter your master password to unlock your entries.
Доступ восстановится только с правильным мастер-паролем.	Only the correct master password can unlock your vault.
Открыть хранилище	Unlock vault
Хранилище заблокировано после 5 минут бездействия.	Your vault was locked after 5 minutes of inactivity.
Подождите…	Please wait…
Не удалось выполнить операцию.	The operation could not be completed.
{label} скопирован. Буфер обмена не очищается автоматически.	{label} copied. The clipboard is not cleared automatically.
Браузер запретил копирование. Откройте запись и скопируйте вручную.	Clipboard access was denied. Open the entry and copy it manually.
Ничего не найдено	No entries found
Попробуйте другое название, логин или адрес сайта.	Try a different name, username or website.
Без логина	No username
Копировать логин: {title}	Copy username: {title}
Логин	Username
Копировать пароль: {title}	Copy password: {title}
Открыть запись: {title}	Open entry: {title}
Удалить: {title}	Delete: {title}
Ваша запись	Your entry
Запись «{title}» будет удалена из этого хранилища.	The entry “{title}” will be deleted from this vault.
Записи добавятся к существующим. Точные дубликаты пропустим, разные версии сохраним отдельно.	Entries will be added to your vault. Exact duplicates are skipped; different versions are kept separately.
Восстановите хранилище из зашифрованной копии. Мастер-пароль останется тем же, что у копии.	Restore an encrypted backup. Your master password will be the one used for that backup.
Для шифрования откройте приложение через localhost или HTTPS. Запустите файл «Запустить.cmd» из папки проекта.	Open this app on localhost or HTTPS to enable encryption. Run Start.cmd from the project folder.
Русский	Russian
Переключить на русский	Switch to Russian
УДАЛИТЬ	DELETE
Скрыть	Hide
Скрыть мастер-пароль	Hide master password
Скрыть пароль	Hide password
Мастер-пароли не совпадают.	The master passwords do not match.
Хранилище заблокировано.	Your vault is locked.
Введите название записи.	Enter a name for this entry.
Укажите адрес сайта, например https://example.com.	Enter a website address, such as https://example.com.
Запись сохранена.	Entry saved.
Создан случайный пароль из 20 символов.	A random 20-character password was generated.
Запись удалена.	Entry deleted.
Копия подготовлена. Сохраните файл в надёжном месте.	Your backup is ready. Save the file in a secure place.
Проверяем CSV…	Checking CSV…
CSV слишком большой. Максимум 4 МБ.	The CSV is too large. The maximum size is 4 MB.
Найдено записей: {total}. Новых: {added}. Дубликатов: {duplicates}. Без пароля пропущено: {skipped}.	Entries found: {total}. New: {added}. Duplicates: {duplicates}. Skipped without a password: {skipped}.
Импорт не выполнен.	Nothing has been imported.
Сначала выберите корректный CSV-файл.	Choose a valid CSV file first.
Импорт из Chrome завершён. Добавлено: {count}. Удалите незашифрованный CSV после проверки.	Chrome import complete. Added: {count}. Remove the unencrypted CSV after checking your entries.
Для сброса введите УДАЛИТЬ.	Type DELETE to reset your vault.
Локальное хранилище удалено. Можно создать новое или восстановить копию.	The local vault was deleted. You can create a new vault or restore a backup.
Выберите файл резервной копии размером до 4 МБ.	Choose an encrypted backup file up to 4 MB.
Импорт завершён. Добавлено записей: {count}.	Import complete. Entries added: {count}.
Данные изменились в другой вкладке. Откройте хранилище заново.	Vault data changed in another tab. Unlock it again.
Неверный формат резервной копии.	Invalid encrypted backup format.
Слишком много записей или неверный формат данных.	Too many entries or an invalid data format.
Файл слишком большой. Максимум 4 МБ.	The file is too large. The maximum size is 4 MB.
Неподдерживаемый формат или параметры шифрования.	Unsupported backup format or encryption settings.
Введите мастер-пароль (до 1024 символов).	Enter a master password of up to 1024 characters.
Хранилище заполнено. Уменьшите объём заметок.	The vault is full. Reduce the size of your notes.
Мастер-пароль должен содержать не менее 12 символов.	Your master password must contain at least 12 characters.
Неверный мастер-пароль или повреждённая копия.	Incorrect master password or a damaged backup.
Длина пароля: от 12 до 64 символов.	Password length must be between 12 and 64 characters.
Выберите хотя бы один набор символов.	Select at least one character set.
Браузер запретил доступ к хранилищу. Разрешите сохранение данных для этого сайта.	Browser storage is unavailable. Allow this site to store data.
Операция отменена: хранилище заблокировано.	Operation cancelled because the vault was locked.
Хранилище изменилось в другой вкладке. Откройте его заново.	The vault changed in another tab. Unlock it again.
Дождитесь завершения текущей операции.	Wait for the current operation to finish.
Не удалось сохранить данные. Память браузера заполнена или сохранение запрещено. Скачайте резервную копию.	Could not save your data. Browser storage is full or blocked. Download an encrypted backup.
Хранилище уже существует. Разблокируйте его.	A vault already exists. Unlock it first.
Хранилище не найдено. Создайте новое или восстановите копию.	No vault was found. Create one or restore a backup.
Сначала разблокируйте хранилище.	Unlock your vault first.
Браузер запретил удаление хранилища.	The browser blocked deletion of the vault.
Для импорта сначала разблокируйте текущее хранилище.	Unlock your existing vault before importing a backup.
Неверная кодировка CSV. Экспортируйте файл из Chrome заново.	Invalid CSV encoding. Export your passwords from Chrome again.
В CSV не закрыта кавычка. Экспортируйте файл из Chrome заново.	The CSV contains an unclosed quote. Export it from Chrome again.
CSV пуст. Выберите файл экспорта паролей Chrome.	The CSV is empty. Choose a Chrome password export.
В CSV повторяются заголовки колонок.	The CSV contains duplicate column headers.
Нужны колонки url, username и password. Выберите экспорт паролей из Chrome.	The CSV must include url, username and password columns. Choose a Chrome password export.
В CSV нет записей с паролями. Ничего не импортировано.	The CSV contains no entries with passwords. Nothing was imported.
Офлайн-режим готов. Приложение можно открывать без сети.	Offline mode is ready. You can reopen the app without a network connection.
Подготавливаем автономный запуск…	Preparing offline access…
Автономный запуск недоступен. Проверьте соединение и настройки браузера.	Offline setup is unavailable. Check your connection and browser settings.
Доступно обновление приложения. Перед обновлением хранилище будет заблокировано.	An app update is available. Your vault will be locked before reloading.
Приложение уже установлено.	The app is already installed.
Google Drive	Google Drive
Сначала сохраните Google OAuth Client ID в настройках ниже.	Save your Google OAuth Client ID in the setup section below first.
Настройка сохранена. Подключите Google Drive.	Configuration saved. Connect Google Drive to continue.
Загружаем вход Google…	Loading Google authorization…
Можно подключить Google Drive.	Ready to connect Google Drive.
Google Drive подключён. Можно сохранить зашифрованную копию.	Google Drive is connected. You can save an encrypted backup.
Google Drive отключён.	Google Drive is disconnected.
Укажите корректный Google OAuth Client ID.	Enter a valid Google OAuth Client ID.
Для Google Drive нужно подключение к интернету.	Google Drive requires an internet connection.
Не удалось загрузить вход Google. Проверьте интернет и блокировщики.	Could not load Google authorization. Check your connection and content blockers.
Вход Google отменён или заблокирован браузером.	Google authorization was cancelled or blocked by the browser.
Google не предоставил доступ к файлам приложения.	Google did not grant access to this app’s files.
Срок подключения Google истёк. Подключите аккаунт снова.	Your Google session expired. Connect your account again.
Не удалось выполнить запрос к Google Drive.	The Google Drive request failed.
В Google Drive недостаточно места или доступ запрещён.	Google Drive storage is full or access was denied.
Сохраняем зашифрованную копию…	Saving encrypted backup…
Зашифрованная копия сохранена в Google Drive.	An encrypted backup was saved to Google Drive.
Резервные копии этого приложения пока не найдены.	No backups created by this app were found.
Открыть в Google Drive	Open in Google Drive
Не удалось отключить доступ Google. Удалите разрешение в настройках Google-аккаунта.	Could not revoke Google access. Remove this app’s permission in your Google Account settings.
Подключение Google отключено на этом устройстве.	Google access has been disconnected on this device.
Загружаем список копий…	Loading your backups…
Не удалось подтвердить сохранение копии в Google Drive.	Could not verify that Google Drive saved the backup.
Слишком много файлов резервных копий. Откройте Google Drive для просмотра всех копий.	Too many backup files. Open Google Drive to view all copies.
Google Drive доступен после разблокировки хранилища.	Unlock your vault to use Google Drive.
Показать инструкцию	View instructions
Помощь	Help
Русский: подробное руководство	Detailed user guide in Russian
English: detailed user guide	English: detailed user guide
Не удалось открыть руководство. Оно также есть в папке docs комплекта.	Could not open the guide. It is also included in the package’s docs folder.
Файл резервной копии не прошёл проверку.	The backup file did not pass validation.
Перед сохранением в Google Drive разблокируйте хранилище.	Unlock your vault before saving a backup to Google Drive.
Операция Google Drive отменена.	Google Drive operation cancelled.
Подключение к Google Drive…	Connecting to Google Drive…
Проверить обновления	Check for updates
Проверяем обновления…	Checking for updates…
Вы используете актуальную версию.	You are using the latest version.
Сначала откройте приложение с подключением к сети.	Open the app with a network connection first.
Офлайн-кэш очищен. Снова откройте приложение при подключении к сети.	The offline cache was cleared. Reopen the app with a network connection.
Менеджер паролей — Личное хранилище	Password Manager — Personal vault
Локальное зашифрованное хранилище паролей.	A local encrypted password vault.
`;
export const english = Object.freeze(Object.fromEntries(pairs.trim().split('\n').map(line => line.split('\t'))));
let locale = 'ru';
try { if (typeof window !== 'undefined' && window.localStorage.getItem(LOCALE_KEY) === 'en') locale = 'en'; } catch { /* Storage may be unavailable; the vault reports that separately. */ }
export const getLocale = () => locale;
export function setLocale(value) {
  if (!['ru', 'en'].includes(value)) throw new Error('Unsupported locale');
  locale = value;
  try { if (typeof window !== 'undefined') window.localStorage.setItem(LOCALE_KEY, value); } catch { /* Keep the selection for this session. */ }
}
const dynamic = [
  [/^В одном файле поддерживается до (\d+) записей\.$/, n => `A single file can contain up to ${n} entries.`],
  [/^Неверный CSV около записи (\d+): лишние символы после кавычек\.$/, n => `Invalid CSV near entry ${n}: unexpected characters after a closing quote.`],
  [/^Неверный CSV около записи (\d+): неожиданная кавычка\.$/, n => `Invalid CSV near entry ${n}: unexpected quote.`],
  [/^Запись (\d+): количество полей не совпадает с заголовком\. Импорт не выполнен\.$/, n => `Entry ${n}: the field count does not match the header. Nothing was imported.`],
  [/^Запись (\d+): слишком длинные или неверные поля\. Импорт не выполнен\.$/, n => `Entry ${n}: a field is too long or invalid. Nothing was imported.`],
];
export function t(source, values = {}) {
  if (typeof source !== 'string') source = 'Не удалось выполнить операцию.';
  let result = source;
  if (locale === 'en') {
    result = english[source] ?? source;
    if (result === source) for (const [pattern, translate] of dynamic) { const match = source.match(pattern); if (match) { result = translate(...match.slice(1)); break; } }
  }
  // Replace placeholders once: an entry title containing {count} stays literal.
  return result.replace(/\{(\w+)\}/g, (all, key) => Object.hasOwn(values, key) ? String(values[key]) : all);
}
export function applyTranslations(root = document) {
  root.documentElement?.setAttribute('lang', locale);
  root.querySelectorAll('[data-i18n]').forEach(element => { element.textContent = t(element.dataset.i18n); });
  for (const attr of ['placeholder', 'aria-label']) root.querySelectorAll(`[data-i18n-${attr}]`).forEach(element => { element.setAttribute(attr, t(element.getAttribute(`data-i18n-${attr}`))); });
  if (root.title !== undefined) root.title = t('Менеджер паролей — Личное хранилище');
  root.querySelector('meta[name="description"]')?.setAttribute('content', t('Локальное зашифрованное хранилище паролей.'));
  root.querySelector('#app-manifest')?.setAttribute('href', locale === 'en' ? './manifest.en.webmanifest' : './manifest.webmanifest');
}
