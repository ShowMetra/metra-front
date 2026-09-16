export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];
export type HotelExperienceImpact = "significantly" | "somewhat" | "no_difference" | "no";
export type ShowStatus = "draft" | "published" | "archived";
export type PerformanceStatus = "scheduled" | "completed" | "cancelled";

export type Database = {
  public: {
    Tables: {
      organizations: {
        Row: { id: string; name: string; slug: string; created_at: string; updated_at: string; created_by: string | null };
        Insert: { name: string; slug: string; created_by?: string | null };
        Update: { name?: string; slug?: string };
        Relationships: [];
      };
      organization_members: {
        Row: { organization_id: string; user_id: string; role: "owner" | "admin" | "member"; created_at: string };
        Insert: { organization_id: string; user_id: string; role?: "owner" | "admin" | "member" };
        Update: { role?: "owner" | "admin" | "member" };
        Relationships: [];
      };
      shows: {
        Row: { id: string; organization_id: string; title: string; slug: string; description: string | null; status: ShowStatus; created_at: string; updated_at: string; created_by: string | null };
        Insert: { organization_id: string; title: string; slug: string; description?: string | null; status?: ShowStatus };
        Update: { title?: string; slug?: string; description?: string | null; status?: ShowStatus };
        Relationships: [];
      };
      performances: {
        Row: { id: string; show_id: string; starts_at: string; ends_at: string | null; timezone: string; venue_name: string | null; status: PerformanceStatus; created_at: string; updated_at: string; created_by: string | null };
        Insert: { show_id: string; starts_at: string; ends_at?: string | null; timezone?: string; venue_name?: string | null; status?: PerformanceStatus };
        Update: { starts_at?: string; ends_at?: string | null; timezone?: string; venue_name?: string | null; status?: PerformanceStatus };
        Relationships: [];
      };
      review_links: {
        Row: { id: string; performance_id: string; token: string; is_active: boolean; expires_at: string | null; created_at: string; updated_at: string; created_by: string | null };
        Insert: { performance_id: string; is_active?: boolean; expires_at?: string | null };
        Update: { is_active?: boolean; expires_at?: string | null };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      create_organization: { Args: { p_name: string; p_slug: string }; Returns: Database["public"]["Tables"]["organizations"]["Row"] };
      resolve_review_link: {
        Args: { p_token: string };
        Returns: Array<{ review_link_id: string; performance_id: string; show_id: string; show_title: string; show_description: string | null; starts_at: string; timezone: string; venue_name: string | null; organization_name: string }>;
      };
      submit_review: { Args: { p_token: string; p_hotel_experience_impact: HotelExperienceImpact; p_comment: string | null; p_ratings: Json }; Returns: string };
      get_show_rating_summary: { Args: { p_show_id: string }; Returns: Array<{ show_id: string; overall_rating: number | null; reviews_count: number }> };
      get_show_rating_breakdown: { Args: { p_show_id: string }; Returns: Array<{ criterion_code: string; criterion_name: string; sort_order: number; average_rating: number | null; ratings_count: number }> };
    };
    Enums: { hotel_experience_impact: HotelExperienceImpact; show_status: ShowStatus; performance_status: PerformanceStatus };
    CompositeTypes: Record<string, never>;
  };
};
