export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never;
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      graphql: {
        Args: {
          extensions?: Json;
          operationName?: string;
          query?: string;
          variables?: Json;
        };
        Returns: Json;
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
  public: {
    Tables: {
      appointment_buffers: {
        Row: {
          appointment_id: string;
          buffer_kind: string;
          created_at: string;
          id: string;
          minutes: number;
          organization_id: string;
        };
        Insert: {
          appointment_id: string;
          buffer_kind: string;
          created_at?: string;
          id?: string;
          minutes: number;
          organization_id: string;
        };
        Update: {
          appointment_id?: string;
          buffer_kind?: string;
          created_at?: string;
          id?: string;
          minutes?: number;
          organization_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'appointment_buffers_appointment_fk';
            columns: ['appointment_id', 'organization_id'];
            isOneToOne: false;
            referencedRelation: 'appointments';
            referencedColumns: ['id', 'organization_id'];
          },
          {
            foreignKeyName: 'appointment_buffers_organization_id_fkey';
            columns: ['organization_id'];
            isOneToOne: false;
            referencedRelation: 'organizations';
            referencedColumns: ['id'];
          },
        ];
      };
      appointment_recurrence_placeholders: {
        Row: {
          appointment_id: string;
          created_at: string;
          id: string;
          organization_id: string;
          recurrence_rule: string;
          recurrence_timezone: string;
          status: string;
        };
        Insert: {
          appointment_id: string;
          created_at?: string;
          id?: string;
          organization_id: string;
          recurrence_rule: string;
          recurrence_timezone: string;
          status?: string;
        };
        Update: {
          appointment_id?: string;
          created_at?: string;
          id?: string;
          organization_id?: string;
          recurrence_rule?: string;
          recurrence_timezone?: string;
          status?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'appointment_recurrence_appointment_fk';
            columns: ['appointment_id', 'organization_id'];
            isOneToOne: false;
            referencedRelation: 'appointments';
            referencedColumns: ['id', 'organization_id'];
          },
          {
            foreignKeyName: 'appointment_recurrence_placeholders_organization_id_fkey';
            columns: ['organization_id'];
            isOneToOne: false;
            referencedRelation: 'organizations';
            referencedColumns: ['id'];
          },
        ];
      };
      appointment_status_history: {
        Row: {
          appointment_id: string;
          changed_by: string | null;
          created_at: string;
          from_status: string | null;
          id: string;
          organization_id: string;
          reason: string | null;
          to_status: string;
        };
        Insert: {
          appointment_id: string;
          changed_by?: string | null;
          created_at?: string;
          from_status?: string | null;
          id?: string;
          organization_id: string;
          reason?: string | null;
          to_status: string;
        };
        Update: {
          appointment_id?: string;
          changed_by?: string | null;
          created_at?: string;
          from_status?: string | null;
          id?: string;
          organization_id?: string;
          reason?: string | null;
          to_status?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'appointment_status_history_appointment_fk';
            columns: ['appointment_id', 'organization_id'];
            isOneToOne: false;
            referencedRelation: 'appointments';
            referencedColumns: ['id', 'organization_id'];
          },
          {
            foreignKeyName: 'appointment_status_history_changed_by_fkey';
            columns: ['changed_by'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'appointment_status_history_organization_id_fkey';
            columns: ['organization_id'];
            isOneToOne: false;
            referencedRelation: 'organizations';
            referencedColumns: ['id'];
          },
        ];
      };
      appointment_waitlist_placeholders: {
        Row: {
          created_at: string;
          id: string;
          organization_id: string;
          patient_id: string | null;
          practitioner_id: string | null;
          preferred_end: string | null;
          preferred_start: string | null;
          service_id: string | null;
          status: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          organization_id: string;
          patient_id?: string | null;
          practitioner_id?: string | null;
          preferred_end?: string | null;
          preferred_start?: string | null;
          service_id?: string | null;
          status?: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          organization_id?: string;
          patient_id?: string | null;
          practitioner_id?: string | null;
          preferred_end?: string | null;
          preferred_start?: string | null;
          service_id?: string | null;
          status?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'appointment_waitlist_patient_fk';
            columns: ['patient_id', 'organization_id'];
            isOneToOne: false;
            referencedRelation: 'patients';
            referencedColumns: ['id', 'organization_id'];
          },
          {
            foreignKeyName: 'appointment_waitlist_placeholders_organization_id_fkey';
            columns: ['organization_id'];
            isOneToOne: false;
            referencedRelation: 'organizations';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'appointment_waitlist_practitioner_fk';
            columns: ['practitioner_id', 'organization_id'];
            isOneToOne: false;
            referencedRelation: 'practitioners';
            referencedColumns: ['id', 'organization_id'];
          },
          {
            foreignKeyName: 'appointment_waitlist_service_fk';
            columns: ['service_id', 'organization_id'];
            isOneToOne: false;
            referencedRelation: 'services';
            referencedColumns: ['id', 'organization_id'];
          },
        ];
      };
      appointments: {
        Row: {
          actual_end: string | null;
          actual_start: string | null;
          appointment_type: string;
          cancellation_reason: string | null;
          completed_at: string | null;
          created_at: string;
          created_by: string | null;
          delay_minutes: number | null;
          duration_minutes: number;
          id: string;
          location_id: string;
          notes: string | null;
          organization_id: string;
          patient_id: string;
          post_buffer_minutes: number;
          practitioner_id: string;
          pre_buffer_minutes: number;
          scheduled_end: string;
          scheduled_start: string;
          service_id: string;
          status: string;
          timezone: string;
          updated_at: string;
          updated_by: string | null;
        };
        Insert: {
          actual_end?: string | null;
          actual_start?: string | null;
          appointment_type?: string;
          cancellation_reason?: string | null;
          completed_at?: string | null;
          created_at?: string;
          created_by?: string | null;
          delay_minutes?: number | null;
          duration_minutes: number;
          id?: string;
          location_id: string;
          notes?: string | null;
          organization_id: string;
          patient_id: string;
          post_buffer_minutes?: number;
          practitioner_id: string;
          pre_buffer_minutes?: number;
          scheduled_end: string;
          scheduled_start: string;
          service_id: string;
          status?: string;
          timezone: string;
          updated_at?: string;
          updated_by?: string | null;
        };
        Update: {
          actual_end?: string | null;
          actual_start?: string | null;
          appointment_type?: string;
          cancellation_reason?: string | null;
          completed_at?: string | null;
          created_at?: string;
          created_by?: string | null;
          delay_minutes?: number | null;
          duration_minutes?: number;
          id?: string;
          location_id?: string;
          notes?: string | null;
          organization_id?: string;
          patient_id?: string;
          post_buffer_minutes?: number;
          practitioner_id?: string;
          pre_buffer_minutes?: number;
          scheduled_end?: string;
          scheduled_start?: string;
          service_id?: string;
          status?: string;
          timezone?: string;
          updated_at?: string;
          updated_by?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'appointments_created_by_fkey';
            columns: ['created_by'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'appointments_location_fk';
            columns: ['location_id', 'organization_id'];
            isOneToOne: false;
            referencedRelation: 'locations';
            referencedColumns: ['id', 'organization_id'];
          },
          {
            foreignKeyName: 'appointments_organization_id_fkey';
            columns: ['organization_id'];
            isOneToOne: false;
            referencedRelation: 'organizations';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'appointments_patient_fk';
            columns: ['patient_id', 'organization_id'];
            isOneToOne: false;
            referencedRelation: 'patients';
            referencedColumns: ['id', 'organization_id'];
          },
          {
            foreignKeyName: 'appointments_practitioner_fk';
            columns: ['practitioner_id', 'organization_id'];
            isOneToOne: false;
            referencedRelation: 'practitioners';
            referencedColumns: ['id', 'organization_id'];
          },
          {
            foreignKeyName: 'appointments_service_fk';
            columns: ['service_id', 'organization_id'];
            isOneToOne: false;
            referencedRelation: 'services';
            referencedColumns: ['id', 'organization_id'];
          },
          {
            foreignKeyName: 'appointments_updated_by_fkey';
            columns: ['updated_by'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      audit_events: {
        Row: {
          action: string;
          actor_profile_id: string | null;
          after_metadata: Json | null;
          before_metadata: Json | null;
          clinic_id: string | null;
          entity_id: string | null;
          entity_type: string;
          id: string;
          ip_address: unknown;
          location_id: string | null;
          metadata: Json;
          occurred_at: string;
          organization_id: string | null;
          outcome: string;
          request_id: string | null;
          retention_until: string | null;
          security_event: boolean;
          user_agent: string | null;
        };
        Insert: {
          action: string;
          actor_profile_id?: string | null;
          after_metadata?: Json | null;
          before_metadata?: Json | null;
          clinic_id?: string | null;
          entity_id?: string | null;
          entity_type: string;
          id?: string;
          ip_address?: unknown;
          location_id?: string | null;
          metadata?: Json;
          occurred_at?: string;
          organization_id?: string | null;
          outcome?: string;
          request_id?: string | null;
          retention_until?: string | null;
          security_event?: boolean;
          user_agent?: string | null;
        };
        Update: {
          action?: string;
          actor_profile_id?: string | null;
          after_metadata?: Json | null;
          before_metadata?: Json | null;
          clinic_id?: string | null;
          entity_id?: string | null;
          entity_type?: string;
          id?: string;
          ip_address?: unknown;
          location_id?: string | null;
          metadata?: Json;
          occurred_at?: string;
          organization_id?: string | null;
          outcome?: string;
          request_id?: string | null;
          retention_until?: string | null;
          security_event?: boolean;
          user_agent?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'audit_events_actor_profile_id_fkey';
            columns: ['actor_profile_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'audit_events_clinic_id_fkey';
            columns: ['clinic_id'];
            isOneToOne: false;
            referencedRelation: 'clinics';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'audit_events_location_id_fkey';
            columns: ['location_id'];
            isOneToOne: false;
            referencedRelation: 'locations';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'audit_events_organization_id_fkey';
            columns: ['organization_id'];
            isOneToOne: false;
            referencedRelation: 'organizations';
            referencedColumns: ['id'];
          },
        ];
      };
      care_plans: {
        Row: {
          created_at: string;
          created_by: string | null;
          encounter_id: string;
          follow_up_notes: string;
          goals: string;
          id: string;
          interventions: string;
          organization_id: string;
          patient_id: string;
          practitioner_id: string;
          review_date: string | null;
          status: string;
          updated_at: string;
          updated_by: string | null;
        };
        Insert: {
          created_at?: string;
          created_by?: string | null;
          encounter_id: string;
          follow_up_notes?: string;
          goals?: string;
          id?: string;
          interventions?: string;
          organization_id: string;
          patient_id: string;
          practitioner_id: string;
          review_date?: string | null;
          status?: string;
          updated_at?: string;
          updated_by?: string | null;
        };
        Update: {
          created_at?: string;
          created_by?: string | null;
          encounter_id?: string;
          follow_up_notes?: string;
          goals?: string;
          id?: string;
          interventions?: string;
          organization_id?: string;
          patient_id?: string;
          practitioner_id?: string;
          review_date?: string | null;
          status?: string;
          updated_at?: string;
          updated_by?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'care_plans_created_by_fkey';
            columns: ['created_by'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'care_plans_encounter_fk';
            columns: ['encounter_id', 'organization_id'];
            isOneToOne: false;
            referencedRelation: 'encounters';
            referencedColumns: ['id', 'organization_id'];
          },
          {
            foreignKeyName: 'care_plans_organization_id_fkey';
            columns: ['organization_id'];
            isOneToOne: false;
            referencedRelation: 'organizations';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'care_plans_patient_fk';
            columns: ['patient_id', 'organization_id'];
            isOneToOne: false;
            referencedRelation: 'patients';
            referencedColumns: ['id', 'organization_id'];
          },
          {
            foreignKeyName: 'care_plans_practitioner_fk';
            columns: ['practitioner_id', 'organization_id'];
            isOneToOne: false;
            referencedRelation: 'practitioners';
            referencedColumns: ['id', 'organization_id'];
          },
          {
            foreignKeyName: 'care_plans_updated_by_fkey';
            columns: ['updated_by'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      clinical_attachments: {
        Row: {
          created_at: string;
          encounter_id: string;
          filename: string;
          id: string;
          media_type: string;
          organization_id: string;
          size_bytes: number;
          storage_reference: string;
          updated_at: string;
          uploaded_by: string;
        };
        Insert: {
          created_at?: string;
          encounter_id: string;
          filename: string;
          id?: string;
          media_type: string;
          organization_id: string;
          size_bytes: number;
          storage_reference: string;
          updated_at?: string;
          uploaded_by: string;
        };
        Update: {
          created_at?: string;
          encounter_id?: string;
          filename?: string;
          id?: string;
          media_type?: string;
          organization_id?: string;
          size_bytes?: number;
          storage_reference?: string;
          updated_at?: string;
          uploaded_by?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'clinical_attachments_encounter_fk';
            columns: ['encounter_id', 'organization_id'];
            isOneToOne: false;
            referencedRelation: 'encounters';
            referencedColumns: ['id', 'organization_id'];
          },
          {
            foreignKeyName: 'clinical_attachments_organization_id_fkey';
            columns: ['organization_id'];
            isOneToOne: false;
            referencedRelation: 'organizations';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'clinical_attachments_uploaded_by_fkey';
            columns: ['uploaded_by'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      clinical_diagnoses: {
        Row: {
          code: string;
          coding_system: string;
          created_at: string;
          created_by: string | null;
          description: string;
          encounter_id: string;
          id: string;
          is_primary: boolean;
          organization_id: string;
          patient_id: string;
          updated_at: string;
          updated_by: string | null;
        };
        Insert: {
          code: string;
          coding_system: string;
          created_at?: string;
          created_by?: string | null;
          description: string;
          encounter_id: string;
          id?: string;
          is_primary?: boolean;
          organization_id: string;
          patient_id: string;
          updated_at?: string;
          updated_by?: string | null;
        };
        Update: {
          code?: string;
          coding_system?: string;
          created_at?: string;
          created_by?: string | null;
          description?: string;
          encounter_id?: string;
          id?: string;
          is_primary?: boolean;
          organization_id?: string;
          patient_id?: string;
          updated_at?: string;
          updated_by?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'clinical_diagnoses_created_by_fkey';
            columns: ['created_by'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'clinical_diagnoses_encounter_fk';
            columns: ['encounter_id', 'organization_id'];
            isOneToOne: false;
            referencedRelation: 'encounters';
            referencedColumns: ['id', 'organization_id'];
          },
          {
            foreignKeyName: 'clinical_diagnoses_organization_id_fkey';
            columns: ['organization_id'];
            isOneToOne: false;
            referencedRelation: 'organizations';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'clinical_diagnoses_patient_fk';
            columns: ['patient_id', 'organization_id'];
            isOneToOne: false;
            referencedRelation: 'patients';
            referencedColumns: ['id', 'organization_id'];
          },
          {
            foreignKeyName: 'clinical_diagnoses_updated_by_fkey';
            columns: ['updated_by'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      clinical_forms: {
        Row: {
          completion_status: string;
          created_at: string;
          created_by: string | null;
          encounter_id: string;
          form_type: string;
          id: string;
          organization_id: string;
          structured_response: Json;
          title: string;
          updated_at: string;
          updated_by: string | null;
          version: string;
        };
        Insert: {
          completion_status?: string;
          created_at?: string;
          created_by?: string | null;
          encounter_id: string;
          form_type: string;
          id?: string;
          organization_id: string;
          structured_response?: Json;
          title: string;
          updated_at?: string;
          updated_by?: string | null;
          version: string;
        };
        Update: {
          completion_status?: string;
          created_at?: string;
          created_by?: string | null;
          encounter_id?: string;
          form_type?: string;
          id?: string;
          organization_id?: string;
          structured_response?: Json;
          title?: string;
          updated_at?: string;
          updated_by?: string | null;
          version?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'clinical_forms_created_by_fkey';
            columns: ['created_by'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'clinical_forms_encounter_fk';
            columns: ['encounter_id', 'organization_id'];
            isOneToOne: false;
            referencedRelation: 'encounters';
            referencedColumns: ['id', 'organization_id'];
          },
          {
            foreignKeyName: 'clinical_forms_organization_id_fkey';
            columns: ['organization_id'];
            isOneToOne: false;
            referencedRelation: 'organizations';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'clinical_forms_updated_by_fkey';
            columns: ['updated_by'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      clinical_procedures: {
        Row: {
          code: string;
          created_at: string;
          created_by: string | null;
          description: string;
          encounter_id: string;
          id: string;
          organization_id: string;
          patient_id: string;
          performed_date: string;
          practitioner_id: string;
          updated_at: string;
          updated_by: string | null;
        };
        Insert: {
          code: string;
          created_at?: string;
          created_by?: string | null;
          description: string;
          encounter_id: string;
          id?: string;
          organization_id: string;
          patient_id: string;
          performed_date: string;
          practitioner_id: string;
          updated_at?: string;
          updated_by?: string | null;
        };
        Update: {
          code?: string;
          created_at?: string;
          created_by?: string | null;
          description?: string;
          encounter_id?: string;
          id?: string;
          organization_id?: string;
          patient_id?: string;
          performed_date?: string;
          practitioner_id?: string;
          updated_at?: string;
          updated_by?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'clinical_procedures_created_by_fkey';
            columns: ['created_by'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'clinical_procedures_encounter_fk';
            columns: ['encounter_id', 'organization_id'];
            isOneToOne: false;
            referencedRelation: 'encounters';
            referencedColumns: ['id', 'organization_id'];
          },
          {
            foreignKeyName: 'clinical_procedures_organization_id_fkey';
            columns: ['organization_id'];
            isOneToOne: false;
            referencedRelation: 'organizations';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'clinical_procedures_patient_fk';
            columns: ['patient_id', 'organization_id'];
            isOneToOne: false;
            referencedRelation: 'patients';
            referencedColumns: ['id', 'organization_id'];
          },
          {
            foreignKeyName: 'clinical_procedures_practitioner_fk';
            columns: ['practitioner_id', 'organization_id'];
            isOneToOne: false;
            referencedRelation: 'practitioners';
            referencedColumns: ['id', 'organization_id'];
          },
          {
            foreignKeyName: 'clinical_procedures_updated_by_fkey';
            columns: ['updated_by'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      clinics: {
        Row: {
          archived_at: string | null;
          archived_by: string | null;
          created_at: string;
          id: string;
          name: string;
          organization_id: string;
          slug: string | null;
          status: string;
          timezone: string | null;
          updated_at: string;
        };
        Insert: {
          archived_at?: string | null;
          archived_by?: string | null;
          created_at?: string;
          id?: string;
          name: string;
          organization_id: string;
          slug?: string | null;
          status?: string;
          timezone?: string | null;
          updated_at?: string;
        };
        Update: {
          archived_at?: string | null;
          archived_by?: string | null;
          created_at?: string;
          id?: string;
          name?: string;
          organization_id?: string;
          slug?: string | null;
          status?: string;
          timezone?: string | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'clinics_archived_by_fkey';
            columns: ['archived_by'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'clinics_organization_id_fkey';
            columns: ['organization_id'];
            isOneToOne: false;
            referencedRelation: 'organizations';
            referencedColumns: ['id'];
          },
        ];
      };
      encounter_status_history: {
        Row: {
          changed_by: string | null;
          created_at: string;
          encounter_id: string;
          from_status: string | null;
          id: string;
          organization_id: string;
          reason: string | null;
          to_status: string;
        };
        Insert: {
          changed_by?: string | null;
          created_at?: string;
          encounter_id: string;
          from_status?: string | null;
          id?: string;
          organization_id: string;
          reason?: string | null;
          to_status: string;
        };
        Update: {
          changed_by?: string | null;
          created_at?: string;
          encounter_id?: string;
          from_status?: string | null;
          id?: string;
          organization_id?: string;
          reason?: string | null;
          to_status?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'encounter_status_history_changed_by_fkey';
            columns: ['changed_by'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'encounter_status_history_encounter_fk';
            columns: ['encounter_id', 'organization_id'];
            isOneToOne: false;
            referencedRelation: 'encounters';
            referencedColumns: ['id', 'organization_id'];
          },
          {
            foreignKeyName: 'encounter_status_history_organization_id_fkey';
            columns: ['organization_id'];
            isOneToOne: false;
            referencedRelation: 'organizations';
            referencedColumns: ['id'];
          },
        ];
      };
      encounters: {
        Row: {
          appointment_id: string | null;
          archived_at: string | null;
          completed_at: string | null;
          created_at: string;
          created_by: string | null;
          encounter_type: string;
          id: string;
          organization_id: string;
          patient_id: string;
          practitioner_id: string;
          started_at: string | null;
          status: string;
          updated_at: string;
          updated_by: string | null;
        };
        Insert: {
          appointment_id?: string | null;
          archived_at?: string | null;
          completed_at?: string | null;
          created_at?: string;
          created_by?: string | null;
          encounter_type?: string;
          id?: string;
          organization_id: string;
          patient_id: string;
          practitioner_id: string;
          started_at?: string | null;
          status?: string;
          updated_at?: string;
          updated_by?: string | null;
        };
        Update: {
          appointment_id?: string | null;
          archived_at?: string | null;
          completed_at?: string | null;
          created_at?: string;
          created_by?: string | null;
          encounter_type?: string;
          id?: string;
          organization_id?: string;
          patient_id?: string;
          practitioner_id?: string;
          started_at?: string | null;
          status?: string;
          updated_at?: string;
          updated_by?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'encounters_appointment_fk';
            columns: ['appointment_id', 'organization_id'];
            isOneToOne: false;
            referencedRelation: 'appointments';
            referencedColumns: ['id', 'organization_id'];
          },
          {
            foreignKeyName: 'encounters_created_by_fkey';
            columns: ['created_by'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'encounters_organization_id_fkey';
            columns: ['organization_id'];
            isOneToOne: false;
            referencedRelation: 'organizations';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'encounters_patient_fk';
            columns: ['patient_id', 'organization_id'];
            isOneToOne: false;
            referencedRelation: 'patients';
            referencedColumns: ['id', 'organization_id'];
          },
          {
            foreignKeyName: 'encounters_practitioner_fk';
            columns: ['practitioner_id', 'organization_id'];
            isOneToOne: false;
            referencedRelation: 'practitioners';
            referencedColumns: ['id', 'organization_id'];
          },
          {
            foreignKeyName: 'encounters_updated_by_fkey';
            columns: ['updated_by'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      invitation_location_scopes: {
        Row: {
          clinic_id: string;
          created_at: string;
          id: string;
          invitation_id: string;
          location_id: string;
          organization_id: string;
        };
        Insert: {
          clinic_id: string;
          created_at?: string;
          id?: string;
          invitation_id: string;
          location_id: string;
          organization_id: string;
        };
        Update: {
          clinic_id?: string;
          created_at?: string;
          id?: string;
          invitation_id?: string;
          location_id?: string;
          organization_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'invitation_location_scopes_invitation_fk';
            columns: ['invitation_id', 'organization_id'];
            isOneToOne: false;
            referencedRelation: 'invitations';
            referencedColumns: ['id', 'organization_id'];
          },
          {
            foreignKeyName: 'invitation_location_scopes_location_fk';
            columns: ['location_id', 'clinic_id', 'organization_id'];
            isOneToOne: false;
            referencedRelation: 'locations';
            referencedColumns: ['id', 'clinic_id', 'organization_id'];
          },
          {
            foreignKeyName: 'invitation_location_scopes_organization_id_fkey';
            columns: ['organization_id'];
            isOneToOne: false;
            referencedRelation: 'organizations';
            referencedColumns: ['id'];
          },
        ];
      };
      invitation_role_assignments: {
        Row: {
          created_at: string;
          id: string;
          invitation_id: string;
          organization_id: string;
          role_id: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          invitation_id: string;
          organization_id: string;
          role_id: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          invitation_id?: string;
          organization_id?: string;
          role_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'invitation_role_assignments_invitation_fk';
            columns: ['invitation_id', 'organization_id'];
            isOneToOne: false;
            referencedRelation: 'invitations';
            referencedColumns: ['id', 'organization_id'];
          },
          {
            foreignKeyName: 'invitation_role_assignments_organization_id_fkey';
            columns: ['organization_id'];
            isOneToOne: false;
            referencedRelation: 'organizations';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'invitation_role_assignments_role_id_fkey';
            columns: ['role_id'];
            isOneToOne: false;
            referencedRelation: 'roles';
            referencedColumns: ['id'];
          },
        ];
      };
      invitations: {
        Row: {
          accepted_at: string | null;
          accepted_by: string | null;
          cancelled_at: string | null;
          cancelled_by: string | null;
          created_at: string;
          email_normalized: string;
          expires_at: string;
          id: string;
          idempotency_key: string | null;
          invited_by: string;
          last_sent_at: string | null;
          organization_id: string;
          proposed_access: Json;
          resend_count: number;
          revoked_at: string | null;
          status: string;
          target_profile_id: string | null;
          token_digest: string;
          updated_at: string;
        };
        Insert: {
          accepted_at?: string | null;
          accepted_by?: string | null;
          cancelled_at?: string | null;
          cancelled_by?: string | null;
          created_at?: string;
          email_normalized: string;
          expires_at: string;
          id?: string;
          idempotency_key?: string | null;
          invited_by: string;
          last_sent_at?: string | null;
          organization_id: string;
          proposed_access?: Json;
          resend_count?: number;
          revoked_at?: string | null;
          status?: string;
          target_profile_id?: string | null;
          token_digest: string;
          updated_at?: string;
        };
        Update: {
          accepted_at?: string | null;
          accepted_by?: string | null;
          cancelled_at?: string | null;
          cancelled_by?: string | null;
          created_at?: string;
          email_normalized?: string;
          expires_at?: string;
          id?: string;
          idempotency_key?: string | null;
          invited_by?: string;
          last_sent_at?: string | null;
          organization_id?: string;
          proposed_access?: Json;
          resend_count?: number;
          revoked_at?: string | null;
          status?: string;
          target_profile_id?: string | null;
          token_digest?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'invitations_accepted_by_fkey';
            columns: ['accepted_by'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'invitations_cancelled_by_fkey';
            columns: ['cancelled_by'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'invitations_invited_by_fkey';
            columns: ['invited_by'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'invitations_organization_id_fkey';
            columns: ['organization_id'];
            isOneToOne: false;
            referencedRelation: 'organizations';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'invitations_target_profile_id_fkey';
            columns: ['target_profile_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      locations: {
        Row: {
          address_line_1: string | null;
          address_line_2: string | null;
          archived_at: string | null;
          archived_by: string | null;
          city: string | null;
          clinic_id: string;
          code: string | null;
          country_code: string;
          created_at: string;
          email: string | null;
          id: string;
          location_type: string;
          name: string;
          operational_status: string;
          organization_id: string;
          phone: string | null;
          postal_code: string | null;
          province: string | null;
          province_or_state: string | null;
          public_booking_enabled: boolean;
          status: string;
          timezone: string | null;
          updated_at: string;
        };
        Insert: {
          address_line_1?: string | null;
          address_line_2?: string | null;
          archived_at?: string | null;
          archived_by?: string | null;
          city?: string | null;
          clinic_id: string;
          code?: string | null;
          country_code?: string;
          created_at?: string;
          email?: string | null;
          id?: string;
          location_type?: string;
          name: string;
          operational_status?: string;
          organization_id: string;
          phone?: string | null;
          postal_code?: string | null;
          province?: string | null;
          province_or_state?: string | null;
          public_booking_enabled?: boolean;
          status?: string;
          timezone?: string | null;
          updated_at?: string;
        };
        Update: {
          address_line_1?: string | null;
          address_line_2?: string | null;
          archived_at?: string | null;
          archived_by?: string | null;
          city?: string | null;
          clinic_id?: string;
          code?: string | null;
          country_code?: string;
          created_at?: string;
          email?: string | null;
          id?: string;
          location_type?: string;
          name?: string;
          operational_status?: string;
          organization_id?: string;
          phone?: string | null;
          postal_code?: string | null;
          province?: string | null;
          province_or_state?: string | null;
          public_booking_enabled?: boolean;
          status?: string;
          timezone?: string | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'locations_archived_by_fkey';
            columns: ['archived_by'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'locations_clinic_id_fkey';
            columns: ['clinic_id'];
            isOneToOne: false;
            referencedRelation: 'clinics';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'locations_clinic_organization_fk';
            columns: ['clinic_id', 'organization_id'];
            isOneToOne: false;
            referencedRelation: 'clinics';
            referencedColumns: ['id', 'organization_id'];
          },
          {
            foreignKeyName: 'locations_organization_id_fkey';
            columns: ['organization_id'];
            isOneToOne: false;
            referencedRelation: 'organizations';
            referencedColumns: ['id'];
          },
        ];
      };
      membership_clinic_scopes: {
        Row: {
          clinic_id: string;
          created_at: string;
          created_by: string | null;
          id: string;
          membership_id: string;
          organization_id: string;
        };
        Insert: {
          clinic_id: string;
          created_at?: string;
          created_by?: string | null;
          id?: string;
          membership_id: string;
          organization_id: string;
        };
        Update: {
          clinic_id?: string;
          created_at?: string;
          created_by?: string | null;
          id?: string;
          membership_id?: string;
          organization_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'membership_clinic_scopes_clinic_fk';
            columns: ['clinic_id', 'organization_id'];
            isOneToOne: false;
            referencedRelation: 'clinics';
            referencedColumns: ['id', 'organization_id'];
          },
          {
            foreignKeyName: 'membership_clinic_scopes_created_by_fkey';
            columns: ['created_by'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'membership_clinic_scopes_membership_fk';
            columns: ['membership_id', 'organization_id'];
            isOneToOne: false;
            referencedRelation: 'organization_memberships';
            referencedColumns: ['id', 'organization_id'];
          },
          {
            foreignKeyName: 'membership_clinic_scopes_membership_id_fkey';
            columns: ['membership_id'];
            isOneToOne: false;
            referencedRelation: 'organization_memberships';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'membership_clinic_scopes_organization_id_fkey';
            columns: ['organization_id'];
            isOneToOne: false;
            referencedRelation: 'organizations';
            referencedColumns: ['id'];
          },
        ];
      };
      membership_location_scopes: {
        Row: {
          clinic_id: string;
          created_at: string;
          created_by: string | null;
          id: string;
          location_id: string;
          membership_id: string;
          organization_id: string;
        };
        Insert: {
          clinic_id: string;
          created_at?: string;
          created_by?: string | null;
          id?: string;
          location_id: string;
          membership_id: string;
          organization_id: string;
        };
        Update: {
          clinic_id?: string;
          created_at?: string;
          created_by?: string | null;
          id?: string;
          location_id?: string;
          membership_id?: string;
          organization_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'membership_location_scopes_created_by_fkey';
            columns: ['created_by'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'membership_location_scopes_location_fk';
            columns: ['location_id', 'clinic_id', 'organization_id'];
            isOneToOne: false;
            referencedRelation: 'locations';
            referencedColumns: ['id', 'clinic_id', 'organization_id'];
          },
          {
            foreignKeyName: 'membership_location_scopes_membership_fk';
            columns: ['membership_id', 'organization_id'];
            isOneToOne: false;
            referencedRelation: 'organization_memberships';
            referencedColumns: ['id', 'organization_id'];
          },
          {
            foreignKeyName: 'membership_location_scopes_membership_id_fkey';
            columns: ['membership_id'];
            isOneToOne: false;
            referencedRelation: 'organization_memberships';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'membership_location_scopes_organization_id_fkey';
            columns: ['organization_id'];
            isOneToOne: false;
            referencedRelation: 'organizations';
            referencedColumns: ['id'];
          },
        ];
      };
      membership_roles: {
        Row: {
          assigned_by: string | null;
          created_at: string;
          expires_at: string | null;
          id: string;
          membership_id: string;
          organization_id: string;
          role_id: string;
        };
        Insert: {
          assigned_by?: string | null;
          created_at?: string;
          expires_at?: string | null;
          id?: string;
          membership_id: string;
          organization_id: string;
          role_id: string;
        };
        Update: {
          assigned_by?: string | null;
          created_at?: string;
          expires_at?: string | null;
          id?: string;
          membership_id?: string;
          organization_id?: string;
          role_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'membership_roles_assigned_by_fkey';
            columns: ['assigned_by'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'membership_roles_membership_fk';
            columns: ['membership_id', 'organization_id'];
            isOneToOne: false;
            referencedRelation: 'organization_memberships';
            referencedColumns: ['id', 'organization_id'];
          },
          {
            foreignKeyName: 'membership_roles_membership_id_fkey';
            columns: ['membership_id'];
            isOneToOne: false;
            referencedRelation: 'organization_memberships';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'membership_roles_organization_id_fkey';
            columns: ['organization_id'];
            isOneToOne: false;
            referencedRelation: 'organizations';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'membership_roles_role_id_fkey';
            columns: ['role_id'];
            isOneToOne: false;
            referencedRelation: 'roles';
            referencedColumns: ['id'];
          },
        ];
      };
      organization_holidays: {
        Row: {
          created_at: string;
          created_by: string | null;
          holiday_date: string;
          id: string;
          location_id: string | null;
          name: string;
          organization_id: string;
          status: string;
          updated_at: string;
          updated_by: string | null;
        };
        Insert: {
          created_at?: string;
          created_by?: string | null;
          holiday_date: string;
          id?: string;
          location_id?: string | null;
          name: string;
          organization_id: string;
          status?: string;
          updated_at?: string;
          updated_by?: string | null;
        };
        Update: {
          created_at?: string;
          created_by?: string | null;
          holiday_date?: string;
          id?: string;
          location_id?: string | null;
          name?: string;
          organization_id?: string;
          status?: string;
          updated_at?: string;
          updated_by?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'organization_holiday_location_fk';
            columns: ['location_id', 'organization_id'];
            isOneToOne: false;
            referencedRelation: 'locations';
            referencedColumns: ['id', 'organization_id'];
          },
          {
            foreignKeyName: 'organization_holidays_created_by_fkey';
            columns: ['created_by'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'organization_holidays_organization_id_fkey';
            columns: ['organization_id'];
            isOneToOne: false;
            referencedRelation: 'organizations';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'organization_holidays_updated_by_fkey';
            columns: ['updated_by'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      organization_memberships: {
        Row: {
          accepted_at: string | null;
          created_at: string;
          id: string;
          invited_at: string | null;
          organization_id: string;
          profile_id: string;
          removed_at: string | null;
          removed_by: string | null;
          revoked_at: string | null;
          status: string;
          status_reason: string | null;
          suspended_at: string | null;
          updated_at: string;
        };
        Insert: {
          accepted_at?: string | null;
          created_at?: string;
          id?: string;
          invited_at?: string | null;
          organization_id: string;
          profile_id: string;
          removed_at?: string | null;
          removed_by?: string | null;
          revoked_at?: string | null;
          status?: string;
          status_reason?: string | null;
          suspended_at?: string | null;
          updated_at?: string;
        };
        Update: {
          accepted_at?: string | null;
          created_at?: string;
          id?: string;
          invited_at?: string | null;
          organization_id?: string;
          profile_id?: string;
          removed_at?: string | null;
          removed_by?: string | null;
          revoked_at?: string | null;
          status?: string;
          status_reason?: string | null;
          suspended_at?: string | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'organization_memberships_organization_id_fkey';
            columns: ['organization_id'];
            isOneToOne: false;
            referencedRelation: 'organizations';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'organization_memberships_profile_id_fkey';
            columns: ['profile_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'organization_memberships_removed_by_fkey';
            columns: ['removed_by'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      organization_onboarding_attempts: {
        Row: {
          created_at: string;
          id: string;
          idempotency_key: string;
          location_id: string;
          organization_id: string;
          request_id: string;
          requested_by_user_id: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          idempotency_key: string;
          location_id: string;
          organization_id: string;
          request_id?: string;
          requested_by_user_id: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          idempotency_key?: string;
          location_id?: string;
          organization_id?: string;
          request_id?: string;
          requested_by_user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'organization_onboarding_attempts_location_id_fkey';
            columns: ['location_id'];
            isOneToOne: false;
            referencedRelation: 'locations';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'organization_onboarding_attempts_organization_id_fkey';
            columns: ['organization_id'];
            isOneToOne: false;
            referencedRelation: 'organizations';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'organization_onboarding_attempts_requested_by_user_id_fkey';
            columns: ['requested_by_user_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      organizations: {
        Row: {
          archived_at: string | null;
          archived_by: string | null;
          created_at: string;
          created_by_user_id: string | null;
          default_country_code: string;
          default_currency: string;
          default_locale: string;
          default_timezone: string;
          display_name: string | null;
          id: string;
          legal_name: string | null;
          name: string;
          onboarding_status: string;
          slug: string;
          status: string;
          updated_at: string;
        };
        Insert: {
          archived_at?: string | null;
          archived_by?: string | null;
          created_at?: string;
          created_by_user_id?: string | null;
          default_country_code?: string;
          default_currency?: string;
          default_locale?: string;
          default_timezone?: string;
          display_name?: string | null;
          id?: string;
          legal_name?: string | null;
          name: string;
          onboarding_status?: string;
          slug: string;
          status?: string;
          updated_at?: string;
        };
        Update: {
          archived_at?: string | null;
          archived_by?: string | null;
          created_at?: string;
          created_by_user_id?: string | null;
          default_country_code?: string;
          default_currency?: string;
          default_locale?: string;
          default_timezone?: string;
          display_name?: string | null;
          id?: string;
          legal_name?: string | null;
          name?: string;
          onboarding_status?: string;
          slug?: string;
          status?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'organizations_archived_by_fkey';
            columns: ['archived_by'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'organizations_created_by_user_id_fkey';
            columns: ['created_by_user_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      patient_consents: {
        Row: {
          consent_date: string;
          consent_type: string;
          created_at: string;
          created_by: string | null;
          document_reference: string | null;
          id: string;
          organization_id: string;
          patient_id: string;
          updated_at: string;
          updated_by: string | null;
          version: string;
          withdrawn: boolean;
        };
        Insert: {
          consent_date: string;
          consent_type: string;
          created_at?: string;
          created_by?: string | null;
          document_reference?: string | null;
          id?: string;
          organization_id: string;
          patient_id: string;
          updated_at?: string;
          updated_by?: string | null;
          version: string;
          withdrawn?: boolean;
        };
        Update: {
          consent_date?: string;
          consent_type?: string;
          created_at?: string;
          created_by?: string | null;
          document_reference?: string | null;
          id?: string;
          organization_id?: string;
          patient_id?: string;
          updated_at?: string;
          updated_by?: string | null;
          version?: string;
          withdrawn?: boolean;
        };
        Relationships: [
          {
            foreignKeyName: 'patient_consents_created_by_fkey';
            columns: ['created_by'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'patient_consents_organization_id_fkey';
            columns: ['organization_id'];
            isOneToOne: false;
            referencedRelation: 'organizations';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'patient_consents_patient_fk';
            columns: ['patient_id', 'organization_id'];
            isOneToOne: false;
            referencedRelation: 'patients';
            referencedColumns: ['id', 'organization_id'];
          },
          {
            foreignKeyName: 'patient_consents_updated_by_fkey';
            columns: ['updated_by'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      patient_contacts: {
        Row: {
          address: string | null;
          alternate_phone: string | null;
          city: string | null;
          country: string;
          created_at: string;
          created_by: string | null;
          email: string | null;
          email_allowed: boolean;
          id: string;
          marketing_opt_in: boolean;
          organization_id: string;
          patient_id: string;
          phone: string | null;
          phone_allowed: boolean;
          postal_code: string | null;
          preferred_contact_method: string;
          province: string | null;
          reminder_preference: string | null;
          sms_allowed: boolean;
          updated_at: string;
          updated_by: string | null;
        };
        Insert: {
          address?: string | null;
          alternate_phone?: string | null;
          city?: string | null;
          country?: string;
          created_at?: string;
          created_by?: string | null;
          email?: string | null;
          email_allowed?: boolean;
          id?: string;
          marketing_opt_in?: boolean;
          organization_id: string;
          patient_id: string;
          phone?: string | null;
          phone_allowed?: boolean;
          postal_code?: string | null;
          preferred_contact_method?: string;
          province?: string | null;
          reminder_preference?: string | null;
          sms_allowed?: boolean;
          updated_at?: string;
          updated_by?: string | null;
        };
        Update: {
          address?: string | null;
          alternate_phone?: string | null;
          city?: string | null;
          country?: string;
          created_at?: string;
          created_by?: string | null;
          email?: string | null;
          email_allowed?: boolean;
          id?: string;
          marketing_opt_in?: boolean;
          organization_id?: string;
          patient_id?: string;
          phone?: string | null;
          phone_allowed?: boolean;
          postal_code?: string | null;
          preferred_contact_method?: string;
          province?: string | null;
          reminder_preference?: string | null;
          sms_allowed?: boolean;
          updated_at?: string;
          updated_by?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'patient_contacts_created_by_fkey';
            columns: ['created_by'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'patient_contacts_organization_id_fkey';
            columns: ['organization_id'];
            isOneToOne: false;
            referencedRelation: 'organizations';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'patient_contacts_patient_fk';
            columns: ['patient_id', 'organization_id'];
            isOneToOne: false;
            referencedRelation: 'patients';
            referencedColumns: ['id', 'organization_id'];
          },
          {
            foreignKeyName: 'patient_contacts_updated_by_fkey';
            columns: ['updated_by'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      patient_duplicate_flags: {
        Row: {
          created_at: string;
          created_by: string | null;
          id: string;
          match_reason: string;
          matched_patient_id: string;
          organization_id: string;
          patient_id: string;
          resolved_at: string | null;
          resolved_by: string | null;
          status: string;
        };
        Insert: {
          created_at?: string;
          created_by?: string | null;
          id?: string;
          match_reason: string;
          matched_patient_id: string;
          organization_id: string;
          patient_id: string;
          resolved_at?: string | null;
          resolved_by?: string | null;
          status?: string;
        };
        Update: {
          created_at?: string;
          created_by?: string | null;
          id?: string;
          match_reason?: string;
          matched_patient_id?: string;
          organization_id?: string;
          patient_id?: string;
          resolved_at?: string | null;
          resolved_by?: string | null;
          status?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'patient_duplicate_flag_matched_fk';
            columns: ['matched_patient_id', 'organization_id'];
            isOneToOne: false;
            referencedRelation: 'patients';
            referencedColumns: ['id', 'organization_id'];
          },
          {
            foreignKeyName: 'patient_duplicate_flag_patient_fk';
            columns: ['patient_id', 'organization_id'];
            isOneToOne: false;
            referencedRelation: 'patients';
            referencedColumns: ['id', 'organization_id'];
          },
          {
            foreignKeyName: 'patient_duplicate_flags_created_by_fkey';
            columns: ['created_by'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'patient_duplicate_flags_organization_id_fkey';
            columns: ['organization_id'];
            isOneToOne: false;
            referencedRelation: 'organizations';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'patient_duplicate_flags_resolved_by_fkey';
            columns: ['resolved_by'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      patient_emergency_contacts: {
        Row: {
          address: string | null;
          alternate_phone: string | null;
          created_at: string;
          created_by: string | null;
          email: string | null;
          id: string;
          is_primary: boolean;
          name: string;
          organization_id: string;
          patient_id: string;
          phone: string;
          relationship: string;
          status: string;
          updated_at: string;
          updated_by: string | null;
        };
        Insert: {
          address?: string | null;
          alternate_phone?: string | null;
          created_at?: string;
          created_by?: string | null;
          email?: string | null;
          id?: string;
          is_primary?: boolean;
          name: string;
          organization_id: string;
          patient_id: string;
          phone: string;
          relationship: string;
          status?: string;
          updated_at?: string;
          updated_by?: string | null;
        };
        Update: {
          address?: string | null;
          alternate_phone?: string | null;
          created_at?: string;
          created_by?: string | null;
          email?: string | null;
          id?: string;
          is_primary?: boolean;
          name?: string;
          organization_id?: string;
          patient_id?: string;
          phone?: string;
          relationship?: string;
          status?: string;
          updated_at?: string;
          updated_by?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'patient_emergency_contact_patient_fk';
            columns: ['patient_id', 'organization_id'];
            isOneToOne: false;
            referencedRelation: 'patients';
            referencedColumns: ['id', 'organization_id'];
          },
          {
            foreignKeyName: 'patient_emergency_contacts_created_by_fkey';
            columns: ['created_by'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'patient_emergency_contacts_organization_id_fkey';
            columns: ['organization_id'];
            isOneToOne: false;
            referencedRelation: 'organizations';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'patient_emergency_contacts_updated_by_fkey';
            columns: ['updated_by'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      patient_identifiers: {
        Row: {
          created_at: string;
          created_by: string | null;
          id: string;
          identifier_last4: string;
          identifier_type: string;
          identifier_value: string;
          is_primary: boolean;
          issuing_jurisdiction: string | null;
          organization_id: string;
          patient_id: string;
          status: string;
          updated_at: string;
          updated_by: string | null;
        };
        Insert: {
          created_at?: string;
          created_by?: string | null;
          id?: string;
          identifier_last4: string;
          identifier_type: string;
          identifier_value: string;
          is_primary?: boolean;
          issuing_jurisdiction?: string | null;
          organization_id: string;
          patient_id: string;
          status?: string;
          updated_at?: string;
          updated_by?: string | null;
        };
        Update: {
          created_at?: string;
          created_by?: string | null;
          id?: string;
          identifier_last4?: string;
          identifier_type?: string;
          identifier_value?: string;
          is_primary?: boolean;
          issuing_jurisdiction?: string | null;
          organization_id?: string;
          patient_id?: string;
          status?: string;
          updated_at?: string;
          updated_by?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'patient_identifiers_created_by_fkey';
            columns: ['created_by'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'patient_identifiers_organization_id_fkey';
            columns: ['organization_id'];
            isOneToOne: false;
            referencedRelation: 'organizations';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'patient_identifiers_patient_fk';
            columns: ['patient_id', 'organization_id'];
            isOneToOne: false;
            referencedRelation: 'patients';
            referencedColumns: ['id', 'organization_id'];
          },
          {
            foreignKeyName: 'patient_identifiers_updated_by_fkey';
            columns: ['updated_by'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      patient_insurance: {
        Row: {
          created_at: string;
          created_by: string | null;
          id: string;
          insurer_name: string;
          member_number: string | null;
          notes: string | null;
          organization_id: string;
          patient_id: string;
          policy_number: string | null;
          status: string;
          updated_at: string;
          updated_by: string | null;
        };
        Insert: {
          created_at?: string;
          created_by?: string | null;
          id?: string;
          insurer_name: string;
          member_number?: string | null;
          notes?: string | null;
          organization_id: string;
          patient_id: string;
          policy_number?: string | null;
          status?: string;
          updated_at?: string;
          updated_by?: string | null;
        };
        Update: {
          created_at?: string;
          created_by?: string | null;
          id?: string;
          insurer_name?: string;
          member_number?: string | null;
          notes?: string | null;
          organization_id?: string;
          patient_id?: string;
          policy_number?: string | null;
          status?: string;
          updated_at?: string;
          updated_by?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'patient_insurance_created_by_fkey';
            columns: ['created_by'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'patient_insurance_organization_id_fkey';
            columns: ['organization_id'];
            isOneToOne: false;
            referencedRelation: 'organizations';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'patient_insurance_patient_fk';
            columns: ['patient_id', 'organization_id'];
            isOneToOne: false;
            referencedRelation: 'patients';
            referencedColumns: ['id', 'organization_id'];
          },
          {
            foreignKeyName: 'patient_insurance_updated_by_fkey';
            columns: ['updated_by'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      patient_referrals: {
        Row: {
          created_at: string;
          created_by: string | null;
          id: string;
          organization_id: string;
          patient_id: string;
          referral_date: string | null;
          referral_notes: string | null;
          referral_source: string | null;
          referred_by: string | null;
          referred_by_practitioner_id: string | null;
          updated_at: string;
          updated_by: string | null;
        };
        Insert: {
          created_at?: string;
          created_by?: string | null;
          id?: string;
          organization_id: string;
          patient_id: string;
          referral_date?: string | null;
          referral_notes?: string | null;
          referral_source?: string | null;
          referred_by?: string | null;
          referred_by_practitioner_id?: string | null;
          updated_at?: string;
          updated_by?: string | null;
        };
        Update: {
          created_at?: string;
          created_by?: string | null;
          id?: string;
          organization_id?: string;
          patient_id?: string;
          referral_date?: string | null;
          referral_notes?: string | null;
          referral_source?: string | null;
          referred_by?: string | null;
          referred_by_practitioner_id?: string | null;
          updated_at?: string;
          updated_by?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'patient_referral_patient_fk';
            columns: ['patient_id', 'organization_id'];
            isOneToOne: false;
            referencedRelation: 'patients';
            referencedColumns: ['id', 'organization_id'];
          },
          {
            foreignKeyName: 'patient_referral_practitioner_fk';
            columns: ['referred_by_practitioner_id', 'organization_id'];
            isOneToOne: false;
            referencedRelation: 'practitioners';
            referencedColumns: ['id', 'organization_id'];
          },
          {
            foreignKeyName: 'patient_referrals_created_by_fkey';
            columns: ['created_by'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'patient_referrals_organization_id_fkey';
            columns: ['organization_id'];
            isOneToOne: false;
            referencedRelation: 'organizations';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'patient_referrals_updated_by_fkey';
            columns: ['updated_by'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      patient_relationships: {
        Row: {
          created_at: string;
          created_by: string | null;
          id: string;
          notes: string | null;
          organization_id: string;
          patient_id: string;
          related_patient_id: string;
          relationship_type: string;
          status: string;
          updated_at: string;
          updated_by: string | null;
        };
        Insert: {
          created_at?: string;
          created_by?: string | null;
          id?: string;
          notes?: string | null;
          organization_id: string;
          patient_id: string;
          related_patient_id: string;
          relationship_type: string;
          status?: string;
          updated_at?: string;
          updated_by?: string | null;
        };
        Update: {
          created_at?: string;
          created_by?: string | null;
          id?: string;
          notes?: string | null;
          organization_id?: string;
          patient_id?: string;
          related_patient_id?: string;
          relationship_type?: string;
          status?: string;
          updated_at?: string;
          updated_by?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'patient_relationship_patient_fk';
            columns: ['patient_id', 'organization_id'];
            isOneToOne: false;
            referencedRelation: 'patients';
            referencedColumns: ['id', 'organization_id'];
          },
          {
            foreignKeyName: 'patient_relationship_related_fk';
            columns: ['related_patient_id', 'organization_id'];
            isOneToOne: false;
            referencedRelation: 'patients';
            referencedColumns: ['id', 'organization_id'];
          },
          {
            foreignKeyName: 'patient_relationships_created_by_fkey';
            columns: ['created_by'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'patient_relationships_organization_id_fkey';
            columns: ['organization_id'];
            isOneToOne: false;
            referencedRelation: 'organizations';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'patient_relationships_updated_by_fkey';
            columns: ['updated_by'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      patients: {
        Row: {
          accessibility_notes: string | null;
          archived_at: string | null;
          archived_by: string | null;
          biological_sex: string;
          created_at: string;
          created_by: string | null;
          date_of_birth: string;
          first_name: string;
          gender_identity: string | null;
          id: string;
          interpreter_required: boolean;
          last_name: string;
          legal_name: string | null;
          marital_status: string;
          middle_name: string | null;
          non_clinical_notes: string | null;
          normalized_name: string;
          occupation: string | null;
          organization_id: string;
          patient_number: string;
          photo_reference: string | null;
          preferred_language: string;
          preferred_name: string | null;
          pronouns: string | null;
          status: string;
          updated_at: string;
          updated_by: string | null;
        };
        Insert: {
          accessibility_notes?: string | null;
          archived_at?: string | null;
          archived_by?: string | null;
          biological_sex: string;
          created_at?: string;
          created_by?: string | null;
          date_of_birth: string;
          first_name: string;
          gender_identity?: string | null;
          id?: string;
          interpreter_required?: boolean;
          last_name: string;
          legal_name?: string | null;
          marital_status: string;
          middle_name?: string | null;
          non_clinical_notes?: string | null;
          normalized_name: string;
          occupation?: string | null;
          organization_id: string;
          patient_number: string;
          photo_reference?: string | null;
          preferred_language: string;
          preferred_name?: string | null;
          pronouns?: string | null;
          status?: string;
          updated_at?: string;
          updated_by?: string | null;
        };
        Update: {
          accessibility_notes?: string | null;
          archived_at?: string | null;
          archived_by?: string | null;
          biological_sex?: string;
          created_at?: string;
          created_by?: string | null;
          date_of_birth?: string;
          first_name?: string;
          gender_identity?: string | null;
          id?: string;
          interpreter_required?: boolean;
          last_name?: string;
          legal_name?: string | null;
          marital_status?: string;
          middle_name?: string | null;
          non_clinical_notes?: string | null;
          normalized_name?: string;
          occupation?: string | null;
          organization_id?: string;
          patient_number?: string;
          photo_reference?: string | null;
          preferred_language?: string;
          preferred_name?: string | null;
          pronouns?: string | null;
          status?: string;
          updated_at?: string;
          updated_by?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'patients_archived_by_fkey';
            columns: ['archived_by'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'patients_created_by_fkey';
            columns: ['created_by'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'patients_organization_id_fkey';
            columns: ['organization_id'];
            isOneToOne: false;
            referencedRelation: 'organizations';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'patients_updated_by_fkey';
            columns: ['updated_by'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      permissions: {
        Row: {
          action: string;
          created_at: string;
          description: string;
          domain: string;
          id: string;
          key: string;
          status: string;
          updated_at: string;
        };
        Insert: {
          action: string;
          created_at?: string;
          description: string;
          domain: string;
          id?: string;
          key: string;
          status?: string;
          updated_at?: string;
        };
        Update: {
          action?: string;
          created_at?: string;
          description?: string;
          domain?: string;
          id?: string;
          key?: string;
          status?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      practitioner_availability_blocks: {
        Row: {
          capacity_hint: number;
          created_at: string;
          created_by: string | null;
          end_time: string;
          id: string;
          location_id: string | null;
          mode: string;
          organization_id: string;
          practitioner_id: string;
          service_id: string | null;
          start_time: string;
          template_id: string;
          updated_at: string;
          updated_by: string | null;
          weekday: number;
        };
        Insert: {
          capacity_hint?: number;
          created_at?: string;
          created_by?: string | null;
          end_time: string;
          id?: string;
          location_id?: string | null;
          mode?: string;
          organization_id: string;
          practitioner_id: string;
          service_id?: string | null;
          start_time: string;
          template_id: string;
          updated_at?: string;
          updated_by?: string | null;
          weekday: number;
        };
        Update: {
          capacity_hint?: number;
          created_at?: string;
          created_by?: string | null;
          end_time?: string;
          id?: string;
          location_id?: string | null;
          mode?: string;
          organization_id?: string;
          practitioner_id?: string;
          service_id?: string | null;
          start_time?: string;
          template_id?: string;
          updated_at?: string;
          updated_by?: string | null;
          weekday?: number;
        };
        Relationships: [
          {
            foreignKeyName: 'availability_block_location_fk';
            columns: ['location_id', 'organization_id'];
            isOneToOne: false;
            referencedRelation: 'locations';
            referencedColumns: ['id', 'organization_id'];
          },
          {
            foreignKeyName: 'availability_block_practitioner_fk';
            columns: ['practitioner_id', 'organization_id'];
            isOneToOne: false;
            referencedRelation: 'practitioners';
            referencedColumns: ['id', 'organization_id'];
          },
          {
            foreignKeyName: 'availability_block_service_fk';
            columns: ['service_id', 'organization_id'];
            isOneToOne: false;
            referencedRelation: 'services';
            referencedColumns: ['id', 'organization_id'];
          },
          {
            foreignKeyName: 'availability_block_template_fk';
            columns: ['template_id'];
            isOneToOne: false;
            referencedRelation: 'practitioner_availability_templates';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'practitioner_availability_blocks_created_by_fkey';
            columns: ['created_by'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'practitioner_availability_blocks_organization_id_fkey';
            columns: ['organization_id'];
            isOneToOne: false;
            referencedRelation: 'organizations';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'practitioner_availability_blocks_template_id_fkey';
            columns: ['template_id'];
            isOneToOne: false;
            referencedRelation: 'practitioner_availability_templates';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'practitioner_availability_blocks_updated_by_fkey';
            columns: ['updated_by'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      practitioner_availability_templates: {
        Row: {
          created_at: string;
          created_by: string | null;
          effective_from: string | null;
          effective_to: string | null;
          id: string;
          name: string;
          organization_id: string;
          practitioner_id: string;
          status: string;
          timezone: string;
          updated_at: string;
          updated_by: string | null;
        };
        Insert: {
          created_at?: string;
          created_by?: string | null;
          effective_from?: string | null;
          effective_to?: string | null;
          id?: string;
          name: string;
          organization_id: string;
          practitioner_id: string;
          status?: string;
          timezone: string;
          updated_at?: string;
          updated_by?: string | null;
        };
        Update: {
          created_at?: string;
          created_by?: string | null;
          effective_from?: string | null;
          effective_to?: string | null;
          id?: string;
          name?: string;
          organization_id?: string;
          practitioner_id?: string;
          status?: string;
          timezone?: string;
          updated_at?: string;
          updated_by?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'availability_template_practitioner_fk';
            columns: ['practitioner_id', 'organization_id'];
            isOneToOne: false;
            referencedRelation: 'practitioners';
            referencedColumns: ['id', 'organization_id'];
          },
          {
            foreignKeyName: 'practitioner_availability_templates_created_by_fkey';
            columns: ['created_by'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'practitioner_availability_templates_organization_id_fkey';
            columns: ['organization_id'];
            isOneToOne: false;
            referencedRelation: 'organizations';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'practitioner_availability_templates_updated_by_fkey';
            columns: ['updated_by'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      practitioner_breaks: {
        Row: {
          block_id: string;
          created_at: string;
          created_by: string | null;
          end_time: string;
          id: string;
          label: string;
          organization_id: string;
          practitioner_id: string;
          start_time: string;
          updated_at: string;
          updated_by: string | null;
        };
        Insert: {
          block_id: string;
          created_at?: string;
          created_by?: string | null;
          end_time: string;
          id?: string;
          label: string;
          organization_id: string;
          practitioner_id: string;
          start_time: string;
          updated_at?: string;
          updated_by?: string | null;
        };
        Update: {
          block_id?: string;
          created_at?: string;
          created_by?: string | null;
          end_time?: string;
          id?: string;
          label?: string;
          organization_id?: string;
          practitioner_id?: string;
          start_time?: string;
          updated_at?: string;
          updated_by?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'practitioner_break_practitioner_fk';
            columns: ['practitioner_id', 'organization_id'];
            isOneToOne: false;
            referencedRelation: 'practitioners';
            referencedColumns: ['id', 'organization_id'];
          },
          {
            foreignKeyName: 'practitioner_breaks_block_id_fkey';
            columns: ['block_id'];
            isOneToOne: false;
            referencedRelation: 'practitioner_availability_blocks';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'practitioner_breaks_created_by_fkey';
            columns: ['created_by'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'practitioner_breaks_organization_id_fkey';
            columns: ['organization_id'];
            isOneToOne: false;
            referencedRelation: 'organizations';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'practitioner_breaks_updated_by_fkey';
            columns: ['updated_by'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      practitioner_credentials: {
        Row: {
          created_at: string;
          created_by: string | null;
          credential_type: string;
          document_reference: string | null;
          expiry_date: string | null;
          id: string;
          is_primary: boolean;
          issue_date: string | null;
          issuing_body: string | null;
          jurisdiction: string | null;
          notes: string | null;
          organization_id: string;
          practitioner_id: string;
          registration_number: string | null;
          status: string;
          updated_at: string;
          updated_by: string | null;
          verification_date: string | null;
          verification_status: string;
          verified_by: string | null;
        };
        Insert: {
          created_at?: string;
          created_by?: string | null;
          credential_type: string;
          document_reference?: string | null;
          expiry_date?: string | null;
          id?: string;
          is_primary?: boolean;
          issue_date?: string | null;
          issuing_body?: string | null;
          jurisdiction?: string | null;
          notes?: string | null;
          organization_id: string;
          practitioner_id: string;
          registration_number?: string | null;
          status?: string;
          updated_at?: string;
          updated_by?: string | null;
          verification_date?: string | null;
          verification_status?: string;
          verified_by?: string | null;
        };
        Update: {
          created_at?: string;
          created_by?: string | null;
          credential_type?: string;
          document_reference?: string | null;
          expiry_date?: string | null;
          id?: string;
          is_primary?: boolean;
          issue_date?: string | null;
          issuing_body?: string | null;
          jurisdiction?: string | null;
          notes?: string | null;
          organization_id?: string;
          practitioner_id?: string;
          registration_number?: string | null;
          status?: string;
          updated_at?: string;
          updated_by?: string | null;
          verification_date?: string | null;
          verification_status?: string;
          verified_by?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'practitioner_credential_practitioner_fk';
            columns: ['practitioner_id', 'organization_id'];
            isOneToOne: false;
            referencedRelation: 'practitioners';
            referencedColumns: ['id', 'organization_id'];
          },
          {
            foreignKeyName: 'practitioner_credentials_created_by_fkey';
            columns: ['created_by'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'practitioner_credentials_organization_id_fkey';
            columns: ['organization_id'];
            isOneToOne: false;
            referencedRelation: 'organizations';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'practitioner_credentials_updated_by_fkey';
            columns: ['updated_by'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'practitioner_credentials_verified_by_fkey';
            columns: ['verified_by'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      practitioner_languages: {
        Row: {
          created_at: string;
          created_by: string | null;
          id: string;
          is_primary: boolean;
          language_code: string;
          organization_id: string;
          practitioner_id: string;
          updated_at: string;
          updated_by: string | null;
        };
        Insert: {
          created_at?: string;
          created_by?: string | null;
          id?: string;
          is_primary?: boolean;
          language_code: string;
          organization_id: string;
          practitioner_id: string;
          updated_at?: string;
          updated_by?: string | null;
        };
        Update: {
          created_at?: string;
          created_by?: string | null;
          id?: string;
          is_primary?: boolean;
          language_code?: string;
          organization_id?: string;
          practitioner_id?: string;
          updated_at?: string;
          updated_by?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'practitioner_language_practitioner_fk';
            columns: ['practitioner_id', 'organization_id'];
            isOneToOne: false;
            referencedRelation: 'practitioners';
            referencedColumns: ['id', 'organization_id'];
          },
          {
            foreignKeyName: 'practitioner_languages_created_by_fkey';
            columns: ['created_by'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'practitioner_languages_organization_id_fkey';
            columns: ['organization_id'];
            isOneToOne: false;
            referencedRelation: 'organizations';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'practitioner_languages_updated_by_fkey';
            columns: ['updated_by'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      practitioner_location_assignments: {
        Row: {
          booking_visible: boolean;
          created_at: string;
          created_by: string | null;
          effective_from: string | null;
          effective_to: string | null;
          id: string;
          internal_notes: string | null;
          is_primary: boolean;
          location_id: string;
          organization_id: string;
          practitioner_id: string;
          status: string;
          updated_at: string;
          updated_by: string | null;
        };
        Insert: {
          booking_visible?: boolean;
          created_at?: string;
          created_by?: string | null;
          effective_from?: string | null;
          effective_to?: string | null;
          id?: string;
          internal_notes?: string | null;
          is_primary?: boolean;
          location_id: string;
          organization_id: string;
          practitioner_id: string;
          status?: string;
          updated_at?: string;
          updated_by?: string | null;
        };
        Update: {
          booking_visible?: boolean;
          created_at?: string;
          created_by?: string | null;
          effective_from?: string | null;
          effective_to?: string | null;
          id?: string;
          internal_notes?: string | null;
          is_primary?: boolean;
          location_id?: string;
          organization_id?: string;
          practitioner_id?: string;
          status?: string;
          updated_at?: string;
          updated_by?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'practitioner_location_assignment_location_fk';
            columns: ['location_id', 'organization_id'];
            isOneToOne: false;
            referencedRelation: 'locations';
            referencedColumns: ['id', 'organization_id'];
          },
          {
            foreignKeyName: 'practitioner_location_assignment_practitioner_fk';
            columns: ['practitioner_id', 'organization_id'];
            isOneToOne: false;
            referencedRelation: 'practitioners';
            referencedColumns: ['id', 'organization_id'];
          },
          {
            foreignKeyName: 'practitioner_location_assignments_created_by_fkey';
            columns: ['created_by'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'practitioner_location_assignments_organization_id_fkey';
            columns: ['organization_id'];
            isOneToOne: false;
            referencedRelation: 'organizations';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'practitioner_location_assignments_updated_by_fkey';
            columns: ['updated_by'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      practitioner_location_availability: {
        Row: {
          created_at: string;
          created_by: string | null;
          end_time: string;
          id: string;
          location_id: string;
          mode: string;
          organization_id: string;
          practitioner_id: string;
          start_time: string;
          updated_at: string;
          updated_by: string | null;
          weekday: number;
        };
        Insert: {
          created_at?: string;
          created_by?: string | null;
          end_time: string;
          id?: string;
          location_id: string;
          mode?: string;
          organization_id: string;
          practitioner_id: string;
          start_time: string;
          updated_at?: string;
          updated_by?: string | null;
          weekday: number;
        };
        Update: {
          created_at?: string;
          created_by?: string | null;
          end_time?: string;
          id?: string;
          location_id?: string;
          mode?: string;
          organization_id?: string;
          practitioner_id?: string;
          start_time?: string;
          updated_at?: string;
          updated_by?: string | null;
          weekday?: number;
        };
        Relationships: [
          {
            foreignKeyName: 'practitioner_location_availability_created_by_fkey';
            columns: ['created_by'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'practitioner_location_availability_location_fk';
            columns: ['location_id', 'organization_id'];
            isOneToOne: false;
            referencedRelation: 'locations';
            referencedColumns: ['id', 'organization_id'];
          },
          {
            foreignKeyName: 'practitioner_location_availability_organization_id_fkey';
            columns: ['organization_id'];
            isOneToOne: false;
            referencedRelation: 'organizations';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'practitioner_location_availability_practitioner_fk';
            columns: ['practitioner_id', 'organization_id'];
            isOneToOne: false;
            referencedRelation: 'practitioners';
            referencedColumns: ['id', 'organization_id'];
          },
          {
            foreignKeyName: 'practitioner_location_availability_updated_by_fkey';
            columns: ['updated_by'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      practitioner_public_profiles: {
        Row: {
          accepting_new_clients: boolean;
          booking_visibility: string;
          created_at: string;
          created_by: string | null;
          display_name: string | null;
          full_biography: string | null;
          id: string;
          organization_id: string;
          practitioner_id: string;
          professional_title: string | null;
          profile_image_reference: string | null;
          profile_slug: string | null;
          pronouns: string | null;
          seo_description: string | null;
          seo_title: string | null;
          short_biography: string | null;
          updated_at: string;
          updated_by: string | null;
          visibility_status: string;
        };
        Insert: {
          accepting_new_clients?: boolean;
          booking_visibility?: string;
          created_at?: string;
          created_by?: string | null;
          display_name?: string | null;
          full_biography?: string | null;
          id?: string;
          organization_id: string;
          practitioner_id: string;
          professional_title?: string | null;
          profile_image_reference?: string | null;
          profile_slug?: string | null;
          pronouns?: string | null;
          seo_description?: string | null;
          seo_title?: string | null;
          short_biography?: string | null;
          updated_at?: string;
          updated_by?: string | null;
          visibility_status?: string;
        };
        Update: {
          accepting_new_clients?: boolean;
          booking_visibility?: string;
          created_at?: string;
          created_by?: string | null;
          display_name?: string | null;
          full_biography?: string | null;
          id?: string;
          organization_id?: string;
          practitioner_id?: string;
          professional_title?: string | null;
          profile_image_reference?: string | null;
          profile_slug?: string | null;
          pronouns?: string | null;
          seo_description?: string | null;
          seo_title?: string | null;
          short_biography?: string | null;
          updated_at?: string;
          updated_by?: string | null;
          visibility_status?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'practitioner_public_profile_practitioner_fk';
            columns: ['practitioner_id', 'organization_id'];
            isOneToOne: false;
            referencedRelation: 'practitioners';
            referencedColumns: ['id', 'organization_id'];
          },
          {
            foreignKeyName: 'practitioner_public_profiles_created_by_fkey';
            columns: ['created_by'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'practitioner_public_profiles_organization_id_fkey';
            columns: ['organization_id'];
            isOneToOne: false;
            referencedRelation: 'organizations';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'practitioner_public_profiles_updated_by_fkey';
            columns: ['updated_by'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      practitioner_schedule_overrides: {
        Row: {
          created_at: string;
          created_by: string | null;
          end_time: string | null;
          id: string;
          kind: string;
          location_id: string | null;
          mode: string;
          organization_id: string;
          override_date: string;
          practitioner_id: string;
          reason: string | null;
          service_id: string | null;
          start_time: string | null;
          updated_at: string;
          updated_by: string | null;
        };
        Insert: {
          created_at?: string;
          created_by?: string | null;
          end_time?: string | null;
          id?: string;
          kind: string;
          location_id?: string | null;
          mode?: string;
          organization_id: string;
          override_date: string;
          practitioner_id: string;
          reason?: string | null;
          service_id?: string | null;
          start_time?: string | null;
          updated_at?: string;
          updated_by?: string | null;
        };
        Update: {
          created_at?: string;
          created_by?: string | null;
          end_time?: string | null;
          id?: string;
          kind?: string;
          location_id?: string | null;
          mode?: string;
          organization_id?: string;
          override_date?: string;
          practitioner_id?: string;
          reason?: string | null;
          service_id?: string | null;
          start_time?: string | null;
          updated_at?: string;
          updated_by?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'practitioner_override_location_fk';
            columns: ['location_id', 'organization_id'];
            isOneToOne: false;
            referencedRelation: 'locations';
            referencedColumns: ['id', 'organization_id'];
          },
          {
            foreignKeyName: 'practitioner_override_practitioner_fk';
            columns: ['practitioner_id', 'organization_id'];
            isOneToOne: false;
            referencedRelation: 'practitioners';
            referencedColumns: ['id', 'organization_id'];
          },
          {
            foreignKeyName: 'practitioner_override_service_fk';
            columns: ['service_id', 'organization_id'];
            isOneToOne: false;
            referencedRelation: 'services';
            referencedColumns: ['id', 'organization_id'];
          },
          {
            foreignKeyName: 'practitioner_schedule_overrides_created_by_fkey';
            columns: ['created_by'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'practitioner_schedule_overrides_organization_id_fkey';
            columns: ['organization_id'];
            isOneToOne: false;
            referencedRelation: 'organizations';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'practitioner_schedule_overrides_updated_by_fkey';
            columns: ['updated_by'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      practitioner_service_assignments: {
        Row: {
          created_at: string;
          created_by: string | null;
          display_order: number;
          id: string;
          internal_notes: string | null;
          location_id: string | null;
          organization_id: string;
          practitioner_id: string;
          service_id: string;
          status: string;
          updated_at: string;
          updated_by: string | null;
        };
        Insert: {
          created_at?: string;
          created_by?: string | null;
          display_order?: number;
          id?: string;
          internal_notes?: string | null;
          location_id?: string | null;
          organization_id: string;
          practitioner_id: string;
          service_id: string;
          status?: string;
          updated_at?: string;
          updated_by?: string | null;
        };
        Update: {
          created_at?: string;
          created_by?: string | null;
          display_order?: number;
          id?: string;
          internal_notes?: string | null;
          location_id?: string | null;
          organization_id?: string;
          practitioner_id?: string;
          service_id?: string;
          status?: string;
          updated_at?: string;
          updated_by?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'practitioner_service_assignment_location_fk';
            columns: ['location_id', 'organization_id'];
            isOneToOne: false;
            referencedRelation: 'locations';
            referencedColumns: ['id', 'organization_id'];
          },
          {
            foreignKeyName: 'practitioner_service_assignment_practitioner_fk';
            columns: ['practitioner_id', 'organization_id'];
            isOneToOne: false;
            referencedRelation: 'practitioners';
            referencedColumns: ['id', 'organization_id'];
          },
          {
            foreignKeyName: 'practitioner_service_assignment_service_fk';
            columns: ['service_id', 'organization_id'];
            isOneToOne: false;
            referencedRelation: 'services';
            referencedColumns: ['id', 'organization_id'];
          },
          {
            foreignKeyName: 'practitioner_service_assignments_created_by_fkey';
            columns: ['created_by'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'practitioner_service_assignments_organization_id_fkey';
            columns: ['organization_id'];
            isOneToOne: false;
            referencedRelation: 'organizations';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'practitioner_service_assignments_updated_by_fkey';
            columns: ['updated_by'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      practitioner_service_availability: {
        Row: {
          created_at: string;
          created_by: string | null;
          end_time: string;
          id: string;
          location_id: string | null;
          mode: string;
          organization_id: string;
          practitioner_id: string;
          service_id: string;
          start_time: string;
          updated_at: string;
          updated_by: string | null;
          weekday: number;
        };
        Insert: {
          created_at?: string;
          created_by?: string | null;
          end_time: string;
          id?: string;
          location_id?: string | null;
          mode?: string;
          organization_id: string;
          practitioner_id: string;
          service_id: string;
          start_time: string;
          updated_at?: string;
          updated_by?: string | null;
          weekday: number;
        };
        Update: {
          created_at?: string;
          created_by?: string | null;
          end_time?: string;
          id?: string;
          location_id?: string | null;
          mode?: string;
          organization_id?: string;
          practitioner_id?: string;
          service_id?: string;
          start_time?: string;
          updated_at?: string;
          updated_by?: string | null;
          weekday?: number;
        };
        Relationships: [
          {
            foreignKeyName: 'practitioner_service_availability_created_by_fkey';
            columns: ['created_by'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'practitioner_service_availability_location_fk';
            columns: ['location_id', 'organization_id'];
            isOneToOne: false;
            referencedRelation: 'locations';
            referencedColumns: ['id', 'organization_id'];
          },
          {
            foreignKeyName: 'practitioner_service_availability_organization_id_fkey';
            columns: ['organization_id'];
            isOneToOne: false;
            referencedRelation: 'organizations';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'practitioner_service_availability_practitioner_fk';
            columns: ['practitioner_id', 'organization_id'];
            isOneToOne: false;
            referencedRelation: 'practitioners';
            referencedColumns: ['id', 'organization_id'];
          },
          {
            foreignKeyName: 'practitioner_service_availability_service_fk';
            columns: ['service_id', 'organization_id'];
            isOneToOne: false;
            referencedRelation: 'services';
            referencedColumns: ['id', 'organization_id'];
          },
          {
            foreignKeyName: 'practitioner_service_availability_updated_by_fkey';
            columns: ['updated_by'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      practitioner_specialty_assignments: {
        Row: {
          created_at: string;
          created_by: string | null;
          display_order: number;
          id: string;
          is_primary: boolean;
          organization_id: string;
          practitioner_id: string;
          specialty_id: string;
          status: string;
          updated_at: string;
          updated_by: string | null;
        };
        Insert: {
          created_at?: string;
          created_by?: string | null;
          display_order?: number;
          id?: string;
          is_primary?: boolean;
          organization_id: string;
          practitioner_id: string;
          specialty_id: string;
          status?: string;
          updated_at?: string;
          updated_by?: string | null;
        };
        Update: {
          created_at?: string;
          created_by?: string | null;
          display_order?: number;
          id?: string;
          is_primary?: boolean;
          organization_id?: string;
          practitioner_id?: string;
          specialty_id?: string;
          status?: string;
          updated_at?: string;
          updated_by?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'practitioner_specialty_assignment_practitioner_fk';
            columns: ['practitioner_id', 'organization_id'];
            isOneToOne: false;
            referencedRelation: 'practitioners';
            referencedColumns: ['id', 'organization_id'];
          },
          {
            foreignKeyName: 'practitioner_specialty_assignment_specialty_fk';
            columns: ['specialty_id', 'organization_id'];
            isOneToOne: false;
            referencedRelation: 'specialties';
            referencedColumns: ['id', 'organization_id'];
          },
          {
            foreignKeyName: 'practitioner_specialty_assignments_created_by_fkey';
            columns: ['created_by'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'practitioner_specialty_assignments_organization_id_fkey';
            columns: ['organization_id'];
            isOneToOne: false;
            referencedRelation: 'organizations';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'practitioner_specialty_assignments_updated_by_fkey';
            columns: ['updated_by'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      practitioner_time_off: {
        Row: {
          all_day: boolean;
          category: string;
          created_at: string;
          created_by: string | null;
          end_date: string;
          id: string;
          organization_id: string;
          practitioner_id: string;
          reason: string | null;
          start_date: string;
          status: string;
          updated_at: string;
          updated_by: string | null;
        };
        Insert: {
          all_day?: boolean;
          category: string;
          created_at?: string;
          created_by?: string | null;
          end_date: string;
          id?: string;
          organization_id: string;
          practitioner_id: string;
          reason?: string | null;
          start_date: string;
          status?: string;
          updated_at?: string;
          updated_by?: string | null;
        };
        Update: {
          all_day?: boolean;
          category?: string;
          created_at?: string;
          created_by?: string | null;
          end_date?: string;
          id?: string;
          organization_id?: string;
          practitioner_id?: string;
          reason?: string | null;
          start_date?: string;
          status?: string;
          updated_at?: string;
          updated_by?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'practitioner_time_off_created_by_fkey';
            columns: ['created_by'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'practitioner_time_off_organization_id_fkey';
            columns: ['organization_id'];
            isOneToOne: false;
            referencedRelation: 'organizations';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'practitioner_time_off_practitioner_fk';
            columns: ['practitioner_id', 'organization_id'];
            isOneToOne: false;
            referencedRelation: 'practitioners';
            referencedColumns: ['id', 'organization_id'];
          },
          {
            foreignKeyName: 'practitioner_time_off_updated_by_fkey';
            columns: ['updated_by'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      practitioners: {
        Row: {
          archived_at: string | null;
          archived_by: string | null;
          created_at: string;
          created_by: string | null;
          display_name: string;
          id: string;
          linked_membership_id: string | null;
          organization_id: string;
          professional_title: string | null;
          registration_jurisdiction: string | null;
          status: string;
          updated_at: string;
          updated_by: string | null;
        };
        Insert: {
          archived_at?: string | null;
          archived_by?: string | null;
          created_at?: string;
          created_by?: string | null;
          display_name: string;
          id?: string;
          linked_membership_id?: string | null;
          organization_id: string;
          professional_title?: string | null;
          registration_jurisdiction?: string | null;
          status?: string;
          updated_at?: string;
          updated_by?: string | null;
        };
        Update: {
          archived_at?: string | null;
          archived_by?: string | null;
          created_at?: string;
          created_by?: string | null;
          display_name?: string;
          id?: string;
          linked_membership_id?: string | null;
          organization_id?: string;
          professional_title?: string | null;
          registration_jurisdiction?: string | null;
          status?: string;
          updated_at?: string;
          updated_by?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'practitioners_archived_by_fkey';
            columns: ['archived_by'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'practitioners_created_by_fkey';
            columns: ['created_by'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'practitioners_membership_fk';
            columns: ['linked_membership_id', 'organization_id'];
            isOneToOne: false;
            referencedRelation: 'organization_memberships';
            referencedColumns: ['id', 'organization_id'];
          },
          {
            foreignKeyName: 'practitioners_organization_id_fkey';
            columns: ['organization_id'];
            isOneToOne: false;
            referencedRelation: 'organizations';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'practitioners_updated_by_fkey';
            columns: ['updated_by'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      profiles: {
        Row: {
          created_at: string;
          display_name: string | null;
          id: string;
          last_seen_at: string | null;
          preferred_name: string | null;
          status: string;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          display_name?: string | null;
          id: string;
          last_seen_at?: string | null;
          preferred_name?: string | null;
          status?: string;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          display_name?: string | null;
          id?: string;
          last_seen_at?: string | null;
          preferred_name?: string | null;
          status?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      role_permissions: {
        Row: {
          created_at: string;
          created_by: string | null;
          permission_id: string;
          role_id: string;
        };
        Insert: {
          created_at?: string;
          created_by?: string | null;
          permission_id: string;
          role_id: string;
        };
        Update: {
          created_at?: string;
          created_by?: string | null;
          permission_id?: string;
          role_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'role_permissions_created_by_fkey';
            columns: ['created_by'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'role_permissions_permission_id_fkey';
            columns: ['permission_id'];
            isOneToOne: false;
            referencedRelation: 'permissions';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'role_permissions_role_id_fkey';
            columns: ['role_id'];
            isOneToOne: false;
            referencedRelation: 'roles';
            referencedColumns: ['id'];
          },
        ];
      };
      roles: {
        Row: {
          archived_at: string | null;
          archived_by: string | null;
          created_at: string;
          description: string | null;
          id: string;
          key: string;
          kind: string;
          name: string;
          organization_id: string | null;
          status: string;
          updated_at: string;
          version: number;
        };
        Insert: {
          archived_at?: string | null;
          archived_by?: string | null;
          created_at?: string;
          description?: string | null;
          id?: string;
          key: string;
          kind: string;
          name: string;
          organization_id?: string | null;
          status?: string;
          updated_at?: string;
          version?: number;
        };
        Update: {
          archived_at?: string | null;
          archived_by?: string | null;
          created_at?: string;
          description?: string | null;
          id?: string;
          key?: string;
          kind?: string;
          name?: string;
          organization_id?: string | null;
          status?: string;
          updated_at?: string;
          version?: number;
        };
        Relationships: [
          {
            foreignKeyName: 'roles_archived_by_fkey';
            columns: ['archived_by'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'roles_organization_id_fkey';
            columns: ['organization_id'];
            isOneToOne: false;
            referencedRelation: 'organizations';
            referencedColumns: ['id'];
          },
        ];
      };
      services: {
        Row: {
          created_at: string;
          created_by: string | null;
          description: string | null;
          display_order: number;
          id: string;
          name: string;
          organization_id: string;
          status: string;
          updated_at: string;
          updated_by: string | null;
        };
        Insert: {
          created_at?: string;
          created_by?: string | null;
          description?: string | null;
          display_order?: number;
          id?: string;
          name: string;
          organization_id: string;
          status?: string;
          updated_at?: string;
          updated_by?: string | null;
        };
        Update: {
          created_at?: string;
          created_by?: string | null;
          description?: string | null;
          display_order?: number;
          id?: string;
          name?: string;
          organization_id?: string;
          status?: string;
          updated_at?: string;
          updated_by?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'services_created_by_fkey';
            columns: ['created_by'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'services_organization_id_fkey';
            columns: ['organization_id'];
            isOneToOne: false;
            referencedRelation: 'organizations';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'services_updated_by_fkey';
            columns: ['updated_by'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      soap_notes: {
        Row: {
          assessment: string;
          created_at: string;
          created_by: string | null;
          encounter_id: string;
          id: string;
          objective: string;
          organization_id: string;
          plan: string;
          subjective: string;
          updated_at: string;
          updated_by: string | null;
        };
        Insert: {
          assessment?: string;
          created_at?: string;
          created_by?: string | null;
          encounter_id: string;
          id?: string;
          objective?: string;
          organization_id: string;
          plan?: string;
          subjective?: string;
          updated_at?: string;
          updated_by?: string | null;
        };
        Update: {
          assessment?: string;
          created_at?: string;
          created_by?: string | null;
          encounter_id?: string;
          id?: string;
          objective?: string;
          organization_id?: string;
          plan?: string;
          subjective?: string;
          updated_at?: string;
          updated_by?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'soap_notes_created_by_fkey';
            columns: ['created_by'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'soap_notes_encounter_fk';
            columns: ['encounter_id', 'organization_id'];
            isOneToOne: false;
            referencedRelation: 'encounters';
            referencedColumns: ['id', 'organization_id'];
          },
          {
            foreignKeyName: 'soap_notes_organization_id_fkey';
            columns: ['organization_id'];
            isOneToOne: false;
            referencedRelation: 'organizations';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'soap_notes_updated_by_fkey';
            columns: ['updated_by'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      specialties: {
        Row: {
          created_at: string;
          created_by: string | null;
          description: string | null;
          display_order: number;
          id: string;
          name: string;
          organization_id: string;
          public_visible: boolean;
          stable_key: string;
          status: string;
          updated_at: string;
          updated_by: string | null;
        };
        Insert: {
          created_at?: string;
          created_by?: string | null;
          description?: string | null;
          display_order?: number;
          id?: string;
          name: string;
          organization_id: string;
          public_visible?: boolean;
          stable_key: string;
          status?: string;
          updated_at?: string;
          updated_by?: string | null;
        };
        Update: {
          created_at?: string;
          created_by?: string | null;
          description?: string | null;
          display_order?: number;
          id?: string;
          name?: string;
          organization_id?: string;
          public_visible?: boolean;
          stable_key?: string;
          status?: string;
          updated_at?: string;
          updated_by?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'specialties_created_by_fkey';
            columns: ['created_by'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'specialties_organization_id_fkey';
            columns: ['organization_id'];
            isOneToOne: false;
            referencedRelation: 'organizations';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'specialties_updated_by_fkey';
            columns: ['updated_by'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      accept_staff_invitation: {
        Args: { p_token: string };
        Returns: {
          membership_id: string;
          organization_id: string;
          organization_name: string;
        }[];
      };
      add_attachment_metadata: {
        Args: {
          p_encounter_id: string;
          p_filename: string;
          p_media_type: string;
          p_size_bytes: number;
          p_storage_reference: string;
        };
        Returns: string;
      };
      add_patient_emergency_contact: {
        Args: {
          p_address?: string;
          p_alternate_phone?: string;
          p_email?: string;
          p_is_primary?: boolean;
          p_name: string;
          p_patient_id: string;
          p_phone: string;
          p_relationship: string;
        };
        Returns: string;
      };
      add_patient_identifier: {
        Args: {
          p_identifier_type: string;
          p_identifier_value: string;
          p_is_primary?: boolean;
          p_issuing_jurisdiction?: string;
          p_patient_id: string;
        };
        Returns: string;
      };
      add_patient_relationship: {
        Args: {
          p_notes?: string;
          p_patient_id: string;
          p_related_patient_id: string;
          p_relationship_type: string;
        };
        Returns: string;
      };
      add_practitioner_break: {
        Args: {
          p_block_id: string;
          p_end_time: string;
          p_label: string;
          p_organization_id: string;
          p_start_time: string;
        };
        Returns: string;
      };
      add_practitioner_credential: {
        Args: {
          p_credential_type: string;
          p_document_reference?: string;
          p_expiry_date?: string;
          p_is_primary?: boolean;
          p_issue_date?: string;
          p_issuing_body?: string;
          p_jurisdiction?: string;
          p_notes?: string;
          p_practitioner_id: string;
          p_registration_number?: string;
        };
        Returns: {
          credential_id: string;
        }[];
      };
      add_practitioner_schedule_override: {
        Args: {
          p_end_time?: string;
          p_kind: string;
          p_location_id?: string;
          p_mode?: string;
          p_organization_id: string;
          p_override_date: string;
          p_practitioner_id: string;
          p_reason?: string;
          p_service_id?: string;
          p_start_time?: string;
        };
        Returns: string;
      };
      amend_encounter: {
        Args: { p_encounter_id: string; p_reason?: string };
        Returns: string;
      };
      append_audit_event: {
        Args: {
          action: string;
          actor_profile_id: string;
          after_metadata: Json;
          before_metadata: Json;
          clinic_id: string;
          entity_id: string;
          entity_type: string;
          ip_address: unknown;
          location_id: string;
          metadata: Json;
          organization_id: string;
          outcome: string;
          request_id: string;
          security_event: boolean;
          user_agent: string;
        };
        Returns: string;
      };
      append_availability_segments: {
        Args: {
          p_block_id?: string;
          p_date: string;
          p_end_time: string;
          p_location_id: string;
          p_mode: string;
          p_result: Json;
          p_service_id: string;
          p_source: string;
          p_start_time: string;
          p_timezone: string;
        };
        Returns: Json;
      };
      appointment_conflict_window: {
        Args: {
          p_appointment: Database['public']['Tables']['appointments']['Row'];
        };
        Returns: unknown;
      };
      appointment_permission: {
        Args: { required_action: string; target_organization_id: string };
        Returns: boolean;
      };
      appointment_transition_allowed: {
        Args: { from_value: string; to_value: string };
        Returns: boolean;
      };
      archive_encounter: {
        Args: { p_encounter_id: string; p_reason?: string };
        Returns: string;
      };
      availability_permission: {
        Args: { required_action: string; target_organization_id: string };
        Returns: boolean;
      };
      cancel_appointment: {
        Args: { p_appointment_id: string; p_reason?: string };
        Returns: string;
      };
      cancel_practitioner_time_off: {
        Args: { p_time_off_id: string };
        Returns: boolean;
      };
      cancel_staff_invitation: {
        Args: { p_invitation_id: string; p_reason?: string };
        Returns: boolean;
      };
      change_appointment_status: {
        Args: {
          p_appointment_id: string;
          p_reason?: string;
          p_to_status: string;
        };
        Returns: string;
      };
      change_encounter_status: {
        Args: {
          p_encounter_id: string;
          p_reason?: string;
          p_to_status: string;
        };
        Returns: string;
      };
      change_patient_status: {
        Args: { p_patient_id: string; p_reason?: string; p_status: string };
        Returns: boolean;
      };
      change_practitioner_status: {
        Args: {
          p_practitioner_id: string;
          p_reason?: string;
          p_status: string;
        };
        Returns: boolean;
      };
      check_in_patient: { Args: { p_appointment_id: string }; Returns: string };
      clinical_permission: {
        Args: { required_action: string; target_organization_id: string };
        Returns: boolean;
      };
      complete_appointment: {
        Args: { p_appointment_id: string };
        Returns: string;
      };
      complete_encounter: { Args: { p_encounter_id: string }; Returns: string };
      confirm_appointment: {
        Args: { p_appointment_id: string };
        Returns: string;
      };
      create_appointment: {
        Args: {
          p_appointment_type: string;
          p_duration_minutes: number;
          p_location_id: string;
          p_notes?: string;
          p_organization_id: string;
          p_patient_id: string;
          p_post_buffer_minutes?: number;
          p_practitioner_id: string;
          p_pre_buffer_minutes?: number;
          p_scheduled_start: string;
          p_service_id: string;
          p_status?: string;
          p_timezone: string;
        };
        Returns: {
          appointment_id: string;
          conflict_count: number;
        }[];
      };
      create_encounter: {
        Args: {
          p_appointment_id?: string;
          p_encounter_type?: string;
          p_organization_id: string;
          p_patient_id: string;
          p_practitioner_id: string;
          p_status?: string;
        };
        Returns: {
          encounter_id: string;
        }[];
      };
      create_organization_with_first_location: {
        Args: {
          p_idempotency_key: string;
          p_location: Json;
          p_organization: Json;
        };
        Returns: {
          location_id: string;
          location_name: string;
          membership_id: string;
          organization_display_name: string;
          organization_id: string;
          request_id: string;
        }[];
      };
      create_patient: {
        Args: {
          p_accessibility_notes: string;
          p_biological_sex: string;
          p_date_of_birth: string;
          p_email?: string;
          p_first_name: string;
          p_gender_identity: string;
          p_interpreter_required: boolean;
          p_last_name: string;
          p_legal_name: string;
          p_marital_status: string;
          p_middle_name: string;
          p_non_clinical_notes: string;
          p_occupation: string;
          p_organization_id: string;
          p_patient_number: string;
          p_phone?: string;
          p_photo_reference: string;
          p_preferred_language: string;
          p_preferred_name: string;
          p_pronouns: string;
          p_status?: string;
        };
        Returns: {
          duplicate_count: number;
          patient_id: string;
        }[];
      };
      create_practitioner: {
        Args: {
          p_display_name: string;
          p_language_codes?: string[];
          p_location_ids?: string[];
          p_membership_id?: string;
          p_organization_id: string;
          p_primary_location_id?: string;
          p_professional_title?: string;
          p_specialty_ids?: string[];
          p_status?: string;
        };
        Returns: {
          practitioner_id: string;
        }[];
      };
      create_practitioner_availability_schedule: {
        Args: {
          p_blocks: Json;
          p_name: string;
          p_organization_id: string;
          p_practitioner_id: string;
          p_timezone: string;
        };
        Returns: string;
      };
      create_practitioner_time_off: {
        Args: {
          p_category: string;
          p_end_date: string;
          p_organization_id: string;
          p_practitioner_id: string;
          p_reason?: string;
          p_start_date: string;
        };
        Returns: string;
      };
      create_staff_invitation: {
        Args: {
          p_access_mode: string;
          p_email: string;
          p_idempotency_key?: string;
          p_location_ids?: string[];
          p_organization_id: string;
          p_role_keys: string[];
        };
        Returns: {
          acceptance_token: string;
          already_exists: boolean;
          expires_at: string;
          invitation_id: string;
          invited_email: string;
          organization_name: string;
        }[];
      };
      current_profile_id: { Args: never; Returns: string };
      encounter_transition_allowed: {
        Args: { from_value: string; to_value: string };
        Returns: boolean;
      };
      get_staff_invitation_preview: {
        Args: { p_token: string };
        Returns: {
          access_mode: string;
          expires_at: string;
          invitation_id: string;
          invited_email: string;
          organization_name: string;
          role_names: string[];
        }[];
      };
      has_active_membership: {
        Args: { target_organization_id: string };
        Returns: boolean;
      };
      has_clinic_access: {
        Args: { target_clinic_id: string };
        Returns: boolean;
      };
      has_location_access: {
        Args: { target_location_id: string };
        Returns: boolean;
      };
      has_organization_access: {
        Args: { target_organization_id: string };
        Returns: boolean;
      };
      has_permission: {
        Args: { required_permission: string; target_organization_id: string };
        Returns: boolean;
      };
      is_organization_owner: {
        Args: { target_organization_id: string; target_profile_id?: string };
        Returns: boolean;
      };
      link_practitioner_membership: {
        Args: { p_membership_id: string; p_practitioner_id: string };
        Returns: boolean;
      };
      mark_no_show: {
        Args: { p_appointment_id: string; p_reason?: string };
        Returns: string;
      };
      normalize_organization_slug: {
        Args: { input_name: string };
        Returns: string;
      };
      normalize_patient_name: { Args: { value: string }; Returns: string };
      normalize_patient_phone: { Args: { value: string }; Returns: string };
      patient_permission: {
        Args: { required_action: string; target_organization_id: string };
        Returns: boolean;
      };
      preview_conflicts: {
        Args: {
          p_appointment_type: string;
          p_duration_minutes: number;
          p_location_id: string;
          p_organization_id: string;
          p_patient_id: string;
          p_post_buffer_minutes?: number;
          p_practitioner_id: string;
          p_pre_buffer_minutes?: number;
          p_scheduled_start: string;
          p_service_id: string;
          p_timezone: string;
        };
        Returns: {
          appointment_id: string;
          conflict_end: string;
          conflict_start: string;
          conflict_type: string;
        }[];
      };
      preview_duplicate_matches: {
        Args: {
          p_date_of_birth: string;
          p_email?: string;
          p_first_name: string;
          p_last_name: string;
          p_middle_name: string;
          p_organization_id: string;
          p_phone?: string;
        };
        Returns: Json;
      };
      preview_practitioner_availability: {
        Args: {
          p_end_date: string;
          p_location_id?: string;
          p_practitioner_id: string;
          p_service_id?: string;
          p_start_date: string;
        };
        Returns: Json;
      };
      remove_practitioner_availability_schedule: {
        Args: { p_template_id: string };
        Returns: boolean;
      };
      remove_practitioner_break: {
        Args: { p_break_id: string };
        Returns: boolean;
      };
      remove_practitioner_schedule_override: {
        Args: { p_override_id: string };
        Returns: boolean;
      };
      resend_staff_invitation: {
        Args: { p_invitation_id: string };
        Returns: {
          acceptance_token: string;
          expires_at: string;
          invitation_id: string;
        }[];
      };
      set_practitioner_languages: {
        Args: { p_language_codes?: string[]; p_practitioner_id: string };
        Returns: boolean;
      };
      set_practitioner_location_availability: {
        Args: {
          p_organization_id: string;
          p_practitioner_id: string;
          p_rows: Json;
        };
        Returns: boolean;
      };
      set_practitioner_locations: {
        Args: {
          p_location_ids?: string[];
          p_practitioner_id: string;
          p_primary_location_id?: string;
        };
        Returns: boolean;
      };
      set_practitioner_service_availability: {
        Args: {
          p_organization_id: string;
          p_practitioner_id: string;
          p_rows: Json;
        };
        Returns: boolean;
      };
      set_practitioner_services: {
        Args: {
          p_location_id?: string;
          p_practitioner_id: string;
          p_service_ids?: string[];
        };
        Returns: boolean;
      };
      set_practitioner_specialties: {
        Args: { p_practitioner_id: string; p_specialty_ids?: string[] };
        Returns: boolean;
      };
      start_appointment: {
        Args: { p_appointment_id: string };
        Returns: string;
      };
      unlink_practitioner_membership: {
        Args: { p_practitioner_id: string };
        Returns: boolean;
      };
      update_appointment: {
        Args: {
          p_appointment_id: string;
          p_appointment_type: string;
          p_duration_minutes: number;
          p_location_id: string;
          p_notes?: string;
          p_post_buffer_minutes?: number;
          p_pre_buffer_minutes?: number;
          p_scheduled_start: string;
          p_service_id: string;
          p_timezone: string;
        };
        Returns: string;
      };
      update_care_plan: {
        Args: {
          p_care_plan_id: string;
          p_encounter_id: string;
          p_follow_up_notes: string;
          p_goals: string;
          p_interventions: string;
          p_review_date: string;
          p_status: string;
        };
        Returns: string;
      };
      update_diagnoses: {
        Args: {
          p_code: string;
          p_coding_system: string;
          p_description: string;
          p_diagnosis_id: string;
          p_encounter_id: string;
          p_is_primary: boolean;
        };
        Returns: string;
      };
      update_encounter: {
        Args: {
          p_encounter_id: string;
          p_encounter_type: string;
          p_started_at?: string;
        };
        Returns: string;
      };
      update_forms: {
        Args: {
          p_completion_status: string;
          p_encounter_id: string;
          p_form_id: string;
          p_form_type: string;
          p_structured_response: Json;
          p_title: string;
          p_version: string;
        };
        Returns: string;
      };
      update_membership_roles_and_access: {
        Args: {
          p_access_mode: string;
          p_location_ids?: string[];
          p_membership_id: string;
          p_role_keys: string[];
        };
        Returns: boolean;
      };
      update_membership_status: {
        Args: { p_membership_id: string; p_reason?: string; p_status: string };
        Returns: boolean;
      };
      update_organization_holiday: {
        Args: {
          p_holiday_date: string;
          p_holiday_id: string;
          p_location_id?: string;
          p_name: string;
          p_organization_id: string;
          p_status?: string;
        };
        Returns: string;
      };
      update_patient: {
        Args: {
          p_accessibility_notes: string;
          p_biological_sex: string;
          p_date_of_birth: string;
          p_first_name: string;
          p_gender_identity: string;
          p_interpreter_required: boolean;
          p_last_name: string;
          p_legal_name: string;
          p_marital_status: string;
          p_middle_name: string;
          p_non_clinical_notes: string;
          p_occupation: string;
          p_patient_id: string;
          p_photo_reference: string;
          p_preferred_language: string;
          p_preferred_name: string;
          p_pronouns: string;
        };
        Returns: boolean;
      };
      update_patient_communication_preferences: {
        Args: {
          p_email_allowed: boolean;
          p_marketing_opt_in: boolean;
          p_patient_id: string;
          p_phone_allowed: boolean;
          p_preferred_contact_method: string;
          p_reminder_preference: string;
          p_sms_allowed: boolean;
        };
        Returns: boolean;
      };
      update_patient_consents: {
        Args: { p_consents: Json; p_patient_id: string };
        Returns: boolean;
      };
      update_patient_contact: {
        Args: {
          p_address: string;
          p_alternate_phone: string;
          p_city: string;
          p_country: string;
          p_email: string;
          p_email_allowed: boolean;
          p_marketing_opt_in: boolean;
          p_patient_id: string;
          p_phone: string;
          p_phone_allowed: boolean;
          p_postal_code: string;
          p_preferred_contact_method: string;
          p_province: string;
          p_reminder_preference: string;
          p_sms_allowed: boolean;
        };
        Returns: boolean;
      };
      update_patient_emergency_contact: {
        Args: {
          p_address?: string;
          p_alternate_phone?: string;
          p_contact_id: string;
          p_email?: string;
          p_is_primary?: boolean;
          p_name: string;
          p_phone: string;
          p_relationship: string;
        };
        Returns: boolean;
      };
      update_patient_identifier: {
        Args: {
          p_identifier_id: string;
          p_identifier_type: string;
          p_identifier_value: string;
          p_is_primary?: boolean;
          p_issuing_jurisdiction?: string;
        };
        Returns: boolean;
      };
      update_practitioner_availability_schedule: {
        Args: {
          p_blocks: Json;
          p_name: string;
          p_template_id: string;
          p_timezone: string;
        };
        Returns: boolean;
      };
      update_practitioner_credential: {
        Args: {
          p_credential_id: string;
          p_credential_type: string;
          p_document_reference?: string;
          p_expiry_date?: string;
          p_is_primary?: boolean;
          p_issue_date?: string;
          p_issuing_body?: string;
          p_jurisdiction?: string;
          p_notes?: string;
          p_registration_number?: string;
        };
        Returns: boolean;
      };
      update_practitioner_profile: {
        Args: {
          p_display_name: string;
          p_practitioner_id: string;
          p_professional_title?: string;
          p_registration_jurisdiction?: string;
        };
        Returns: boolean;
      };
      update_practitioner_public_profile: {
        Args: {
          p_accepting_new_clients?: boolean;
          p_booking_visibility?: string;
          p_display_name?: string;
          p_full_biography?: string;
          p_practitioner_id: string;
          p_professional_title?: string;
          p_profile_image_reference?: string;
          p_profile_slug?: string;
          p_pronouns?: string;
          p_seo_description?: string;
          p_seo_title?: string;
          p_short_biography?: string;
          p_visibility_status?: string;
        };
        Returns: boolean;
      };
      update_procedures: {
        Args: {
          p_code: string;
          p_description: string;
          p_encounter_id: string;
          p_performed_date: string;
          p_practitioner_id: string;
          p_procedure_id: string;
        };
        Returns: string;
      };
      update_soap_note: {
        Args: {
          p_assessment: string;
          p_encounter_id: string;
          p_objective: string;
          p_plan: string;
          p_subjective: string;
        };
        Returns: string;
      };
      validate_appointment_booking: {
        Args: {
          p_appointment_type: string;
          p_duration_minutes: number;
          p_exclude_id?: string;
          p_location_id: string;
          p_organization_id: string;
          p_patient_id: string;
          p_post_buffer_minutes: number;
          p_practitioner_id: string;
          p_pre_buffer_minutes: number;
          p_scheduled_start: string;
          p_service_id: string;
          p_timezone: string;
        };
        Returns: undefined;
      };
      validate_clinical_context: {
        Args: {
          p_appointment_id?: string;
          p_organization_id: string;
          p_patient_id: string;
          p_practitioner_id: string;
        };
        Returns: undefined;
      };
      verify_practitioner_credential: {
        Args: {
          p_credential_id: string;
          p_notes?: string;
          p_verification_status: string;
        };
        Returns: boolean;
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>;

type DefaultSchema = DatabaseWithoutInternals[Extract<
  keyof Database,
  'public'
>];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema['Tables'] &
        DefaultSchema['Views'])
    ? (DefaultSchema['Tables'] &
        DefaultSchema['Views'])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema['Tables'] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema['Tables'] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    keyof DefaultSchema['Enums'] | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums']
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums'][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema['Enums']
    ? DefaultSchema['Enums'][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema['CompositeTypes']
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes']
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes'][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema['CompositeTypes']
    ? DefaultSchema['CompositeTypes'][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {},
  },
} as const;
