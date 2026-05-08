import 'dart:async';
import 'dart:convert';

import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:flutter_html/flutter_html.dart';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';
import 'package:url_launcher/url_launcher.dart';

const String siteBase = String.fromEnvironment(
  'SITE_BASE_URL',
  defaultValue: 'https://moatazalalqami.online',
);
const String apiBase = String.fromEnvironment(
  'API_BASE_URL',
  defaultValue: '$siteBase/api/public',
);

void main() {
  WidgetsFlutterBinding.ensureInitialized();
  runApp(const MoatazApp());
}

class MoatazApp extends StatelessWidget {
  const MoatazApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'معتز العلقمي',
      debugShowCheckedModeBanner: false,
      locale: const Locale('ar'),
      theme: ThemeData(
        useMaterial3: true,
        fontFamily: 'Tajawal',
        colorScheme: ColorScheme.fromSeed(
          seedColor: const Color(0xFF12664F),
          primary: const Color(0xFF12664F),
          secondary: const Color(0xFFC99700),
          surface: const Color(0xFFFFFBF4),
        ),
        scaffoldBackgroundColor: const Color(0xFFFFFBF4),
        appBarTheme: const AppBarTheme(
          centerTitle: true,
          backgroundColor: Color(0xFFFFFBF4),
          surfaceTintColor: Colors.transparent,
          titleTextStyle: TextStyle(
            fontFamily: 'Tajawal',
            color: Color(0xFF1E1A13),
            fontWeight: FontWeight.w700,
            fontSize: 19,
          ),
        ),
        cardTheme: CardThemeData(
          elevation: 0,
          color: Colors.white,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(22)),
        ),
      ),
      home: const Directionality(
        textDirection: TextDirection.rtl,
        child: MainShell(),
      ),
    );
  }
}

class ApiClient {
  static const Duration cacheDuration = Duration(minutes: 5);

  static Future<dynamic> getJson(String endpoint, String cacheKey, {bool staleOnError = true}) async {
    final prefs = await SharedPreferences.getInstance();
    final cached = prefs.getString(cacheKey);
    if (cached != null) {
      final entry = jsonDecode(cached) as Map<String, dynamic>;
      final time = DateTime.tryParse(entry['timestamp']?.toString() ?? '');
      if (time != null && DateTime.now().difference(time) < cacheDuration) {
        return entry['data'];
      }
    }

    try {
      final uri = Uri.parse('$apiBase$endpoint');
      final response = await http.get(uri, headers: const {'Accept': 'application/json'}).timeout(const Duration(seconds: 25));
      final decoded = jsonDecode(response.body);
      if (response.statusCode < 200 || response.statusCode >= 300 || decoded is Map && decoded['success'] == false) {
        throw Exception(decoded is Map ? (decoded['error'] ?? decoded['message'] ?? 'API Error') : 'API Error');
      }
      final data = decoded is Map && decoded.containsKey('data') ? decoded['data'] : decoded;
      await prefs.setString(cacheKey, jsonEncode({'timestamp': DateTime.now().toIso8601String(), 'data': data}));
      return data;
    } catch (_) {
      if (staleOnError && cached != null) {
        final entry = jsonDecode(cached) as Map<String, dynamic>;
        return entry['data'];
      }
      rethrow;
    }
  }
}

String? normalizeUrl(dynamic value) {
  final text = value?.toString().trim();
  if (text == null || text.isEmpty) return null;
  if (text.startsWith('http://') || text.startsWith('https://')) return text;
  if (text.startsWith('/')) return '$siteBase$text';
  return '$siteBase/$text';
}

String stripHtml(String html) {
  return html
      .replaceAll(RegExp(r'<[^>]*>'), ' ')
      .replaceAll('&nbsp;', ' ')
      .replaceAll('&amp;', '&')
      .replaceAll('&quot;', '"')
      .replaceAll(RegExp(r'\s+'), ' ')
      .trim();
}

int readingTime(String text) {
  final words = stripHtml(text).split(RegExp(r'\s+')).where((w) => w.isNotEmpty).length;
  return words == 0 ? 1 : (words / 180).ceil();
}

class Author {
  final String name;
  final String? avatar;
  const Author({required this.name, this.avatar});

