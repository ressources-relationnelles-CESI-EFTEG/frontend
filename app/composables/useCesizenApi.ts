import {
  getInformationBySlug,
  getInformations,
  getMenuItems,
} from '~/services/informations.service';
import { getEmotions } from '~/services/emotions.service';
import { createTrackerEntry, getTrackerEntries } from '~/services/tracker.service';

export function useCesizenApi() {
  return {
    getInformations,
    getInformationBySlug,
    getMenuItems,
    getEmotions,
    getTrackerEntries,
    createTrackerEntry,
  };
}
