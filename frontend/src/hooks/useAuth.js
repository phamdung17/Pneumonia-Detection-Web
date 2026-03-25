import { useAuthStore } from '../stores/authStore';

export function useAuth() {
  const store = useAuthStore();
  return {
    ...store,
    hasRole: (roles = []) => (roles.length === 0 ? true : roles.includes(store.user?.role)),
  };
}
