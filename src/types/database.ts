export type AlertStatus = 'active' | 'completed' | 'fallback_triggered' | 'cancelled'
export type RequestStatus = 'pending' | 'accepted' | 'rejected' | 'expired'

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          username: string
          full_name: string | null
          phone: string | null
          push_token: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          username: string
          full_name?: string | null
          phone?: string | null
          push_token?: string | null
        }
        Update: {
          username?: string
          full_name?: string | null
          phone?: string | null
          push_token?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      contacts: {
        Row: {
          id: string
          user_id: string
          contact_id: string
          is_trusted: boolean
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          contact_id: string
          is_trusted?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          contact_id?: string
          is_trusted?: boolean
          created_at?: string
        }
        Relationships: []
      }
      alerts: {
        Row: {
          id: string
          user_id: string
          destination_name: string
          destination_lat: number
          destination_lng: number
          destination_radius: number
          fallback_minutes: number
          fallback_at: string
          status: AlertStatus
          triggered_at: string | null
          last_known_lat: number | null
          last_known_lng: number | null
          last_known_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          destination_name: string
          destination_lat: number
          destination_lng: number
          destination_radius?: number
          fallback_minutes: number
          fallback_at: string
          status?: AlertStatus
          triggered_at?: string | null
          last_known_lat?: number | null
          last_known_lng?: number | null
          last_known_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          destination_name?: string
          destination_lat?: number
          destination_lng?: number
          destination_radius?: number
          fallback_minutes?: number
          fallback_at?: string
          status?: AlertStatus
          triggered_at?: string | null
          last_known_lat?: number | null
          last_known_lng?: number | null
          last_known_at?: string | null
          created_at?: string
        }
        Relationships: []
      }
      alert_recipients: {
        Row: {
          id: string
          alert_id: string
          recipient_id: string
          notified_at: string | null
        }
        Insert: {
          id?: string
          alert_id: string
          recipient_id: string
          notified_at?: string | null
        }
        Update: {
          id?: string
          alert_id?: string
          recipient_id?: string
          notified_at?: string | null
        }
        Relationships: []
      }
      requests: {
        Row: {
          id: string
          from_user_id: string
          to_user_id: string
          destination_name: string | null
          destination_lat: number | null
          destination_lng: number | null
          message: string | null
          status: RequestStatus
          responded_at: string | null
          created_alert_id: string | null
          created_at: string
          expires_at: string | null
        }
        Insert: {
          id?: string
          from_user_id: string
          to_user_id: string
          destination_name?: string | null
          destination_lat?: number | null
          destination_lng?: number | null
          message?: string | null
          status?: RequestStatus
          responded_at?: string | null
          created_alert_id?: string | null
          created_at?: string
          expires_at?: string | null
        }
        Update: {
          id?: string
          from_user_id?: string
          to_user_id?: string
          destination_name?: string | null
          destination_lat?: number | null
          destination_lng?: number | null
          message?: string | null
          status?: RequestStatus
          responded_at?: string | null
          created_alert_id?: string | null
          created_at?: string
          expires_at?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      alert_status: AlertStatus
      request_status: RequestStatus
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

// Tipos derivados
export type Profile = Database['public']['Tables']['profiles']['Row']
export type Contact = Database['public']['Tables']['contacts']['Row']
export type Alert = Database['public']['Tables']['alerts']['Row']
export type AlertRecipient = Database['public']['Tables']['alert_recipients']['Row']
export type Request = Database['public']['Tables']['requests']['Row']

// Tipos con relaciones
export type ContactWithProfile = Contact & {
  contact: Profile
}

export type AlertWithRecipients = Alert & {
  recipients: (AlertRecipient & { recipient: Profile })[]
}

export type RequestWithUsers = Request & {
  from_user: Profile
  to_user: Profile
}
