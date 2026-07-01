# Firebase setup для IXSAYZ Inventory

## Сейчас приложение работает без пароля

Это личный режим: приложение открывается сразу, без регистрации и входа. Данные сохраняются в Firebase Firestore в общей личной папке:

```text
users/public/...
```

Важно: если кто-то получит ссылку на приложение и правила Firestore открыты, он технически сможет читать и менять эти данные. Для личного использования это удобно. Для продажи, сотрудников или разных пользователей нужно включать авторизацию.

## 1. Создать Firebase проект

1. Откройте https://console.firebase.google.com/.
2. Нажмите `Add project`.
3. Назовите проект, например `ixsayz-inventory`.
4. Google Analytics можно отключить.
5. Дождитесь создания проекта.

## 2. Добавить Web App

1. В Firebase Console откройте Project settings.
2. В блоке `Your apps` нажмите значок Web `</>`.
3. Назовите приложение `IXSAYZ Inventory`.
4. Firebase Hosting включать не нужно, проект работает через GitHub Pages.
5. Скопируйте объект `firebaseConfig`.
6. Вставьте значения в `firebase.js`.

## 3. Создать Firestore

1. Откройте `Firestore Database`.
2. Нажмите `Create database`.
3. Выберите production mode.
4. Регион выберите ближайший к вам.
5. Дождитесь создания базы.

## 4. Вставить правила Firestore для личного открытого режима

Откройте `Firestore Database` -> `Rules` и вставьте:

```js
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/public/{document=**} {
      allow read, write: if true;
    }
  }
}
```

Нажмите `Publish`.

Эти правила разрешают приложению без пароля сохранять данные в `users/public/...`.

## 5. Включить GitHub Pages

1. Загрузите проект в GitHub repository.
2. Откройте `Settings` -> `Pages`.
3. В `Build and deployment` выберите `Deploy from a branch`.
4. Branch: `main`.
5. Folder: `/root`.
6. Нажмите `Save`.
7. Через 1-3 минуты GitHub покажет ссылку на сайт.

## 6. Открыть на iPhone

1. Откройте ссылку GitHub Pages в Safari.
2. Нажмите Share.
3. Выберите `Add to Home Screen`.
4. Подтвердите название `IXSAYZ Inventory`.

## 7. Первый рабочий сценарий

1. Откройте приложение.
2. Добавьте поставщика `P1`.
3. Добавьте завоз и строки товаров.
4. Проверьте раздел `Товары`.
5. Создайте PDF ценников.
6. Создайте отчет по поставке.
7. Сделайте CSV экспорт.
8. Откройте приложение на другом устройстве: данные должны подтянуться из Firestore.

## 8. Если данные не сохраняются

- Если ошибка `permission-denied`, проверьте правила Firestore.
- Если ошибка `Firebase config пустой`, проверьте `firebase.js`.
- Если сайт старый после загрузки на GitHub, подождите пару минут и обновите страницу.
- Если телефон держит старую версию PWA, удалите иконку с экрана Домой и добавьте заново.

## 9. Правила для будущей версии с пользователями

Если потом понадобится продавать приложение или разделять данные разных людей, используйте авторизацию и такие правила:

```js
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId}/{document=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```
