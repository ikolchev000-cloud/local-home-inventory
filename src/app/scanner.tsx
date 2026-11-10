import { useRef, useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Linking, Modal, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { BarcodeScanningResult, CameraView, useCameraPermissions } from 'expo-camera';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as Haptics from 'expo-haptics';
import {
  ArrowRight,
  Check,
  CheckCircle2,
  Flashlight,
  FlashlightOff,
  Keyboard,
  Minus,
  PackagePlus,
  Plus,
  ScanLine,
  X,
} from 'lucide-react-native';
import { ProductArtwork } from '@/components/ProductArtwork';
import { IconButton } from '@/components/ui';
import { colors, fonts } from '@/constants/theme';
import { useInventory } from '@/context/InventoryContext';
import type { CategoryId, Product } from '@/types/inventory';
import { formatQuantity } from '@/utils/date';
import { quantityStep } from '@/utils/inventory';
import { lookupProduct } from '@/utils/productLookup';

type ScanMode = 'added' | 'consumed';
interface ScanResult {
  code: string;
  product?: Product;
  suggestedName?: string;
  suggestedBrand?: string;
  suggestedCategory?: CategoryId;
}

export default function ScannerScreen() {
  const { products, adjustQuantity, showToast } = useInventory();
  const [permission, requestPermission] = useCameraPermissions();
  const [mode, setMode] = useState<ScanMode>('added');
  const [torch, setTorch] = useState(false);
  const [locked, setLocked] = useState(false);
  const [lookingUp, setLookingUp] = useState(false);
  const [result, setResult] = useState<ScanResult | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [success, setSuccess] = useState(false);
  const [manualVisible, setManualVisible] = useState(false);
  const [manualCode, setManualCode] = useState('');
  const insets = useSafeAreaInsets();
  const processing = useRef(false);

  async function handleCode(code: string) {
    const normalized = code.trim();
    if (!normalized || processing.current) return;
    processing.current = true;
    setLocked(true);
    setSuccess(false);
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => undefined);
    const existing = products.find((product) => product.barcode === normalized);
    if (existing) {
      setQuantity(quantityStep(existing.unit));
      setResult({ code: normalized, product: existing });
    } else {
      setLookingUp(true);
      setResult({ code: normalized });
      const suggestion = await lookupProduct(normalized);
      setResult({
        code: normalized,
        suggestedName: suggestion?.name,
        suggestedBrand: suggestion?.brand,
        suggestedCategory: suggestion?.category,
      });
      setLookingUp(false);
    }
  }

  function resetScanner() {
    processing.current = false;
    setResult(null);
    setLocked(false);
    setLookingUp(false);
    setSuccess(false);
    setQuantity(1);
  }

  function applyResult() {
    if (!result?.product) return;
    adjustQuantity(result.product.id, quantity, mode);
    setSuccess(true);
    showToast(mode === 'added' ? 'Запас пополнен по штрихкоду' : 'Расход сохранён в аналитике');
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => undefined);
  }

  function openNewProduct() {
    if (!result) return;
    router.push({
      pathname: '/product-form',
      params: {
        barcode: result.code,
        name: result.suggestedName ?? '',
        brand: result.suggestedBrand ?? '',
        category: result.suggestedCategory ?? 'other',
      },
    });
  }

  return (
    <View style={styles.screen}>
      <StatusBar style="light" />
      {permission?.granted ? (
        <CameraView
          style={StyleSheet.absoluteFill}
          facing="back"
          enableTorch={torch}
          barcodeScannerSettings={{ barcodeTypes: ['qr', 'ean13', 'ean8', 'code128', 'code39', 'upc_a', 'upc_e', 'itf14'] }}
          onBarcodeScanned={locked ? undefined : (event: BarcodeScanningResult) => void handleCode(event.data)}
        />
      ) : <View style={[StyleSheet.absoluteFill, styles.permissionBackground]} />}

      <SafeAreaView style={styles.overlay} edges={['top']}>
        <View style={styles.header}>
          <IconButton icon={X} dark label="Закрыть сканер" onPress={() => router.back()} />
          <View style={{ alignItems: 'center' }}><Text style={styles.headerTitle}>Сканер</Text><Text style={styles.headerSubtitle}>QR и штрихкоды</Text></View>
          <IconButton icon={torch ? FlashlightOff : Flashlight} dark label="Фонарик" onPress={() => setTorch((value) => !value)} />
        </View>

        {!permission ? (
          <View style={styles.permissionContent}><ActivityIndicator color={colors.accent} /><Text style={styles.permissionText}>Проверяем доступ к камере…</Text></View>
        ) : !permission.granted ? (
          <View style={styles.permissionContent}>
            <View style={styles.permissionIcon}><ScanLine size={35} color={colors.ink} /></View>
            <Text style={styles.permissionTitle}>Нужен доступ к камере</Text>
            <Text style={styles.permissionText}>Камера используется только для распознавания кодов. Фото не сохраняются.</Text>
            <Pressable style={styles.permissionButton} onPress={() => permission.canAskAgain ? void requestPermission() : void Linking.openSettings()}><Text style={styles.permissionButtonText}>{permission.canAskAgain ? 'Разрешить камеру' : 'Открыть настройки'}</Text></Pressable>
            <Pressable onPress={() => setManualVisible(true)} style={styles.manualPermission}><Keyboard size={16} color={colors.white} /><Text style={styles.manualPermissionText}>Ввести код вручную</Text></Pressable>
          </View>
        ) : (
          <>
            <View style={styles.modeSwitch}>
              <Pressable onPress={() => setMode('added')} style={[styles.modeButton, mode === 'added' && styles.modeActive]}><Plus size={15} color={mode === 'added' ? colors.ink : colors.white} /><Text style={[styles.modeText, mode === 'added' && styles.modeTextActive]}>Пополнение</Text></Pressable>
              <Pressable onPress={() => setMode('consumed')} style={[styles.modeButton, mode === 'consumed' && styles.modeActive]}><Minus size={15} color={mode === 'consumed' ? colors.ink : colors.white} /><Text style={[styles.modeText, mode === 'consumed' && styles.modeTextActive]}>Списание</Text></Pressable>
            </View>
            <View style={styles.scanArea}>
              <View style={styles.scanFrame}>
                <View style={[styles.corner, styles.cornerTL]} /><View style={[styles.corner, styles.cornerTR]} /><View style={[styles.corner, styles.cornerBL]} /><View style={[styles.corner, styles.cornerBR]} />
                <View style={styles.scanLine} />
              </View>
              <Text style={styles.scanHint}>Поместите код внутри рамки</Text>
              <Text style={styles.scanTypes}>EAN · UPC · Code 128 · QR</Text>
            </View>
            <View style={[styles.bottomControls, { paddingBottom: Math.max(insets.bottom, 20) }]}>
              <Pressable onPress={() => setManualVisible(true)} style={styles.manualButton}><Keyboard size={18} color={colors.ink} /><Text style={styles.manualButtonText}>Ввести код вручную</Text><ArrowRight size={17} color={colors.ink} /></Pressable>
              <Text style={styles.offlineNote}>Распознавание происходит на устройстве</Text>
            </View>
          </>
        )}
      </SafeAreaView>

      {result ? (
        <View style={[styles.resultOverlay, { paddingTop: insets.top }]}>
          <Pressable style={StyleSheet.absoluteFill} onPress={resetScanner} />
          <View style={[styles.resultSheet, { paddingBottom: Math.max(insets.bottom, 22) }]}>
            {success && result.product ? (
              <View style={styles.successContent}>
                <View style={styles.successIcon}><CheckCircle2 size={34} color={colors.green} /></View>
                <Text style={styles.resultTitle}>{mode === 'added' ? 'Запас пополнен' : 'Продукт списан'}</Text>
                <Text style={styles.resultDescription}>{result.product.name} · {formatQuantity(quantity)} {result.product.unit}</Text>
                <Pressable onPress={resetScanner} style={styles.primaryButton}><ScanLine size={18} color={colors.ink} /><Text style={styles.primaryButtonText}>Сканировать ещё</Text></Pressable>
                <Pressable onPress={() => router.back()} style={styles.secondaryButton}><Text style={styles.secondaryButtonText}>Готово</Text></Pressable>
              </View>
            ) : lookingUp ? (
              <View style={styles.lookupContent}><ActivityIndicator color={colors.green} size="large" /><Text style={styles.resultTitle}>Ищем продукт</Text><Text style={styles.resultDescription}>Проверяем открытую базу Open Food Facts</Text></View>
            ) : result.product ? (
              <>
                <View style={styles.sheetHandle} />
                <View style={styles.resultProduct}>
                  <ProductArtwork category={result.product.category} size={59} />
                  <View style={{ flex: 1 }}><Text style={styles.foundLabel}>ПРОДУКТ НАЙДЕН</Text><Text style={styles.productName} numberOfLines={1}>{result.product.name}</Text><Text style={styles.resultCode}>{result.code}</Text></View>
                  <Pressable onPress={resetScanner} style={styles.closeResult}><X size={19} color={colors.textSecondary} /></Pressable>
                </View>
                <View style={styles.resultQuantityRow}>
                  <View><Text style={styles.quantityLabel}>{mode === 'added' ? 'Добавить к запасам' : 'Списать из запасов'}</Text><Text style={styles.currentStock}>Сейчас: {formatQuantity(result.product.quantity)} {result.product.unit}</Text></View>
                  <View style={styles.stepper}>
                    <Pressable onPress={() => setQuantity((value) => Math.max(quantityStep(result.product!.unit), value - quantityStep(result.product!.unit)))} style={styles.stepButton}><Minus size={18} color={colors.ink} /></Pressable>
                    <Text style={styles.quantityValue}>{formatQuantity(quantity)}</Text>
                    <Pressable onPress={() => setQuantity((value) => value + quantityStep(result.product!.unit))} style={styles.stepButton}><Plus size={18} color={colors.ink} /></Pressable>
                  </View>
                </View>
                <Pressable onPress={applyResult} disabled={mode === 'consumed' && result.product.quantity === 0} style={[styles.primaryButton, mode === 'consumed' && result.product.quantity === 0 && { opacity: 0.4 }]}><Check size={19} color={colors.ink} /><Text style={styles.primaryButtonText}>{mode === 'added' ? 'Подтвердить пополнение' : 'Подтвердить списание'}</Text></Pressable>
              </>
            ) : (
              <>
                <View style={styles.sheetHandle} />
                <View style={styles.newProductHeader}>
                  <View style={styles.newProductIcon}><PackagePlus size={27} color={colors.green} /></View>
                  <View style={{ flex: 1 }}><Text style={styles.foundLabel}>{result.suggestedName ? 'НАЙДЕНО В БАЗЕ' : 'НОВЫЙ ПРОДУКТ'}</Text><Text style={styles.resultTitle}>{result.suggestedName ?? 'Добавим на вашу полку?'}</Text></View>
                </View>
                <Text style={styles.resultDescription}>{result.suggestedBrand ? `${result.suggestedBrand} · ` : ''}{result.code}</Text>
                <Text style={styles.newProductHint}>{result.suggestedName ? 'Проверьте название, укажите количество и срок годности.' : 'Продукт не найден в открытой базе. Заполнение карточки займёт меньше минуты.'}</Text>
                <Pressable onPress={openNewProduct} style={styles.primaryButton}><PackagePlus size={18} color={colors.ink} /><Text style={styles.primaryButtonText}>Заполнить карточку</Text><ArrowRight size={18} color={colors.ink} /></Pressable>
                <Pressable onPress={resetScanner} style={styles.secondaryButton}><Text style={styles.secondaryButtonText}>Сканировать другой код</Text></Pressable>
              </>
            )}
          </View>
        </View>
      ) : null}

      <Modal visible={manualVisible} transparent animationType="fade" onRequestClose={() => setManualVisible(false)}>
        <KeyboardAvoidingView style={styles.manualModal} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={styles.manualCard}>
            <View style={styles.manualHeader}><Text style={styles.manualTitle}>Код с упаковки</Text><Pressable onPress={() => setManualVisible(false)}><X size={20} color={colors.textSecondary} /></Pressable></View>
            <Text style={styles.manualDescription}>Введите цифры под штрихкодом или содержимое QR-кода.</Text>
            <TextInput autoFocus value={manualCode} onChangeText={setManualCode} onSubmitEditing={() => { if (manualCode.trim()) { setManualVisible(false); void handleCode(manualCode); setManualCode(''); } }} placeholder="Например, 4607032430017" placeholderTextColor={colors.textTertiary} autoCapitalize="none" style={styles.manualInput} returnKeyType="done" />
            <Pressable disabled={!manualCode.trim()} onPress={() => { setManualVisible(false); void handleCode(manualCode); setManualCode(''); }} style={[styles.primaryButton, !manualCode.trim() && { opacity: 0.4 }]}><Text style={styles.primaryButtonText}>Найти продукт</Text><ArrowRight size={18} color={colors.ink} /></Pressable>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#111B15' },
  permissionBackground: { backgroundColor: '#17241C' },
  overlay: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 8 },
  headerTitle: { fontFamily: fonts.bold, fontSize: 16, color: colors.white },
  headerSubtitle: { fontFamily: fonts.regular, fontSize: 9, color: '#B9C5BC', marginTop: 2 },
  modeSwitch: { flexDirection: 'row', alignSelf: 'center', backgroundColor: '#101913B8', borderRadius: 15, padding: 4, marginTop: 22 },
  modeButton: { flexDirection: 'row', alignItems: 'center', gap: 6, height: 37, borderRadius: 11, paddingHorizontal: 16 },
  modeActive: { backgroundColor: colors.accent },
  modeText: { fontFamily: fonts.semibold, fontSize: 10, color: colors.white },
  modeTextActive: { color: colors.ink },
  scanArea: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingBottom: 40 },
  scanFrame: { width: 270, height: 210, position: 'relative', alignItems: 'center', justifyContent: 'center' },
  corner: { position: 'absolute', width: 42, height: 42, borderColor: colors.accent },
  cornerTL: { left: 0, top: 0, borderLeftWidth: 3, borderTopWidth: 3, borderTopLeftRadius: 16 },
  cornerTR: { right: 0, top: 0, borderRightWidth: 3, borderTopWidth: 3, borderTopRightRadius: 16 },
  cornerBL: { left: 0, bottom: 0, borderLeftWidth: 3, borderBottomWidth: 3, borderBottomLeftRadius: 16 },
  cornerBR: { right: 0, bottom: 0, borderRightWidth: 3, borderBottomWidth: 3, borderBottomRightRadius: 16 },
  scanLine: { width: 218, height: 1.5, backgroundColor: colors.accent, opacity: 0.8, shadowColor: colors.accent, shadowRadius: 8 },
  scanHint: { fontFamily: fonts.semibold, fontSize: 13, color: colors.white, marginTop: 26 },
  scanTypes: { fontFamily: fonts.medium, fontSize: 9, letterSpacing: 1.1, color: '#B9C5BC', marginTop: 8 },
  bottomControls: { paddingHorizontal: 20 },
  manualButton: { height: 51, borderRadius: 17, backgroundColor: colors.white, flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 17 },
  manualButtonText: { flex: 1, fontFamily: fonts.bold, fontSize: 12, color: colors.ink },
  offlineNote: { fontFamily: fonts.regular, fontSize: 9, color: '#A8B7AC', textAlign: 'center', marginTop: 12 },
  permissionContent: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 42, paddingBottom: 90 },
  permissionIcon: { width: 72, height: 72, borderRadius: 24, backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center', marginBottom: 23 },
  permissionTitle: { fontFamily: fonts.extrabold, fontSize: 23, color: colors.white, textAlign: 'center', marginBottom: 12 },
  permissionText: { fontFamily: fonts.regular, fontSize: 12, lineHeight: 19, color: '#B9C5BC', textAlign: 'center', marginTop: 10 },
  permissionButton: { height: 50, borderRadius: 16, backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 28, marginTop: 24 },
  permissionButtonText: { fontFamily: fonts.bold, fontSize: 12, color: colors.ink },
  manualPermission: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 15, marginTop: 8 },
  manualPermissionText: { fontFamily: fonts.semibold, fontSize: 11, color: colors.white },
  resultOverlay: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, backgroundColor: '#0A120C90', justifyContent: 'flex-end' },
  resultSheet: { backgroundColor: colors.surface, borderTopLeftRadius: 29, borderTopRightRadius: 29, paddingHorizontal: 22, paddingTop: 20, maxWidth: 560, width: '100%', alignSelf: 'center' },
  sheetHandle: { width: 36, height: 4, borderRadius: 2, backgroundColor: colors.border, alignSelf: 'center', marginBottom: 20 },
  resultProduct: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  foundLabel: { fontFamily: fonts.semibold, fontSize: 8, letterSpacing: 1.2, color: colors.green, marginBottom: 5 },
  productName: { fontFamily: fonts.bold, fontSize: 16, color: colors.ink, marginBottom: 4 },
  resultCode: { fontFamily: fonts.regular, fontSize: 9, color: colors.textSecondary },
  closeResult: { padding: 5, alignSelf: 'flex-start' },
  resultQuantityRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 22 },
  quantityLabel: { fontFamily: fonts.semibold, fontSize: 11, color: colors.ink, marginBottom: 5 },
  currentStock: { fontFamily: fonts.regular, fontSize: 9, color: colors.textSecondary },
  stepper: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  stepButton: { width: 35, height: 37, borderRadius: 11, backgroundColor: colors.surfaceMuted, alignItems: 'center', justifyContent: 'center' },
  quantityValue: { minWidth: 37, textAlign: 'center', fontFamily: fonts.bold, fontSize: 16, color: colors.ink },
  primaryButton: { minHeight: 51, borderRadius: 16, backgroundColor: colors.accent, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 9, paddingHorizontal: 15 },
  primaryButtonText: { fontFamily: fonts.bold, fontSize: 12, color: colors.ink },
  secondaryButton: { height: 43, alignItems: 'center', justifyContent: 'center', marginTop: 4 },
  secondaryButtonText: { fontFamily: fonts.semibold, fontSize: 11, color: colors.textSecondary },
  successContent: { alignItems: 'center', paddingTop: 7 },
  successIcon: { width: 68, height: 68, borderRadius: 23, backgroundColor: colors.greenMuted, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  resultTitle: { fontFamily: fonts.extrabold, fontSize: 20, lineHeight: 27, color: colors.ink, textAlign: 'center' },
  resultDescription: { fontFamily: fonts.regular, fontSize: 11, color: colors.textSecondary, textAlign: 'center', marginTop: 6, marginBottom: 21 },
  successContent_primary: {},
  lookupContent: { alignItems: 'center', paddingVertical: 20 },
  newProductHeader: { flexDirection: 'row', alignItems: 'center', gap: 13 },
  newProductIcon: { width: 55, height: 55, borderRadius: 18, backgroundColor: colors.greenMuted, alignItems: 'center', justifyContent: 'center' },
  newProductHint: { fontFamily: fonts.regular, fontSize: 11, lineHeight: 17, color: colors.textSecondary, marginBottom: 22 },
  manualModal: { flex: 1, backgroundColor: '#0A120CA0', alignItems: 'center', justifyContent: 'center', padding: 22 },
  manualCard: { width: '100%', maxWidth: 400, borderRadius: 25, backgroundColor: colors.surface, padding: 22 },
  manualHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  manualTitle: { fontFamily: fonts.bold, fontSize: 19, color: colors.ink },
  manualDescription: { fontFamily: fonts.regular, fontSize: 11, lineHeight: 17, color: colors.textSecondary, marginTop: 8, marginBottom: 18 },
  manualInput: { height: 49, borderRadius: 14, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.background, paddingHorizontal: 14, fontFamily: fonts.medium, fontSize: 12, color: colors.ink, marginBottom: 12 },
});
