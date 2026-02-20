import type { ApiItemResponse, ApiListResponse } from '~/types/api';
import type { Information, MenuItem } from '~/types/db';
import { apiRequest } from './api-client';

export function getInformations() {
  return apiRequest<ApiListResponse<Information>>('/informations');
}

export function getInformationBySlug(slug: string) {
  return apiRequest<ApiItemResponse<Information>>(`/informations/${slug}`);
}

export function getMenuItems() {
  return apiRequest<ApiListResponse<MenuItem>>('/menu-items');
}
