export type StarSourceType =
  // earn
  | 'page_read'
  | 'game_correct'
  | 'game_perfect'
  | 'phonics_complete'
  | 'daily_login'
  | 'streak_bonus'
  | 'weekly_mission'
  | 'card_unlock'
  // spend
  | 'hori_item'
  | 'foil_card'
  | 'season_costume';

export interface StarLedgerEntry {
  id: string;
  profile_id: string;
  delta: number;
  source_type: StarSourceType;
  source_id: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

export interface StarBalance {
  profile_id: string;
  stars_total: number;
  streak_days: number;
  last_active_date: string | null;
}
