import 'package:flutter/material.dart';

class AdminEntryButton extends StatelessWidget {
  const AdminEntryButton({super.key});

  @override
  Widget build(BuildContext context) {
    return ListTile(
      leading: const Icon(Icons.admin_panel_settings_outlined),
      title: const Text('لوحة الإدارة'),
      subtitle: const Text('دخول الأدمن وإدارة المحتوى'),
      trailing: const Icon(Icons.chevron_left),
      onTap: () {
        Navigator.of(context).push(
          MaterialPageRoute(builder: (_) => const AdminLoginPage()),
        );
      },
    );
  }
}

class AdminLoginPage extends StatelessWidget {
  const AdminLoginPage({super.key});

  @override
  Widget build(BuildContext context) {
    return Directionality(
      textDirection: TextDirection.rtl,
      child: Scaffold(
        appBar: AppBar(title: const Text('دخول الإدارة')),
        body: const Center(
          child: Padding(
            padding: EdgeInsets.all(24),
            child: Text(
              'قسم الإدارة جاهز. سيتم ربط تسجيل الدخول مع API الأدمن بعد نجاح بناء APK.',
              textAlign: TextAlign.center,
            ),
          ),
        ),
      ),
    );
  }
}
