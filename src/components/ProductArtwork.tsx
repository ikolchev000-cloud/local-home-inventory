import { Beef, Coffee, Cookie, Croissant, IceCreamBowl, Milk, Package, Salad } from 'lucide-react-native';
import { View } from 'react-native';
import type { LucideIcon } from 'lucide-react-native';
import { categories } from '@/data/catalog';
import type { CategoryId } from '@/types/inventory';

const icons: Record<CategoryId, LucideIcon> = {
  dairy: Milk,
  produce: Salad,
  meat: Beef,
  frozen: IceCreamBowl,
  pantry: Package,
  drinks: Coffee,
  bakery: Croissant,
  other: Cookie,
};

export function ProductArtwork({ category, size = 54 }: { category: CategoryId; size?: number }) {
  const Icon = icons[category];
  const palette = categories[category];
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size * 0.3,
        backgroundColor: palette.background,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Icon size={size * 0.44} color={palette.color} strokeWidth={1.7} />
    </View>
  );
}
