import { signIn, signUp } from '~/services/auth.service';

export function useApi() {
  return {
    signIn,
    signUp,
  };
}