  factory Author.fromJson(Map<String, dynamic>? json) {
    if (json == null) return const Author(name: 'معتز العلقمي');
    return Author(
      name: json['name']?.toString().trim().isNotEmpty == true ? json['name'].toString() : 'معتز العلقمي',
      avatar: normalizeUrl(json['avatar'] ?? json['image']),
    );
  }
}

class CategoryItem {
  final String id;
  final String name;
  final String slug;
  final String? description;
  final int count;
  const CategoryItem({required this.id, required this.name, required this.slug, this.description, this.count = 0});

  factory CategoryItem.fromJson(Map<String, dynamic> json) {
    return CategoryItem(
      id: json['id']?.toString() ?? json['slug']?.toString() ?? '',
      name: json['name']?.toString() ?? 'تصنيف',
      slug: json['slug']?.toString() ?? '',
      description: json['description']?.toString(),
      count: int.tryParse(json['count']?.toString() ?? '') ?? 0,
    );
  }
}

class Post {
  final String id;
  final String slug;
  final String title;
  final String excerpt;
  final String content;
  final String? coverImage;
  final String? publishedAt;
  final int views;
  final int minutes;
  final Author author;
  final CategoryItem? category;

  const Post({
    required this.id,
    required this.slug,
    required this.title,
    required this.excerpt,
    required this.content,
    this.coverImage,
    this.publishedAt,
    this.views = 0,
    this.minutes = 1,
    required this.author,
    this.category,
  });

  factory Post.fromJson(Map<String, dynamic> json) {
    final content = json['content']?.toString() ?? '';
    final rawExcerpt = json['excerpt']?.toString();
    return Post(
      id: json['id']?.toString() ?? json['slug']?.toString() ?? '',
      slug: json['slug']?.toString() ?? '',
      title: json['title']?.toString().trim().isNotEmpty == true ? json['title'].toString() : 'بدون عنوان',
      excerpt: rawExcerpt?.trim().isNotEmpty == true ? stripHtml(rawExcerpt!) : stripHtml(content).characters.take(150).toString(),
      content: content,
      coverImage: normalizeUrl(json['coverImage'] ?? json['image'] ?? json['cover']),
      publishedAt: json['publishedAt']?.toString(),
      views: int.tryParse(json['views']?.toString() ?? '') ?? 0,
      minutes: int.tryParse(json['readingTime']?.toString() ?? '') ?? readingTime(content.isNotEmpty ? content : (rawExcerpt ?? '')),
      author: Author.fromJson(json['author'] is Map ? Map<String, dynamic>.from(json['author']) : null),
      category: json['category'] is Map ? CategoryItem.fromJson(Map<String, dynamic>.from(json['category'])) : null,
    );
  }
}

class PublicApi {
  static List<Post> _postsFrom(dynamic data) {
    final items = data is List ? data : data is Map ? (data['items'] as List? ?? const []) : const [];
    return items.map((e) => Post.fromJson(Map<String, dynamic>.from(e as Map))).toList();
  }

  static Future<List<Post>> posts({int page = 1, int limit = 12}) async {
    final data = await ApiClient.getJson('/posts?page=$page&limit=$limit', 'posts_${page}_$limit');
    return _postsFrom(data);
  }

  static Future<Post> post(String slug) async {
    final data = await ApiClient.getJson('/posts/$slug', 'post_$slug');
    final postData = data is Map && data['post'] is Map ? data['post'] : data;
    return Post.fromJson(Map<String, dynamic>.from(postData as Map));
  }

  static Future<List<CategoryItem>> categories() async {
    final data = await ApiClient.getJson('/categories', 'categories');
    final items = data is List ? data : data is Map ? (data['items'] as List? ?? const []) : const [];
    return items.map((e) => CategoryItem.fromJson(Map<String, dynamic>.from(e as Map))).toList();
  }

  static Future<List<Post>> postsByCategory(String slug) async {
    final data = await ApiClient.getJson('/posts?category=${Uri.encodeComponent(slug)}&page=1&limit=30', 'cat_$slug');
    return _postsFrom(data);
  }

  static Future<List<Post>> search(String query) async {
    if (query.trim().isEmpty) return [];
    final data = await ApiClient.getJson('/search?q=${Uri.encodeComponent(query.trim())}', 'search_${query.trim()}');
    return _postsFrom(data);
  }
}

class FavoritesStore {
  static const key = 'favorite_posts';

