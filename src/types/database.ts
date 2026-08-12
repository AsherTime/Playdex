export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

type GameRow = {
  id: string;
  slug: string;
  title: string;
  genre: string;
  platforms: string[];
  release_date: string;
  cover_tone: string | null;
  description: string | null;
  latest_updates: string[];
  roadmap: string[];
  created_at: string;
  updated_at: string;
};

type GameSourceRow = {
  id: string;
  game_id: string | null;
  name: string;
  source_type: "rss" | "website" | "steam" | "trusted_site";
  url: string | null;
  external_ref: string | null;
  status: string;
  last_collected_at: string | null;
  last_error: string | null;
  cadence: string;
  cadence_minutes: number;
  enabled: boolean;
  tags: string[];
  created_at: string;
  updated_at: string;
};

type NewsItemRow = {
  id: string;
  game_id: string | null;
  title: string;
  summary: string;
  url: string;
  image_url: string | null;
  image_source_url: string | null;
  image_match_type: string | null;
  source_name: string;
  source_type: string;
  published_at: string;
  collected_at: string;
  external_id: string | null;
  content_hash: string;
  tags: string[];
  category: string;
  created_at: string;
  updated_at: string;
};

type CollectorRunRow = {
  id: string;
  collector: string;
  status: string;
  started_at: string;
  finished_at: string | null;
  processed_records: number;
  message: string | null;
  errors: Json;
  created_at: string;
};

type ProfileRow = {
  id: string;
  email: string;
  name: string | null;
  age: number | null;
  username: string | null;
  bio: string | null;
  avatar_url: string | null;
  profile_visibility: "public" | "private";
  show_playtime: boolean;
  show_weekly_playtime: boolean;
  show_recent_games: boolean;
  show_improvement_plan: boolean;
  show_favorite_games: boolean;
  show_streak: boolean;
  main_game_slug: string | null;
  show_platform: boolean;
  improvement_snapshot: import("@/lib/public-profile").ImprovementSnapshot | null;
  created_at: string;
  updated_at: string;
};

type UserFollowedGameRow = {
  id: string;
  user_id: string;
  game_slug: string;
  created_at: string;
};

type UserTrainingProgressRow = {
  id: string;
  user_id: string;
  game_slug: string;
  plan_day: number;
  task_id: string;
  task_title: string;
  is_completed: boolean;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
};

type UserGameUsageDailyRow = {
  id: string;
  user_id: string;
  usage_date: string;
  game_slug: string;
  playtime_seconds: number;
  session_count: number;
  last_played_at: string | null;
  source: string;
  created_at: string;
  updated_at: string;
};

