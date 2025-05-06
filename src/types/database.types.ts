export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      agency_agents: {
        Row: {
          agency_id: string
          agent_id: string
          created_at: string | null
          id: string
          status: string
          updated_at: string | null
        }
        Insert: {
          agency_id: string
          agent_id: string
          created_at?: string | null
          id?: string
          status?: string
          updated_at?: string | null
        }
        Update: {
          agency_id?: string
          agent_id?: string
          created_at?: string | null
          id?: string
          status?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "agency_agents_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: false
            referencedRelation: "agent_statistics"
            referencedColumns: ["agent_id"]
          },
          {
            foreignKeyName: "agency_agents_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agency_agents_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agent_statistics"
            referencedColumns: ["agent_id"]
          },
          {
            foreignKeyName: "agency_agents_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      agency_project_requests: {
        Row: {
          agency_id: string
          id: string
          project_id: string
          requested_at: string | null
          signed_file: string | null
          signed_file_name: string | null
          status: string
        }
        Insert: {
          agency_id: string
          id?: string
          project_id: string
          requested_at?: string | null
          signed_file?: string | null
          signed_file_name?: string | null
          status?: string
        }
        Update: {
          agency_id?: string
          id?: string
          project_id?: string
          requested_at?: string | null
          signed_file?: string | null
          signed_file_name?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "agency_project_requests_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: false
            referencedRelation: "agent_statistics"
            referencedColumns: ["agent_id"]
          },
          {
            foreignKeyName: "agency_project_requests_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agency_project_requests_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      agency_properties: {
        Row: {
          agency_id: string
          created_at: string | null
          id: string
          property_id: string
          status: string
          updated_at: string | null
        }
        Insert: {
          agency_id: string
          created_at?: string | null
          id?: string
          property_id: string
          status?: string
          updated_at?: string | null
        }
        Update: {
          agency_id?: string
          created_at?: string | null
          id?: string
          property_id?: string
          status?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "agency_properties_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: false
            referencedRelation: "agent_statistics"
            referencedColumns: ["agent_id"]
          },
          {
            foreignKeyName: "agency_properties_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agency_properties_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      agent_certifications: {
        Row: {
          agent_id: string
          created_at: string | null
          file_url: string
          id: string
          is_rera: boolean | null
          name: string
          rera_number: string | null
          updated_at: string | null
        }
        Insert: {
          agent_id: string
          created_at?: string | null
          file_url: string
          id?: string
          is_rera?: boolean | null
          name: string
          rera_number?: string | null
          updated_at?: string | null
        }
        Update: {
          agent_id?: string
          created_at?: string | null
          file_url?: string
          id?: string
          is_rera?: boolean | null
          name?: string
          rera_number?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "agent_certifications_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agent_statistics"
            referencedColumns: ["agent_id"]
          },
          {
            foreignKeyName: "agent_certifications_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      agent_invitations: {
        Row: {
          agency_id: string
          created_at: string | null
          email: string
          expires_at: string
          full_name: string | null
          id: string
          phone: string | null
          status: string
          token: string
          updated_at: string | null
          whatsapp: string | null
        }
        Insert: {
          agency_id: string
          created_at?: string | null
          email: string
          expires_at: string
          full_name?: string | null
          id?: string
          phone?: string | null
          status?: string
          token: string
          updated_at?: string | null
          whatsapp?: string | null
        }
        Update: {
          agency_id?: string
          created_at?: string | null
          email?: string
          expires_at?: string
          full_name?: string | null
          id?: string
          phone?: string | null
          status?: string
          token?: string
          updated_at?: string | null
          whatsapp?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "agent_invitations_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: false
            referencedRelation: "agent_statistics"
            referencedColumns: ["agent_id"]
          },
          {
            foreignKeyName: "agent_invitations_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      agent_projects: {
        Row: {
          agent_id: string
          created_at: string | null
          id: string
          project_id: string
        }
        Insert: {
          agent_id: string
          created_at?: string | null
          id?: string
          project_id: string
        }
        Update: {
          agent_id?: string
          created_at?: string | null
          id?: string
          project_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "agent_projects_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agent_statistics"
            referencedColumns: ["agent_id"]
          },
          {
            foreignKeyName: "agent_projects_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agent_projects_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      agent_properties: {
        Row: {
          agent_id: string
          created_at: string | null
          id: string
          property_id: string
          status: string
          updated_at: string | null
        }
        Insert: {
          agent_id: string
          created_at?: string | null
          id?: string
          property_id: string
          status?: string
          updated_at?: string | null
        }
        Update: {
          agent_id?: string
          created_at?: string | null
          id?: string
          property_id?: string
          status?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "agent_properties_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agent_statistics"
            referencedColumns: ["agent_id"]
          },
          {
            foreignKeyName: "agent_properties_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agent_properties_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      agent_referrals: {
        Row: {
          agent_id: string
          created_at: string | null
          id: string
          referral_contact: string
          referral_name: string
          status: string
          updated_at: string | null
        }
        Insert: {
          agent_id: string
          created_at?: string | null
          id?: string
          referral_contact: string
          referral_name: string
          status?: string
          updated_at?: string | null
        }
        Update: {
          agent_id?: string
          created_at?: string | null
          id?: string
          referral_contact?: string
          referral_name?: string
          status?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "agent_referrals_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agent_statistics"
            referencedColumns: ["agent_id"]
          },
          {
            foreignKeyName: "agent_referrals_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      agent_service_areas: {
        Row: {
          agent_id: string
          created_at: string | null
          id: string
          location: string
          updated_at: string | null
        }
        Insert: {
          agent_id: string
          created_at?: string | null
          id?: string
          location: string
          updated_at?: string | null
        }
        Update: {
          agent_id?: string
          created_at?: string | null
          id?: string
          location?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "agent_service_areas_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agent_statistics"
            referencedColumns: ["agent_id"]
          },
          {
            foreignKeyName: "agent_service_areas_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_logs: {
        Row: {
          action: string
          created_at: string | null
          id: string
          new_data: Json | null
          old_data: Json | null
          record_id: string
          table_name: string
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string | null
          id?: string
          new_data?: Json | null
          old_data?: Json | null
          record_id: string
          table_name: string
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string | null
          id?: string
          new_data?: Json | null
          old_data?: Json | null
          record_id?: string
          table_name?: string
          user_id?: string | null
        }
        Relationships: []
      }
      collaboration_requests: {
        Row: {
          client_email: string
          client_name: string
          client_phone: string | null
          created_at: string | null
          id: string
          notes: string | null
          property_id: string
          receiving_agent_id: string
          requesting_agent_id: string
          status: string
          updated_at: string | null
        }
        Insert: {
          client_email: string
          client_name: string
          client_phone?: string | null
          created_at?: string | null
          id?: string
          notes?: string | null
          property_id: string
          receiving_agent_id: string
          requesting_agent_id: string
          status?: string
          updated_at?: string | null
        }
        Update: {
          client_email?: string
          client_name?: string
          client_phone?: string | null
          created_at?: string | null
          id?: string
          notes?: string | null
          property_id?: string
          receiving_agent_id?: string
          requesting_agent_id?: string
          status?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "collaboration_requests_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "collaboration_requests_receiving_agent_id_fkey"
            columns: ["receiving_agent_id"]
            isOneToOne: false
            referencedRelation: "agent_statistics"
            referencedColumns: ["agent_id"]
          },
          {
            foreignKeyName: "collaboration_requests_receiving_agent_id_fkey"
            columns: ["receiving_agent_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "collaboration_requests_requesting_agent_id_fkey"
            columns: ["requesting_agent_id"]
            isOneToOne: false
            referencedRelation: "agent_statistics"
            referencedColumns: ["agent_id"]
          },
          {
            foreignKeyName: "collaboration_requests_requesting_agent_id_fkey"
            columns: ["requesting_agent_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_activities: {
        Row: {
          activity_type: string
          agent_id: string
          created_at: string | null
          deal_id: string | null
          description: string
          id: string
          lead_id: string | null
        }
        Insert: {
          activity_type: string
          agent_id: string
          created_at?: string | null
          deal_id?: string | null
          description: string
          id?: string
          lead_id?: string | null
        }
        Update: {
          activity_type?: string
          agent_id?: string
          created_at?: string | null
          deal_id?: string | null
          description?: string
          id?: string
          lead_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "crm_activities_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agent_statistics"
            referencedColumns: ["agent_id"]
          },
          {
            foreignKeyName: "crm_activities_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_activities_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "crm_deals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_activities_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "crm_leads"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_checklists: {
        Row: {
          created_at: string | null
          deal_id: string
          id: string
          is_completed: boolean | null
          sort_order: number | null
          title: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          deal_id: string
          id?: string
          is_completed?: boolean | null
          sort_order?: number | null
          title: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          deal_id?: string
          id?: string
          is_completed?: boolean | null
          sort_order?: number | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "crm_checklists_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "crm_deals"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_deals: {
        Row: {
          agent_id: string
          co_agent_id: string | null
          commission_split: string | null
          created_at: string | null
          deal_type: string
          deal_value: number | null
          id: string
          lead_id: string | null
          notes: string | null
          project_id: string | null
          property_id: string | null
          status: string
          updated_at: string | null
        }
        Insert: {
          agent_id: string
          co_agent_id?: string | null
          commission_split?: string | null
          created_at?: string | null
          deal_type: string
          deal_value?: number | null
          id?: string
          lead_id?: string | null
          notes?: string | null
          project_id?: string | null
          property_id?: string | null
          status: string
          updated_at?: string | null
        }
        Update: {
          agent_id?: string
          co_agent_id?: string | null
          commission_split?: string | null
          created_at?: string | null
          deal_type?: string
          deal_value?: number | null
          id?: string
          lead_id?: string | null
          notes?: string | null
          project_id?: string | null
          property_id?: string | null
          status?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "crm_deals_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agent_statistics"
            referencedColumns: ["agent_id"]
          },
          {
            foreignKeyName: "crm_deals_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_deals_co_agent_id_fkey"
            columns: ["co_agent_id"]
            isOneToOne: false
            referencedRelation: "agent_statistics"
            referencedColumns: ["agent_id"]
          },
          {
            foreignKeyName: "crm_deals_co_agent_id_fkey"
            columns: ["co_agent_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_deals_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "crm_leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_deals_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_deals_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_documents: {
        Row: {
          created_at: string | null
          deal_id: string
          file_name: string
          file_path: string
          file_size: number
          id: string
          type: string
          uploaded_by: string
        }
        Insert: {
          created_at?: string | null
          deal_id: string
          file_name: string
          file_path: string
          file_size: number
          id?: string
          type: string
          uploaded_by: string
        }
        Update: {
          created_at?: string | null
          deal_id?: string
          file_name?: string
          file_path?: string
          file_size?: number
          id?: string
          type?: string
          uploaded_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "crm_documents_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "crm_deals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_documents_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "agent_statistics"
            referencedColumns: ["agent_id"]
          },
          {
            foreignKeyName: "crm_documents_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_leads: {
        Row: {
          agent_id: string
          created_at: string | null
          email: string | null
          full_name: string
          id: string
          language: string | null
          last_contacted_at: string | null
          lead_score: number | null
          lead_type: string
          notes: string | null
          phone_number: string
          status: string
          updated_at: string | null
        }
        Insert: {
          agent_id: string
          created_at?: string | null
          email?: string | null
          full_name: string
          id?: string
          language?: string | null
          last_contacted_at?: string | null
          lead_score?: number | null
          lead_type: string
          notes?: string | null
          phone_number: string
          status: string
          updated_at?: string | null
        }
        Update: {
          agent_id?: string
          created_at?: string | null
          email?: string | null
          full_name?: string
          id?: string
          language?: string | null
          last_contacted_at?: string | null
          lead_score?: number | null
          lead_type?: string
          notes?: string | null
          phone_number?: string
          status?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "crm_leads_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agent_statistics"
            referencedColumns: ["agent_id"]
          },
          {
            foreignKeyName: "crm_leads_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_messages: {
        Row: {
          created_at: string | null
          deal_id: string
          id: string
          is_read: boolean | null
          message: string
          sender_id: string
        }
        Insert: {
          created_at?: string | null
          deal_id: string
          id?: string
          is_read?: boolean | null
          message: string
          sender_id: string
        }
        Update: {
          created_at?: string | null
          deal_id?: string
          id?: string
          is_read?: boolean | null
          message?: string
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "crm_messages_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "crm_deals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "agent_statistics"
            referencedColumns: ["agent_id"]
          },
          {
            foreignKeyName: "crm_messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_reminders: {
        Row: {
          agent_id: string
          created_at: string | null
          deal_id: string | null
          description: string | null
          due_date: string
          id: string
          is_completed: boolean | null
          lead_id: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          agent_id: string
          created_at?: string | null
          deal_id?: string | null
          description?: string | null
          due_date: string
          id?: string
          is_completed?: boolean | null
          lead_id?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          agent_id?: string
          created_at?: string | null
          deal_id?: string | null
          description?: string | null
          due_date?: string
          id?: string
          is_completed?: boolean | null
          lead_id?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "crm_reminders_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agent_statistics"
            referencedColumns: ["agent_id"]
          },
          {
            foreignKeyName: "crm_reminders_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_reminders_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "crm_deals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_reminders_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "crm_leads"
            referencedColumns: ["id"]
          },
        ]
      }
      custom_amenities: {
        Row: {
          created_at: string | null
          created_by: string | null
          id: string
          name: string
          property_id: string
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          name: string
          property_id: string
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          name?: string
          property_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "custom_amenities_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "agent_statistics"
            referencedColumns: ["agent_id"]
          },
          {
            foreignKeyName: "custom_amenities_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "custom_amenities_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      deal_activities: {
        Row: {
          action_type: string
          agent_id: string
          deal_id: string
          details: string
          id: string
          timestamp: string
        }
        Insert: {
          action_type: string
          agent_id: string
          deal_id: string
          details: string
          id?: string
          timestamp?: string
        }
        Update: {
          action_type?: string
          agent_id?: string
          deal_id?: string
          details?: string
          id?: string
          timestamp?: string
        }
        Relationships: [
          {
            foreignKeyName: "deal_activities_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agent_statistics"
            referencedColumns: ["agent_id"]
          },
          {
            foreignKeyName: "deal_activities_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deal_activities_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "deals"
            referencedColumns: ["id"]
          },
        ]
      }
      deal_activity_logs: {
        Row: {
          created_at: string | null
          deal_id: string
          id: string
          payload: Json
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          deal_id: string
          id?: string
          payload: Json
          type: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          deal_id?: string
          id?: string
          payload?: Json
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "deal_activity_logs_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "deals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deal_activity_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "agent_statistics"
            referencedColumns: ["agent_id"]
          },
          {
            foreignKeyName: "deal_activity_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      deal_chats: {
        Row: {
          created_at: string | null
          deal_id: string
          id: string
          message: string
          read: boolean | null
          sender_id: string
        }
        Insert: {
          created_at?: string | null
          deal_id: string
          id?: string
          message: string
          read?: boolean | null
          sender_id: string
        }
        Update: {
          created_at?: string | null
          deal_id?: string
          id?: string
          message?: string
          read?: boolean | null
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "deal_chats_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "deals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deal_chats_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "agent_statistics"
            referencedColumns: ["agent_id"]
          },
          {
            foreignKeyName: "deal_chats_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      deal_documents: {
        Row: {
          ai_check_result: Json | null
          ai_check_status: string | null
          category: string | null
          checked_at: string | null
          created_at: string | null
          deal_id: string
          id: string
          name: string
          type: string
          uploaded_by: string
          url: string
        }
        Insert: {
          ai_check_result?: Json | null
          ai_check_status?: string | null
          category?: string | null
          checked_at?: string | null
          created_at?: string | null
          deal_id: string
          id?: string
          name: string
          type: string
          uploaded_by: string
          url: string
        }
        Update: {
          ai_check_result?: Json | null
          ai_check_status?: string | null
          category?: string | null
          checked_at?: string | null
          created_at?: string | null
          deal_id?: string
          id?: string
          name?: string
          type?: string
          uploaded_by?: string
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "deal_documents_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "deals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deal_documents_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "agent_statistics"
            referencedColumns: ["agent_id"]
          },
          {
            foreignKeyName: "deal_documents_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      deal_events: {
        Row: {
          created_at: string | null
          created_by: string
          deal_id: string
          description: string | null
          end_time: string
          id: string
          location: string | null
          start_time: string
          title: string
        }
        Insert: {
          created_at?: string | null
          created_by: string
          deal_id: string
          description?: string | null
          end_time: string
          id?: string
          location?: string | null
          start_time: string
          title: string
        }
        Update: {
          created_at?: string | null
          created_by?: string
          deal_id?: string
          description?: string | null
          end_time?: string
          id?: string
          location?: string | null
          start_time?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "deal_events_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "agent_statistics"
            referencedColumns: ["agent_id"]
          },
          {
            foreignKeyName: "deal_events_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deal_events_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "deals"
            referencedColumns: ["id"]
          },
        ]
      }
      deal_meetings: {
        Row: {
          created_at: string | null
          created_by: string
          deal_id: string
          description: string | null
          end_time: string
          id: string
          location: string | null
          start_time: string
          title: string
        }
        Insert: {
          created_at?: string | null
          created_by: string
          deal_id: string
          description?: string | null
          end_time: string
          id?: string
          location?: string | null
          start_time: string
          title: string
        }
        Update: {
          created_at?: string | null
          created_by?: string
          deal_id?: string
          description?: string | null
          end_time?: string
          id?: string
          location?: string | null
          start_time?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "deal_meetings_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "agent_statistics"
            referencedColumns: ["agent_id"]
          },
          {
            foreignKeyName: "deal_meetings_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deal_meetings_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "deals"
            referencedColumns: ["id"]
          },
        ]
      }
      deal_notes: {
        Row: {
          author_id: string
          created_at: string | null
          deal_id: string
          id: string
          text: string
        }
        Insert: {
          author_id: string
          created_at?: string | null
          deal_id: string
          id?: string
          text: string
        }
        Update: {
          author_id?: string
          created_at?: string | null
          deal_id?: string
          id?: string
          text?: string
        }
        Relationships: [
          {
            foreignKeyName: "deal_notes_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "agent_statistics"
            referencedColumns: ["agent_id"]
          },
          {
            foreignKeyName: "deal_notes_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deal_notes_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "deals"
            referencedColumns: ["id"]
          },
        ]
      }
      deal_notifications: {
        Row: {
          created_at: string | null
          deal_id: string
          id: string
          message: string
          read: boolean | null
          recipient_id: string
          type: string
        }
        Insert: {
          created_at?: string | null
          deal_id: string
          id?: string
          message: string
          read?: boolean | null
          recipient_id: string
          type: string
        }
        Update: {
          created_at?: string | null
          deal_id?: string
          id?: string
          message?: string
          read?: boolean | null
          recipient_id?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "deal_notifications_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "deals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deal_notifications_recipient_id_fkey"
            columns: ["recipient_id"]
            isOneToOne: false
            referencedRelation: "agent_statistics"
            referencedColumns: ["agent_id"]
          },
          {
            foreignKeyName: "deal_notifications_recipient_id_fkey"
            columns: ["recipient_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      deals: {
        Row: {
          archived_at: string | null
          buying_agent_id: string
          buying_agent_signed: boolean | null
          client_email: string
          client_name: string
          closed_at: string | null
          collaboration_request_id: string | null
          commission_split: number | null
          contract_at: string | null
          created_at: string | null
          deal_progress: Json | null
          deal_type: string
          docs_sent_at: string | null
          draft_at: string | null
          id: string
          in_progress_at: string | null
          inquiry_at: string | null
          lead_id: string | null
          listing_agent_id: string
          listing_agent_signed: boolean | null
          locked: boolean | null
          lost_at: string | null
          negotiation_at: string | null
          offer_at: string | null
          payment_at: string | null
          property_id: string
          signed_at: string | null
          status: Database["public"]["Enums"]["deal_status"]
          transfer_at: string | null
          updated_at: string | null
          viewing_at: string | null
        }
        Insert: {
          archived_at?: string | null
          buying_agent_id: string
          buying_agent_signed?: boolean | null
          client_email: string
          client_name: string
          closed_at?: string | null
          collaboration_request_id?: string | null
          commission_split?: number | null
          contract_at?: string | null
          created_at?: string | null
          deal_progress?: Json | null
          deal_type?: string
          docs_sent_at?: string | null
          draft_at?: string | null
          id?: string
          in_progress_at?: string | null
          inquiry_at?: string | null
          lead_id?: string | null
          listing_agent_id: string
          listing_agent_signed?: boolean | null
          locked?: boolean | null
          lost_at?: string | null
          negotiation_at?: string | null
          offer_at?: string | null
          payment_at?: string | null
          property_id: string
          signed_at?: string | null
          status?: Database["public"]["Enums"]["deal_status"]
          transfer_at?: string | null
          updated_at?: string | null
          viewing_at?: string | null
        }
        Update: {
          archived_at?: string | null
          buying_agent_id?: string
          buying_agent_signed?: boolean | null
          client_email?: string
          client_name?: string
          closed_at?: string | null
          collaboration_request_id?: string | null
          commission_split?: number | null
          contract_at?: string | null
          created_at?: string | null
          deal_progress?: Json | null
          deal_type?: string
          docs_sent_at?: string | null
          draft_at?: string | null
          id?: string
          in_progress_at?: string | null
          inquiry_at?: string | null
          lead_id?: string | null
          listing_agent_id?: string
          listing_agent_signed?: boolean | null
          locked?: boolean | null
          lost_at?: string | null
          negotiation_at?: string | null
          offer_at?: string | null
          payment_at?: string | null
          property_id?: string
          signed_at?: string | null
          status?: Database["public"]["Enums"]["deal_status"]
          transfer_at?: string | null
          updated_at?: string | null
          viewing_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "deals_buying_agent_id_fkey"
            columns: ["buying_agent_id"]
            isOneToOne: false
            referencedRelation: "agent_statistics"
            referencedColumns: ["agent_id"]
          },
          {
            foreignKeyName: "deals_buying_agent_id_fkey"
            columns: ["buying_agent_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deals_collaboration_request_id_fkey"
            columns: ["collaboration_request_id"]
            isOneToOne: false
            referencedRelation: "collaboration_requests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deals_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "crm_leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deals_listing_agent_id_fkey"
            columns: ["listing_agent_id"]
            isOneToOne: false
            referencedRelation: "agent_statistics"
            referencedColumns: ["agent_id"]
          },
          {
            foreignKeyName: "deals_listing_agent_id_fkey"
            columns: ["listing_agent_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deals_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      developer_agency_contracts: {
        Row: {
          agency_id: string
          agency_license_url: string | null
          agency_registration_url: string | null
          agency_signed_contract_url: string | null
          created_at: string | null
          developer_contract_url: string | null
          developer_id: string
          id: string
          notes: string | null
          status: string
          updated_at: string | null
        }
        Insert: {
          agency_id: string
          agency_license_url?: string | null
          agency_registration_url?: string | null
          agency_signed_contract_url?: string | null
          created_at?: string | null
          developer_contract_url?: string | null
          developer_id: string
          id?: string
          notes?: string | null
          status?: string
          updated_at?: string | null
        }
        Update: {
          agency_id?: string
          agency_license_url?: string | null
          agency_registration_url?: string | null
          agency_signed_contract_url?: string | null
          created_at?: string | null
          developer_contract_url?: string | null
          developer_id?: string
          id?: string
          notes?: string | null
          status?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "developer_agency_contracts_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: false
            referencedRelation: "agent_statistics"
            referencedColumns: ["agent_id"]
          },
          {
            foreignKeyName: "developer_agency_contracts_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "developer_agency_contracts_developer_id_fkey"
            columns: ["developer_id"]
            isOneToOne: false
            referencedRelation: "agent_statistics"
            referencedColumns: ["agent_id"]
          },
          {
            foreignKeyName: "developer_agency_contracts_developer_id_fkey"
            columns: ["developer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      developer_contracts: {
        Row: {
          developer_id: string
          file_name: string
          file_url: string
          id: string
          uploaded_at: string | null
        }
        Insert: {
          developer_id: string
          file_name: string
          file_url: string
          id?: string
          uploaded_at?: string | null
        }
        Update: {
          developer_id?: string
          file_name?: string
          file_url?: string
          id?: string
          uploaded_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "developer_contracts_developer_id_fkey"
            columns: ["developer_id"]
            isOneToOne: false
            referencedRelation: "agent_statistics"
            referencedColumns: ["agent_id"]
          },
          {
            foreignKeyName: "developer_contracts_developer_id_fkey"
            columns: ["developer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      developer_meetings: {
        Row: {
          agency_id: string | null
          agent_id: string | null
          date: string
          developer_id: string
          id: string
          notes: string | null
          project_id: string | null
          status: string
          title: string
        }
        Insert: {
          agency_id?: string | null
          agent_id?: string | null
          date: string
          developer_id: string
          id?: string
          notes?: string | null
          project_id?: string | null
          status?: string
          title: string
        }
        Update: {
          agency_id?: string | null
          agent_id?: string | null
          date?: string
          developer_id?: string
          id?: string
          notes?: string | null
          project_id?: string | null
          status?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "developer_meetings_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: false
            referencedRelation: "agent_statistics"
            referencedColumns: ["agent_id"]
          },
          {
            foreignKeyName: "developer_meetings_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "developer_meetings_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agent_statistics"
            referencedColumns: ["agent_id"]
          },
          {
            foreignKeyName: "developer_meetings_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "developer_meetings_developer_id_fkey"
            columns: ["developer_id"]
            isOneToOne: false
            referencedRelation: "agent_statistics"
            referencedColumns: ["agent_id"]
          },
          {
            foreignKeyName: "developer_meetings_developer_id_fkey"
            columns: ["developer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "developer_meetings_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      developer_project_leads: {
        Row: {
          agency_id: string | null
          agent_id: string
          client_name: string
          developer_id: string
          id: string
          notes: string | null
          project_id: string
          status: string
          submitted_at: string | null
          updated_at: string | null
        }
        Insert: {
          agency_id?: string | null
          agent_id: string
          client_name: string
          developer_id: string
          id?: string
          notes?: string | null
          project_id: string
          status?: string
          submitted_at?: string | null
          updated_at?: string | null
        }
        Update: {
          agency_id?: string | null
          agent_id?: string
          client_name?: string
          developer_id?: string
          id?: string
          notes?: string | null
          project_id?: string
          status?: string
          submitted_at?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "developer_project_leads_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: false
            referencedRelation: "agent_statistics"
            referencedColumns: ["agent_id"]
          },
          {
            foreignKeyName: "developer_project_leads_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "developer_project_leads_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agent_statistics"
            referencedColumns: ["agent_id"]
          },
          {
            foreignKeyName: "developer_project_leads_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "developer_project_leads_developer_id_fkey"
            columns: ["developer_id"]
            isOneToOne: false
            referencedRelation: "agent_statistics"
            referencedColumns: ["agent_id"]
          },
          {
            foreignKeyName: "developer_project_leads_developer_id_fkey"
            columns: ["developer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "developer_project_leads_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      developer_project_stats: {
        Row: {
          developer_id: string
          id: string
          last_updated_at: string
          num_active_projects: number
          num_agents_displaying_project: number
          num_agents_in_agencies: number
          num_partner_agencies: number
          num_projects_uploaded_by_developer: number
          num_total_properties_for_sale: number
          project_id: string | null
          total_project_page_views_by_agents: number
          total_project_page_views_by_buyers: number
        }
        Insert: {
          developer_id: string
          id?: string
          last_updated_at?: string
          num_active_projects?: number
          num_agents_displaying_project?: number
          num_agents_in_agencies?: number
          num_partner_agencies?: number
          num_projects_uploaded_by_developer?: number
          num_total_properties_for_sale?: number
          project_id?: string | null
          total_project_page_views_by_agents?: number
          total_project_page_views_by_buyers?: number
        }
        Update: {
          developer_id?: string
          id?: string
          last_updated_at?: string
          num_active_projects?: number
          num_agents_displaying_project?: number
          num_agents_in_agencies?: number
          num_partner_agencies?: number
          num_projects_uploaded_by_developer?: number
          num_total_properties_for_sale?: number
          project_id?: string | null
          total_project_page_views_by_agents?: number
          total_project_page_views_by_buyers?: number
        }
        Relationships: [
          {
            foreignKeyName: "developer_project_stats_developer_id_fkey"
            columns: ["developer_id"]
            isOneToOne: false
            referencedRelation: "agent_statistics"
            referencedColumns: ["agent_id"]
          },
          {
            foreignKeyName: "developer_project_stats_developer_id_fkey"
            columns: ["developer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "developer_project_stats_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      homepage_assets: {
        Row: {
          created_at: string | null
          created_by: string | null
          file_name: string
          file_size: number
          file_type: string
          id: string
          url: string
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          file_name: string
          file_size: number
          file_type: string
          id?: string
          url: string
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          file_name?: string
          file_size?: number
          file_type?: string
          id?: string
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "homepage_assets_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "super_admins"
            referencedColumns: ["id"]
          },
        ]
      }
      homepage_content: {
        Row: {
          created_at: string | null
          created_by: string | null
          description: string | null
          id: string
          image_url: string | null
          is_visible: boolean
          link_text: string | null
          link_url: string | null
          section_id: string
          sort_order: number
          subtitle: string | null
          title: string | null
          updated_at: string | null
          updated_by: string | null
          video_url: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          is_visible?: boolean
          link_text?: string | null
          link_url?: string | null
          section_id: string
          sort_order?: number
          subtitle?: string | null
          title?: string | null
          updated_at?: string | null
          updated_by?: string | null
          video_url?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          is_visible?: boolean
          link_text?: string | null
          link_url?: string | null
          section_id?: string
          sort_order?: number
          subtitle?: string | null
          title?: string | null
          updated_at?: string | null
          updated_by?: string | null
          video_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "homepage_content_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "super_admins"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "homepage_content_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "super_admins"
            referencedColumns: ["id"]
          },
        ]
      }
      import_tokens: {
        Row: {
          created_at: string | null
          developer_id: string | null
          expires_at: string | null
          id: string
          project_count: number | null
          used_at: string | null
        }
        Insert: {
          created_at?: string | null
          developer_id?: string | null
          expires_at?: string | null
          id?: string
          project_count?: number | null
          used_at?: string | null
        }
        Update: {
          created_at?: string | null
          developer_id?: string | null
          expires_at?: string | null
          id?: string
          project_count?: number | null
          used_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "import_tokens_developer_id_fkey"
            columns: ["developer_id"]
            isOneToOne: false
            referencedRelation: "agent_statistics"
            referencedColumns: ["agent_id"]
          },
          {
            foreignKeyName: "import_tokens_developer_id_fkey"
            columns: ["developer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      job_applications: {
        Row: {
          agent_id: string
          cover_letter: string | null
          created_at: string | null
          id: string
          job_id: string
          status: string
          updated_at: string | null
        }
        Insert: {
          agent_id: string
          cover_letter?: string | null
          created_at?: string | null
          id?: string
          job_id: string
          status?: string
          updated_at?: string | null
        }
        Update: {
          agent_id?: string
          cover_letter?: string | null
          created_at?: string | null
          id?: string
          job_id?: string
          status?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "job_applications_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agent_statistics"
            referencedColumns: ["agent_id"]
          },
          {
            foreignKeyName: "job_applications_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_applications_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "job_postings"
            referencedColumns: ["id"]
          },
        ]
      }
      job_postings: {
        Row: {
          agency_id: string
          contract_type: string | null
          created_at: string | null
          deadline: string
          description: string
          experience_required: string
          id: string
          languages: string[]
          location: string
          qualifications: string[]
          salary_max: number | null
          salary_min: number | null
          status: string
          title: string
          updated_at: string | null
        }
        Insert: {
          agency_id: string
          contract_type?: string | null
          created_at?: string | null
          deadline: string
          description: string
          experience_required: string
          id?: string
          languages: string[]
          location: string
          qualifications: string[]
          salary_max?: number | null
          salary_min?: number | null
          status?: string
          title: string
          updated_at?: string | null
        }
        Update: {
          agency_id?: string
          contract_type?: string | null
          created_at?: string | null
          deadline?: string
          description?: string
          experience_required?: string
          id?: string
          languages?: string[]
          location?: string
          qualifications?: string[]
          salary_max?: number | null
          salary_min?: number | null
          status?: string
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "job_postings_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: false
            referencedRelation: "agent_statistics"
            referencedColumns: ["agent_id"]
          },
          {
            foreignKeyName: "job_postings_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      leads: {
        Row: {
          budget: string
          created_at: string | null
          email: string
          id: string
          name: string
          status: string
          timeline: string
          updated_at: string | null
          whatsapp: string
        }
        Insert: {
          budget: string
          created_at?: string | null
          email: string
          id?: string
          name: string
          status?: string
          timeline: string
          updated_at?: string | null
          whatsapp: string
        }
        Update: {
          budget?: string
          created_at?: string | null
          email?: string
          id?: string
          name?: string
          status?: string
          timeline?: string
          updated_at?: string | null
          whatsapp?: string
        }
        Relationships: []
      }
      messages: {
        Row: {
          created_at: string | null
          email: string
          id: string
          message: string
          name: string
        }
        Insert: {
          created_at?: string | null
          email: string
          id?: string
          message: string
          name: string
        }
        Update: {
          created_at?: string | null
          email?: string
          id?: string
          message?: string
          name?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          agency_id: string | null
          created_at: string
          id: string
          is_read: boolean
          link_url: string | null
          message: string
          recipient_id: string
          title: string
          token: string | null
          type: string
        }
        Insert: {
          agency_id?: string | null
          created_at?: string
          id?: string
          is_read?: boolean
          link_url?: string | null
          message: string
          recipient_id: string
          title: string
          token?: string | null
          type: string
        }
        Update: {
          agency_id?: string | null
          created_at?: string
          id?: string
          is_read?: boolean
          link_url?: string | null
          message?: string
          recipient_id?: string
          title?: string
          token?: string | null
          type?: string
        }
        Relationships: []
      }
      page_views: {
        Row: {
          id: string
          ip_address: string | null
          profile_id: string | null
          property_id: string | null
          user_agent: string | null
          viewed_at: string | null
          viewer_id: string | null
        }
        Insert: {
          id?: string
          ip_address?: string | null
          profile_id?: string | null
          property_id?: string | null
          user_agent?: string | null
          viewed_at?: string | null
          viewer_id?: string | null
        }
        Update: {
          id?: string
          ip_address?: string | null
          profile_id?: string | null
          property_id?: string | null
          user_agent?: string | null
          viewed_at?: string | null
          viewer_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "page_views_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "agent_statistics"
            referencedColumns: ["agent_id"]
          },
          {
            foreignKeyName: "page_views_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "page_views_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "page_views_viewer_id_fkey"
            columns: ["viewer_id"]
            isOneToOne: false
            referencedRelation: "agent_statistics"
            referencedColumns: ["agent_id"]
          },
          {
            foreignKeyName: "page_views_viewer_id_fkey"
            columns: ["viewer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          agency_email: string | null
          agency_formation_date: string | null
          agency_id: string | null
          agency_logo: string | null
          agency_name: string | null
          agency_team_size: number | null
          agency_website: string | null
          api_token: string | null
          avatar_url: string | null
          company_details: Json | null
          created_at: string | null
          developer_details: Json | null
          email: string
          experience: string | null
          facebook: string | null
          full_name: string | null
          id: string
          instagram: string | null
          introduction: string | null
          languages: string[] | null
          linkedin: string | null
          location: string | null
          promotion_video_url: string | null
          registration_number: string | null
          role: string
          slug: string | null
          specialties: string[] | null
          tiktok: string | null
          updated_at: string | null
          verified: boolean | null
          whatsapp: string | null
          x: string | null
          youtube: string | null
        }
        Insert: {
          agency_email?: string | null
          agency_formation_date?: string | null
          agency_id?: string | null
          agency_logo?: string | null
          agency_name?: string | null
          agency_team_size?: number | null
          agency_website?: string | null
          api_token?: string | null
          avatar_url?: string | null
          company_details?: Json | null
          created_at?: string | null
          developer_details?: Json | null
          email: string
          experience?: string | null
          facebook?: string | null
          full_name?: string | null
          id: string
          instagram?: string | null
          introduction?: string | null
          languages?: string[] | null
          linkedin?: string | null
          location?: string | null
          promotion_video_url?: string | null
          registration_number?: string | null
          role?: string
          slug?: string | null
          specialties?: string[] | null
          tiktok?: string | null
          updated_at?: string | null
          verified?: boolean | null
          whatsapp?: string | null
          x?: string | null
          youtube?: string | null
        }
        Update: {
          agency_email?: string | null
          agency_formation_date?: string | null
          agency_id?: string | null
          agency_logo?: string | null
          agency_name?: string | null
          agency_team_size?: number | null
          agency_website?: string | null
          api_token?: string | null
          avatar_url?: string | null
          company_details?: Json | null
          created_at?: string | null
          developer_details?: Json | null
          email?: string
          experience?: string | null
          facebook?: string | null
          full_name?: string | null
          id?: string
          instagram?: string | null
          introduction?: string | null
          languages?: string[] | null
          linkedin?: string | null
          location?: string | null
          promotion_video_url?: string | null
          registration_number?: string | null
          role?: string
          slug?: string | null
          specialties?: string[] | null
          tiktok?: string | null
          updated_at?: string | null
          verified?: boolean | null
          whatsapp?: string | null
          x?: string | null
          youtube?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: false
            referencedRelation: "agent_statistics"
            referencedColumns: ["agent_id"]
          },
          {
            foreignKeyName: "profiles_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      properties: {
        Row: {
          agent_id: string
          amenities: string[] | null
          average_unit_size: number | null
          bathrooms: number | null
          bedrooms: number | null
          brochure: Json | null
          brochure_url: string | null
          completion_status:
            | Database["public"]["Enums"]["completion_status"]
            | null
          contract_type: Database["public"]["Enums"]["contract_type"]
          created_at: string | null
          creator_id: string | null
          creator_type: string
          description: string | null
          entry_type: Database["public"]["Enums"]["project_entry_type"] | null
          eoi_amount: number | null
          first_payment_percent: number | null
          floor_plan: Json | null
          floor_plan_image: string | null
          furnishing_status:
            | Database["public"]["Enums"]["furnishing_status"]
            | null
          handover_date: string | null
          handover_percent: number | null
          highlight: string | null
          id: string
          images: string[]
          import_token: string | null
          is_prelaunch: boolean | null
          lat: number | null
          launch_date: string | null
          lng: number | null
          location: string
          map_address: string | null
          map_latitude: number | null
          map_longitude: number | null
          marketplace_id: string | null
          media_images: Json | null
          media_videos: Json | null
          monthly_payment_months: number | null
          monthly_payment_percent: number | null
          parking_available: boolean | null
          payment_plan: string | null
          payment_plan_type: string | null
          posthandover_months: number | null
          posthandover_percent: number | null
          posthandover_years_after: number | null
          price: number
          release_process: string | null
          shared: boolean | null
          shared_with_all_agents: boolean | null
          size_range_max: number | null
          size_range_min: number | null
          slug: string | null
          source: string
          sqft: number | null
          starting_price_by_unit_type: Json | null
          status: string | null
          title: string
          type: Database["public"]["Enums"]["property_type"]
          unit_size_unit: string | null
          unit_types: string[] | null
          updated_at: string | null
          videos: string[] | null
        }
        Insert: {
          agent_id: string
          amenities?: string[] | null
          average_unit_size?: number | null
          bathrooms?: number | null
          bedrooms?: number | null
          brochure?: Json | null
          brochure_url?: string | null
          completion_status?:
            | Database["public"]["Enums"]["completion_status"]
            | null
          contract_type: Database["public"]["Enums"]["contract_type"]
          created_at?: string | null
          creator_id?: string | null
          creator_type?: string
          description?: string | null
          entry_type?: Database["public"]["Enums"]["project_entry_type"] | null
          eoi_amount?: number | null
          first_payment_percent?: number | null
          floor_plan?: Json | null
          floor_plan_image?: string | null
          furnishing_status?:
            | Database["public"]["Enums"]["furnishing_status"]
            | null
          handover_date?: string | null
          handover_percent?: number | null
          highlight?: string | null
          id?: string
          images: string[]
          import_token?: string | null
          is_prelaunch?: boolean | null
          lat?: number | null
          launch_date?: string | null
          lng?: number | null
          location: string
          map_address?: string | null
          map_latitude?: number | null
          map_longitude?: number | null
          marketplace_id?: string | null
          media_images?: Json | null
          media_videos?: Json | null
          monthly_payment_months?: number | null
          monthly_payment_percent?: number | null
          parking_available?: boolean | null
          payment_plan?: string | null
          payment_plan_type?: string | null
          posthandover_months?: number | null
          posthandover_percent?: number | null
          posthandover_years_after?: number | null
          price: number
          release_process?: string | null
          shared?: boolean | null
          shared_with_all_agents?: boolean | null
          size_range_max?: number | null
          size_range_min?: number | null
          slug?: string | null
          source?: string
          sqft?: number | null
          starting_price_by_unit_type?: Json | null
          status?: string | null
          title: string
          type: Database["public"]["Enums"]["property_type"]
          unit_size_unit?: string | null
          unit_types?: string[] | null
          updated_at?: string | null
          videos?: string[] | null
        }
        Update: {
          agent_id?: string
          amenities?: string[] | null
          average_unit_size?: number | null
          bathrooms?: number | null
          bedrooms?: number | null
          brochure?: Json | null
          brochure_url?: string | null
          completion_status?:
            | Database["public"]["Enums"]["completion_status"]
            | null
          contract_type?: Database["public"]["Enums"]["contract_type"]
          created_at?: string | null
          creator_id?: string | null
          creator_type?: string
          description?: string | null
          entry_type?: Database["public"]["Enums"]["project_entry_type"] | null
          eoi_amount?: number | null
          first_payment_percent?: number | null
          floor_plan?: Json | null
          floor_plan_image?: string | null
          furnishing_status?:
            | Database["public"]["Enums"]["furnishing_status"]
            | null
          handover_date?: string | null
          handover_percent?: number | null
          highlight?: string | null
          id?: string
          images?: string[]
          import_token?: string | null
          is_prelaunch?: boolean | null
          lat?: number | null
          launch_date?: string | null
          lng?: number | null
          location?: string
          map_address?: string | null
          map_latitude?: number | null
          map_longitude?: number | null
          marketplace_id?: string | null
          media_images?: Json | null
          media_videos?: Json | null
          monthly_payment_months?: number | null
          monthly_payment_percent?: number | null
          parking_available?: boolean | null
          payment_plan?: string | null
          payment_plan_type?: string | null
          posthandover_months?: number | null
          posthandover_percent?: number | null
          posthandover_years_after?: number | null
          price?: number
          release_process?: string | null
          shared?: boolean | null
          shared_with_all_agents?: boolean | null
          size_range_max?: number | null
          size_range_min?: number | null
          slug?: string | null
          source?: string
          sqft?: number | null
          starting_price_by_unit_type?: Json | null
          status?: string | null
          title?: string
          type?: Database["public"]["Enums"]["property_type"]
          unit_size_unit?: string | null
          unit_types?: string[] | null
          updated_at?: string | null
          videos?: string[] | null
        }
        Relationships: [
          {
            foreignKeyName: "properties_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agent_statistics"
            referencedColumns: ["agent_id"]
          },
          {
            foreignKeyName: "properties_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "properties_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "agent_statistics"
            referencedColumns: ["agent_id"]
          },
          {
            foreignKeyName: "properties_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "properties_marketplace_id_fkey"
            columns: ["marketplace_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      property_shares: {
        Row: {
          id: string
          property_id: string
          shared_at: string | null
          shared_by: string
          shared_with: string
          status: string
          updated_at: string | null
        }
        Insert: {
          id?: string
          property_id: string
          shared_at?: string | null
          shared_by: string
          shared_with: string
          status?: string
          updated_at?: string | null
        }
        Update: {
          id?: string
          property_id?: string
          shared_at?: string | null
          shared_by?: string
          shared_with?: string
          status?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "property_shares_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "property_shares_shared_by_fkey"
            columns: ["shared_by"]
            isOneToOne: false
            referencedRelation: "agent_statistics"
            referencedColumns: ["agent_id"]
          },
          {
            foreignKeyName: "property_shares_shared_by_fkey"
            columns: ["shared_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "property_shares_shared_with_fkey"
            columns: ["shared_with"]
            isOneToOne: false
            referencedRelation: "agent_statistics"
            referencedColumns: ["agent_id"]
          },
          {
            foreignKeyName: "property_shares_shared_with_fkey"
            columns: ["shared_with"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      reviews: {
        Row: {
          agent_id: string
          agent_reply: string | null
          comment: string
          created_at: string | null
          id: string
          rating: number
          reviewer_contact: Json | null
          reviewer_id: string | null
          updated_at: string | null
        }
        Insert: {
          agent_id: string
          agent_reply?: string | null
          comment: string
          created_at?: string | null
          id?: string
          rating: number
          reviewer_contact?: Json | null
          reviewer_id?: string | null
          updated_at?: string | null
        }
        Update: {
          agent_id?: string
          agent_reply?: string | null
          comment?: string
          created_at?: string | null
          id?: string
          rating?: number
          reviewer_contact?: Json | null
          reviewer_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "reviews_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agent_statistics"
            referencedColumns: ["agent_id"]
          },
          {
            foreignKeyName: "reviews_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_reviewer_id_fkey"
            columns: ["reviewer_id"]
            isOneToOne: false
            referencedRelation: "agent_statistics"
            referencedColumns: ["agent_id"]
          },
          {
            foreignKeyName: "reviews_reviewer_id_fkey"
            columns: ["reviewer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      shared_properties: {
        Row: {
          agent_id: string
          created_at: string | null
          id: string
          notified: boolean | null
          property_id: string
          shared_by_agency_id: string
        }
        Insert: {
          agent_id: string
          created_at?: string | null
          id?: string
          notified?: boolean | null
          property_id: string
          shared_by_agency_id: string
        }
        Update: {
          agent_id?: string
          created_at?: string | null
          id?: string
          notified?: boolean | null
          property_id?: string
          shared_by_agency_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "shared_properties_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agent_statistics"
            referencedColumns: ["agent_id"]
          },
          {
            foreignKeyName: "shared_properties_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shared_properties_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shared_properties_shared_by_agency_id_fkey"
            columns: ["shared_by_agency_id"]
            isOneToOne: false
            referencedRelation: "agent_statistics"
            referencedColumns: ["agent_id"]
          },
          {
            foreignKeyName: "shared_properties_shared_by_agency_id_fkey"
            columns: ["shared_by_agency_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      super_admins: {
        Row: {
          created_at: string | null
          id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      unit_types: {
        Row: {
          created_at: string | null
          developer_id: string
          floor_plan_image: string | null
          floor_range: string | null
          id: string
          images: string[] | null
          name: string
          notes: string | null
          price_range: string | null
          project_id: string
          size_range: string | null
          status: string
          units_available: number | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          developer_id: string
          floor_plan_image?: string | null
          floor_range?: string | null
          id?: string
          images?: string[] | null
          name: string
          notes?: string | null
          price_range?: string | null
          project_id: string
          size_range?: string | null
          status?: string
          units_available?: number | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          developer_id?: string
          floor_plan_image?: string | null
          floor_range?: string | null
          id?: string
          images?: string[] | null
          name?: string
          notes?: string | null
          price_range?: string | null
          project_id?: string
          size_range?: string | null
          status?: string
          units_available?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "unit_types_developer_id_fkey"
            columns: ["developer_id"]
            isOneToOne: false
            referencedRelation: "agent_statistics"
            referencedColumns: ["agent_id"]
          },
          {
            foreignKeyName: "unit_types_developer_id_fkey"
            columns: ["developer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "unit_types_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      agent_statistics: {
        Row: {
          active_deals: number | null
          agent_id: string | null
          full_name: string | null
          new_deals_30d: number | null
          new_properties_30d: number | null
          refreshed_at: string | null
          role: string | null
          shared_properties: number | null
          shares_30d: number | null
          total_deals: number | null
          total_properties: number | null
          total_shares: number | null
          total_views: number | null
          unique_properties_shared: number | null
          unique_viewing_days: number | null
          verified: boolean | null
          views_30d: number | null
        }
        Relationships: []
      }
      service_area_statistics: {
        Row: {
          agent_id: string | null
          location: string | null
          max_price: number | null
          min_price: number | null
          new_properties_30d: number | null
          rent_properties: number | null
          sale_properties: number | null
          total_agents_active: number | null
          total_properties: number | null
        }
        Relationships: [
          {
            foreignKeyName: "properties_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agent_statistics"
            referencedColumns: ["agent_id"]
          },
          {
            foreignKeyName: "properties_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      accept_invitation: {
        Args: { p_token: string; p_user_id: string }
        Returns: boolean
      }
      add_columns: {
        Args: { sql_statement: string }
        Returns: undefined
      }
      add_notification: {
        Args: {
          p_recipient_id: string
          p_type: string
          p_title: string
          p_message: string
          p_link_url?: string
        }
        Returns: string
      }
      add_to_my_listings: {
        Args: { p_property_id: string; p_agent_id?: string }
        Returns: string
      }
      create_agent_invitation: {
        Args: { p_email: string; p_agency_id: string }
        Returns: string
      }
      create_indexes: {
        Args: { sql_statement: string }
        Returns: undefined
      }
      create_notification: {
        Args: {
          p_recipient_id: string
          p_type: string
          p_title: string
          p_message: string
          p_link_url?: string
        }
        Returns: string
      }
      create_sample_notifications_for_user: {
        Args: { user_id: string }
        Returns: undefined
      }
      create_trigger: {
        Args: { trigger_definition: string }
        Returns: undefined
      }
      create_validation_function: {
        Args: { function_definition: string }
        Returns: undefined
      }
      fix_user_role_to_developer: {
        Args: { user_id: string }
        Returns: undefined
      }
      generate_agent_slug: {
        Args: { full_name: string; id: string }
        Returns: string
      }
      generate_developer_api_token: {
        Args: { p_developer_id: string }
        Returns: string
      }
      generate_developer_slug: {
        Args: { full_name: string; id: string }
        Returns: string
      }
      generate_import_token: {
        Args: { p_developer_id: string; p_project_count: number }
        Returns: string
      }
      generate_invitation_token: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      generate_property_slug: {
        Args: { title: string; id: string }
        Returns: string
      }
      get_agent_service_areas: {
        Args: { p_agent_id: string }
        Returns: {
          location: string
          property_count: number
        }[]
      }
      get_agent_visible_properties: {
        Args: { agent_id: string }
        Returns: {
          property_id: string
        }[]
      }
      get_all_property_amenities: {
        Args: { p_property_id: string }
        Returns: {
          name: string
          is_custom: boolean
        }[]
      }
      get_developer_stats: {
        Args: { p_developer_id: string }
        Returns: Json
      }
      get_project_import_template: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      get_unread_message_counts: {
        Args: { p_user_id: string; p_deal_ids: string[] }
        Returns: {
          deal_id: string
          count: number
        }[]
      }
      get_unread_notification_count: {
        Args: { p_user_id: string }
        Returns: number
      }
      log_chat_activity: {
        Args: { p_deal_id: string; p_sender_id: string; p_message: string }
        Returns: undefined
      }
      mark_all_notifications_read: {
        Args: { p_user_id: string }
        Returns: undefined
      }
      mark_notification_read: {
        Args: { p_notification_id: string }
        Returns: boolean
      }
      populate_developer_project_stats: {
        Args: { p_developer_id: string }
        Returns: undefined
      }
      refresh_agent_statistics: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      refresh_developer_stats: {
        Args: { p_developer_id: string }
        Returns: undefined
      }
      refresh_service_area_statistics: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      set_claim: {
        Args: { claim: string; value: string }
        Returns: undefined
      }
      standardize_filename: {
        Args: { original_name: string; user_id: string; category?: string }
        Returns: string
      }
      track_page_view: {
        Args: { p_profile_id?: string; p_property_id?: string }
        Returns: undefined
      }
      track_project_view: {
        Args: { p_project_id: string; p_viewer_id?: string }
        Returns: undefined
      }
      update_deal_checklist_item: {
        Args: { p_deal_id: string; p_item_id: string; p_completed: boolean }
        Returns: Json
      }
      update_property_coordinates: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      update_user_role_to_developer: {
        Args: { user_email: string }
        Returns: undefined
      }
      verify_invitation_token: {
        Args: { p_token: string }
        Returns: Json
      }
    }
    Enums: {
      completion_status: "Ready" | "Off-Plan" | "Off-plan resale"
      contract_type: "Sale" | "Rent"
      deal_status:
        | "inquiry"
        | "viewing"
        | "offer"
        | "negotiation"
        | "contract"
        | "payment"
        | "transfer"
      furnishing_status: "Furnished" | "Unfurnished" | "Semi-Furnished"
      project_entry_type: "manual" | "imported" | "prelaunch"
      property_type:
        | "Apartment"
        | "House"
        | "Villa"
        | "Land"
        | "Town house"
        | "Penthouse"
        | "Townhouse"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      completion_status: ["Ready", "Off-Plan", "Off-plan resale"],
      contract_type: ["Sale", "Rent"],
      deal_status: [
        "inquiry",
        "viewing",
        "offer",
        "negotiation",
        "contract",
        "payment",
        "transfer",
      ],
      furnishing_status: ["Furnished", "Unfurnished", "Semi-Furnished"],
      project_entry_type: ["manual", "imported", "prelaunch"],
      property_type: [
        "Apartment",
        "House",
        "Villa",
        "Land",
        "Town house",
        "Penthouse",
        "Townhouse",
      ],
    },
  },
} as const
