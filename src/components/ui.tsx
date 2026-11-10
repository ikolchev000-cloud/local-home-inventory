import { ArrowLeft, Check, ChevronRight, X } from 'lucide-react-native';
import type { LucideIcon } from 'lucide-react-native';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { colors, fonts, shadows } from '@/constants/theme';

export function IconButton({
  icon: Icon,
  onPress,
  dark = false,
  label,
}: {
  icon: LucideIcon;
  onPress: () => void;
  dark?: boolean;
  label: string;
}) {
  return (
    <Pressable
      accessibilityLabel={label}
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.iconButton, dark && styles.iconButtonDark, pressed && { opacity: 0.65 }]}
    >
      <Icon size={20} color={dark ? colors.white : colors.ink} strokeWidth={1.8} />
    </Pressable>
  );
}

export function BackButton({ dark = false }: { dark?: boolean }) {
  return <IconButton icon={ArrowLeft} onPress={() => router.back()} dark={dark} label="Назад" />;
}

export function ScreenHeader({ title, subtitle, action }: { title: string; subtitle?: string; action?: React.ReactNode }) {
  return (
    <View style={styles.screenHeader}>
      <View style={{ flex: 1 }}>
        <Text style={styles.screenTitle}>{title}</Text>
        {subtitle ? <Text style={styles.screenSubtitle}>{subtitle}</Text> : null}
      </View>
      {action}
    </View>
  );
}

export function SectionHeader({ title, action, onAction }: { title: string; action?: string; onAction?: () => void }) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {action ? (
        <Pressable onPress={onAction} style={styles.sectionAction} accessibilityRole="button">
          <Text style={styles.sectionActionText}>{action}</Text>
          <ChevronRight size={15} color={colors.textSecondary} />
        </Pressable>
      ) : null}
    </View>
  );
}

export function EmptyState({ icon: Icon, title, description }: { icon: LucideIcon; title: string; description: string }) {
  return (
    <View style={styles.emptyState}>
      <View style={styles.emptyIcon}><Icon size={28} color={colors.green} strokeWidth={1.6} /></View>
      <Text style={styles.emptyTitle}>{title}</Text>
      <Text style={styles.emptyDescription}>{description}</Text>
    </View>
  );
}

export function ConfirmDialog({
  visible,
  title,
  description,
  confirmLabel,
  onConfirm,
  onClose,
}: {
  visible: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  onConfirm: () => void;
  onClose: () => void;
}) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.modalBackdrop}>
        <View style={styles.dialog}>
          <Pressable onPress={onClose} style={styles.dialogClose} accessibilityLabel="Закрыть">
            <X size={19} color={colors.textSecondary} />
          </Pressable>
          <Text style={styles.dialogTitle}>{title}</Text>
          <Text style={styles.dialogDescription}>{description}</Text>
          <View style={styles.dialogActions}>
            <Pressable onPress={onClose} style={styles.dialogCancel}><Text style={styles.dialogCancelText}>Отмена</Text></Pressable>
            <Pressable onPress={onConfirm} style={styles.dialogConfirm}>
              <Check size={17} color={colors.white} />
              <Text style={styles.dialogConfirmText}>{confirmLabel}</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  iconButton: {
    width: 42,
    height: 42,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  iconButtonDark: { backgroundColor: '#FFFFFF18', borderColor: '#FFFFFF28' },
  screenHeader: { flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: 24 },
  screenTitle: { fontFamily: fonts.extrabold, fontSize: 29, lineHeight: 36, color: colors.ink, letterSpacing: -1 },
  screenSubtitle: { fontFamily: fonts.regular, fontSize: 13, color: colors.textSecondary, marginTop: 4 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  sectionTitle: { fontFamily: fonts.bold, fontSize: 18, color: colors.ink, letterSpacing: -0.4 },
  sectionAction: { flexDirection: 'row', alignItems: 'center', gap: 1, paddingVertical: 4 },
  sectionActionText: { fontFamily: fonts.medium, fontSize: 12, color: colors.textSecondary },
  emptyState: { alignItems: 'center', paddingHorizontal: 30, paddingVertical: 44 },
  emptyIcon: { width: 58, height: 58, borderRadius: 20, backgroundColor: colors.greenMuted, alignItems: 'center', justifyContent: 'center', marginBottom: 15 },
  emptyTitle: { fontFamily: fonts.bold, fontSize: 17, color: colors.ink, marginBottom: 7, textAlign: 'center' },
  emptyDescription: { fontFamily: fonts.regular, fontSize: 13, lineHeight: 20, color: colors.textSecondary, textAlign: 'center' },
  modalBackdrop: { flex: 1, backgroundColor: '#101A14A0', alignItems: 'center', justifyContent: 'center', padding: 24 },
  dialog: { width: '100%', maxWidth: 390, backgroundColor: colors.surface, borderRadius: 26, padding: 25, ...shadows.floating },
  dialogClose: { position: 'absolute', right: 17, top: 17, padding: 5 },
  dialogTitle: { fontFamily: fonts.bold, fontSize: 21, color: colors.ink, paddingRight: 25, marginBottom: 10 },
  dialogDescription: { fontFamily: fonts.regular, fontSize: 14, lineHeight: 21, color: colors.textSecondary, marginBottom: 24 },
  dialogActions: { flexDirection: 'row', gap: 10 },
  dialogCancel: { flex: 1, height: 48, borderRadius: 15, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surfaceMuted },
  dialogCancelText: { fontFamily: fonts.semibold, fontSize: 13, color: colors.text },
  dialogConfirm: { flex: 1.25, height: 48, borderRadius: 15, flexDirection: 'row', gap: 6, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.red },
  dialogConfirmText: { fontFamily: fonts.semibold, fontSize: 13, color: colors.white },
});
