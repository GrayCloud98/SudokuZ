import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import Head from 'expo-router/head';
import { colors, fonts, radius, spacing } from '@/theme/theme';
import { useHover } from '@/hooks/useHover';

export default function NotFoundScreen() {
  const router = useRouter();
  const { hovered, hoverProps } = useHover();

  return (
    <View style={styles.container}>
      <Head>
        <title>Page not found · SudokuZ</title>
      </Head>
      <Text style={styles.code}>404</Text>
      <Text style={styles.title}>This cell is empty</Text>
      <Text style={styles.subtitle}>The page you're looking for doesn't exist.</Text>
      <Pressable
        style={[styles.btn, hovered && styles.btnHovered]}
        onPress={() => router.replace('/')}
        {...hoverProps}
      >
        <Text style={styles.btnText}>Back to home</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing['2xl'],
    gap: spacing.sm,
  },
  code: {
    fontSize: 64,
    fontFamily: fonts.extrabold,
    fontWeight: '800',
    color: colors.accent,
    letterSpacing: -2,
  },
  title: {
    fontSize: 22,
    fontFamily: fonts.bold,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  subtitle: {
    fontSize: 14,
    fontFamily: fonts.regular,
    fontWeight: '400',
    color: colors.textSecondary,
    marginBottom: spacing.lg,
  },
  btn: {
    backgroundColor: colors.accent,
    borderRadius: radius.lg,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing['2xl'],
  },
  btnHovered: {
    backgroundColor: colors.accentDark,
  },
  btnText: {
    fontSize: 15,
    fontFamily: fonts.bold,
    fontWeight: '700',
    color: '#fff',
  },
});
