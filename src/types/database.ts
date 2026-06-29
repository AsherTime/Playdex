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
  source_type: "rss" | "website" | "steam";
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
        Insert: Omit<NewsItemRow, "id" | "created_at" | "updated_at" | "collected_at" | "summary" | "image_url" | "external_id" | "tags" | "category"> &
          Partial<Pick<NewsItemRow, "id" | "created_at" | "updated_at" | "collected_at" | "summary" | "image_url" | "external_id" | "tags" | "category">>;
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
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
