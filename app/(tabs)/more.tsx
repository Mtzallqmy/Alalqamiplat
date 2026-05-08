import { ScrollView, Text, View, TouchableOpacity, ActivityIndicator, Linking, Alert } from 'react-native';
import { useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import { ScreenContainer } from '@/components/screen-container';
import { useColors } from '@/hooks/use-colors';
import { getSettings, Settings, SITE_BASE } from '@/src/api/public';
import { Image } from 'expo-image';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useAuth } from '@/src/auth/context';
import { useThemeContext } from '@/lib/theme-provider';

const ABOUT_TEXT =
  'منصة معتز العلقمي، كاتب وصيدلاني يمني، مهتم بالمحتوى الصيدلاني، والتقني والثقافي المتنوع، وهذه أحد مساحاتي وأماكني التي بدأت بممارسة شغفي فيها.';

function normalizeUrl(url?: string) {
  if (!url) return undefined;
  if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('mailto:')) return url;
  return `https://${url}`;
}

export default function MoreScreen() {
  const colors = useColors();
  const router = useRouter();
  const { token } = useAuth();
  const { colorScheme, setColorScheme } = useThemeContext();

  const [settings, setSettings] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(true);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const data = await getSettings();
      setSettings(data);
    } catch (err) {
      console.error('Error loading settings:', err);
      setSettings({});
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSettings();
  }, []);

  const openLink = async (url?: string) => {
    const target = normalizeUrl(url);
    if (!target) return;
    const supported = await Linking.canOpenURL(target).catch(() => false);
    if (supported) Linking.openURL(target);
    else Alert.alert('تنبيه', 'تعذر فتح الرابط.');
  };

  const siteName = settings?.siteName || 'معتز العلقمي';
  const logo = settings?.logo ? (settings.logo.startsWith('/') ? `${SITE_BASE}${settings.logo}` : settings.logo) : undefined;

  if (loading) {
    return (
      <ScreenContainer className="flex items-center justify-center">
        <ActivityIndicator size="large" color={colors.primary} />
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
        <View className="px-4 py-6 border-b border-border mb-6">
          <Text className="text-2xl font-bold text-foreground text-right" style={{ fontFamily: 'Tajawal-Bold' }}>المزيد</Text>
        </View>

        <View className="items-center mb-8 px-4">
          <View className="w-24 h-24 bg-surface rounded-3xl items-center justify-center border border-border shadow-sm mb-4 overflow-hidden">
            {logo ? (
              <Image source={{ uri: logo }} style={{ width: '100%', height: '100%' }} contentFit="cover" />
            ) : (
              <Text className="text-primary text-4xl font-bold" style={{ fontFamily: 'Tajawal-Bold' }}>م</Text>
            )}
          </View>
          <Text className="text-xl font-bold text-foreground text-center" style={{ fontFamily: 'Tajawal-Bold' }}>{siteName}</Text>
          <Text className="text-muted text-center mt-2 leading-6" style={{ fontFamily: 'Tajawal-Regular' }}>
            {settings?.siteDescription || 'مقالات وقصص وإلهام'}
          </Text>
        </View>

        <View className="px-4">
          <Text className="text-right text-muted mb-3 mr-2" style={{ fontFamily: 'Tajawal-Bold' }}>روابط مهمة</Text>
          <View className="bg-surface border border-border rounded-2xl overflow-hidden mb-6">
            <MenuRow title="الموقع الرسمي" subtitle={SITE_BASE} icon="globe" color={colors.primary} onPress={() => openLink(SITE_BASE)} />
            <MenuRow title="الخصوصية" subtitle="سياسة خصوصية التطبيق والمنصة" icon="lock.shield.fill" color={colors.primary} onPress={() => openLink(settings?.privacyUrl || `${SITE_BASE}/privacy`)} />
          </View>

          <Text className="text-right text-muted mb-3 mr-2" style={{ fontFamily: 'Tajawal-Bold' }}>من نحن</Text>
          <View className="bg-surface border border-border rounded-2xl p-4 mb-6">
            <Text className="text-foreground text-right leading-7" style={{ fontFamily: 'Tajawal-Regular' }}>
              {settings?.about || ABOUT_TEXT}
            </Text>
          </View>

          <Text className="text-right text-muted mb-3 mr-2" style={{ fontFamily: 'Tajawal-Bold' }}>تواصل معنا</Text>
          <View className="bg-surface border border-border rounded-2xl overflow-hidden mb-6">
            <MenuRow title="البريد الإلكتروني" subtitle={settings?.email || 'moataz775498320@gmail.com'} icon="envelope.fill" color={colors.primary} onPress={() => openLink(`mailto:${settings?.email || 'moataz775498320@gmail.com'}`)} />
            <MenuRow title="فيسبوك" icon="person.2.fill" color="#1877F2" onPress={() => openLink(settings?.facebook || 'https://www.facebook.com/moataz77549')} />
            <MenuRow title="إنستغرام" icon="camera.fill" color="#C13584" onPress={() => openLink(settings?.instagram || 'https://www.instagram.com/Moataz77549')} />
            <MenuRow title="تويتر / X" icon="paperplane.fill" color={colors.foreground} onPress={() => openLink(settings?.twitter || 'https://x.com/Moataz77549')} last />
          </View>

          <Text className="text-right text-muted mb-3 mr-2" style={{ fontFamily: 'Tajawal-Bold' }}>المظهر</Text>
          <View className="bg-surface border border-border rounded-2xl overflow-hidden mb-6">
            <MenuRow
              title={colorScheme === 'dark' ? 'الوضع الفاتح' : 'الوضع الليلي'}
              subtitle="تغيير ألوان التطبيق بما يناسب القراءة"
              icon="moon.fill"
              color={colors.primary}
              onPress={() => setColorScheme(colorScheme === 'dark' ? 'light' : 'dark')}
              last
            />
          </View>

          <Text className="text-right text-muted mb-3 mr-2" style={{ fontFamily: 'Tajawal-Bold' }}>الإدارة</Text>
          <View className="bg-surface border border-border rounded-2xl overflow-hidden mb-6">
            <MenuRow
              title="لوحة التحكم"
              subtitle={token ? 'إدارة المقالات والإحصائيات' : 'تسجيل الدخول للمشرفين فقط'}
              icon="lock.fill"
              color="#F59E0B"
              onPress={() => router.push(token ? '/admin/dashboard' : '/admin/login')}
              last
            />
          </View>

          <View className="bg-surface border border-border rounded-2xl p-4">
            <Text className="text-muted text-center text-xs" style={{ fontFamily: 'Tajawal-Regular' }}>
              الإصدار 1.0.0 — جميع الحقوق محفوظة © {new Date().getFullYear()} معتز العلقمي
            </Text>
          </View>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}

function MenuRow({
  title,
  subtitle,
  icon,
  color,
  onPress,
  last,
}: {
  title: string;
  subtitle?: string;
  icon: any;
  color: string;
  onPress: () => void;
  last?: boolean;
}) {
  return (
    <TouchableOpacity onPress={onPress} className={`flex-row-reverse items-center p-4 ${last ? '' : 'border-b border-border'}`}>
      <View className="w-10 h-10 rounded-full items-center justify-center" style={{ backgroundColor: `${color}1A` }}>
        <IconSymbol name={icon} size={20} color={color} />
      </View>
      <View className="flex-1 mr-4">
        <Text className="text-foreground text-right" style={{ fontFamily: 'Tajawal-Bold' }}>{title}</Text>
        {subtitle ? <Text className="text-muted text-right text-xs mt-1" style={{ fontFamily: 'Tajawal-Regular' }}>{subtitle}</Text> : null}
      </View>
      <IconSymbol name="chevron.left" size={18} color="#999" />
    </TouchableOpacity>
  );
}
