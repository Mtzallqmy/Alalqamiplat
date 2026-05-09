#!/usr/bin/env bash
set -e

echo "======================================"
echo "➕ إضافة قسم الإدارة Native إلى Flutter"
echo "======================================"

mkdir -p lib/features/admin

# -----------------------------
# تحديث pubspec.yaml
# -----------------------------
python3 - <<'PY'
from pathlib import Path
import re

path = Path("pubspec.yaml")
text = path.read_text()

def add_dep(text, name, version):
    if re.search(rf"^\s*{re.escape(name)}\s*:", text, re.M):
        return text
    if "dependencies:" not in text:
        text += "\n\ndependencies:\n"
    return re.sub(
        r"dependencies:\n",
        f"dependencies:\n  {name}: {version}\n",
        text,
        count=1
    )

text = add_dep(text, "http", "^1.2.2")
text = add_dep(text, "flutter_secure_storage", "^9.2.2")

path.write_text(text)
print("✅ تم تحديث pubspec.yaml")
PY

# -----------------------------
# admin_config.dart
# -----------------------------
cat > lib/features/admin/admin_config.dart <<'DART'
class AdminConfig {
  static const String baseUrl = 'https://moatazalalqami.online';

  /// عدّل هذه المسارات إذا كانت API الموقع مختلفة.
  static const String loginPath = '/api/admin/login';
  static const String dashboardPath = '/api/admin/dashboard';
  static const String postsPath = '/api/admin/posts';
  static const String categoriesPath = '/api/admin/categories';
}
DART

# -----------------------------
# admin_api_service.dart
# -----------------------------
cat > lib/features/admin/admin_api_service.dart <<'DART'
import 'dart:convert';
import 'package:http/http.dart' as http;
import 'admin_config.dart';

class AdminApiException implements Exception {
  final String message;
  final int? statusCode;

  AdminApiException(this.message, {this.statusCode});

  @override
  String toString() {
    if (statusCode == null) return message;
    return 'HTTP $statusCode - $message';
  }
}

class AdminApiService {
  const AdminApiService();

  Uri _uri(String path) => Uri.parse('${AdminConfig.baseUrl}$path');

  Map<String, String> _headers({String? token}) {
    return {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      if (token != null && token.isNotEmpty) 'Authorization': 'Bearer $token',
    };
  }

  Future<Map<String, dynamic>> login({
    required String email,
    required String password,
  }) async {
    final response = await http
        .post(
          _uri(AdminConfig.loginPath),
          headers: _headers(),
          body: jsonEncode({
            'email': email,
            'password': password,
          }),
        )
        .timeout(const Duration(seconds: 20));

    return _decode(response);
  }

  Future<Map<String, dynamic>> dashboard(String token) async {
    final response = await http
        .get(
          _uri(AdminConfig.dashboardPath),
          headers: _headers(token: token),
        )
        .timeout(const Duration(seconds: 20));

    return _decode(response);
  }

  Future<List<dynamic>> posts(String token) async {
    final response = await http
        .get(
          _uri(AdminConfig.postsPath),
          headers: _headers(token: token),
        )
        .timeout(const Duration(seconds: 20));

    final data = _decode(response);
    final raw = data['data'] ?? data['posts'] ?? data['items'] ?? [];
    if (raw is List) return raw;
    if (raw is Map && raw['posts'] is List) return raw['posts'] as List;
    return [];
  }

  Future<List<dynamic>> categories(String token) async {
    final response = await http
        .get(
          _uri(AdminConfig.categoriesPath),
          headers: _headers(token: token),
        )
        .timeout(const Duration(seconds: 20));

    final data = _decode(response);
    final raw = data['data'] ?? data['categories'] ?? data['items'] ?? [];
    if (raw is List) return raw;
    if (raw is Map && raw['categories'] is List) {
      return raw['categories'] as List;
    }
    return [];
  }

  Future<void> deletePost(String token, String id) async {
    final response = await http
        .delete(
          _uri('${AdminConfig.postsPath}/$id'),
          headers: _headers(token: token),
        )
        .timeout(const Duration(seconds: 20));

    _decode(response, allowEmpty: true);
  }

  Future<void> deleteCategory(String token, String id) async {
    final response = await http
        .delete(
          _uri('${AdminConfig.categoriesPath}/$id'),
          headers: _headers(token: token),
        )
        .timeout(const Duration(seconds: 20));

    _decode(response, allowEmpty: true);
  }

