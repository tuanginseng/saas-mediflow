export type UserRole = 'admin' | 'doctor' | 'marketer' | 'telesale'
export type ContentStatus = 'draft' | 'pending_review' | 'approved' | 'rejected' | 'published'
export type ContentStage = 'stage_0' | 'stage_2'
export type PatientStatus = 'new' | 'contacted' | 'booked' | 'treated' | 'follow_up' | 'lost'
export type LeadStatus = 'new' | 'calling' | 'interested' | 'booked' | 'rejected' | 'invalid'
export type CampaignChannel = 'facebook' | 'google' | 'tiktok' | 'zalo' | 'youtube' | 'referral' | 'organic' | 'other'
export type BookingStatus = 'scheduled' | 'confirmed' | 'completed' | 'cancelled' | 'no_show'

export interface Database {
  public: {
    Tables: {
      content_reviews: {
        Row: {
          id: string
          content_id: string
          reviewer_id: string
          status: ContentStatus
          medical_approved: boolean
          feedback: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          content_id: string
          reviewer_id: string
          status: ContentStatus
          medical_approved?: boolean
          feedback?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          content_id?: string
          reviewer_id?: string
          status?: ContentStatus
          medical_approved?: boolean
          feedback?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      clinics: {
        Row: {
          id: string
          name: string
          address: string | null
          phone: string | null
          email: string | null
          logo_url: string | null
          website: string | null
          tax_code: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          address?: string | null
          phone?: string | null
          email?: string | null
          logo_url?: string | null
          website?: string | null
          tax_code?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          address?: string | null
          phone?: string | null
          email?: string | null
          logo_url?: string | null
          website?: string | null
          tax_code?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          id: string
          clinic_id: string | null
          full_name: string
          avatar_url: string | null
          role: UserRole
          phone: string | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          clinic_id?: string | null
          full_name: string
          avatar_url?: string | null
          role: UserRole
          phone?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          clinic_id?: string | null
          full_name?: string
          avatar_url?: string | null
          role?: UserRole
          phone?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      patients: {
        Row: {
          id: string
          clinic_id: string | null
          full_name: string
          phone: string | null
          email: string | null
          date_of_birth: string | null
          gender: 'male' | 'female' | 'other' | null
          address: string | null
          source: string | null
          source_campaign_id: string | null
          status: PatientStatus
          assigned_telesale_id: string | null
          assigned_doctor_id: string | null
          notes: string | null
          tags: string[]
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          clinic_id?: string | null
          full_name: string
          phone?: string | null
          email?: string | null
          date_of_birth?: string | null
          gender?: 'male' | 'female' | 'other' | null
          address?: string | null
          source?: string | null
          source_campaign_id?: string | null
          status?: PatientStatus
          assigned_telesale_id?: string | null
          assigned_doctor_id?: string | null
          notes?: string | null
          tags?: string[]
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          clinic_id?: string | null
          full_name?: string
          phone?: string | null
          email?: string | null
          date_of_birth?: string | null
          gender?: 'male' | 'female' | 'other' | null
          address?: string | null
          source?: string | null
          source_campaign_id?: string | null
          status?: PatientStatus
          assigned_telesale_id?: string | null
          assigned_doctor_id?: string | null
          notes?: string | null
          tags?: string[]
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      content: {
        Row: {
          id: string
          clinic_id: string | null
          title: string
          body: string | null
          content_type: string
          stage: ContentStage
          status: ContentStatus
          keywords: string[]
          platform: string[]
          thumbnail_url: string | null
          media_urls: string[]
          author_id: string | null
          published_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          clinic_id?: string | null
          title: string
          body?: string | null
          content_type: string
          stage?: ContentStage
          status?: ContentStatus
          keywords?: string[]
          platform?: string[]
          thumbnail_url?: string | null
          media_urls?: string[]
          author_id?: string | null
          published_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          clinic_id?: string | null
          title?: string
          body?: string | null
          content_type?: string
          stage?: ContentStage
          status?: ContentStatus
          keywords?: string[]
          platform?: string[]
          thumbnail_url?: string | null
          media_urls?: string[]
          author_id?: string | null
          published_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      campaigns: {
        Row: {
          id: string
          clinic_id: string | null
          name: string
          description: string | null
          channel: CampaignChannel
          budget: number
          spent: number
          cpl: number
          cac: number
          total_leads: number
          total_converted: number
          start_date: string | null
          end_date: string | null
          is_active: boolean
          owner_id: string | null
          content_id: string | null
          utm_source: string | null
          utm_medium: string | null
          utm_campaign: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          clinic_id?: string | null
          name: string
          description?: string | null
          channel: CampaignChannel
          budget?: number
          spent?: number
          cac?: number
          total_leads?: number
          total_converted?: number
          start_date?: string | null
          end_date?: string | null
          is_active?: boolean
          owner_id?: string | null
          content_id?: string | null
          utm_source?: string | null
          utm_medium?: string | null
          utm_campaign?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          clinic_id?: string | null
          name?: string
          description?: string | null
          channel?: CampaignChannel
          budget?: number
          spent?: number
          cpl?: number
          cac?: number
          total_leads?: number
          total_converted?: number
          start_date?: string | null
          end_date?: string | null
          is_active?: boolean
          owner_id?: string | null
          content_id?: string | null
          utm_source?: string | null
          utm_medium?: string | null
          utm_campaign?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      leads: {
        Row: {
          id: string
          clinic_id: string | null
          campaign_id: string | null
          patient_id: string | null
          full_name: string
          phone: string
          email: string | null
          status: LeadStatus
          source: string | null
          utm_data: Record<string, unknown>
          assigned_to: string | null
          call_count: number
          last_called_at: string | null
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          clinic_id?: string | null
          campaign_id?: string | null
          patient_id?: string | null
          full_name: string
          phone: string
          email?: string | null
          status?: LeadStatus
          source?: string | null
          utm_data?: Record<string, unknown>
          assigned_to?: string | null
          call_count?: number
          last_called_at?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          clinic_id?: string | null
          campaign_id?: string | null
          patient_id?: string | null
          full_name?: string
          phone?: string
          email?: string | null
          status?: LeadStatus
          source?: string | null
          utm_data?: Record<string, unknown>
          assigned_to?: string | null
          call_count?: number
          last_called_at?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      bookings: {
        Row: {
          id: string
          clinic_id: string | null
          patient_id: string
          doctor_id: string | null
          lead_id: string | null
          booked_at: string
          duration_minutes: number
          status: BookingStatus
          service: string | null
          service_fee: number | null
          notes: string | null
          reminder_sent: boolean
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          clinic_id?: string | null
          patient_id: string
          doctor_id?: string | null
          lead_id?: string | null
          booked_at: string
          duration_minutes?: number
          status?: BookingStatus
          service?: string | null
          service_fee?: number | null
          notes?: string | null
          reminder_sent?: boolean
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          clinic_id?: string | null
          patient_id?: string
          doctor_id?: string | null
          lead_id?: string | null
          booked_at?: string
          duration_minutes?: number
          status?: BookingStatus
          service?: string | null
          service_fee?: number | null
          notes?: string | null
          reminder_sent?: boolean
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: Record<string, never>
    Functions: {
      get_my_role: { Args: Record<PropertyKey, never>; Returns: UserRole }
      get_my_clinic_id: { Args: Record<PropertyKey, never>; Returns: string }
      has_role: { Args: { check_role: UserRole }; Returns: boolean }
    }
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
}
