export const AVATAR_IDS = [
  'hori',
  'dino',
  'rabbit',
  'bear',
  'cat',
  'dog',
  'penguin',
  'fox',
] as const;
export type AvatarId = (typeof AVATAR_IDS)[number];

export interface Account {
  id: string;
  email: string | null;
  hasPin: boolean;
  pinSetAt: string | null;
  createdAt: string;
}

export interface ChildProfile {
  id: string;
  accountId: string;
  name: string;
  avatarId: AvatarId;
  birthDate: string | null;
  lastActiveAt: string | null;
  createdAt: string;
}

// 학습 이벤트 타입은 `types/learning-events.ts`로 이관 (snake_case + metadata 강타입)
