# ملخص النسخة النهائية

هذه نسخة Native Expo React Native وليست WebView، مجهزة للتجربة عبر Expo Go ولإنتاج APK عبر EAS أو GitHub Actions.

## الإصلاحات

- تنظيف package.json من تبعيات السيرفر غير الضرورية.
- تثبيت إعدادات EAS للـ APK.
- إضافة GitHub Actions لبناء APK ورفعه كـ artifact.
- تثبيت إعدادات التطبيق باسم: معتز العلقمي.
- ضبط الحزمة: com.moataz.alalqami.
- الحفاظ على كاش 5 دقائق، المفضلة، الوضع الليلي، RTL، Tajawal.
- تثبيت مسار أدمن الموبايل: /api/mobile/auth/login.
- منع حفظ null/undefined في AsyncStorage.

## الملفات المهمة

- app/ شاشات التطبيق.
- src/api/public.ts اتصال API العام.
- src/api/admin.ts اتصال API الأدمن.
- src/auth/context.tsx جلسة الأدمن.
- .github/workflows/android-apk.yml بناء APK من GitHub Actions.
