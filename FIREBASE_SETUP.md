# Firebase setup для IXSAYZ Inventory

## 1. Создать Firebase проект

1. Откройте https://console.firebase.google.com/.
2. Нажмите `Add project`.
3. Назовите проект, например `ixsayz-inventory`.
4. Google Analytics можно отключить, для приложения он не обязателен.
5. Дождитесь создания проекта.

## 2. Добавить Web App

1. В Firebase Console откройте Project settings.
2. В блоке `Your apps` нажмите значок Web `</>`.
3. Назовите приложение `IXSAYZ Inventory`.
4. Firebase Hosting включать не нужно, проект работает через GitHub Pages.
5. Скопируйте объект `firebaseConfig`.

## 3. Включить Authentication Email/Password

1. Откройте `Authentication`.
2. Нажмите `Get started`.
3. Откройте вкладку `Sign-in method`.
4. Выберите `Email/Password`.
5. Включите первый переключатель `Email/Password`.
6. Нажмите `Save`.

## 4. Создать Firestore

1. Откройте `Firestore Database`.
2. Нажмите `Create database`.
3. Выберите production mode.
4. Регион выберите ближайший к вам или к вашим пользователям.
5. Дождитесь создания базы.

## 5. Вставить правила Firestore

Откройте `Firestore Database` -> `Rules` и вставьте:

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

Нажмите `Publish`.

## 6. Вставить firebaseConfig

Откройте файл `firebase.js` и замените пустые значения:

```js
export const firebaseConfig = {
  apiKey: "",
  authDomain: "",
  projectId: "",
  storageBucket: "",
  messagingSenderId: "",
  appId: ""
};
```

на значения из Firebase Console.

## 7. Загрузить проект на GitHub

В репозиторий нужно загрузить все файлы из корня проекта:

```text
index.html
styles.css
app.js
firebase.js
manifest.json
sw.js
README.md
FIREBASE_SETUP.md
CHECKED.md
js/
assets/
```

Папки `work/` и `outputs/` загружать не обязательно.

## 8. Включить GitHub Pages

1. Откройте GitHub repository.
2. Перейдите в `Settings` -> `Pages`.
3. В `Build and deployment` выберите `Deploy from a branch`.
4. Branch: `main`.
5. Folder: `/root`.
6. Нажмите `Save`.
7. Через 1-3 минуты GitHub покажет ссылку на сайт.

## 9. Открыть приложение на iPhone

1. Откройте ссылку GitHub Pages в Safari.
2. Войдите или зарегистрируйтесь.
3. Нажмите Share.
4. Выберите `Add to Home Screen`.
5. Подтвердите название `IXSAYZ Inventory`.

## 10. Первый рабочий сценарий

1. Зарегистрируйтесь.
2. Добавьте поставщика `P1`.
3. Добавьте завоз и строки товаров.
4. Проверьте раздел `Товары`.
5. Создайте PDF ценников.
6. Создайте отчет по поставке.
7. Сделайте CSV экспорт.
8. Войдите на другом устройстве с тем же аккаунтом и проверьте данные.

## 11. Если Firebase не подключается

- Проверьте, что файл `firebase.js` действительно загружен на GitHub Pages после изменения.
- Проверьте, что GitHub Pages обновился, иногда нужно подождать пару минут.
- Проверьте, что Firestore rules опубликованы.
- Проверьте Authentication -> Users: после регистрации пользователь должен появиться в списке.
- Если в консоли ошибка `permission-denied`, почти всегда проблема в правилах или входе пользователя.
- Если ошибка `auth/configuration-not-found`, проверьте `authDomain` и включенный Email/Password.

## Если при регистрации ошибка 403 Forbidden

Это означает, что Google блокирует доступ к Firebase Auth API до выполнения операции входа/регистрации.

Проверьте:

1. Firebase Console -> Authentication -> Sign-in method -> Email/Password включен.
2. Google Cloud Console -> APIs & Services -> Enabled APIs: включен `Identity Toolkit API`.
3. Google Cloud Console -> APIs & Services -> Credentials -> ваш Web API key:
   - на время проверки можно поставить `Application restrictions: None`;
   - после публикации можно ограничить ключ HTTP referrers и добавить:
     - `https://ВАШ-ЛОГИН.github.io/*`
     - `https://ВАШ-ЛОГИН.github.io/ВАШ-РЕПО/*`
     - `http://localhost:*/*`
     - `http://127.0.0.1:*/*`
   - если включены API restrictions, разрешите минимум `Identity Toolkit API` и `Cloud Firestore API`.
4. После изменения ограничений подождите 1-5 минут и обновите приложение.
