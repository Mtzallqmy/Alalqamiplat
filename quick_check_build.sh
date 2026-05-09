#!/usr/bin/env bash
set -e

echo "🔍 فحص المشروع قبل بناء APK"

test -f pubspec.yaml || { echo "❌ pubspec.yaml غير موجود"; exit 1; }
test -f lib/main.dart || { echo "❌ lib/main.dart غير موجود"; exit 1; }
test -f .github/workflows/build.yml || { echo "❌ .github/workflows/build.yml غير موجود"; exit 1; }

echo "✅ الملفات الأساسية موجودة"

grep -q "subosito/flutter-action" .github/workflows/build.yml || { echo "❌ الأكشن لا يستخدم Flutter SDK"; exit 1; }
grep -q "flutter pub get" .github/workflows/build.yml || { echo "❌ الأكشن لا يحتوي flutter pub get"; exit 1; }
grep -q "flutter build apk" .github/workflows/build.yml || { echo "❌ الأكشن لا يحتوي flutter build apk"; exit 1; }

echo "✅ ملف GitHub Actions مضبوط"

if [ -f assets/icon.png ]; then
  echo "✅ الأيقونة موجودة assets/icon.png"
else
  echo "⚠️ الأيقونة غير موجودة assets/icon.png"
fi

if [ -d lib/features/admin ]; then
  echo "✅ قسم الإدارة موجود"
else
  echo "⚠️ قسم الإدارة غير موجود"
fi

echo "📌 حالة Git:"
git status --short

git add .

git commit -m "Final quick check before APK build" || true

git pull --rebase origin main

git push

if command -v gh >/dev/null 2>&1 && gh auth status >/dev/null 2>&1; then
  gh workflow run "Build Flutter APK" || gh workflow run build.yml
  echo "✅ تم تشغيل GitHub Actions"
else
  echo "⚠️ شغّل الأكشن يدويًا من GitHub > Actions > Build Flutter APK > Run workflow"
fi

echo "✅ انتهى الفحص والرفع"