  static Future<List<String>> ids() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getStringList(key) ?? [];
  }

  static Future<bool> has(String slug) async => (await ids()).contains(slug);

  static Future<void> toggle(String slug) async {
    final prefs = await SharedPreferences.getInstance();
    final current = prefs.getStringList(key) ?? [];
    current.contains(slug) ? current.remove(slug) : current.add(slug);
    await prefs.setStringList(key, current);
  }
}

class MainShell extends StatefulWidget {
  const MainShell({super.key});

  @override
  State<MainShell> createState() => _MainShellState();
}

class _MainShellState extends State<MainShell> {
  int index = 0;
  final pages = const [HomePage(), PostsPage(), CategoriesPage(), SearchPage(), FavoritesPage(), MorePage()];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: pages[index],
      bottomNavigationBar: NavigationBar(
        selectedIndex: index,
        onDestinationSelected: (value) => setState(() => index = value),
        labelBehavior: NavigationDestinationLabelBehavior.alwaysShow,
        destinations: const [
          NavigationDestination(icon: Icon(Icons.home_outlined), selectedIcon: Icon(Icons.home), label: 'الرئيسية'),
          NavigationDestination(icon: Icon(Icons.article_outlined), selectedIcon: Icon(Icons.article), label: 'المقالات'),
          NavigationDestination(icon: Icon(Icons.category_outlined), selectedIcon: Icon(Icons.category), label: 'التصنيفات'),
          NavigationDestination(icon: Icon(Icons.search), label: 'البحث'),
          NavigationDestination(icon: Icon(Icons.favorite_border), selectedIcon: Icon(Icons.favorite), label: 'المفضلة'),
          NavigationDestination(icon: Icon(Icons.more_horiz), label: 'المزيد'),
        ],
      ),
    );
  }
}

class HomePage extends StatelessWidget {
  const HomePage({super.key});

  @override
  Widget build(BuildContext context) {
    return AppPage(
      title: 'معتز العلقمي',
      child: FutureBuilder<List<Post>>(
        future: PublicApi.posts(limit: 8),
        builder: (context, snapshot) {
          if (snapshot.connectionState == ConnectionState.waiting) return const LoadingView();
          if (snapshot.hasError) return ErrorView(onRetry: () => (context as Element).markNeedsBuild());
          final posts = snapshot.data ?? [];
          return RefreshIndicator(
            onRefresh: () async => (context as Element).markNeedsBuild(),
            child: ListView(
              padding: const EdgeInsets.fromLTRB(16, 8, 16, 24),
              children: [
                const HeroCard(),
                const SizedBox(height: 18),
                SectionHeader(title: 'أحدث المقالات', action: '${posts.length} مقالات'),
                const SizedBox(height: 8),
                ...posts.map((post) => PostCard(post: post)),
              ],
            ),
          );
        },
      ),
    );
  }
}

class HeroCard extends StatelessWidget {
  const HeroCard({super.key});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(22),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(28),
        gradient: const LinearGradient(colors: [Color(0xFF12664F), Color(0xFF0D3D32)]),
        boxShadow: [BoxShadow(color: Colors.black.withOpacity(.08), blurRadius: 20, offset: const Offset(0, 10))],
      ),
      child: const Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('مساحة عربية للمعرفة والإلهام', style: TextStyle(color: Color(0xFFFFE7A3), fontSize: 15, fontWeight: FontWeight.w700)),
          SizedBox(height: 10),
          Text('اقرأ أحدث المقالات والقصص والخواطر بتجربة خفيفة وسريعة.', style: TextStyle(color: Colors.white, fontSize: 24, height: 1.35, fontWeight: FontWeight.w700)),
          SizedBox(height: 12),
          Text('التطبيق يعتمد على API الموقع مباشرة مع كاش محلي لتقليل الحجم والتحميل.', style: TextStyle(color: Colors.white70, fontSize: 14, height: 1.7)),
        ],
      ),
    );
  }
}

class PostsPage extends StatelessWidget {
  const PostsPage({super.key});

  @override
  Widget build(BuildContext context) => AppPage(
        title: 'المقالات',
        child: FuturePostList(future: PublicApi.posts(limit: 30)),
      );
}

class CategoriesPage extends StatelessWidget {
  const CategoriesPage({super.key});

