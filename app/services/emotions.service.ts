import type { ApiListResponse } from '~/types/api';
import type { Emotion } from '~/types/db';
import { apiRequest } from './api-client';

export function getEmotions() {
  return apiRequest<ApiListResponse<Emotion>>('/emotions');
}
