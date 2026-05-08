# تطبيق معتز العلقمي - Flutter APK

نسخة Flutter خفيفة للتطبيق الرسمي. التطبيق لا يخزن المقالات داخله، بل يقرأها مباشرة من API الموقع:

```text
https://moatazalalqami.online/api/public
```

## المميزات

- Flutter + Dart.
- عربي RTL بالكامل.
- صفحات: الرئيسية، المقالات، التصنيفات، البحث، المفضلة، المزيد.
- عرض المقالات من API الموقع مباشرة.
- كاش محلي مؤقت لتقليل استهلاك الإنترنت وتحسين السرعة.
- مفضلة محلية باستخدام SharedPreferences.
- خط Tajawal مدمج.
- GitHub Actions يبني APK تلقائيًا.
- بناء Split APK لتقليل الحجم حسب معمارية الهاتف.

## طريقة الرفع إلى GitHub وتشغيل الأكشن

1. أنشئ مستودعًا جديدًا في GitHub.
2. ارفع محتويات هذا المجلد كما هي إلى المستودع.
3. افتح تبويب **Actions**.
4. اختر **Build Flutter APK**.
5. اضغط **Run workflow**.
6. بعد اكتمال البناء ستجد ملف APK في Artifacts باسم:

```text
moataz-alalqami-apk
```

## ملاحظات مهمة

الأكشن يبني نوعين:

- APK مقسم حسب المعمارية لتقليل الحجم:
  - `app-arm64-v8a-release.apk` مناسب لمعظم الهواتف الحديثة.
  - `app-armeabi-v7a-release.apk` مناسب لبعض الهواتف القديمة.
- APK شامل:
  - `app-release.apk` حجمه أكبر لكنه يعمل على أغلب الأجهزة.

## تغيير رابط API

افتح الملف:

```text
.github/workflows/build-apk.yml
```

وعدّل:

```yaml
SITE_BASE_URL: https://moatazalalqami.online
API_BASE_URL: https://moatazalalqami.online/api/public
```

أو عند البناء المحلي:

```bash
flutter build apk --release --split-per-abi \
  --dart-define=SITE_BASE_URL=https://moatazalalqami.online \
  --dart-define=API_BASE_URL=https://moatazalalqami.online/api/public
```

## تشغيل محليًا

```bash
flutter pub get
flutter run
```

إذا لم يكن مجلد Android موجودًا محليًا:

```bash
flutter create --platforms=android --org com.moataz --project-name alalqami .
flutter pub get
flutter run
```
