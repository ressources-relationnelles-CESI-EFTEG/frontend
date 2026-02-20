export enum UserRole {
  USER = 'USER',
  ADMIN = 'ADMIN',
}

export enum AuditTargetType {
  USER = 'USER',
  INFORMATION = 'INFORMATION',
  MENU_ITEM = 'MENU_ITEM',
  EMOTION = 'EMOTION',
  TRACKER_ENTRY = 'TRACKER_ENTRY',
}

export interface User {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  isActive: boolean;
  createdAt: string;
}

export interface Information {
  id: number;
  title: string;
  content: string;
  slug: string;
  isPublished: boolean;
  sortOrder: number;
}

export interface MenuItem {
  id: number;
  label: string;
  url: string | null;
  informationId: number | null;
  sortOrder: number;
}

export interface Emotion {
  id: number;
  label: string;
  level: number;
  parentId: number | null;
  color: string;
  iconPath: string;
}

export interface TrackerEntry {
  id: number;
  userId: number;
  emotionId: number;
  note: string | null;
  dateEntry: string;
  createdAt: string;
}

export interface AuditLog {
  id: number;
  adminId: number;
  action: string;
  targetType: AuditTargetType;
  targetId: number;
  createdAt: string;
}
