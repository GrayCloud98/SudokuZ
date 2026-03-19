import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useAuth } from '@/context/AuthContext';
import { useState, useEffect } from 'react';
import { useRouter } from 'expo-router';

function getAvatarColor(seed: string): string {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = seed.charCodeAt(i) + ((hash << 5) - hash);
  }
  const hue = Math.abs(hash) % 360;
  return `hsl(${hue}, 65%, 50%)`;
}

export function Header() {
  const { user, isGuest, isLoading, signOut } = useAuth();
  const router = useRouter();

  const [guestUsername] = useState(() => {
    const existing = sessionStorage.getItem('guestUsername');
    if (existing) return existing;
    const generated = `guest_${Math.random().toString(36).slice(2, 8)}`;
    sessionStorage.setItem('guestUsername', generated);
    return generated;
  });

  const username = isGuest
    ? guestUsername
    : (user?.user_metadata?.user_name ?? // GitHub
      user?.user_metadata?.name ?? // Google
      user?.user_metadata?.username ?? // email signup
      'player');

  const avatarLetter = username[0].toUpperCase();
  const avatarColor = getAvatarColor(username);

  useEffect(() => {
    if (isLoading) return;
    if (!user && !isGuest) {
      router.replace('/(auth)/login');
    }
  }, [user, isGuest, isLoading]);

  async function handleSignOut() {
    await signOut();
  }

  return (
    <View style={styles.container}>
      <View style={styles.profile}>
        <View style={[styles.avatar, { backgroundColor: avatarColor }]}>
          <Text style={styles.avatarLetter}>{avatarLetter}</Text>
        </View>
        <Text style={styles.username}>{username}</Text>
      </View>

      <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
        <Text style={styles.signOutText}>{isGuest ? 'Sign in' : 'Sign out'}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  profile: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarLetter: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  username: {
    fontSize: 15,
    fontWeight: '600',
  },
  signOutButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#ccc',
  },
  signOutText: {
    fontSize: 14,
    color: '#555',
  },
});