export interface Database {
  public: {
    Tables: {
      games: {
        Row: GameRow;
        Insert: Omit<GameRow, "created_at" | "updated_at"> & Partial<Pick<GameRow, "created_at" | "updated_at">>;
        Update: Partial<GameRow>;
        Relationships: [];
      };
      game_metrics_daily: {
        Row: {
          id: string;
          game_id: string;
          metric_date: string;
          player_count: number;
          player_growth: number;
          twitch_viewers: number;
          twitch_growth: number;
          youtube_hype: number;
          reddit_activity: number;
          news_volume: number;
          release_hype: number;
          created_at: string;
        };
        Insert: {
          id: string;
          game_id: string;
          metric_date: string;
          player_count: number;
          player_growth: number;
          twitch_viewers: number;
          twitch_growth: number;
          youtube_hype: number;
          reddit_activity: number;
          news_volume: number;
          release_hype?: number;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["game_metrics_daily"]["Insert"]>;
        Relationships: [];
      };
      game_news: {
        Row: {
          id: string;
          game_id: string | null;
          title: string;
          source: string;
          game_tag: string;
          summary: string;
          category: string;
          published_at: string;
          created_at: string;
        };
        Insert: {
          id: string;
          game_id?: string | null;
          title: string;
          source: string;
          game_tag: string;
          summary: string;
          category: string;
          published_at: string;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["game_news"]["Insert"]>;
        Relationships: [];
      };
      game_sources: {
        Row: GameSourceRow;
        Insert: Omit<GameSourceRow, "created_at" | "updated_at" | "status" | "last_collected_at" | "last_error" | "cadence" | "cadence_minutes" | "enabled" | "tags" | "source_type"> &
          Partial<Pick<GameSourceRow, "created_at" | "updated_at" | "status" | "last_collected_at" | "last_error" | "cadence" | "cadence_minutes" | "enabled" | "tags" | "source_type">>;
        Update: Partial<GameSourceRow>;
        Relationships: [];
      };
      news_items: {
        Row: NewsItemRow;
        Insert: Omit<NewsItemRow, "id" | "created_at" | "updated_at" | "collected_at" | "summary" | "image_url" | "image_source_url" | "image_match_type" | "external_id" | "tags" | "category"> &
          Partial<Pick<NewsItemRow, "id" | "created_at" | "updated_at" | "collected_at" | "summary" | "image_url" | "image_source_url" | "image_match_type" | "external_id" | "tags" | "category">>;
        Update: Partial<NewsItemRow>;
        Relationships: [];
      };
      videos: {
        Row: {
          id: string;
          game_id: string | null;
          title: string;
          url: string;
          thumbnail_url: string | null;
          source_name: string;
          source_type: string;
          published_at: string | null;
          collected_at: string;
          external_id: string | null;
          content_hash: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          game_id?: string | null;
          title: string;
          url: string;
          thumbnail_url?: string | null;
          source_name: string;
          source_type?: string;
          published_at?: string | null;
          collected_at?: string;
          external_id?: string | null;
          content_hash: string;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["videos"]["Row"]>;
        Relationships: [];
      };
      collector_runs: {
        Row: CollectorRunRow;
        Insert: Omit<CollectorRunRow, "id" | "created_at" | "started_at" | "processed_records" | "errors" | "finished_at" | "message"> &
          Partial<Pick<CollectorRunRow, "id" | "created_at" | "started_at" | "processed_records" | "errors" | "finished_at" | "message">>;
        Update: Partial<CollectorRunRow>;
        Relationships: [];
      };
      trend_scores: {
        Row: {
          game_id: string;
          score: number;
          status: string;
          worth_trying_score: number;
          calculated_at: string;
        };
        Insert: {
          game_id: string;
          score: number;
          status: string;
          worth_trying_score: number;
          calculated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["trend_scores"]["Insert"]>;
        Relationships: [];
      };
      upcoming_games: {
        Row: {
          id: string;
          title: string;
          release_date: string;
          genre: string;
          platforms: string[];
          hype_score: number;
          wishlist_interest: number;
          trailer_url: string | null;
          news_url: string | null;
          created_at: string;
        };
        Insert: {
          id: string;
          title: string;
          release_date: string;
          genre: string;
          platforms?: string[];
          hype_score: number;
          wishlist_interest: number;
          trailer_url?: string | null;
          news_url?: string | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["upcoming_games"]["Insert"]>;
        Relationships: [];
      };
      profiles: {
        Row: ProfileRow;
        Insert: {
          id: string;
          email: string;
          name?: string | null;
          age?: number | null;
          username?: string | null;
          bio?: string | null;
          avatar_url?: string | null;
          profile_visibility?: "public" | "private";
          show_playtime?: boolean;
          show_weekly_playtime?: boolean;
          show_recent_games?: boolean;
          show_improvement_plan?: boolean;
          show_favorite_games?: boolean;
          show_streak?: boolean;
          main_game_slug?: string | null;
          show_platform?: boolean;
          improvement_snapshot?: ProfileRow["improvement_snapshot"];
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Omit<ProfileRow, "id">>;
        Relationships: [];
      };
      user_followed_games: {
        Row: UserFollowedGameRow;
        Insert: {
          id?: string;
          user_id: string;
          game_slug: string;
          created_at?: string;
        };
        Update: Partial<Omit<UserFollowedGameRow, "id">>;
        Relationships: [];
      };
      user_training_progress: {
        Row: UserTrainingProgressRow;
        Insert: {
          id?: string;
          user_id: string;
          game_slug: string;
          plan_day: number;
          task_id: string;
          task_title?: string;
          is_completed?: boolean;
          completed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Omit<UserTrainingProgressRow, "id">>;
        Relationships: [];
      };
      user_game_usage_daily: {
        Row: UserGameUsageDailyRow;
        Insert: {
          id?: string;
          user_id: string;
          usage_date: string;
          game_slug: string;
          playtime_seconds?: number;
          session_count?: number;
          last_played_at?: string | null;
          source?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Omit<UserGameUsageDailyRow, "id">>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      check_auth_email_status: {
        Args: {
          check_email: string;
        };
        Returns: "confirmed" | "unconfirmed" | "not_found";
      };
      get_gaming_usage_aggregates: {
        Args: {
          p_user_id: string;
          p_days?: number;
        };
        Returns: Array<{
          game_slug: string;
          total_playtime_seconds: number;
          last_played_at: string | null;
          active_days: number;
        }>;
      };
      get_gaming_usage_totals: {
        Args: {
          p_user_id: string;
          p_days?: number;
        };
        Returns: Array<{
          total_playtime_seconds: number;
          games_played: number;
          active_days: number;
        }>;
      };
      get_public_gaming_profile: {
        Args: {
          p_username: string;
        };
        Returns: import("@/lib/public-profile").PublicGamingProfile;
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
