# خطوات تشغيل وبناء تطبيق معتز العلقمي

## تشغيل التطبيق

```bash
npm install
npx expo start --tunnel --clear
```

افتح Expo Go وامسح QR.

## بناء APK من الطرفية

```bash
npm install -g eas-cli
eas login
eas build --profile preview --platform android
```

## بناء APK من GitHub Actions

- أضف Secret باسم `EXPO_TOKEN`.
- افتح Actions.
- شغّل `Build Android APK`.
- حمّل artifact بعد انتهاء البناء.

## بناء AAB للمتجر لاحقًا

```bash
eas build --profile production --platform android
```
