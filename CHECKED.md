# Что уже проверено

Дата проверки: 2026-07-01.

## Проверено локально

- Создана требуемая структура файлов проекта.
- `app.js` прошел `node --check`.
- Все файлы `js/*.js` прошли `node --check`.
- Проверено, что в коде нет `localStorage` и `sessionStorage`.
- Проверено, что Firestore-пути идут через `users/{uid}/suppliers`, `deliveries`, `products`, `categories`, `settings/main`.
- Проверена функция контрольной цифры EAN-13.
- Проверена функция валидации EAN-13.
- Проверено, что `labelQty = 5` учитывается как пять этикеток в генераторе PDF.
- Проверены расчеты dashboard и поставки на тестовых данных.
- Проверен CSV UTF-8 с BOM и разделителями `;` и `,`.
- Проверено, что штрихкод в CSV отдается текстом для Excel.
- Проверены manifest и service worker для GitHub Pages.
- Проверено, что проект не требует сервера и может работать как статический сайт.

## Требует вашего Firebase config

Эти пункты невозможно честно подтвердить без реального Firebase проекта и ваших ключей:

- Реальная регистрация Firebase Auth.
- Реальный вход Firebase Auth.
- Реальная запись в Firestore.
- Синхронизация данных между двумя устройствами.
- Изоляция данных разных пользователей в опубликованном Firebase проекте.

Код для этих функций реализован. После вставки `firebaseConfig` и правил из `FIREBASE_SETUP.md` их нужно проверить на вашем Firebase проекте.

## Автотест

- Выполнен `work/verify.mjs`: `OK: core logic checks passed`.

## Firebase config inserted

Ваш Firebase config вставлен в `firebase.js`.

## Firebase network check

- Попытка создать временного тестового пользователя через Firebase Auth REST API вернула `403 Forbidden`.
- Повтор с HTTP referrer локального сайта также вернул `403 Forbidden`.
- Это указывает на блокировку API key / Identity Toolkit API / ограничение referrer, а не на синтаксическую ошибку приложения.
- Реальная проверка регистрации в браузере станет возможна после исправления настроек ключа или API в Firebase/Google Cloud Console.
