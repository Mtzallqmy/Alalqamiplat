# تطبيق معتز العلقمي

تطبيق أندرويد حقيقي مبني بـ **Expo React Native** و **Expo Router**، وليس WebView. التطبيق يقرأ بيانات منصة معتز العلقمي من API الحقيقي ويعرضها داخل واجهات Native عربية RTL.

## ما يستطيع التطبيق عمله

- عرض أحدث المقالات والمقال المميز.
- عرض جميع المقالات مع pagination.
- عرض تفاصيل المقال: صورة الغلاف، العنوان، الكاتب، التاريخ، وقت القراءة، المحتوى HTML.
- عرض التصنيفات ومقالات كل تصنيف.
- البحث في المقالات.
- حفظ المقالات المفضلة محليًا.
- مشاركة روابط المقالات.
- كاش خفيف لمدة 5 دقائق.
- حفظ أحدث المقالات للقراءة الأساسية عند ضعف الإنترنت.
- صفحة المزيد: رابط الموقع، الخصوصية، من نحن، روابط التواصل.
- الوضع الليلي والفاتح.
- تسجيل دخول الأدمن عبر JWT mobile endpoint.
- لوحة إدارة: إحصائيات، قائمة مقالات، إنشاء/تعديل/حفظ مسودة/نشر حسب دعم API الموقع.

## API المستخدم

```txt
Public API:
https://moatazalalqami.online/api/public

Admin mobile login:
https://moatazalalqami.online/api/mobile/auth/login
```

## التشغيل في GitHub Codespaces أو الكمبيوتر

```bash
npm install
npm run start
```

ثم امسح QR من تطبيق Expo Go.

## بناء APK يدويًا عبر EAS

```bash
npm install -g eas-cli
eas login
eas build --profile preview --platform android
```

## بناء APK من GitHub Actions

1. ارفع المشروع إلى GitHub.
2. من إعدادات المستودع أضف secret باسم:

```txt
EXPO_TOKEN
```

3. احصل على التوكن من Expo:

```txt
https://expo.dev/accounts/[username]/settings/access-tokens
```

4. افتح تبويب **Actions**.
5. شغّل workflow باسم **Build Android APK**.
6. بعد النجاح ستجد ملف APK في Artifacts باسم:

```txt
moataz-alalqami-apk
```

## ملاحظات مهمة

- التطبيق لا يحتوي على `node_modules` داخل ZIP لتقليل الحجم.
- لا تستخدم بيانات وهمية؛ المصدر هو API الموقع.
- إذا فشل الأدمن، تأكد أن `/api/mobile/auth/login` يرجع `success + token + user`.
- Package الحالي: `com.moataz.alalqami`.
