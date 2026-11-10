import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { CalendarDays, Check, PackagePlus, ScanLine } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { ProductArtwork } from '@/components/ProductArtwork';
import { BackButton } from '@/components/ui';
import { colors, fonts } from '@/constants/theme';
import { useInventory } from '@/context/InventoryContext';
import { categories, locations, units } from '@/data/catalog';
import type { CategoryId, LocationId, Unit } from '@/types/inventory';
import { addDays, formatInputDate, parseInputDate, toISODate } from '@/utils/date';

export default function ProductFormScreen() {
  const params = useLocalSearchParams<{ id?: string; barcode?: string; name?: string; brand?: string; category?: CategoryId }>();
  const { products, addProduct, updateProduct, showToast } = useInventory();
  const existing = products.find((product) => product.id === params.id);
  const [name, setName] = useState(existing?.name ?? params.name ?? '');
  const [brand, setBrand] = useState(existing?.brand ?? params.brand ?? '');
  const [category, setCategory] = useState<CategoryId>(existing?.category ?? params.category ?? 'other');
  const [location, setLocation] = useState<LocationId>(existing?.location ?? 'fridge');
  const [quantity, setQuantity] = useState(String(existing?.quantity ?? 1));
  const [unit, setUnit] = useState<Unit>(existing?.unit ?? 'шт');
  const [minQuantity, setMinQuantity] = useState(String(existing?.minQuantity ?? 1));
  const [expiresAt, setExpiresAt] = useState(formatInputDate(existing?.expiresAt ?? toISODate(addDays(new Date(), 7))));
  const [price, setPrice] = useState(existing?.price ? String(existing.price) : '');
  const [barcode, setBarcode] = useState(existing?.barcode ?? params.barcode ?? '');
  const [note, setNote] = useState(existing?.note ?? '');
  const [error, setError] = useState('');

  function save() {
    const parsedQuantity = Number(quantity.replace(',', '.'));
    const parsedMinimum = Number(minQuantity.replace(',', '.'));
    const parsedPrice = price.trim() ? Number(price.replace(',', '.')) : undefined;
    const parsedExpiry = expiresAt.trim() ? parseInputDate(expiresAt) : null;
    if (!name.trim()) return setError('Введите название продукта.');
    if (!Number.isFinite(parsedQuantity) || parsedQuantity < 0) return setError('Укажите корректное количество.');
    if (!Number.isFinite(parsedMinimum) || parsedMinimum < 0) return setError('Укажите корректный минимальный запас.');
    if (parsedPrice !== undefined && (!Number.isFinite(parsedPrice) || parsedPrice < 0)) return setError('Проверьте цену продукта.');
    if (expiresAt.trim() && !parsedExpiry) return setError('Введите дату в формате ДД.ММ.ГГГГ.');
    const input = {
      name: name.trim(),
      brand: brand.trim() || undefined,
      category,
      location,
      quantity: parsedQuantity,
      unit,
      minQuantity: parsedMinimum,
      expiresAt: parsedExpiry,
      price: parsedPrice,
      barcode: barcode.trim() || undefined,
      note: note.trim() || undefined,
    };
    if (existing) {
      updateProduct(existing.id, input);
      showToast('Изменения сохранены');
      router.back();
    } else {
      const id = addProduct(input);
      showToast('Продукт добавлен в запасы');
      router.replace({ pathname: '/product/[id]', params: { id } });
    }
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => undefined);
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.header}>
          <BackButton />
          <Text style={styles.headerTitle}>{existing ? 'Редактирование' : 'Новый продукт'}</Text>
          <View style={{ width: 42 }} />
        </View>
        <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
          <View style={styles.intro}>
            <ProductArtwork category={category} size={66} />
            <View style={{ flex: 1 }}><Text style={styles.introTitle}>{existing ? 'Обновите детали' : 'Пополните свою полку'}</Text><Text style={styles.introText}>Только важное: количество, место и срок годности.</Text></View>
          </View>

          {params.barcode && !existing ? <View style={styles.scannedBadge}><ScanLine size={16} color={colors.green} /><Text style={styles.scannedText}>Код отсканирован: {params.barcode}</Text></View> : null}
          {error ? <View style={styles.error}><Text style={styles.errorText}>{error}</Text></View> : null}

          <Field label="Название" required><TextInput value={name} onChangeText={(value) => { setName(value); setError(''); }} placeholder="Например, молоко" placeholderTextColor={colors.textTertiary} style={styles.input} /></Field>
          <Field label="Бренд"><TextInput value={brand} onChangeText={setBrand} placeholder="Необязательно" placeholderTextColor={colors.textTertiary} style={styles.input} /></Field>

          <Text style={styles.label}>Категория</Text>
          <View style={styles.categoryGrid}>
            {(Object.keys(categories) as CategoryId[]).map((item) => (
              <Pressable key={item} accessibilityRole="button" onPress={() => setCategory(item)} style={[styles.categoryButton, category === item && { backgroundColor: categories[item].background, borderColor: categories[item].color }]}>
                <View style={[styles.categoryDot, { backgroundColor: categories[item].color }]} />
                <Text style={[styles.categoryName, category === item && { color: colors.ink }]}>{categories[item].shortName}</Text>
                {category === item ? <Check size={13} color={categories[item].color} /> : null}
              </Pressable>
            ))}
          </View>

          <Text style={styles.label}>Где хранится</Text>
          <View style={styles.locationRow}>
            {(Object.keys(locations) as LocationId[]).map((item) => <Pressable key={item} accessibilityRole="button" onPress={() => setLocation(item)} style={[styles.locationButton, location === item && styles.locationActive]}><Text style={[styles.locationText, location === item && styles.locationTextActive]}>{locations[item].name}</Text></Pressable>)}
          </View>

          <View style={styles.twoColumns}>
            <View style={{ flex: 1 }}><Field label="Количество" required><TextInput value={quantity} onChangeText={setQuantity} keyboardType="decimal-pad" style={styles.input} /></Field></View>
            <View style={{ flex: 1 }}><Field label="Минимальный запас"><TextInput value={minQuantity} onChangeText={setMinQuantity} keyboardType="decimal-pad" style={styles.input} /></Field></View>
          </View>
          <Text style={styles.label}>Единица измерения</Text>
          <View style={styles.unitRow}>{units.map((item) => <Pressable key={item} accessibilityRole="button" onPress={() => setUnit(item)} style={[styles.unitButton, unit === item && styles.unitActive]}><Text style={[styles.unitText, unit === item && styles.unitTextActive]}>{item}</Text></Pressable>)}</View>

          <Field label="Срок годности">
            <View style={styles.dateInputWrap}><CalendarDays size={17} color={colors.textSecondary} /><TextInput value={expiresAt} onChangeText={(value) => { setExpiresAt(value); setError(''); }} placeholder="ДД.ММ.ГГГГ" placeholderTextColor={colors.textTertiary} style={[styles.input, { borderWidth: 0, flex: 1, height: 45 }]} /></View>
          </Field>
          <View style={styles.dateShortcuts}>
            {[{ label: '3 дня', days: 3 }, { label: 'Неделя', days: 7 }, { label: 'Месяц', days: 30 }, { label: 'Без срока', days: null }].map((item) => <Pressable key={item.label} accessibilityRole="button" onPress={() => setExpiresAt(item.days === null ? '' : formatInputDate(toISODate(addDays(new Date(), item.days))))} style={styles.dateShortcut}><Text style={styles.dateShortcutText}>{item.label}</Text></Pressable>)}
          </View>

          <View style={styles.twoColumns}>
            <View style={{ flex: 1 }}><Field label="Цена за единицу, ₽"><TextInput value={price} onChangeText={setPrice} keyboardType="decimal-pad" placeholder="0" placeholderTextColor={colors.textTertiary} style={styles.input} /></Field></View>
            <View style={{ flex: 1 }}><Field label="QR / штрихкод"><TextInput value={barcode} onChangeText={setBarcode} autoCapitalize="none" placeholder="Не указан" placeholderTextColor={colors.textTertiary} style={styles.input} /></Field></View>
          </View>
          <Field label="Заметка"><TextInput value={note} onChangeText={setNote} multiline placeholder="Например, после вскрытия хранить 2 дня" placeholderTextColor={colors.textTertiary} style={[styles.input, styles.noteInput]} /></Field>
        </ScrollView>
        <View style={styles.footer}><Pressable accessibilityRole="button" onPress={save} style={({ pressed }) => [styles.saveButton, pressed && { opacity: 0.85 }]}><PackagePlus size={19} color={colors.ink} /><Text style={styles.saveText}>{existing ? 'Сохранить изменения' : 'Добавить в запасы'}</Text></Pressable></View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return <View style={styles.field}><Text style={styles.label}>{label}{required ? <Text style={{ color: colors.red }}> *</Text> : null}</Text>{children}</View>;
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 11 },
  headerTitle: { fontFamily: fonts.bold, fontSize: 14, color: colors.ink },
  content: { width: '100%', maxWidth: 560, alignSelf: 'center', paddingHorizontal: 20, paddingBottom: 25 },
  intro: { flexDirection: 'row', alignItems: 'center', gap: 15, marginTop: 10, marginBottom: 23 },
  introTitle: { fontFamily: fonts.bold, fontSize: 17, color: colors.ink, marginBottom: 5 },
  introText: { fontFamily: fonts.regular, fontSize: 10, lineHeight: 16, color: colors.textSecondary },
  scannedBadge: { flexDirection: 'row', alignItems: 'center', gap: 8, borderRadius: 13, padding: 12, backgroundColor: colors.greenMuted, marginBottom: 15 },
  scannedText: { flex: 1, fontFamily: fonts.semibold, fontSize: 10, color: colors.green },
  error: { padding: 12, borderRadius: 12, backgroundColor: colors.redMuted, marginBottom: 15 },
  errorText: { fontFamily: fonts.medium, fontSize: 11, color: colors.red },
  field: { marginBottom: 16 },
  label: { fontFamily: fonts.semibold, fontSize: 10, color: colors.text, marginBottom: 8 },
  input: { height: 47, borderRadius: 14, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, paddingHorizontal: 14, fontFamily: fonts.medium, fontSize: 12, color: colors.ink },
  categoryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 18 },
  categoryButton: { width: '48%', flexGrow: 1, minHeight: 41, borderRadius: 13, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, flexDirection: 'row', alignItems: 'center', gap: 7, paddingHorizontal: 10 },
  categoryDot: { width: 6, height: 6, borderRadius: 3 },
  categoryName: { flex: 1, fontFamily: fonts.medium, fontSize: 9, color: colors.textSecondary },
  locationRow: { flexDirection: 'row', gap: 8, marginBottom: 18 },
  locationButton: { flex: 1, height: 42, borderRadius: 13, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  locationActive: { backgroundColor: colors.ink, borderColor: colors.ink },
  locationText: { fontFamily: fonts.semibold, fontSize: 9, color: colors.textSecondary },
  locationTextActive: { color: colors.white },
  twoColumns: { flexDirection: 'row', gap: 10 },
  unitRow: { flexDirection: 'row', gap: 7, marginBottom: 18 },
  unitButton: { flex: 1, height: 38, borderRadius: 12, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  unitActive: { backgroundColor: colors.accent, borderColor: colors.accent },
  unitText: { fontFamily: fonts.semibold, fontSize: 10, color: colors.textSecondary },
  unitTextActive: { color: colors.ink },
  dateInputWrap: { flexDirection: 'row', alignItems: 'center', gap: 8, borderRadius: 14, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, paddingLeft: 13, paddingRight: 3 },
  dateShortcuts: { flexDirection: 'row', gap: 7, marginTop: -7, marginBottom: 19 },
  dateShortcut: { paddingHorizontal: 11, paddingVertical: 7, borderRadius: 9, backgroundColor: colors.surfaceMuted },
  dateShortcutText: { fontFamily: fonts.semibold, fontSize: 9, color: colors.textSecondary },
  noteInput: { height: 78, paddingTop: 13, textAlignVertical: 'top' },
  footer: { paddingHorizontal: 20, paddingTop: 10, paddingBottom: 14, backgroundColor: colors.background, borderTopWidth: 1, borderTopColor: colors.border },
  saveButton: { height: 52, maxWidth: 560, width: '100%', alignSelf: 'center', borderRadius: 17, backgroundColor: colors.accent, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 9 },
  saveText: { fontFamily: fonts.bold, fontSize: 12, color: colors.ink },
});