  Map<String, dynamic> _decode(http.Response response, {bool allowEmpty = false}) {
    final code = response.statusCode;
    final body = response.body.trim();

    if (code < 200 || code >= 300) {
      String message = body.isEmpty ? 'فشل الطلب' : body;
      try {
        final parsed = jsonDecode(body);
        if (parsed is Map && parsed['message'] != null) {
          message = parsed['message'].toString();
        }
        if (parsed is Map && parsed['error'] != null) {
          message = parsed['error'].toString();
        }
      } catch (_) {}
      throw AdminApiException(message, statusCode: code);
    }

    if (body.isEmpty) {
      if (allowEmpty) return <String, dynamic>{};
      throw AdminApiException('استجابة فارغة من الخادم', statusCode: code);
    }

    final parsed = jsonDecode(body);
    if (parsed is Map<String, dynamic>) return parsed;

    throw AdminApiException('صيغة الاستجابة غير مدعومة', statusCode: code);
  }
}
DART

# -----------------------------
# admin_session_storage.dart
# -----------------------------
cat > lib/features/admin/admin_session_storage.dart <<'DART'
import 'package:flutter_secure_storage/flutter_secure_storage.dart';

class AdminSessionStorage {
  static const _storage = FlutterSecureStorage();
  static const _tokenKey = 'admin_token';
  static const _emailKey = 'admin_email';

  Future<void> saveSession({
    required String token,
    required String email,
  }) async {
    await _storage.write(key: _tokenKey, value: token);
    await _storage.write(key: _emailKey, value: email);
  }

  Future<String?> getToken() {
    return _storage.read(key: _tokenKey);
  }

  Future<String?> getEmail() {
    return _storage.read(key: _emailKey);
  }

  Future<void> clear() async {
    await _storage.delete(key: _tokenKey);
    await _storage.delete(key: _emailKey);
  }
}
DART

# -----------------------------
# admin_pages.dart
# -----------------------------
cat > lib/features/admin/admin_pages.dart <<'DART'
import 'package:flutter/material.dart';
import 'admin_api_service.dart';
import 'admin_session_storage.dart';

class AdminEntryPage extends StatefulWidget {
  const AdminEntryPage({super.key});

  @override
  State<AdminEntryPage> createState() => _AdminEntryPageState();
}

class _AdminEntryPageState extends State<AdminEntryPage> {
  final _session = AdminSessionStorage();
  String? _token;
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    final token = await _session.getToken();
    if (!mounted) return;
    setState(() {
      _token = token;
      _loading = false;
    });
  }

  @override
  Widget build(BuildContext context) {
    if (_loading) {
      return const Scaffold(
        body: Center(child: CircularProgressIndicator()),
      );
    }

    if (_token == null || _token!.isEmpty) {
      return const AdminLoginPage();
    }

    return AdminDashboardPage(token: _token!);
  }
}

class AdminLoginPage extends StatefulWidget {
  const AdminLoginPage({super.key});

  @override
  State<AdminLoginPage> createState() => _AdminLoginPageState();
}

class _AdminLoginPageState extends State<AdminLoginPage> {
  final _api = const AdminApiService();
  final _session = AdminSessionStorage();

  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();

  bool _loading = false;
  String? _error;

  @override
  void dispose() {
    _emailController.dispose();
    _passwordController.dispose();
    super.dispose();
  }

