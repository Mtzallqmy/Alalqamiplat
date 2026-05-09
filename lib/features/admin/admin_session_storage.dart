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
