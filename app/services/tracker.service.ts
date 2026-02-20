import type { ApiListResponse } from '~/types/api';
import type { TrackerEntry } from '~/types/db';
import { apiRequest } from './api-client';

interface CreateTrackerEntryPayload {
  emotionId: number;
  note?: string;
  dateEntry: string;
}

export function getTrackerEntries() {
  return apiRequest<ApiListResponse<TrackerEntry>>('/tracker-entries');
}

export function createTrackerEntry(payload: CreateTrackerEntryPayload) {
  return apiRequest<TrackerEntry, CreateTrackerEntryPayload>('/tracker-entries', {
    method: 'POST',
    body: payload,
  });
}