  Future<void> _login() async {
    final email = _emailController.text.trim();
    final password = _passwordController.text;

    if (email.isEmpty || password.isEmpty) {
      setState(() => _error = 'أدخل البريد الإلكتروني وكلمة المرور');
      return;
    }

    setState(() {
      _loading = true;
      _error = null;
    });

    try {
      final data = await _api.login(email: email, password: password);

      final token = data['token'] ??
          data['access_token'] ??
          data['data']?['token'] ??
          data['data']?['access_token'];

      if (token == null || token.toString().isEmpty) {
        throw AdminApiException(
          'تم تسجيل الدخول لكن لم يرجع API أي token. راجع مسار تسجيل الدخول.',
        );
      }

      await _session.saveSession(token: token.toString(), email: email);

      if (!mounted) return;
      Navigator.of(context).pushReplacement(
        MaterialPageRoute(
          builder: (_) => AdminDashboardPage(token: token.toString()),
        ),
      );
    } catch (e) {
      setState(() => _error = e.toString());
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Directionality(
      textDirection: TextDirection.rtl,
      child: Scaffold(
        appBar: AppBar(title: const Text('دخول الإدارة')),
        body: ListView(
          padding: const EdgeInsets.all(20),
          children: [
            const SizedBox(height: 20),
            const Icon(Icons.admin_panel_settings, size: 72),
            const SizedBox(height: 20),
            TextField(
              controller: _emailController,
              keyboardType: TextInputType.emailAddress,
              textInputAction: TextInputAction.next,
              decoration: const InputDecoration(
                labelText: 'البريد الإلكتروني',
                border: OutlineInputBorder(),
              ),
            ),
            const SizedBox(height: 14),
            TextField(
              controller: _passwordController,
              obscureText: true,
              textInputAction: TextInputAction.done,
              onSubmitted: (_) => _login(),
              decoration: const InputDecoration(
                labelText: 'كلمة المرور',
                border: OutlineInputBorder(),
              ),
            ),
            const SizedBox(height: 18),
            if (_error != null)
              Padding(
                padding: const EdgeInsets.only(bottom: 12),
                child: Text(
                  _error!,
                  style: const TextStyle(color: Colors.red),
                  textAlign: TextAlign.center,
                ),
              ),
            FilledButton.icon(
              onPressed: _loading ? null : _login,
              icon: _loading
                  ? const SizedBox(
                      width: 18,
                      height: 18,
                      child: CircularProgressIndicator(strokeWidth: 2),
                    )
                  : const Icon(Icons.login),
              label: const Text('تسجيل الدخول'),
            ),
          ],
        ),
      ),
    );
  }
}

class AdminDashboardPage extends StatefulWidget {
  final String token;

  const AdminDashboardPage({super.key, required this.token});

  @override
  State<AdminDashboardPage> createState() => _AdminDashboardPageState();
}

class _AdminDashboardPageState extends State<AdminDashboardPage> {
  final _api = const AdminApiService();
  final _session = AdminSessionStorage();

  bool _loading = true;
  String? _error;
  Map<String, dynamic> _dashboard = {};

  @override
  void initState() {
    super.initState();
    _loadDashboard();
  }

  Future<void> _loadDashboard() async {
    setState(() {
      _loading = true;
      _error = null;
    });

    try {
      final data = await _api.dashboard(widget.token);
      if (!mounted) return;
      setState(() => _dashboard = data);
    } catch (e) {
      if (!mounted) return;
      setState(() => _error = e.toString());
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _logout() async {
    await _session.clear();
    if (!mounted) return;
    Navigator.of(context).pushAndRemoveUntil(
      MaterialPageRoute(builder: (_) => const AdminLoginPage()),
      (_) => false,
    );
  }

  int _readCount(String key1, String key2) {
    final data = _dashboard['data'];
    final value = _dashboard[key1] ?? _dashboard[key2] ?? data?[key1] ?? data?[key2];
    if (value is int) return value;
    if (value is String) return int.tryParse(value) ?? 0;
    return 0;
  }

  @override
  Widget build(BuildContext context) {
    final postsCount = _readCount('postsCount', 'posts_count');
    final categoriesCount = _readCount('categoriesCount', 'categories_count');

    return Directionality(
      textDirection: TextDirection.rtl,
      child: Scaffold(
        appBar: AppBar(
          title: const Text('لوحة الإدارة'),
          actions: [
            IconButton(
              onPressed: _loadDashboard,
              icon: const Icon(Icons.refresh),
            ),
            IconButton(
              onPressed: _logout,
              icon: const Icon(Icons.logout),
            ),
          ],
        ),
        body: _loading
            ? const Center(child: CircularProgressIndicator())
            : _error != null
                ? _AdminErrorView(message: _error!, onRetry: _loadDashboard)
                : ListView(
                    padding: const EdgeInsets.all(16),
                    children: [
                      _AdminStatCard(
                        title: 'المقالات',
                        value: postsCount.toString(),
                        icon: Icons.article,
                      ),
                      const SizedBox(height: 12),
                      _AdminStatCard(
                        title: 'التصنيفات',
                        value: categoriesCount.toString(),
                        icon: Icons.category,
                      ),
                      const SizedBox(height: 20),
                      _AdminActionTile(
                        title: 'إدارة المقالات',
                        subtitle: 'عرض وحذف المقالات من API الأدمن',
                        icon: Icons.article_outlined,
                        onTap: () {
                          Navigator.of(context).push(
                            MaterialPageRoute(
                              builder: (_) => AdminPostsPage(token: widget.token),
                            ),
                          );
                        },
                      ),
                      _AdminActionTile(
                        title: 'إدارة التصنيفات',
                        subtitle: 'عرض وحذف التصنيفات من API الأدمن',
                        icon: Icons.category_outlined,
                        onTap: () {
                          Navigator.of(context).push(
                            MaterialPageRoute(
                              builder: (_) => AdminCategoriesPage(token: widget.token),
                            ),
                          );
                        },
                      ),
                    ],
                  ),
      ),
    );
  }
}

class AdminPostsPage extends StatefulWidget {
  final String token;

  const AdminPostsPage({super.key, required this.token});

  @override
  State<AdminPostsPage> createState() => _AdminPostsPageState();
}

class _AdminPostsPageState extends State<AdminPostsPage> {
  final _api = const AdminApiService();
  bool _loading = true;
  String? _error;
  List<dynamic> _items = [];

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() {
      _loading = true;
      _error = null;
    });

    try {
      final items = await _api.posts(widget.token);
      if (!mounted) return;
      setState(() => _items = items);
    } catch (e) {
      if (!mounted) return;
      setState(() => _error = e.toString());
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  String _titleOf(dynamic item) {
    if (item is Map) {
      return (item['title'] ?? item['name'] ?? item['slug'] ?? item['id'] ?? 'بدون عنوان').toString();
    }
    return item.toString();
  }

  String _idOf(dynamic item) {
    if (item is Map) {
      return (item['id'] ?? item['_id'] ?? item['slug'] ?? '').toString();
    }
    return '';
  }

  Future<void> _delete(dynamic item) async {
    final id = _idOf(item);
    if (id.isEmpty) return;

    final ok = await showDialog<bool>(
      context: context,
      builder: (_) => AlertDialog(
        title: const Text('حذف المقال؟'),
        content: Text(_titleOf(item)),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context, false), child: const Text('إلغاء')),
          FilledButton(onPressed: () => Navigator.pop(context, true), child: const Text('حذف')),
        ],
      ),
    );

