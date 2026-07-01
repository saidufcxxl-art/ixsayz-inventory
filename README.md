# IXSAYZ Inventory

Личное мобильное PWA-приложение для складского учета. Сейчас сделано без регистрации: открыл приложение и работаешь. Данные сохраняются в Firebase Firestore по пути `users/public/...`.

## Правильный рабочий сценарий

1. Открываешь приложение.
2. На экране `Завозы` нажимаешь `Создать завоз`.
3. Указываешь название/номер завоза и дату.
4. Открываешь завоз.
5. Внутри завоза нажимаешь `Добавить` поставщика.
6. Пишешь только имя/название поставщика.
7. Открываешь поставщика.
8. Внутри поставщика добавляешь товары таблицей.
9. Для товара нужны только рабочие поля: название/бренд, категория, пол, размер, закупка, продажа, количество, количество ценников, штрихкод.
10. Если штрихкод пустой, приложение само создает EAN-13.
11. Потом можно печатать PDF-ценники, делать отчеты и экспорт CSV/XLSX.

## Что есть

- Завозы отдельным экраном.
- Поставщики внутри конкретного завоза.
- Товары внутри конкретного поставщика.
- Все товары отдельным поиском.
- PDF-ценники 43 x 25 мм.
- PDF-отчеты.
- CSV и XLSX экспорт.
- PWA-иконки для iPhone/Android.
- Работа через GitHub Pages.

## Firebase Rules для личного режима

В Cloud Firestore -> Rules должно быть:

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

После вставки нажмите `Publish`.

Если приложение пишет `Firebase не дает доступ`, значит эти правила не опубликованы или открыт не Cloud Firestore.

## GitHub Pages

Загрузите в корень репозитория:

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

В GitHub: Settings -> Pages -> Deploy from branch -> main -> /root.

## Установка на телефон

На iPhone: открыть сайт в Safari -> Share -> Add to Home Screen.

На Android: открыть сайт в Chrome -> меню -> Add to Home screen / Install app.