  @override
  Widget build(BuildContext context) {
    return AppPage(
      title: 'التصنيفات',
      child: FutureBuilder<List<CategoryItem>>(
        future: PublicApi.categories(),
        builder: (context, snapshot) {
          if (snapshot.connectionState == ConnectionState.waiting) return const LoadingView();
          if (snapshot.hasError) return ErrorView(onRetry: () => (context as Element).markNeedsBuild());
          final categories = snapshot.data ?? [];
          if (categories.isEmpty) return const EmptyView(text: 'لا توجد تصنيفات بعد');
          return ListView.separated(
            padding: const EdgeInsets.all(16),
            itemCount: categories.length,
            separatorBuilder: (_, __) => const SizedBox(height: 10),
            itemBuilder: (context, i) => CategoryTile(category: categories[i]),
          );
        },
      ),
    );
  }
}

class CategoryTile extends StatelessWidget {
  final CategoryItem category;
  const CategoryTile({super.key, required this.category});

  @override
  Widget build(BuildContext context) {
    return Card(
      child: ListTile(
        contentPadding: const EdgeInsets.symmetric(horizontal: 18, vertical: 10),
        leading: CircleAvatar(backgroundColor: const Color(0xFFE9F4EF), child: Text(category.name.characters.take(1).toString(), style: const TextStyle(color: Color(0xFF12664F), fontWeight: FontWeight.w700))),
        title: Text(category.name, style: const TextStyle(fontWeight: FontWeight.w700)),
        subtitle: Text(category.description?.isNotEmpty == true ? category.description! : 'مقالات هذا التصنيف'),
        trailing: const Icon(Icons.chevron_left),
        onTap: () => Navigator.of(context).push(MaterialPageRoute(builder: (_) => Directionality(textDirection: TextDirection.rtl, child: CategoryPostsPage(category: category)))),
      ),
    );
  }
}

class CategoryPostsPage extends StatelessWidget {
  final CategoryItem category;
  const CategoryPostsPage({super.key, required this.category});

  @override
  Widget build(BuildContext context) => AppPage(
        title: category.name,
        child: FuturePostList(future: PublicApi.postsByCategory(category.slug)),
      );
}

class SearchPage extends StatefulWidget {
  const SearchPage({super.key});

  @override
  State<SearchPage> createState() => _SearchPageState();
}

class _SearchPageState extends State<SearchPage> {
  final controller = TextEditingController();
  Future<List<Post>>? future;

  @override
  Widget build(BuildContext context) {
    return AppPage(
      title: 'البحث',
      child: Column(
        children: [
          Padding(
            padding: const EdgeInsets.all(16),
            child: TextField(
              controller: controller,
              textInputAction: TextInputAction.search,
              decoration: InputDecoration(
                hintText: 'ابحث عن مقال...',
                prefixIcon: const Icon(Icons.search),
                filled: true,
                fillColor: Colors.white,
                border: OutlineInputBorder(borderRadius: BorderRadius.circular(20), borderSide: BorderSide.none),
              ),
              onSubmitted: (value) => setState(() => future = PublicApi.search(value)),
            ),
          ),
          Expanded(child: future == null ? const EmptyView(text: 'اكتب كلمة واضغط بحث') : FuturePostList(future: future!)),
        ],
      ),
    );
  }
}

class FavoritesPage extends StatefulWidget {
  const FavoritesPage({super.key});

  @override
  State<FavoritesPage> createState() => _FavoritesPageState();
}

class _FavoritesPageState extends State<FavoritesPage> {
  Future<List<Post>> load() async {
    final ids = await FavoritesStore.ids();
    final posts = <Post>[];
    for (final slug in ids.reversed) {
      try {
        posts.add(await PublicApi.post(slug));
      } catch (_) {}
    }
    return posts;
  }

  @override
  Widget build(BuildContext context) => AppPage(
        title: 'المفضلة',
        child: FuturePostList(future: load(), emptyText: 'لم تضف أي مقال إلى المفضلة بعد'),
      );
}

class MorePage extends StatelessWidget {
  const MorePage({super.key});

  @override
  Widget build(BuildContext context) {
    return AppPage(
      title: 'المزيد',
      child: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          const HeroCard(),
          const SizedBox(height: 16),
          MoreTile(icon: Icons.language, title: 'زيارة الموقع', url: siteBase),
          MoreTile(icon: Icons.privacy_tip_outlined, title: 'سياسة الخصوصية', url: '$siteBase/privacy'),
          MoreTile(icon: Icons.facebook, title: 'Facebook', url: 'https://www.facebook.com/moataz77549'),
          MoreTile(icon: Icons.alternate_email, title: 'X / Twitter', url: 'https://x.com/Moataz77549'),
          MoreTile(icon: Icons.camera_alt_outlined, title: 'Instagram', url: 'https://www.instagram.com/Moataz77549'),
          const SizedBox(height: 16),
          const Text('جميع الحقوق محفوظة لدى معتز العلقمي 2026', textAlign: TextAlign.center, style: TextStyle(color: Colors.black54)),
        ],
      ),
    );
  }
}

