# Changelog / История изменений

## 1.1.0

### Русский

- Переключение русского/английского языка интерфейса с сохранением выбора.
- Манифесты PWA на двух языках, иконки 192/512 px, отдельное окно и кэш файлов приложения для автономного запуска.
- Обновление офлайн-версии по явному действию с блокировкой хранилища перед перезагрузкой.
- Необязательные ручные резервные копии в Google Drive: настройка публичного OAuth Client ID, ограниченное разрешение drive.file, токен только в памяти страницы.
- Отправка только проверенного зашифрованного конверта в Drive; отдельные копии с датой, без перезаписи старых.
- Описание на двух языках и полные руководства по использованию, установке PWA, переносу Chrome и Google Cloud.
- Кнопка «Помощь» и автономно доступная двуязычная HTML-инструкция.
- Дополнительные функциональные тесты локализации, PWA и запросов Google Drive с имитацией API.

Google OAuth Client ID в комплекте не задан. Реальное подключение и загрузка в Google Drive требуют его настройки и разрешения владельца аккаунта. Установка PWA также зависит от браузера; тесты логики не заменяют проверку установки на целевом устройстве. Независимый аудит безопасности не выполнен. Формат хранилища совместим с 1.0.

### English

- Russian/English interface switching with a remembered language preference.
- Localized PWA manifests, 192/512 px icons, standalone display and an offline app-shell cache.
- Explicit offline updates that lock the vault before reloading.
- Optional manual Google Drive backups: public OAuth Client ID configuration, limited drive.file permission and an in-memory access token.
- Only validated encrypted vault envelopes are uploaded. Timestamped copies preserve previous backups.
- Bilingual descriptions and full user guides covering daily use, PWA installation, Chrome migration and Google Cloud setup.
- Help link and an offline-readable bilingual HTML guide.
- Additional functional tests for localization, PWA behavior and mocked Google Drive requests.

No Google OAuth Client ID is included. Real Drive sign-in/upload requires configuration and account-owner authorization. PWA installation depends on the browser; logic tests do not replace installation checks on a target device. No independent security audit has been performed. The vault format remains compatible with 1.0.
