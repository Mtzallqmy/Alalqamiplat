// Fallback for using MaterialIcons on Android and web.
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { SymbolWeight } from 'expo-symbols';
import { ComponentProps } from 'react';
import { OpaqueColorValue, type StyleProp, type TextStyle } from 'react-native';

type MaterialName = ComponentProps<typeof MaterialIcons>['name'];
type IconMapping = Record<string, MaterialName>;

const MAPPING: IconMapping = {
  'house.fill': 'home',
  'paperplane.fill': 'send',
  'chevron.left.forwardslash.chevron.right': 'code',
  'chevron.right': 'chevron-right',
  'chevron.left': 'chevron-left',
  'list.bullet': 'list',
  magnifyingglass: 'search',
  'heart.fill': 'favorite',
  heart: 'favorite-border',
  ellipsis: 'more-horiz',
  'rectangle.portrait.and.arrow.right': 'logout',
  'doc.text': 'article',
  plus: 'add',
  'square.and.arrow.up': 'share',
  globe: 'language',
  'lock.shield.fill': 'security',
  'lock.fill': 'lock',
  'envelope.fill': 'email',
  'person.2.fill': 'groups',
  'camera.fill': 'photo-camera',
  'moon.fill': 'dark-mode',
  'info.circle.fill': 'info',
  folder: 'folder',
  tag: 'sell',
};

export function IconSymbol({
  name,
  size = 24,
  color,
  style,
}: {
  name: string;
  size?: number;
  color: string | OpaqueColorValue;
  style?: StyleProp<TextStyle>;
  weight?: SymbolWeight;
}) {
  return <MaterialIcons color={color} size={size} name={MAPPING[name] ?? 'help-outline'} style={style} />;
}