    if (ok != true) return;

    try {
      await _api.deletePost(widget.token, id);
      await _load();
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(e.toString())));
    }
  }

  @override
  Widget build(BuildContext context) {
    return _AdminListScaffold(
      title: 'إدارة المقالات',
      loading: _loading,
      error: _error,
      onRetry: _load,
      itemCount: _items.length,
      itemBuilder: (context, index) {
        final item = _items[index];
        return ListTile(
          title: Text(_titleOf(item)),
          subtitle: Text(_idOf(item)),
          leading: const Icon(Icons.article_outlined),
          trailing: IconButton(
            icon: const Icon(Icons.delete_outline),
            onPressed: () => _delete(item),
          ),
        );
      },
    );
  }
}

class AdminCategoriesPage extends StatefulWidget {
  final String token;

  const AdminCategoriesPage({super.key, required this.token});

  @override
  State<AdminCategoriesPage> createState() => _AdminCategoriesPageState();
}

class _AdminCategoriesPageState extends State<AdminCategoriesPage> {
  final _api = const AdminApiService();
  bool _loading = true;
  String? _error;
  List<dynamic> _items = [];

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() {
      _loading = true;
      _error = null;
    });

    try {
      final items = await _api.categories(widget.token);
      if (!mounted) return;
      setState(() => _items = items);
    } catch (e) {
      if (!mounted) return;
      setState(() => _error = e.toString());
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  String _titleOf(dynamic item) {
    if (item is Map) {
      return (item['name'] ?? item['title'] ?? item['slug'] ?? item['id'] ?? 'تصنيف').toString();
    }
    return item.toString();
  }

  String _idOf(dynamic item) {
    if (item is Map) {
      return (item['id'] ?? item['_id'] ?? item['slug'] ?? '').toString();
    }
    return '';
  }

  Future<void> _delete(dynamic item) async {
    final id = _idOf(item);
    if (id.isEmpty) return;

    final ok = await showDialog<bool>(
      context: context,
      builder: (_) => AlertDialog(
        title: const Text('حذف التصنيف؟'),
        content: Text(_titleOf(item)),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context, false), child: const Text('إلغاء')),
          FilledButton(onPressed: () => Navigator.pop(context, true), child: const Text('حذف')),
        ],
      ),
    );

    if (ok != true) return;

    try {
      await _api.deleteCategory(widget.token, id);
      await _load();
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar

cat > try_patch_admin_button.sh <<'EOF'
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
