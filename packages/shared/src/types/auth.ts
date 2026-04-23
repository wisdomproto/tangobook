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

export interface LearningEvent {
  id: string;
  profileId: string;
  eventType: string;
  storybookId: string | null;
  gameType: string | null;
  word: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
}

export interface LearningEventInsert {
  profile_id: string;
  event_type: string;
  storybook_id?: string | null;
  game_type?: string | null;
  word?: string | null;
  metadata?: Record<string, unknown> | null;
  created_at?: string;
}
