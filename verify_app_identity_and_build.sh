#!/usr/bin/env bash
set -e

APP_NAME="معتز العلقمي"
ICON_PATH="assets/icon.png"
WORKFLOW_FILE=".github/workflows/build.yml"
WORKFLOW_NAME="Build Flutter APK"
ARTIFACT_NAME="moataz-alalqami-apk"

echo "========================================"
echo "🔍 فحص اسم التطبيق والأيقونة وملف الأكشن"
echo "========================================"

# 1) فحص وجود الأيقونة
if [ ! -f "$ICON_PATH" ]; then
  echo "❌ الأيقونة غير موجودة في: $ICON_PATH"
  exit 1
fi

echo "✅ الأيقونة موجودة: $ICON_PATH"

# 2) فحص pubspec.yaml
if [ ! -f "pubspec.yaml" ]; then
  echo "❌ ملف pubspec.yaml غير موجود"
  exit 1
fi

grep -q "flutter_launcher_icons" pubspec.yaml || {
  echo "❌ pubspec.yaml لا يحتوي flutter_launcher_icons"
  exit 1
}

grep -q 'image_path: "assets/icon.png"' pubspec.yaml || {
  echo "❌ pubspec.yaml لا يحتوي image_path الصحيح للأيقونة"
  exit 1
}

echo "✅ pubspec.yaml يحتوي إعدادات flutter_launcher_icons"

# 3) فحص ملف GitHub Actions
if [ ! -f "$WORKFLOW_FILE" ]; then
  echo "❌ ملف الأكشن غير موجود: $WORKFLOW_FILE"
  exit 1
fi

grep -q "subosito/flutter-action" "$WORKFLOW_FILE" || {
  echo "❌ الأكشن لا يستخدم Flutter SDK"
  exit 1
}

grep -q "flutter pub get" "$WORKFLOW_FILE" || {
  echo "❌ الأكشن لا يستخدم flutter pub get"
  exit 1
}

grep -q "dart run flutter_launcher_icons" "$WORKFLOW_FILE" || {
  echo "❌ الأكشن لا يشغّل توليد الأيقونة"
  exit 1
}

grep -q "android:label=\"@string/app_name\"" "$WORKFLOW_FILE" || {
  echo "❌ الأكشن لا يضبط android:label على @string/app_name"
  exit 1
}

grep -q "$APP_NAME" "$WORKFLOW_FILE" || {
  echo "❌ الأكشن لا يحتوي اسم التطبيق العربي: $APP_NAME"
  exit 1
}

grep -q "uses-permission android:name=\"android.permission.INTERNET\"" "$WORKFLOW_FILE" || {
  echo "❌ الأكشن لا يضيف صلاحية الإنترنت"
  exit 1
}

echo "✅ ملف GitHub Actions يحتوي خطوات الاسم والأيقونة والإنترنت"

# 4) فحص git status
echo "========================================"
echo "📦 فحص حالة Git"
echo "========================================"

git status --short

if [ -n "$(git status --short)" ]; then
  echo "⚠️ توجد تعديلات غير مرفوعة. سيتم عمل commit و push."
  git add pubspec.yaml "$WORKFLOW_FILE" "$ICON_PATH"
  git commit -m "Verify app name icon and workflow build setup" || true
  git push
else
  echo "✅ لا توجد تعديلات غير مرفوعة"
fi

# 5) التأكد من وجود GitHub CLI
if ! command -v gh >/dev/null 2>&1; then
  echo "❌ GitHub CLI غير مثبت أو غير متاح في Codespaces"
  echo "شغّل الأكشن يدويًا من GitHub > Actions"
  exit 1
fi

# 6) التأكد من تسجيل الدخول في gh
if ! gh auth status >/dev/null 2>&1; then
  echo "❌ GitHub CLI غير مسجل دخول"
  echo "نفّذ: gh auth login"
  exit 1
fi

echo "✅ GitHub CLI جاهز"

# 7) تشغيل الأكشن
echo "========================================"
echo "🚀 تشغيل GitHub Actions"
echo "========================================"

gh workflow run "$WORKFLOW_NAME" || gh workflow run build.yml

echo "⏳ انتظر 10 ثواني حتى يبدأ التشغيل..."
sleep 10

RUN_ID="$(gh run list --workflow="$WORKFLOW_NAME" --limit 1 --json databaseId --jq '.[0].databaseId' 2>/dev/null || true)"

if [ -z "$RUN_ID" ]; then
  RUN_ID="$(gh run list --limit 1 --json databaseId --jq '.[0].databaseId')"
fi

if [ -z "$RUN_ID" ]; then
  echo "❌ لم أستطع العثور على Run ID"
  exit 1
fi

echo "✅ Run ID: $RUN_ID"

echo "========================================"
echo "👀 انتظار انتهاء البناء"
echo "========================================"

gh run watch "$RUN_ID" --exit-status

echo "========================================"
echo "📥 تنزيل Artifact للتأكد من وجود APK"
echo "========================================"

rm -rf apk_artifacts
mkdir -p apk_artifacts

gh run download "$RUN_ID" --name "$ARTIFACT_NAME" --dir apk_artifacts

APK_COUNT="$(find apk_artifacts -name "*.apk" | wc -l | tr -d ' ')"

if [ "$APK_COUNT" = "0" ]; then
  echo "❌ لم يتم العثور على أي APK داخل Artifact"
  exit 1
fi

echo "✅ تم إنشاء APK بنجاح"
echo "عدد ملفات APK: $APK_COUNT"

echo "========================================"
echo "📄 ملفات APK الناتجة"
echo "========================================"

find apk_artifacts -name "*.apk" -print

echo "========================================"
echo "✅ النتيجة النهائية"
echo "========================================"
echo "تم التأكد من التالي:"
echo "✅ الأيقونة موجودة في assets/icon.png"
echo "✅ pubspec.yaml يحتوي flutter_launcher_icons"
echo "✅ GitHub Actions يغيّر اسم التطبيق إلى: $APP_NAME"
echo "✅ GitHub Actions يولّد الأيقونة"
echo "✅ GitHub Actions بنى APK بنجاح"
echo ""
echo "مهم: احذف التطبيق القديم من الهاتف ثم ثبّت APK الجديد من مجلد apk_artifacts."
