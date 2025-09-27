export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      an_check_types: {
        Row: {
          category: string | null
          check_code: string
          check_description: string
          created_at: string | null
          id: string
        }
        Insert: {
          category?: string | null
          check_code: string
          check_description: string
          created_at?: string | null
          id?: string
        }
        Update: {
          category?: string | null
          check_code?: string
          check_description?: string
          created_at?: string | null
          id?: string
        }
        Relationships: []
      }
      an_leave_requests: {
        Row: {
          created_at: string | null
          days_count: number
          end_date: string
          id: string
          pilot_id: string | null
          reason: string | null
          request_type: string
          review_comments: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          roster_period: string
          start_date: string
          status: string | null
        }
        Insert: {
          created_at?: string | null
          days_count: number
          end_date: string
          id?: string
          pilot_id?: string | null
          reason?: string | null
          request_type: string
          review_comments?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          roster_period: string
          start_date: string
          status?: string | null
        }
        Update: {
          created_at?: string | null
          days_count?: number
          end_date?: string
          id?: string
          pilot_id?: string | null
          reason?: string | null
          request_type?: string
          review_comments?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          roster_period?: string
          start_date?: string
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "an_leave_requests_pilot_id_fkey"
            columns: ["pilot_id"]
            isOneToOne: false
            referencedRelation: "an_pilots"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "an_leave_requests_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "an_users"
            referencedColumns: ["id"]
          },
        ]
      }
      an_pilot_checks: {
        Row: {
          check_type_id: string | null
          created_at: string | null
          expiry_date: string | null
          id: string
          pilot_id: string | null
          updated_at: string | null
        }
        Insert: {
          check_type_id?: string | null
          created_at?: string | null
          expiry_date?: string | null
          id?: string
          pilot_id?: string | null
          updated_at?: string | null
        }
        Update: {
          check_type_id?: string | null
          created_at?: string | null
          expiry_date?: string | null
          id?: string
          pilot_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "an_pilot_checks_check_type_id_fkey"
            columns: ["check_type_id"]
            isOneToOne: false
            referencedRelation: "an_check_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "an_pilot_checks_pilot_id_fkey"
            columns: ["pilot_id"]
            isOneToOne: false
            referencedRelation: "an_pilots"
            referencedColumns: ["id"]
          },
        ]
      }
      an_pilots: {
        Row: {
          commencement_date: string | null
          contract_type: string | null
          created_at: string | null
          date_of_birth: string | null
          employee_id: string
          first_name: string
          id: string
          is_active: boolean | null
          last_name: string
          middle_name: string | null
          nationality: string | null
          passport_expiry: string | null
          passport_number: string | null
          role: string
          updated_at: string | null
        }
        Insert: {
          commencement_date?: string | null
          contract_type?: string | null
          created_at?: string | null
          date_of_birth?: string | null
          employee_id: string
          first_name: string
          id?: string
          is_active?: boolean | null
          last_name: string
          middle_name?: string | null
          nationality?: string | null
          passport_expiry?: string | null
          passport_number?: string | null
          role: string
          updated_at?: string | null
        }
        Update: {
          commencement_date?: string | null
          contract_type?: string | null
          created_at?: string | null
          date_of_birth?: string | null
          employee_id?: string
          first_name?: string
          id?: string
          is_active?: boolean | null
          last_name?: string
          middle_name?: string | null
          nationality?: string | null
          passport_expiry?: string | null
          passport_number?: string | null
          role?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      an_users: {
        Row: {
          created_at: string | null
          email: string
          id: string
          name: string
          role: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          email: string
          id?: string
          name: string
          role: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string
          id?: string
          name?: string
          role?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      check_types: {
        Row: {
          category: string | null
          check_code: string
          check_description: string
          created_at: string
          id: string
          updated_at: string
        }
        Insert: {
          category?: string | null
          check_code: string
          check_description: string
          created_at?: string
          id?: string
          updated_at?: string
        }
        Update: {
          category?: string | null
          check_code?: string
          check_description?: string
          created_at?: string
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      contract_types: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      leave_requests: {
        Row: {
          created_at: string | null
          days_count: number
          end_date: string
          id: string
          is_late_request: boolean | null
          pilot_id: string | null
          reason: string | null
          request_date: string | null
          request_method: string | null
          request_type: string | null
          review_comments: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          roster_period: string | null
          start_date: string
          status: string | null
        }
        Insert: {
          created_at?: string | null
          days_count: number
          end_date: string
          id?: string
          is_late_request?: boolean | null
          pilot_id?: string | null
          reason?: string | null
          request_date?: string | null
          request_method?: string | null
          request_type?: string | null
          review_comments?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          roster_period?: string | null
          start_date: string
          status?: string | null
        }
        Update: {
          created_at?: string | null
          days_count?: number
          end_date?: string
          id?: string
          is_late_request?: boolean | null
          pilot_id?: string | null
          reason?: string | null
          request_date?: string | null
          request_method?: string | null
          request_type?: string | null
          review_comments?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          roster_period?: string | null
          start_date?: string
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "leave_requests_pilot_id_fkey"
            columns: ["pilot_id"]
            isOneToOne: false
            referencedRelation: "captain_qualifications_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leave_requests_pilot_id_fkey"
            columns: ["pilot_id"]
            isOneToOne: false
            referencedRelation: "detailed_expiring_checks"
            referencedColumns: ["pilot_id"]
          },
          {
            foreignKeyName: "leave_requests_pilot_id_fkey"
            columns: ["pilot_id"]
            isOneToOne: false
            referencedRelation: "expiring_checks"
            referencedColumns: ["pilot_id"]
          },
          {
            foreignKeyName: "leave_requests_pilot_id_fkey"
            columns: ["pilot_id"]
            isOneToOne: false
            referencedRelation: "pilot_checks_overview"
            referencedColumns: ["pilot_id"]
          },
          {
            foreignKeyName: "leave_requests_pilot_id_fkey"
            columns: ["pilot_id"]
            isOneToOne: false
            referencedRelation: "pilot_report_summary"
            referencedColumns: ["pilot_id"]
          },
          {
            foreignKeyName: "leave_requests_pilot_id_fkey"
            columns: ["pilot_id"]
            isOneToOne: false
            referencedRelation: "pilot_summary_optimized"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leave_requests_pilot_id_fkey"
            columns: ["pilot_id"]
            isOneToOne: false
            referencedRelation: "pilots"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leave_requests_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "an_users"
            referencedColumns: ["id"]
          },
        ]
      }
      pilot_checks: {
        Row: {
          check_type_id: string
          created_at: string
          expiry_date: string | null
          id: string
          pilot_id: string
          updated_at: string
        }
        Insert: {
          check_type_id: string
          created_at?: string
          expiry_date?: string | null
          id?: string
          pilot_id: string
          updated_at?: string
        }
        Update: {
          check_type_id?: string
          created_at?: string
          expiry_date?: string | null
          id?: string
          pilot_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "pilot_checks_check_type_id_fkey"
            columns: ["check_type_id"]
            isOneToOne: false
            referencedRelation: "check_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pilot_checks_check_type_id_fkey"
            columns: ["check_type_id"]
            isOneToOne: false
            referencedRelation: "detailed_expiring_checks"
            referencedColumns: ["check_type_id"]
          },
          {
            foreignKeyName: "pilot_checks_pilot_id_fkey"
            columns: ["pilot_id"]
            isOneToOne: false
            referencedRelation: "captain_qualifications_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pilot_checks_pilot_id_fkey"
            columns: ["pilot_id"]
            isOneToOne: false
            referencedRelation: "detailed_expiring_checks"
            referencedColumns: ["pilot_id"]
          },
          {
            foreignKeyName: "pilot_checks_pilot_id_fkey"
            columns: ["pilot_id"]
            isOneToOne: false
            referencedRelation: "expiring_checks"
            referencedColumns: ["pilot_id"]
          },
          {
            foreignKeyName: "pilot_checks_pilot_id_fkey"
            columns: ["pilot_id"]
            isOneToOne: false
            referencedRelation: "pilot_checks_overview"
            referencedColumns: ["pilot_id"]
          },
          {
            foreignKeyName: "pilot_checks_pilot_id_fkey"
            columns: ["pilot_id"]
            isOneToOne: false
            referencedRelation: "pilot_report_summary"
            referencedColumns: ["pilot_id"]
          },
          {
            foreignKeyName: "pilot_checks_pilot_id_fkey"
            columns: ["pilot_id"]
            isOneToOne: false
            referencedRelation: "pilot_summary_optimized"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pilot_checks_pilot_id_fkey"
            columns: ["pilot_id"]
            isOneToOne: false
            referencedRelation: "pilots"
            referencedColumns: ["id"]
          },
        ]
      }
      pilots: {
        Row: {
          captain_qualifications: Json | null
          commencement_date: string | null
          contract_type: string | null
          created_at: string
          date_of_birth: string | null
          employee_id: string
          first_name: string
          id: string
          is_active: boolean
          last_name: string
          middle_name: string | null
          nationality: string | null
          passport_expiry: string | null
          passport_number: string | null
          qualification_notes: string | null
          rhs_captain_expiry: string | null
          role: Database["public"]["Enums"]["pilot_role"]
          seniority_number: number | null
          updated_at: string
        }
        Insert: {
          captain_qualifications?: Json | null
          commencement_date?: string | null
          contract_type?: string | null
          created_at?: string
          date_of_birth?: string | null
          employee_id: string
          first_name: string
          id?: string
          is_active?: boolean
          last_name: string
          middle_name?: string | null
          nationality?: string | null
          passport_expiry?: string | null
          passport_number?: string | null
          qualification_notes?: string | null
          rhs_captain_expiry?: string | null
          role: Database["public"]["Enums"]["pilot_role"]
          seniority_number?: number | null
          updated_at?: string
        }
        Update: {
          captain_qualifications?: Json | null
          commencement_date?: string | null
          contract_type?: string | null
          created_at?: string
          date_of_birth?: string | null
          employee_id?: string
          first_name?: string
          id?: string
          is_active?: boolean
          last_name?: string
          middle_name?: string | null
          nationality?: string | null
          passport_expiry?: string | null
          passport_number?: string | null
          qualification_notes?: string | null
          rhs_captain_expiry?: string | null
          role?: Database["public"]["Enums"]["pilot_role"]
          seniority_number?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_pilots_contract_type"
            columns: ["contract_type"]
            isOneToOne: false
            referencedRelation: "contract_types"
            referencedColumns: ["name"]
          },
        ]
      }
      settings: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          key: string
          updated_at: string | null
          value: Json
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          key: string
          updated_at?: string | null
          value: Json
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          key?: string
          updated_at?: string | null
          value?: Json
        }
        Relationships: []
      }
    }
    Views: {
      captain_qualifications_summary: {
        Row: {
          captain_qualifications: Json | null
          employee_id: string | null
          id: string | null
          is_active: boolean | null
          is_examiner: boolean | null
          is_line_captain: boolean | null
          is_training_captain: boolean | null
          pilot_name: string | null
          qualification_notes: string | null
          role: Database["public"]["Enums"]["pilot_role"] | null
        }
        Insert: {
          captain_qualifications?: Json | null
          employee_id?: string | null
          id?: string | null
          is_active?: boolean | null
          is_examiner?: never
          is_line_captain?: never
          is_training_captain?: never
          pilot_name?: never
          qualification_notes?: string | null
          role?: Database["public"]["Enums"]["pilot_role"] | null
        }
        Update: {
          captain_qualifications?: Json | null
          employee_id?: string | null
          id?: string | null
          is_active?: boolean | null
          is_examiner?: never
          is_line_captain?: never
          is_training_captain?: never
          pilot_name?: never
          qualification_notes?: string | null
          role?: Database["public"]["Enums"]["pilot_role"] | null
        }
        Relationships: []
      }
      compliance_dashboard: {
        Row: {
          active_captains: number | null
          active_first_officers: number | null
          attention_checks: number | null
          attention_pilots: number | null
          avg_compliance_score: number | null
          avg_days_to_expiry: number | null
          check_types_expiring_soon: number | null
          check_types_with_expired: number | null
          checks_with_dates: number | null
          compliance_percentage: number | null
          compliant_pilots: number | null
          critical_checks: number | null
          critical_pilots: number | null
          examiner_ratio: number | null
          examiners: number | null
          expired_checks: number | null
          expired_checks_percentage: number | null
          expiring_next_14_days: number | null
          expiring_next_30_days: number | null
          expiring_next_60_days: number | null
          expiring_next_7_days: number | null
          expiring_next_90_days: number | null
          fo_to_captain_ratio: number | null
          generated_at: string | null
          line_captain_coverage_percentage: number | null
          line_captains: number | null
          max_compliance_score: number | null
          min_compliance_score: number | null
          non_compliant_pilots: number | null
          pilots_with_checks: number | null
          report_date: string | null
          total_active_pilots: number | null
          total_categories: number | null
          total_check_types: number | null
          total_checks: number | null
          training_captain_ratio: number | null
          training_captains: number | null
          urgent_checks: number | null
          urgent_pilots: number | null
          warning_checks: number | null
          warning_pilots: number | null
        }
        Relationships: []
      }
      dashboard_metrics: {
        Row: {
          active_pilots: number | null
          inactive_pilots: number | null
          total_captains: number | null
          total_first_officers: number | null
          total_pilots: number | null
        }
        Relationships: []
      }
      detailed_expiring_checks: {
        Row: {
          captain_qualifications: Json | null
          check_category: string | null
          check_code: string | null
          check_created_at: string | null
          check_description: string | null
          check_type_id: string | null
          check_updated_at: string | null
          days_until_expiry: number | null
          employee_id: string | null
          expiry_date: string | null
          first_name: string | null
          is_active: boolean | null
          is_examiner: boolean | null
          is_line_captain: boolean | null
          is_training_captain: boolean | null
          last_name: string | null
          middle_name: string | null
          nationality: string | null
          pilot_check_id: string | null
          pilot_id: string | null
          pilot_name: string | null
          priority_score: number | null
          role: Database["public"]["Enums"]["pilot_role"] | null
          status: string | null
        }
        Relationships: []
      }
      expiring_checks: {
        Row: {
          check_code: string | null
          check_description: string | null
          days_until_expiry: number | null
          employee_id: string | null
          expiry_date: string | null
          pilot_id: string | null
          pilot_name: string | null
          role: Database["public"]["Enums"]["pilot_role"] | null
        }
        Relationships: []
      }
      expiring_checks_optimized: {
        Row: {
          category: string | null
          check_code: string | null
          check_description: string | null
          check_type_id: string | null
          days_until_expiry: number | null
          employee_id: string | null
          expiry_date: string | null
          first_name: string | null
          id: string | null
          last_name: string | null
          pilot_id: string | null
          role: Database["public"]["Enums"]["pilot_role"] | null
          status: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pilot_checks_check_type_id_fkey"
            columns: ["check_type_id"]
            isOneToOne: false
            referencedRelation: "check_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pilot_checks_check_type_id_fkey"
            columns: ["check_type_id"]
            isOneToOne: false
            referencedRelation: "detailed_expiring_checks"
            referencedColumns: ["check_type_id"]
          },
          {
            foreignKeyName: "pilot_checks_pilot_id_fkey"
            columns: ["pilot_id"]
            isOneToOne: false
            referencedRelation: "captain_qualifications_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pilot_checks_pilot_id_fkey"
            columns: ["pilot_id"]
            isOneToOne: false
            referencedRelation: "detailed_expiring_checks"
            referencedColumns: ["pilot_id"]
          },
          {
            foreignKeyName: "pilot_checks_pilot_id_fkey"
            columns: ["pilot_id"]
            isOneToOne: false
            referencedRelation: "expiring_checks"
            referencedColumns: ["pilot_id"]
          },
          {
            foreignKeyName: "pilot_checks_pilot_id_fkey"
            columns: ["pilot_id"]
            isOneToOne: false
            referencedRelation: "pilot_checks_overview"
            referencedColumns: ["pilot_id"]
          },
          {
            foreignKeyName: "pilot_checks_pilot_id_fkey"
            columns: ["pilot_id"]
            isOneToOne: false
            referencedRelation: "pilot_report_summary"
            referencedColumns: ["pilot_id"]
          },
          {
            foreignKeyName: "pilot_checks_pilot_id_fkey"
            columns: ["pilot_id"]
            isOneToOne: false
            referencedRelation: "pilot_summary_optimized"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pilot_checks_pilot_id_fkey"
            columns: ["pilot_id"]
            isOneToOne: false
            referencedRelation: "pilots"
            referencedColumns: ["id"]
          },
        ]
      }
      pilot_checks_overview: {
        Row: {
          check_code: string | null
          check_description: string | null
          commencement_date: string | null
          date_of_birth: string | null
          employee_id: string | null
          expiry_date: string | null
          first_name: string | null
          full_name: string | null
          is_active: boolean | null
          last_name: string | null
          nationality: string | null
          passport_expiry: string | null
          passport_number: string | null
          pilot_id: string | null
          role: Database["public"]["Enums"]["pilot_role"] | null
          status: string | null
        }
        Relationships: []
      }
      pilot_qualification_summary: {
        Row: {
          active_captains: number | null
          active_first_officers: number | null
          examiners: number | null
          line_captains: number | null
          total_pilots: number | null
          training_captains: number | null
        }
        Relationships: []
      }
      pilot_report_summary: {
        Row: {
          all_categories: string[] | null
          attention_checks: number | null
          captain_qualifications: Json | null
          checks_with_dates: number | null
          commencement_date: string | null
          compliance_score: number | null
          compliance_status: string | null
          created_at: string | null
          critical_checks: number | null
          current_categories: number | null
          date_of_birth: string | null
          days_to_next_expiry: number | null
          earliest_expiry: string | null
          employee_id: string | null
          expired_checks: number | null
          first_name: string | null
          full_name: string | null
          is_active: boolean | null
          is_examiner: boolean | null
          is_line_captain: boolean | null
          is_training_captain: boolean | null
          last_first_name: string | null
          last_name: string | null
          latest_expiry: string | null
          middle_name: string | null
          nationality: string | null
          next_expiry_date: string | null
          passport_expiry: string | null
          passport_number: string | null
          pilot_id: string | null
          qualification_notes: string | null
          role: Database["public"]["Enums"]["pilot_role"] | null
          total_categories: number | null
          total_checks: number | null
          updated_at: string | null
          urgent_checks: number | null
          warning_checks: number | null
        }
        Relationships: []
      }
      pilot_requirements_compliance: {
        Row: {
          active_captains: number | null
          active_first_officers: number | null
          captain_compliance_status: string | null
          examiner_compliance_status: string | null
          examiners: number | null
          first_officer_compliance_status: string | null
          required_captains: number | null
          required_examiners: number | null
          required_first_officers: number | null
          required_training_captains: number | null
          training_captain_compliance_status: string | null
          training_captains: number | null
        }
        Relationships: []
      }
      pilot_summary_optimized: {
        Row: {
          captain_qualifications: Json | null
          contract_type: string | null
          critical_checks: number | null
          employee_id: string | null
          expired_checks: number | null
          first_name: string | null
          id: string | null
          is_active: boolean | null
          last_name: string | null
          role: Database["public"]["Enums"]["pilot_role"] | null
          total_checks: number | null
          warning_checks: number | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_pilots_contract_type"
            columns: ["contract_type"]
            isOneToOne: false
            referencedRelation: "contract_types"
            referencedColumns: ["name"]
          },
        ]
      }
      table_performance_stats: {
        Row: {
          analyze_count: number | null
          autoanalyze_count: number | null
          autovacuum_count: number | null
          last_analyze: string | null
          last_autoanalyze: string | null
          last_autovacuum: string | null
          last_vacuum: string | null
          n_dead_tup: number | null
          n_live_tup: number | null
          n_tup_del: number | null
          n_tup_hot_upd: number | null
          n_tup_ins: number | null
          n_tup_upd: number | null
          schemaname: unknown | null
          table_name: unknown | null
          vacuum_count: number | null
        }
        Relationships: []
      }
      v_index_performance_monitor: {
        Row: {
          index_name: unknown | null
          index_type: string | null
          schemaname: unknown | null
          table_name: unknown | null
          total_index_rows_fetched: number | null
          total_index_rows_read: number | null
          total_index_scans: number | null
          usage_level: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      acknowledge_alert: {
        Args:
          | { acknowledger_email: string; alert_id: string }
          | { alert_id: string }
        Returns: boolean
      }
      add_crew_check: {
        Args: {
          p_certificate_number?: string
          p_check_type_code: string
          p_completion_date?: string
          p_crew_member_id: string
          p_examiner_name?: string
          p_expiry_date?: string
          p_notes?: string
          p_result?: string
        }
        Returns: string
      }
      alert_level: {
        Args: { days_until_expiry: number } | { expiry_date: string }
        Returns: string
      }
      aus_to_date: {
        Args: { date_text: string }
        Returns: string
      }
      auth_get_user_role: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      calculate_check_status: {
        Args:
          | {
              advance_days?: number
              renewal_date: string
              validity_date: string
            }
          | {
              advance_renewal_days?: number
              completion_date: string
              expiry_date: string
              validity_date: string
            }
          | {
              critical_days?: number
              expiry_date: string
              warning_days?: number
            }
          | { expiry_date: string }
        Returns: string
      }
      calculate_days_remaining: {
        Args: { expiry_date: string }
        Returns: number
      }
      calculate_days_until_expiry: {
        Args: { expiry_date: string }
        Returns: number
      }
      calculate_leave_days: {
        Args: { end_date: string; start_date: string }
        Returns: number
      }
      calculate_optimal_renewal_date: {
        Args: {
          advance_renewal_days?: number
          current_expiry_date: string
          validity_period_months: number
        }
        Returns: string
      }
      calculate_pilot_to_hull_ratio: {
        Args: Record<PropertyKey, never>
        Returns: {
          active_aircraft: number
          active_pilots: number
          pilots_needed: number
          required_ratio: number
          status: string
          surplus_shortage: number
        }[]
      }
      calculate_required_examiners: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      calculate_required_training_captains: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      calculate_years_in_service: {
        Args: { commencement_date: string } | { pilot_id: string }
        Returns: number
      }
      calculate_years_to_retirement: {
        Args: { birth_date: string } | { pilot_id: string }
        Returns: number
      }
      can_access_pilot_data: {
        Args: { pilot_uuid: string }
        Returns: boolean
      }
      check_training_currency: {
        Args: Record<PropertyKey, never>
        Returns: {
          check_type_code: string
          compliance_status: string
          crew_member_id: string
          days_until_expiry: number
          employee_id: string
          expiry_date: string
          risk_level: string
        }[]
      }
      check_tri_tre_compliance: {
        Args: Record<PropertyKey, never>
        Returns: {
          total_pilots: number
          total_tre: number
          total_tri: number
          tre_required: number
          tre_status: string
          tre_surplus_shortage: number
          tri_required: number
          tri_status: string
          tri_surplus_shortage: number
        }[]
      }
      cleanup_audit_logs: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      cleanup_old_expiry_alerts: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      create_audit_log: {
        Args: {
          p_action: string
          p_entity_id: string
          p_entity_type: string
          p_new_values?: Json
          p_old_values?: Json
        }
        Returns: undefined
      }
      current_user_email: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      daily_database_maintenance: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      daily_expiry_maintenance: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      daily_maintenance: {
        Args: Record<PropertyKey, never>
        Returns: {
          alerts_generated: number
          maintenance_timestamp: string
          status_updates: number
        }[]
      }
      daily_status_update: {
        Args: Record<PropertyKey, never>
        Returns: {
          generated_notifications: number
          updated_checks: number
        }[]
      }
      days_until_expiry: {
        Args: { expiry_date: string }
        Returns: number
      }
      excel_date_to_pg_date: {
        Args: { excel_serial: number }
        Returns: string
      }
      find_check_type_by_code: {
        Args: { code: string }
        Returns: string
      }
      find_crew_member_by_name: {
        Args: { search_name: string }
        Returns: string
      }
      gbt_bit_compress: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbt_bool_compress: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbt_bool_fetch: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbt_bpchar_compress: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbt_bytea_compress: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbt_cash_compress: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbt_cash_fetch: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbt_date_compress: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbt_date_fetch: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbt_decompress: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbt_enum_compress: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbt_enum_fetch: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbt_float4_compress: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbt_float4_fetch: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbt_float8_compress: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbt_float8_fetch: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbt_inet_compress: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbt_int2_compress: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbt_int2_fetch: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbt_int4_compress: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbt_int4_fetch: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbt_int8_compress: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbt_int8_fetch: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbt_intv_compress: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbt_intv_decompress: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbt_intv_fetch: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbt_macad_compress: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbt_macad_fetch: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbt_macad8_compress: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbt_macad8_fetch: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbt_numeric_compress: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbt_oid_compress: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbt_oid_fetch: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbt_text_compress: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbt_time_compress: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbt_time_fetch: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbt_timetz_compress: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbt_ts_compress: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbt_ts_fetch: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbt_tstz_compress: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbt_uuid_compress: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbt_uuid_fetch: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbt_var_decompress: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbt_var_fetch: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbtreekey_var_in: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbtreekey_var_out: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbtreekey16_in: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbtreekey16_out: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbtreekey2_in: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbtreekey2_out: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbtreekey32_in: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbtreekey32_out: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbtreekey4_in: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbtreekey4_out: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbtreekey8_in: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbtreekey8_out: {
        Args: { "": unknown }
        Returns: unknown
      }
      generate_certification_alerts: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      generate_check_alerts: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      generate_compliance_report: {
        Args: { end_date?: string; start_date?: string }
        Returns: {
          affected_crew: number
          compliance_category: string
          critical_events: number
          event_types: Json
          total_events: number
        }[]
      }
      generate_comprehensive_expiry_alerts: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      generate_expiry_alerts: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      generate_simplified_expiry_alerts: {
        Args: Record<PropertyKey, never>
        Returns: {
          alert_level: string
          alert_type: string
          crew_member_id: string
          days_until_expiry: number
          description: string
          expiry_date: string
          title: string
        }[]
      }
      get_certification_compliance_data: {
        Args: Record<PropertyKey, never>
        Returns: {
          compliance_rate: number
          critical_alerts: number
          expired_certifications: number
          expiring_soon: number
          total_certifications: number
          valid_certifications: number
        }[]
      }
      get_certification_stats: {
        Args: Record<PropertyKey, never>
        Returns: {
          critical_alerts: number
          expired_certifications: number
          expiring_soon: number
          total_certifications: number
          valid_certifications: number
        }[]
      }
      get_check_category_distribution: {
        Args: Record<PropertyKey, never>
        Returns: {
          category: string
          count: number
        }[]
      }
      get_check_status: {
        Args: { expiry_date: string }
        Returns: Database["public"]["Enums"]["check_status"]
      }
      get_crew_audit_trail: {
        Args: { crew_member_uuid: string; days_back?: number }
        Returns: {
          changed_fields: string[]
          compliance_category: string
          details: Json
          operation_timestamp: string
          operation_type: string
          regulatory_impact: boolean
          table_name: string
          user_email: string
        }[]
      }
      get_crew_expiry_summary: {
        Args: { crew_member_uuid: string }
        Returns: {
          compliance_status: string
          crew_member_id: string
          critical_count: number
          days_to_next_expiry: number
          employee_id: string
          expired_count: number
          next_expiry_date: string
          next_expiry_type: string
          pilot_name: string
          total_expiries: number
          valid_count: number
          warning_count: number
        }[]
      }
      get_crew_member_expiring_items: {
        Args: { p_crew_member_id: string; p_days_ahead?: number }
        Returns: {
          days_until_expiry: number
          description: string
          expiry_date: string
          expiry_type: string
          reference_id: string
          reference_table: string
          status: string
        }[]
      }
      get_current_alert_severity_and_type: {
        Args: { days_remaining: number }
        Returns: {
          alert_type: string
          severity: string
          should_show: boolean
        }[]
      }
      get_current_pilot_id: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_current_user_role: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_dashboard_metrics: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      get_database_performance_metrics: {
        Args: Record<PropertyKey, never>
        Returns: {
          metric_name: string
          metric_unit: string
          metric_value: number
          status: string
        }[]
      }
      get_expiring_checks: {
        Args: { days_ahead?: number }
        Returns: {
          check_code: string
          check_description: string
          check_id: string
          days_remaining: number
          employee_id: string
          expiry_date: string
          pilot_id: string
          pilot_name: string
          priority: string
          status: string
        }[]
      }
      get_expiry_statistics: {
        Args: Record<PropertyKey, never>
        Returns: {
          expired_count: number
          expiring_in_60_days: number
          upcoming_renewals: number
        }[]
      }
      get_fleet_compliance_stats: {
        Args: Record<PropertyKey, never>
        Returns: {
          fully_compliant_pilots: number
          overall_compliance_percentage: number
          pilots_with_critical: number
          pilots_with_expired: number
          pilots_with_warnings: number
          total_pilots: number
        }[]
      }
      get_fleet_expiry_statistics: {
        Args: Record<PropertyKey, never>
        Returns: {
          avg_days_to_next_expiry: number
          critical_expiries: number
          expired_expiries: number
          expiries_next_30_days: number
          expiries_next_60_days: number
          expiries_next_90_days: number
          pilots_with_critical: number
          pilots_with_expired: number
          pilots_with_warnings: number
          total_expiries: number
          total_pilots: number
          warning_expiries: number
        }[]
      }
      get_monthly_expiry_data: {
        Args: Record<PropertyKey, never>
        Returns: {
          count: number
          month: string
        }[]
      }
      get_pilot_check_types: {
        Args: { pilot_uuid: string }
        Returns: {
          check_type_code: string
          check_type_id: string
          check_type_name: string
          completion_date: string
          created_at: string
          expiry_date: string
          notes: string
          renewal_date: string
          status: string
          updated_at: string
          validity_date: string
        }[]
      }
      get_pilot_compliance_stats: {
        Args: { pilot_uuid: string }
        Returns: {
          compliance_percentage: number
          critical_checks: number
          expired_checks: number
          total_checks: number
          valid_checks: number
          warning_checks: number
        }[]
      }
      get_pilot_dashboard_data: {
        Args: Record<PropertyKey, never>
        Returns: {
          active_pilots: number
          critical_alerts: number
          examiners: number
          expiring_soon: number
          first_officers: number
          line_captains: number
          total_pilots: number
          training_captains: number
        }[]
      }
      get_pilot_data_with_checks: {
        Args: Record<PropertyKey, never>
        Returns: {
          completed_checks: number
          compliance_percentage: number
          display_name: string
          email: string
          employee_id: string
          employee_status: string
          full_name: string
          hire_date: string
          is_tre: boolean
          is_tri: boolean
          medical_certificate_expiry: string
          nationality: string
          passport_expiry_date: string
          pilot_id: string
          pilot_license_expiry: string
          pilot_license_type: string
          role_code: string
          total_required_checks: number
        }[]
      }
      get_pilot_details: {
        Args: { pilot_uuid: string }
        Returns: {
          created_at: string
          display_name: string
          email: string
          first_name: string
          full_name: string
          is_tre: boolean
          is_tri: boolean
          last_name: string
          middle_name: string
          nationality: string
          notes: string
          passport_expiry_date: string
          passport_issue_date: string
          passport_number: string
          phone: string
          pilot_id: string
          role_code: string
          status: string
          updated_at: string
        }[]
      }
      get_pilot_expiries: {
        Args: Record<PropertyKey, never>
        Returns: {
          expiry_date: string
          expiry_type: string
          pilot_id: string
          pilot_name: string
        }[]
      }
      get_pilot_expiry_summary: {
        Args: { pilot_uuid: string }
        Returns: {
          critical_count: number
          days_to_next_expiry: number
          employee_id: string
          expired_count: number
          next_expiry_date: string
          next_expiry_type: string
          pilot_id: string
          pilot_name: string
          total_expiries: number
          valid_count: number
          warning_count: number
        }[]
      }
      get_pilot_statistics: {
        Args: Record<PropertyKey, never>
        Returns: {
          active_pilots: number
          captain_count: number
          first_officer_count: number
          tre_count: number
          tri_count: number
        }[]
      }
      get_renewal_recommendations: {
        Args: { days_ahead?: number }
        Returns: {
          days_until_expiry: number
          employee_id: string
          expiry_date: string
          expiry_description: string
          expiry_type: string
          pilot_id: string
          pilot_name: string
          priority_score: number
          recommended_renewal_date: string
          reference_id: string
          reference_table: string
          renewal_cost_estimate: number
        }[]
      }
      get_system_settings: {
        Args: { p_setting_type?: string; p_user_email: string }
        Returns: Json
      }
      get_years_in_service: {
        Args: { commencement_date: string }
        Returns: number
      }
      get_years_to_retirement: {
        Args: { birth_date: string }
        Returns: number
      }
      gtrgm_compress: {
        Args: { "": unknown }
        Returns: unknown
      }
      gtrgm_decompress: {
        Args: { "": unknown }
        Returns: unknown
      }
      gtrgm_in: {
        Args: { "": unknown }
        Returns: unknown
      }
      gtrgm_options: {
        Args: { "": unknown }
        Returns: undefined
      }
      gtrgm_out: {
        Args: { "": unknown }
        Returns: unknown
      }
      import_crew_check: {
        Args: {
          p_check_code: string
          p_crew_name: string
          p_renewal_serial: number
          p_validity_serial: number
        }
        Returns: boolean
      }
      insert_crew_checks_batch: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      is_admin: {
        Args: Record<PropertyKey, never> | { user_id?: string }
        Returns: boolean
      }
      is_admin_user: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      is_current_user: {
        Args: { user_id: string }
        Returns: boolean
      }
      is_manager_or_admin: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      is_pilot_owner: {
        Args: { pilot_uuid: string }
        Returns: boolean
      }
      map_crew_name_to_id: {
        Args: { check_name: string }
        Returns: string
      }
      mark_check_complete: {
        Args:
          | {
              check_id: string
              completion_date: string
              document_ref?: string
              expiry_date: string
            }
          | {
              p_check_type_code: string
              p_completion_date?: string
              p_crew_member_id: string
              p_validity_months?: number
            }
        Returns: boolean
      }
      parse_cert_date: {
        Args: { date_str: string }
        Returns: string
      }
      parse_excel_date: {
        Args: { excel_serial: number } | { excel_value: string }
        Returns: string
      }
      process_pending_reminders: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      refresh_all_expiry_views: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      refresh_dashboard_metrics: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      refresh_dashboard_views: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      refresh_expiry_materialized_views: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      refresh_expiry_views: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      refresh_pilot_status: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      safe_to_date: {
        Args: { date_str: string }
        Returns: string
      }
      set_limit: {
        Args: { "": number }
        Returns: number
      }
      show_limit: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      show_trgm: {
        Args: { "": string }
        Returns: string[]
      }
      system_health_check: {
        Args: Record<PropertyKey, never>
        Returns: {
          check_name: string
          details: string
          recommendation: string
          status: string
        }[]
      }
      update_all_expiry_statuses: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      update_certification_status: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      update_check_expiry_dates: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      update_check_statuses: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      update_crew_instructor_status: {
        Args: {
          p_crew_member_id: string
          p_is_tre?: boolean
          p_is_tri?: boolean
        }
        Returns: boolean
      }
      update_pilot_checks_status: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      upsert_system_settings: {
        Args: {
          p_alert_days_critical?: number
          p_alert_days_info?: number
          p_alert_days_warning?: number
          p_backup_frequency?: string
          p_email_notifications?: boolean
          p_examiner_ratio?: number
          p_fleet_size?: number
          p_required_captains_per_aircraft?: number
          p_required_first_officers_per_aircraft?: number
          p_setting_type?: string
          p_sms_notifications?: boolean
          p_system_timezone?: string
          p_training_captain_ratio?: number
          p_user_email: string
        }
        Returns: Json
      }
      user_has_admin_role: {
        Args: Record<PropertyKey, never> | { user_id: string }
        Returns: boolean
      }
      user_has_role: {
        Args: { required_roles: string[] }
        Returns: boolean
      }
      validate_crew_member_completeness: {
        Args: Record<PropertyKey, never>
        Returns: {
          compliance_impact: string
          crew_member_id: string
          employee_id: string
          missing_fields: string[]
          severity: string
        }[]
      }
    }
    Enums: {
      assignment_type:
        | "FLIGHT"
        | "STANDBY"
        | "TRAINING"
        | "OFFICE"
        | "LEAVE"
        | "SICK"
        | "REST"
      audit_action:
        | "CREATE"
        | "UPDATE"
        | "DELETE"
        | "VIEW"
        | "APPROVE"
        | "REJECT"
        | "LOGIN"
        | "LOGOUT"
        | "EXPORT"
      certification_category:
        | "LICENCE"
        | "MEDICAL"
        | "IDENTITY"
        | "PASSPORT"
        | "AIRCRAFT_TYPE"
        | "TRAINING"
        | "OPERATIONAL"
        | "SIMULATOR"
      certification_status:
        | "VALID"
        | "EXPIRING"
        | "EXPIRED"
        | "PENDING_RENEWAL"
        | "NOT_APPLICABLE"
      check_category:
        | "MEDICAL"
        | "LICENSE"
        | "TRAINING"
        | "QUALIFICATION"
        | "SECURITY"
        | "RECENCY"
        | "LANGUAGE"
      check_status:
        | "EXPIRED"
        | "EXPIRING_7_DAYS"
        | "EXPIRING_30_DAYS"
        | "EXPIRING_60_DAYS"
        | "EXPIRING_90_DAYS"
        | "CURRENT"
      crew_role:
        | "CAPTAIN"
        | "FIRST_OFFICER"
        | "SECOND_OFFICER"
        | "TRAINING_CAPTAIN"
        | "CHECK_CAPTAIN"
      leave_type:
        | "RDO"
        | "SDO"
        | "ANN"
        | "SCK"
        | "LSL"
        | "COMP"
        | "MAT"
        | "PAT"
        | "UNPAID"
      notification_level:
        | "90_DAYS"
        | "60_DAYS"
        | "30_DAYS"
        | "14_DAYS"
        | "7_DAYS"
        | "EXPIRED"
        | "CRITICAL"
      notification_status:
        | "PENDING"
        | "SENT"
        | "ACKNOWLEDGED"
        | "FAILED"
        | "CANCELLED"
      pilot_position: "captain" | "first_officer" | "second_officer" | "cadet"
      pilot_role: "Captain" | "First Officer"
      request_status:
        | "DRAFT"
        | "PENDING"
        | "APPROVED"
        | "REJECTED"
        | "CANCELLED"
        | "EXPIRED"
      visa_type: "Australia" | "China" | "New Zealand" | "Japan" | "Canada"
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
  public: {
    Enums: {
      assignment_type: [
        "FLIGHT",
        "STANDBY",
        "TRAINING",
        "OFFICE",
        "LEAVE",
        "SICK",
        "REST",
      ],
      audit_action: [
        "CREATE",
        "UPDATE",
        "DELETE",
        "VIEW",
        "APPROVE",
        "REJECT",
        "LOGIN",
        "LOGOUT",
        "EXPORT",
      ],
      certification_category: [
        "LICENCE",
        "MEDICAL",
        "IDENTITY",
        "PASSPORT",
        "AIRCRAFT_TYPE",
        "TRAINING",
        "OPERATIONAL",
        "SIMULATOR",
      ],
      certification_status: [
        "VALID",
        "EXPIRING",
        "EXPIRED",
        "PENDING_RENEWAL",
        "NOT_APPLICABLE",
      ],
      check_category: [
        "MEDICAL",
        "LICENSE",
        "TRAINING",
        "QUALIFICATION",
        "SECURITY",
        "RECENCY",
        "LANGUAGE",
      ],
      check_status: [
        "EXPIRED",
        "EXPIRING_7_DAYS",
        "EXPIRING_30_DAYS",
        "EXPIRING_60_DAYS",
        "EXPIRING_90_DAYS",
        "CURRENT",
      ],
      crew_role: [
        "CAPTAIN",
        "FIRST_OFFICER",
        "SECOND_OFFICER",
        "TRAINING_CAPTAIN",
        "CHECK_CAPTAIN",
      ],
      leave_type: [
        "RDO",
        "SDO",
        "ANN",
        "SCK",
        "LSL",
        "COMP",
        "MAT",
        "PAT",
        "UNPAID",
      ],
      notification_level: [
        "90_DAYS",
        "60_DAYS",
        "30_DAYS",
        "14_DAYS",
        "7_DAYS",
        "EXPIRED",
        "CRITICAL",
      ],
      notification_status: [
        "PENDING",
        "SENT",
        "ACKNOWLEDGED",
        "FAILED",
        "CANCELLED",
      ],
      pilot_position: ["captain", "first_officer", "second_officer", "cadet"],
      pilot_role: ["Captain", "First Officer"],
      request_status: [
        "DRAFT",
        "PENDING",
        "APPROVED",
        "REJECTED",
        "CANCELLED",
        "EXPIRED",
      ],
      visa_type: ["Australia", "China", "New Zealand", "Japan", "Canada"],
    },
  },
} as const