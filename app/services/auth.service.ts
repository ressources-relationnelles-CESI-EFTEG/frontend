import type { User } from '~/types/db';
import { apiRequest } from './api-client';

interface SignInPayload {
  email: string;
  password: string;
}

interface SignInResponse {
  data: {
    accessToken: string;
    user: User;
  };
}

interface SignUpPayload {
  prenom: string;
  nom: string;
  email: string;
  password: string;
  repeatPassword: string;
}

export function signIn(payload: SignInPayload) {
  return apiRequest<SignInResponse, SignInPayload>('/auth/sign-in', {
    method: 'POST',
    body: payload,
  });
}

export function signUp(payload: SignUpPayload) {
  return apiRequest<SignInResponse, SignUpPayload>('/auth/sign-up', {
    method: 'POST',
    body: payload,
  });
}
