import type {
  User,
} from './db';

export interface ApiListResponse<T> {
  data: T[];
}

export interface ApiItemResponse<T> {
  data: T;
}

export interface CurrentUserPayload {
  user: User;
}
