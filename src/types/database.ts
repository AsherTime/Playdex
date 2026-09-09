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
  app_role: "user" | "writer" | "admin";
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

type GuideSourceRow = {
  id: string;
  game_id: string;
  source_site: "nanoka" | "icy-veins" | "ign" | "manual";
  source_type: "roster" | "kit" | "build" | "team";
  name: string;
  base_url: string;
  enabled: boolean;
  status: "pending" | "healthy" | "partial" | "missing" | "failed" | "disabled";
  last_checked_at: string | null;
  last_success_at: string | null;
  last_error: string | null;
  metadata: Json;
  created_at: string;
  updated_at: string;
};

type GameCharacterRow = {
  id: string;
  game_id: string;
  slug: string;
  name: string;
  display_name: string;
  source_character_id: string | null;
  rarity: number | null;
  element: string | null;
  weapon_type: string | null;
  release_date: string | null;
  icon_key: string | null;
  portrait_url: string | null;
  is_playable: boolean;
  metadata: Json;
  created_at: string;
  updated_at: string;
};

type CharacterAliasRow = {
  id: string;
  character_id: string;
  game_id: string;
  alias: string;
  normalized_alias: string;
  source_site: string;
  source_character_id: string | null;
  source_slug: string | null;
  source_url: string | null;
  created_at: string;
};

type CharacterGuideSourceRecordRow = {
  id: string;
  game_id: string;
  character_id: string | null;
  guide_source_id: string | null;
  source_site: "nanoka" | "icy-veins" | "ign" | "manual";
  source_type: "roster" | "kit" | "build" | "team";
  source_url: string;
  source_character_id: string | null;
  source_slug: string | null;
  status: "success" | "partial" | "missing" | "failed";
  content_hash: string | null;
  error: string | null;
  missing_fields: string[];
  metadata: Json;
  imported_at: string;
  last_checked_at: string;
  updated_at: string;
};

type CharacterKitRow = {
  id: string;
  character_id: string;
  guide_source_record_id: string | null;
  source_site: string;
  source_url: string;
  source_version: string | null;
  normal_attack: Json;
  elemental_skill: Json;
  elemental_burst: Json;
  passive_talents: Json;
  constellations: Json;
  rule_terms: Json;
  imported_at: string;
  last_checked_at: string;
  updated_at: string;
};

type CharacterBuildRow = {
  id: string;
  character_id: string;
  guide_source_record_id: string | null;
  source_site: string;
  source_url: string;
  build_name: string;
  role: string | null;
  patch: string | null;
  best_weapons: Json;
  alternative_weapons: Json;
  f2p_weapons: Json;
  best_artifacts: Json;
  alternative_artifacts: Json;
  main_stats: Json;
  substat_priority: Json;
  talent_priority: Json;
  energy_recharge: string | null;
  rotation: Json;
  rotation_playstyle: string | null;
  structured_sections: Json;
  imported_at: string;
  last_checked_at: string;
  updated_at: string;
};

type GuideRevisionStatus = "draft" | "pending_review" | "approved" | "published" | "rejected";

type GuideRevisionRow = {
  id: string;
  game_id: string;
  character_id: string;
  author_user_id: string;
  status: GuideRevisionStatus;
  title: string | null;
  sections_changed: string[];
  base_kit: Json;
  draft_kit: Json;
  base_build: Json;
  draft_build: Json;
  base_teams: Json;
  draft_teams: Json;
  base_version: Json;
  submitted_at: string | null;
  reviewed_at: string | null;
  reviewed_by: string | null;
  review_note: string | null;
  published_at: string | null;
  created_at: string;
  updated_at: string;
};

type CharacterTeamCompRow = {
  id: string;
  character_id: string;
  guide_source_record_id: string | null;
  source_site: string;
  source_url: string;
  team_name: string | null;
  team_type: string | null;
  rank_order: number;
  description: string | null;
  metadata: Json;
  imported_at: string;
  last_checked_at: string;
  updated_at: string;
};

type CharacterTeamMemberRow = {
  id: string;
  team_id: string;
  slot_number: number;
  character_id: string | null;
  character_name: string;
  role: string | null;
  is_flex: boolean;
  alternatives: string[];
  metadata: Json;
  created_at: string;
};

