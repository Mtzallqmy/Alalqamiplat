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
