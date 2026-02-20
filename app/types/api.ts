import type {
  Emotion,
  Information,
  MenuItem,
  TrackerEntry,
  User,
} from './db';

export interface ApiListResponse<T> {
  data: T[];
}

export interface ApiItemResponse<T> {
  data: T;
}

export interface InformationResource extends Information {
  menuItems?: MenuItem[];
}

export interface EmotionNode extends Emotion {
  children?: EmotionNode[];
}

export interface TrackerEntryWithEmotion extends TrackerEntry {
  emotion?: Emotion;
}

export interface CurrentUserPayload {
  user: User;
}