type GuideImportRunRow = {
  id: string;
  game_id: string | null;
  importer: string;
  scope: string;
  status: "running" | "completed" | "partial" | "failed";
  started_at: string;
  finished_at: string | null;
  processed_characters: number;
  successful_records: number;
  failed_records: number;
  errors: Json;
  report: Json;
  created_at: string;
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
          app_role?: "user" | "writer" | "admin";
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
      guide_sources: {
        Row: GuideSourceRow;
        Insert: Omit<GuideSourceRow, "created_at" | "updated_at"> &
          Partial<Pick<GuideSourceRow, "created_at" | "updated_at">>;
        Update: Partial<GuideSourceRow>;
        Relationships: [];
      };
      game_characters: {
        Row: GameCharacterRow;
        Insert: Omit<GameCharacterRow, "created_at" | "updated_at"> &
          Partial<Pick<GameCharacterRow, "created_at" | "updated_at">>;
        Update: Partial<GameCharacterRow>;
        Relationships: [];
      };
      character_aliases: {
        Row: CharacterAliasRow;
        Insert: Omit<CharacterAliasRow, "id" | "created_at"> &
          Partial<Pick<CharacterAliasRow, "id" | "created_at">>;
        Update: Partial<CharacterAliasRow>;
        Relationships: [];
      };
      character_guide_source_records: {
        Row: CharacterGuideSourceRecordRow;
        Insert: Omit<CharacterGuideSourceRecordRow, "imported_at" | "last_checked_at" | "updated_at"> &
          Partial<Pick<CharacterGuideSourceRecordRow, "imported_at" | "last_checked_at" | "updated_at">>;
        Update: Partial<CharacterGuideSourceRecordRow>;
        Relationships: [];
      };
      character_kits: {
        Row: CharacterKitRow;
        Insert: Omit<CharacterKitRow, "imported_at" | "last_checked_at" | "updated_at"> &
          Partial<Pick<CharacterKitRow, "imported_at" | "last_checked_at" | "updated_at">>;
        Update: Partial<CharacterKitRow>;
        Relationships: [];
      };
      character_builds: {
        Row: CharacterBuildRow;
        Insert: Omit<CharacterBuildRow, "imported_at" | "last_checked_at" | "updated_at"> &
          Partial<Pick<CharacterBuildRow, "imported_at" | "last_checked_at" | "updated_at" | "rotation_playstyle">>;
        Update: Partial<CharacterBuildRow>;
        Relationships: [];
      };
      character_team_comps: {
        Row: CharacterTeamCompRow;
        Insert: Omit<CharacterTeamCompRow, "imported_at" | "last_checked_at" | "updated_at"> &
          Partial<Pick<CharacterTeamCompRow, "imported_at" | "last_checked_at" | "updated_at">>;
        Update: Partial<CharacterTeamCompRow>;
        Relationships: [];
      };
      character_team_members: {
        Row: CharacterTeamMemberRow;
        Insert: Omit<CharacterTeamMemberRow, "id" | "created_at"> &
          Partial<Pick<CharacterTeamMemberRow, "id" | "created_at">>;
        Update: Partial<CharacterTeamMemberRow>;
        Relationships: [];
      };
      guide_import_runs: {
        Row: GuideImportRunRow;
        Insert: Omit<GuideImportRunRow, "id" | "started_at" | "created_at" | "processed_characters" | "successful_records" | "failed_records" | "errors" | "report" | "finished_at"> &
          Partial<Pick<GuideImportRunRow, "id" | "started_at" | "created_at" | "processed_characters" | "successful_records" | "failed_records" | "errors" | "report" | "finished_at">>;
        Update: Partial<GuideImportRunRow>;
        Relationships: [];
      };
      guide_revisions: {
        Row: GuideRevisionRow;
        Insert: Omit<
          GuideRevisionRow,
          | "id"
          | "status"
          | "sections_changed"
          | "base_version"
          | "submitted_at"
          | "reviewed_at"
          | "reviewed_by"
          | "review_note"
          | "published_at"
          | "created_at"
          | "updated_at"
        > &
          Partial<
            Pick<
              GuideRevisionRow,
              | "id"
              | "status"
              | "sections_changed"
              | "base_version"
              | "submitted_at"
              | "reviewed_at"
              | "reviewed_by"
              | "review_note"
              | "published_at"
              | "created_at"
              | "updated_at"
            >
          >;
        Update: Partial<Omit<GuideRevisionRow, "id" | "author_user_id" | "created_at">>;
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
