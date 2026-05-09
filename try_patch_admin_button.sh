#!/usr/bin/env bash
set -e

echo "======================================"
echo "🔗 محاولة ربط زر الإدارة داخل main.dart"
echo "======================================"

MAIN="lib/main.dart"

if [ ! -f "$MAIN" ]; then
  echo "❌ lib/main.dart غير موجود"
  exit 1
fi

python3 - <<'PY'
from pathlib import Path
import re

path = Path("lib/main.dart")
text = path.read_text()

import_line = "import 'features/admin/admin_pages.dart';"
if import_line not in text:
    # أضف الاستيراد بعد آخر import
    imports = list(re.finditer(r"^import .+?;\s*$", text, re.M))
    if imports:
        last = imports[-1]
        text = text[:last.end()] + "\n" + import_line + text[last.end():]
    else:
        text = import_line + "\n" + text

# محاولة ذكية لإضافة الزر إذا لم يكن موجودًا
if "AdminEntryButton" not in text.replace(import_line, ""):
    # نبحث عن قائمة فيها كلمة المزيد
    # لن نغامر بتعديل كبير؛ سنضيف تعليق واضح في الملف
    marker = "\n// TODO: Add const AdminEntryButton() inside the More page list.\n"
    if marker.strip() not in text:
        text += marker

path.write_text(text)
print("✅ تم إضافة import لقسم الإدارة")
print("⚠️ إذا لم يظهر زر الإدارة، أضف const AdminEntryButton() يدويًا داخل صفحة المزيد")
PY

echo ""
echo "ابحث في lib/main.dart عن صفحة المزيد وأضف داخل القائمة:"
echo "const AdminEntryButton(),"
