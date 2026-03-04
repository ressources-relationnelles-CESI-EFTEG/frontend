import type { User } from '~/types/db';
import { apiRequest } from './api-client';

export interface UpdateUserPayload {
  prenom?: string;
  nom?: string;
  email?: string;
  telephone?: string;
  description?: string;
  phraseAccroche?: string;
  region?: string;
}

export function getUser(id: number) {
  return apiRequest<User>(`/utilisateurs/${id}`);
}

export function updateUser(id: number, data: UpdateUserPayload) {
  return apiRequest<User, UpdateUserPayload>(`/utilisateurs/${id}`, {
    method: 'PATCH',
    body: data,
  });
}