class MoreTile extends StatelessWidget {
  final IconData icon;
  final String title;
  final String url;
  const MoreTile({super.key, required this.icon, required this.title, required this.url});

  @override
  Widget build(BuildContext context) => Card(
        child: ListTile(
          leading: Icon(icon, color: const Color(0xFF12664F)),
          title: Text(title, style: const TextStyle(fontWeight: FontWeight.w700)),
          trailing: const Icon(Icons.open_in_new),
          onTap: () => launchUrl(Uri.parse(url), mode: LaunchMode.externalApplication),
        ),
      );
}

class FuturePostList extends StatelessWidget {
  final Future<List<Post>> future;
  final String emptyText;
  const FuturePostList({super.key, required this.future, this.emptyText = 'لا توجد مقالات'});

  @override
  Widget build(BuildContext context) {
    return FutureBuilder<List<Post>>(
      future: future,
      builder: (context, snapshot) {
        if (snapshot.connectionState == ConnectionState.waiting) return const LoadingView();
        if (snapshot.hasError) return ErrorView(onRetry: () => (context as Element).markNeedsBuild());
        final posts = snapshot.data ?? [];
        if (posts.isEmpty) return EmptyView(text: emptyText);
        return ListView.builder(
          padding: const EdgeInsets.all(16),
          itemCount: posts.length,
          itemBuilder: (_, i) => PostCard(post: posts[i]),
        );
      },
    );
  }
}

class PostCard extends StatelessWidget {
  final Post post;
  const PostCard({super.key, required this.post});

