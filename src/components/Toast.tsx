import { CheckCircle2 } from 'lucide-react-native';
import { StyleSheet, Text, View } from 'react-native';
import { colors, fonts, shadows } from '@/constants/theme';
import { useInventory } from '@/context/InventoryContext';

export function Toast() {
  const { toast } = useInventory();
  if (!toast) return null;
  return (
    <View style={styles.container} pointerEvents="none">
      <View style={styles.toast}>
        <CheckCircle2 size={19} color={colors.accent} />
        <Text style={styles.text} numberOfLines={2}>{toast}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { position: 'absolute', left: 20, right: 20, bottom: 104, alignItems: 'center', zIndex: 100 },
  toast: { maxWidth: 410, backgroundColor: colors.ink, borderRadius: 17, paddingHorizontal: 17, paddingVertical: 13, flexDirection: 'row', alignItems: 'center', gap: 10, ...shadows.floating },
  text: { flexShrink: 1, fontFamily: fonts.semibold, fontSize: 12, lineHeight: 18, color: colors.white },
});
