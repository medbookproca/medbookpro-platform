export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      audit_events: {
        Row: {
          action: string
          actor_profile_id: string | null
          after_metadata: Json | null
          before_metadata: Json | null
          clinic_id: string | null
          entity_id: string | null
          entity_type: string
          id: string
          ip_address: unknown
          location_id: string | null
          metadata: Json
          occurred_at: string
          organization_id: string | null
          outcome: string
          request_id: string | null
          retention_until: string | null
          security_event: boolean
          user_agent: string | null
        }
        Insert: {
          action: string
          actor_profile_id?: string | null
          after_metadata?: Json | null
          before_metadata?: Json | null
          clinic_id?: string | null
          entity_id?: string | null
          entity_type: string
          id?: string
          ip_address?: unknown
          location_id?: string | null
          metadata?: Json
          occurred_at?: string
          organization_id?: string | null
          outcome?: string
          request_id?: string | null
          retention_until?: string | null
          security_event?: boolean
          user_agent?: string | null
        }
        Update: {
          action?: string
          actor_profile_id?: string | null
          after_metadata?: Json | null
          before_metadata?: Json | null
          clinic_id?: string | null
          entity_id?: string | null
          entity_type?: string
          id?: string
          ip_address?: unknown
          location_id?: string | null
          metadata?: Json
          occurred_at?: string
          organization_id?: string | null
          outcome?: string
          request_id?: string | null
          retention_until?: string | null
          security_event?: boolean
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_events_actor_profile_id_fkey"
            columns: ["actor_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "audit_events_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "audit_events_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "audit_events_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      clinics: {
        Row: {
          archived_at: string | null
          archived_by: string | null
          created_at: string
          id: string
          name: string
          organization_id: string
          slug: string | null
          status: string
          timezone: string | null
          updated_at: string
        }
        Insert: {
          archived_at?: string | null
          archived_by?: string | null
          created_at?: string
          id?: string
          name: string
          organization_id: string
          slug?: string | null
          status?: string
          timezone?: string | null
          updated_at?: string
        }
        Update: {
          archived_at?: string | null
          archived_by?: string | null
          created_at?: string
          id?: string
          name?: string
          organization_id?: string
          slug?: string | null
          status?: string
          timezone?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "clinics_archived_by_fkey"
            columns: ["archived_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "clinics_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      invitations: {
        Row: {
          accepted_at: string | null
          accepted_by: string | null
          created_at: string
          email_normalized: string
          expires_at: string
          id: string
          invited_by: string
          organization_id: string
          proposed_access: Json
          revoked_at: string | null
          status: string
          target_profile_id: string | null
          token_digest: string
          updated_at: string
        }
        Insert: {
          accepted_at?: string | null
          accepted_by?: string | null
          created_at?: string
          email_normalized: string
          expires_at: string
          id?: string
          invited_by: string
          organization_id: string
          proposed_access?: Json
          revoked_at?: string | null
          status?: string
          target_profile_id?: string | null
          token_digest: string
          updated_at?: string
        }
        Update: {
          accepted_at?: string | null
          accepted_by?: string | null
          created_at?: string
          email_normalized?: string
          expires_at?: string
          id?: string
          invited_by?: string
          organization_id?: string
          proposed_access?: Json
          revoked_at?: string | null
          status?: string
          target_profile_id?: string | null
          token_digest?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "invitations_accepted_by_fkey"
            columns: ["accepted_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invitations_invited_by_fkey"
            columns: ["invited_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invitations_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invitations_target_profile_id_fkey"
            columns: ["target_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      locations: {
        Row: {
          address_line_1: string | null
          address_line_2: string | null
          archived_at: string | null
          archived_by: string | null
          city: string | null
          clinic_id: string
          country_code: string
          created_at: string
          id: string
          name: string
          organization_id: string
          postal_code: string | null
          province: string | null
          status: string
          timezone: string | null
          updated_at: string
        }
        Insert: {
          address_line_1?: string | null
          address_line_2?: string | null
          archived_at?: string | null
          archived_by?: string | null
          city?: string | null
          clinic_id: string
          country_code?: string
          created_at?: string
          id?: string
          name: string
          organization_id: string
          postal_code?: string | null
          province?: string | null
          status?: string
          timezone?: string | null
          updated_at?: string
        }
        Update: {
          address_line_1?: string | null
          address_line_2?: string | null
          archived_at?: string | null
          archived_by?: string | null
          city?: string | null
          clinic_id?: string
          country_code?: string
          created_at?: string
          id?: string
          name?: string
          organization_id?: string
          postal_code?: string | null
          province?: string | null
          status?: string
          timezone?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "locations_archived_by_fkey"
            columns: ["archived_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "locations_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "locations_clinic_organization_fk"
            columns: ["clinic_id", "organization_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id", "organization_id"]
          },
          {
            foreignKeyName: "locations_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      membership_clinic_scopes: {
        Row: {
          clinic_id: string
          created_at: string
          created_by: string | null
          id: string
          membership_id: string
          organization_id: string
        }
        Insert: {
          clinic_id: string
          created_at?: string
          created_by?: string | null
          id?: string
          membership_id: string
          organization_id: string
        }
        Update: {
          clinic_id?: string
          created_at?: string
          created_by?: string | null
          id?: string
          membership_id?: string
          organization_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "membership_clinic_scopes_clinic_fk"
            columns: ["clinic_id", "organization_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id", "organization_id"]
          },
          {
            foreignKeyName: "membership_clinic_scopes_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "membership_clinic_scopes_membership_fk"
            columns: ["membership_id", "organization_id"]
            isOneToOne: false
            referencedRelation: "organization_memberships"
            referencedColumns: ["id", "organization_id"]
          },
          {
            foreignKeyName: "membership_clinic_scopes_membership_id_fkey"
            columns: ["membership_id"]
            isOneToOne: false
            referencedRelation: "organization_memberships"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "membership_clinic_scopes_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      membership_location_scopes: {
        Row: {
          clinic_id: string
          created_at: string
          created_by: string | null
          id: string
          location_id: string
          membership_id: string
          organization_id: string
        }
        Insert: {
          clinic_id: string
          created_at?: string
          created_by?: string | null
          id?: string
          location_id: string
          membership_id: string
          organization_id: string
        }
        Update: {
          clinic_id?: string
          created_at?: string
          created_by?: string | null
          id?: string
          location_id?: string
          membership_id?: string
          organization_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "membership_location_scopes_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "membership_location_scopes_location_fk"
            columns: ["location_id", "clinic_id", "organization_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id", "clinic_id", "organization_id"]
          },
          {
            foreignKeyName: "membership_location_scopes_membership_fk"
            columns: ["membership_id", "organization_id"]
            isOneToOne: false
            referencedRelation: "organization_memberships"
            referencedColumns: ["id", "organization_id"]
          },
          {
            foreignKeyName: "membership_location_scopes_membership_id_fkey"
            columns: ["membership_id"]
            isOneToOne: false
            referencedRelation: "organization_memberships"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "membership_location_scopes_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      membership_roles: {
        Row: {
          assigned_by: string | null
          created_at: string
          expires_at: string | null
          id: string
          membership_id: string
          organization_id: string
          role_id: string
        }
        Insert: {
          assigned_by?: string | null
          created_at?: string
          expires_at?: string | null
          id?: string
          membership_id: string
          organization_id: string
          role_id: string
        }
        Update: {
          assigned_by?: string | null
          created_at?: string
          expires_at?: string | null
          id?: string
          membership_id?: string
          organization_id?: string
          role_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "membership_roles_assigned_by_fkey"
            columns: ["assigned_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "membership_roles_membership_fk"
            columns: ["membership_id", "organization_id"]
            isOneToOne: false
            referencedRelation: "organization_memberships"
            referencedColumns: ["id", "organization_id"]
          },
          {
            foreignKeyName: "membership_roles_membership_id_fkey"
            columns: ["membership_id"]
            isOneToOne: false
            referencedRelation: "organization_memberships"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "membership_roles_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "membership_roles_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_memberships: {
        Row: {
          accepted_at: string | null
          created_at: string
          id: string
          invited_at: string | null
          organization_id: string
          profile_id: string
          revoked_at: string | null
          status: string
          status_reason: string | null
          suspended_at: string | null
          updated_at: string
        }
        Insert: {
          accepted_at?: string | null
          created_at?: string
          id?: string
          invited_at?: string | null
          organization_id: string
          profile_id: string
          revoked_at?: string | null
          status?: string
          status_reason?: string | null
          suspended_at?: string | null
          updated_at?: string
        }
        Update: {
          accepted_at?: string | null
          created_at?: string
          id?: string
          invited_at?: string | null
          organization_id?: string
          profile_id?: string
          revoked_at?: string | null
          status?: string
          status_reason?: string | null
          suspended_at?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "organization_memberships_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_memberships_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          archived_at: string | null
          archived_by: string | null
          created_at: string
          default_country_code: string
          default_timezone: string
          id: string
          legal_name: string | null
          name: string
          slug: string
          status: string
          updated_at: string
        }
        Insert: {
          archived_at?: string | null
          archived_by?: string | null
          created_at?: string
          default_country_code?: string
          default_timezone?: string
          id?: string
          legal_name?: string | null
          name: string
          slug: string
          status?: string
          updated_at?: string
        }
        Update: {
          archived_at?: string | null
          archived_by?: string | null
          created_at?: string
          default_country_code?: string
          default_timezone?: string
          id?: string
          legal_name?: string | null
          name?: string
          slug?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "organizations_archived_by_fkey"
            columns: ["archived_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      permissions: {
        Row: {
          action: string
          created_at: string
          description: string
          domain: string
          id: string
          key: string
          status: string
          updated_at: string
        }
        Insert: {
          action: string
          created_at?: string
          description: string
          domain: string
          id?: string
          key: string
          status?: string
          updated_at?: string
        }
        Update: {
          action?: string
          created_at?: string
          description?: string
          domain?: string
          id?: string
          key?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          display_name: string | null
          id: string
          last_seen_at: string | null
          preferred_name: string | null
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          display_name?: string | null
          id: string
          last_seen_at?: string | null
          preferred_name?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          display_name?: string | null
          id?: string
          last_seen_at?: string | null
          preferred_name?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      role_permissions: {
        Row: {
          created_at: string
          created_by: string | null
          permission_id: string
          role_id: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          permission_id: string
          role_id: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          permission_id?: string
          role_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "role_permissions_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "role_permissions_permission_id_fkey"
            columns: ["permission_id"]
            isOneToOne: false
            referencedRelation: "permissions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "role_permissions_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["id"]
          },
        ]
      }
      roles: {
        Row: {
          archived_at: string | null
          archived_by: string | null
          created_at: string
          description: string | null
          id: string
          key: string
          kind: string
          name: string
          organization_id: string | null
          status: string
          updated_at: string
          version: number
        }
        Insert: {
          archived_at?: string | null
          archived_by?: string | null
          created_at?: string
          description?: string | null
          id?: string
          key: string
          kind: string
          name: string
          organization_id?: string | null
          status?: string
          updated_at?: string
          version?: number
        }
        Update: {
          archived_at?: string | null
          archived_by?: string | null
          created_at?: string
          description?: string | null
          id?: string
          key?: string
          kind?: string
          name?: string
          organization_id?: string | null
          status?: string
          updated_at?: string
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "roles_archived_by_fkey"
            columns: ["archived_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "roles_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      append_audit_event: {
        Args: {
          action: string
          actor_profile_id: string
          after_metadata: Json
          before_metadata: Json
          clinic_id: string
          entity_id: string
          entity_type: string
          ip_address: unknown
          location_id: string
          metadata: Json
          organization_id: string
          outcome: string
          request_id: string
          security_event: boolean
          user_agent: string
        }
        Returns: string
      }
      current_profile_id: { Args: never; Returns: string }
      has_active_membership: {
        Args: { target_organization_id: string }
        Returns: boolean
      }
      has_clinic_access: {
        Args: { target_clinic_id: string }
        Returns: boolean
      }
      has_location_access: {
        Args: { target_location_id: string }
        Returns: boolean
      }
      has_organization_access: {
        Args: { target_organization_id: string }
        Returns: boolean
      }
      has_permission: {
        Args: { required_permission: string; target_organization_id: string }
        Returns: boolean
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {},
  },
} as const