  @override
  Widget build(BuildContext context) {
    return Card(
      margin: const EdgeInsets.only(bottom: 14),
      child: InkWell(
        borderRadius: BorderRadius.circular(22),
        onTap: () => Navigator.of(context).push(MaterialPageRoute(builder: (_) => Directionality(textDirection: TextDirection.rtl, child: PostDetailsPage(slug: post.slug)))),
        child: Padding(
          padding: const EdgeInsets.all(12),
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              ClipRRect(
                borderRadius: BorderRadius.circular(18),
                child: SizedBox(
                  width: 96,
                  height: 96,
                  child: post.coverImage == null
                      ? Container(color: const Color(0xFFE9F4EF), child: const Icon(Icons.article, color: Color(0xFF12664F)))
                      : CachedNetworkImage(imageUrl: post.coverImage!, fit: BoxFit.cover, errorWidget: (_, __, ___) => const Icon(Icons.article)),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(post.title, maxLines: 2, overflow: TextOverflow.ellipsis, style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w700, height: 1.4)),
                    const SizedBox(height: 8),
                    Text(post.excerpt, maxLines: 2, overflow: TextOverflow.ellipsis, style: const TextStyle(color: Colors.black54, height: 1.5)),
                    const SizedBox(height: 8),
                    Row(children: [
                      const Icon(Icons.schedule, size: 15, color: Colors.black45),
                      const SizedBox(width: 4),
                      Text('${post.minutes} د قراءة', style: const TextStyle(color: Colors.black45, fontSize: 12)),
                      const Spacer(),
                      if (post.category != null) Text(post.category!.name, style: const TextStyle(color: Color(0xFFC99700), fontWeight: FontWeight.w700, fontSize: 12)),
                    ]),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class PostDetailsPage extends StatefulWidget {
  final String slug;
  const PostDetailsPage({super.key, required this.slug});

  @override
  State<PostDetailsPage> createState() => _PostDetailsPageState();
}

class _PostDetailsPageState extends State<PostDetailsPage> {
  late Future<Post> future;
  bool fav = false;

  @override
  void initState() {
    super.initState();
    future = PublicApi.post(widget.slug);
    FavoritesStore.has(widget.slug).then((value) => mounted ? setState(() => fav = value) : null);
  }

  @override
  Widget build(BuildContext context) {
    return AppPage(
      title: 'المقال',
      actions: [
        IconButton(
          onPressed: () async {
            await FavoritesStore.toggle(widget.slug);
            final value = await FavoritesStore.has(widget.slug);
            setState(() => fav = value);
          },
          icon: Icon(fav ? Icons.favorite : Icons.favorite_border, color: fav ? Colors.red : null),
        ),
      ],
      child: FutureBuilder<Post>(
        future: future,
        builder: (context, snapshot) {
          if (snapshot.connectionState == ConnectionState.waiting) return const LoadingView();
          if (snapshot.hasError) return ErrorView(onRetry: () => setState(() => future = PublicApi.post(widget.slug)));
          final post = snapshot.data!;
          return ListView(
            padding: const EdgeInsets.fromLTRB(16, 8, 16, 28),
            children: [
              if (post.coverImage != null)
                ClipRRect(
                  borderRadius: BorderRadius.circular(26),
                  child: CachedNetworkImage(imageUrl: post.coverImage!, height: 220, fit: BoxFit.cover),
                ),
              const SizedBox(height: 18),
              Text(post.title, style: const TextStyle(fontSize: 26, height: 1.35, fontWeight: FontWeight.w700)),
              const SizedBox(height: 10),
              Row(children: [
                const Icon(Icons.person_outline, size: 18, color: Colors.black45),
                const SizedBox(width: 4),
                Text(post.author.name, style: const TextStyle(color: Colors.black54)),
                const SizedBox(width: 12),
                const Icon(Icons.schedule, size: 18, color: Colors.black45),
                const SizedBox(width: 4),
                Text('${post.minutes} د قراءة', style: const TextStyle(color: Colors.black54)),
              ]),
              const SizedBox(height: 16),
              Html(
                data: post.content,
                style: {
                  'body': Style(fontFamily: 'Tajawal', fontSize: FontSize(17), lineHeight: const LineHeight(1.9), color: const Color(0xFF242018), margin: Margins.zero, padding: HtmlPaddings.zero),
                  'p': Style(margin: Margins.only(bottom: 14)),
                  'h1': Style(fontSize: FontSize(26), fontWeight: FontWeight.bold),
                  'h2': Style(fontSize: FontSize(23), fontWeight: FontWeight.bold),
                  'blockquote': Style(backgroundColor: const Color(0xFFFFF4D8), padding: HtmlPaddings.all(14), border: const Border(right: BorderSide(color: Color(0xFFC99700), width: 4))),
                },
              ),
            ],
          );
        },
      ),
    );
  }
}

class AppPage extends StatelessWidget {
  final String title;
  final Widget child;
  final List<Widget>? actions;
  const AppPage({super.key, required this.title, required this.child, this.actions});

  @override
  Widget build(BuildContext context) {
    return Scaffold(appBar: AppBar(title: Text(title), actions: actions), body: SafeArea(top: false, child: child));
  }
}

class SectionHeader extends StatelessWidget {
  final String title;
  final String? action;
  const SectionHeader({super.key, required this.title, this.action});

  @override
  Widget build(BuildContext context) => Row(
        children: [
          Text(title, style: const TextStyle(fontSize: 20, fontWeight: FontWeight.w700)),
          const Spacer(),
          if (action != null) Text(action!, style: const TextStyle(color: Color(0xFF12664F), fontWeight: FontWeight.w700)),
        ],
      );
}

class LoadingView extends StatelessWidget {
  const LoadingView({super.key});

  @override
  Widget build(BuildContext context) => const Center(child: CircularProgressIndicator());
}

class ErrorView extends StatelessWidget {
  final VoidCallback onRetry;
  const ErrorView({super.key, required this.onRetry});

  @override
  Widget build(BuildContext context) => Center(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Icon(Icons.wifi_off, size: 48, color: Colors.black45),
              const SizedBox(height: 12),
              const Text('تعذر تحميل البيانات. تحقق من الاتصال أو من عمل API الموقع.', textAlign: TextAlign.center),
              const SizedBox(height: 12),
              FilledButton.icon(onPressed: onRetry, icon: const Icon(Icons.refresh), label: const Text('إعادة المحاولة')),
            ],
          ),
        ),
      );
}

class EmptyView extends StatelessWidget {
  final String text;
  const EmptyView({super.key, required this.text});

  @override
  Widget build(BuildContext context) => Center(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Text(text, textAlign: TextAlign.center, style: const TextStyle(color: Colors.black54)),
        ),
      );
}
