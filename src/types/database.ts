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
        Insert: Omit<Database['public']['Tables']['clinics']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['clinics']['Insert']>
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
        Insert: Omit<Database['public']['Tables']['profiles']['Row'], 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['profiles']['Insert']>
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
        Insert: Omit<Database['public']['Tables']['patients']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['patients']['Insert']>
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
        Insert: Omit<Database['public']['Tables']['content']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['content']['Insert']>
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
        Insert: Omit<Database['public']['Tables']['campaigns']['Row'], 'id' | 'cpl' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['campaigns']['Insert']>
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
        Insert: Omit<Database['public']['Tables']['leads']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['leads']['Insert']>
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
        Insert: Omit<Database['public']['Tables']['bookings']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['bookings']['Insert']>
      }
    }
    Functions: {
      get_my_role: { Args: Record<never, never>; Returns: UserRole }
      get_my_clinic_id: { Args: Record<never, never>; Returns: string }
      has_role: { Args: { check_role: UserRole }; Returns: boolean }
    }
  }
}
