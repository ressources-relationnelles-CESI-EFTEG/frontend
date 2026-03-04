import type { User } from '~/types/db';

export function useAuth() {
  const user = useState<User | null>('auth-user', () => null);
  const token = useState<string | null>('auth-token', () => null);

  const isLoggedIn = computed(() => !!token.value);

  function login(newToken: string, newUser: User) {
    token.value = newToken;
    user.value = newUser;
    if (import.meta.client) {
      localStorage.setItem('auth-token', newToken);
      localStorage.setItem('auth-user', JSON.stringify(newUser));
    }
  }

  function logout() {
    token.value = null;
    user.value = null;
    if (import.meta.client) {
      localStorage.removeItem('auth-token');
      localStorage.removeItem('auth-user');
    }
  }

  function restoreSession() {
    if (!import.meta.client) return;
    if (token.value) return;

    const savedToken = localStorage.getItem('auth-token');
    const savedUser = localStorage.getItem('auth-user');

    if (savedToken && savedUser) {
      token.value = savedToken;
      try {
        user.value = JSON.parse(savedUser);
      } catch {
        logout();
      }
    }
  }

  return { user, token, isLoggedIn, login, logout, restoreSession };
}
