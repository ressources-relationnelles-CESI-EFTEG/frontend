import { signIn, signUp } from '~/services/auth.service';
import { getUser, updateUser } from '~/services/utilisateur.service';

export function useApi() {
  return {
    signIn,
    signUp,
    getUser,
    updateUser,
  };
}
