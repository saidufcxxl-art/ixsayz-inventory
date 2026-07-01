# Firebase setup для IXSAYZ Inventory

Нужен только **Cloud Firestore**. Realtime Database и Storage не нужны.

## Создать Cloud Firestore

1. Firebase Console -> слева `Firestore` или `Cloud Firestore`.
2. Нажать `Create database`.
3. Выбрать production mode.
4. Выбрать регион.
5. Открыть вкладку `Rules`.
6. Вставить правила ниже.
7. Нажать `Publish`.

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

## Важно

- Не вставлять эти правила в Realtime Database.
- Не открывать Storage, он для этого приложения не нужен.
- Если Firestore возвращает 403, значит правила не опубликованы или открыт неправильный раздел.

## Будущая версия с пользователями

Если потом нужно продавать приложение или давать доступ другим людям, надо вернуть Firebase Auth и правила `users/{uid}/...`.

## Если завоз не сохраняется

Проверка Firestore вернула `403 Forbidden`. Это не ошибка формы завоза: Firebase блокирует запись до приложения.

Проверьте два места:

1. Cloud Firestore -> Rules -> должно быть опубликовано:

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

2. Google Cloud Console -> APIs & Services -> Credentials -> Web API key:
   - временно поставьте `Application restrictions: None`;
   - если есть API restrictions, разрешите `Cloud Firestore API`.

После этого обновите GitHub Pages и нажмите `Обновить` в приложении.
