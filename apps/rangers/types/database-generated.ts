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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      announcement_reads: {
        Row: {
          announcement_id: string
          id: string
          read_at: string
          user_id: string
        }
        Insert: {
          announcement_id: string
          id?: string
          read_at?: string
          user_id: string
        }
        Update: {
          announcement_id?: string
          id?: string
          read_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "announcement_reads_announcement_id_fkey"
            columns: ["announcement_id"]
            isOneToOne: false
            referencedRelation: "announcements"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "announcement_reads_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "announcement_reads_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      announcements: {
        Row: {
          author_id: string
          body: string | null
          created_at: string
          id: string
          image_url: string | null
          link_url: string | null
          target_tags: Json | null
          team_id: string
          title: string
        }
        Insert: {
          author_id: string
          body?: string | null
          created_at?: string
          id?: string
          image_url?: string | null
          link_url?: string | null
          target_tags?: Json | null
          team_id: string
          title: string
        }
        Update: {
          author_id?: string
          body?: string | null
          created_at?: string
          id?: string
          image_url?: string | null
          link_url?: string | null
          target_tags?: Json | null
          team_id?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "announcements_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "announcements_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "announcements_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      bookings: {
        Row: {
          created_at: string
          id: string
          lesson_id: string
          status: string
          stripe_payment_intent_id: string | null
          swimmer_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          lesson_id: string
          status?: string
          stripe_payment_intent_id?: string | null
          swimmer_id: string
        }
        Update: {
          created_at?: string
          id?: string
          lesson_id?: string
          status?: string
          stripe_payment_intent_id?: string | null
          swimmer_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bookings_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_swimmer_id_fkey"
            columns: ["swimmer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_swimmer_id_fkey"
            columns: ["swimmer_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      join_requests: {
        Row: {
          created_at: string
          id: string
          membership_type: string
          rejection_reason: string | null
          status: string
          swimmer_id: string
          team_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          membership_type: string
          rejection_reason?: string | null
          status?: string
          swimmer_id: string
          team_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          membership_type?: string
          rejection_reason?: string | null
          status?: string
          swimmer_id?: string
          team_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "join_requests_swimmer_id_fkey"
            columns: ["swimmer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "join_requests_swimmer_id_fkey"
            columns: ["swimmer_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "join_requests_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      lessons: {
        Row: {
          capacity: number
          created_at: string
          description: string
          duration_minutes: number
          id: string
          instructor_id: string
          lesson_type: string
          location: string
          price: number
          scheduled_at: string
          specialty: string | null
          status: string
          target_age: string | null
          target_level: string | null
          title: string
        }
        Insert: {
          capacity?: number
          created_at?: string
          description?: string
          duration_minutes?: number
          id?: string
          instructor_id: string
          lesson_type?: string
          location?: string
          price?: number
          scheduled_at: string
          specialty?: string | null
          status?: string
          target_age?: string | null
          target_level?: string | null
          title: string
        }
        Update: {
          capacity?: number
          created_at?: string
          description?: string
          duration_minutes?: number
          id?: string
          instructor_id?: string
          lesson_type?: string
          location?: string
          price?: number
          scheduled_at?: string
          specialty?: string | null
          status?: string
          target_age?: string | null
          target_level?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "lessons_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lessons_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      membership_fees: {
        Row: {
          amount: number
          created_at: string
          id: string
          note: string | null
          paid_at: string | null
          payment_method: string | null
          period: string
          status: string
          stripe_invoice_id: string | null
          stripe_payment_intent_id: string | null
          stripe_subscription_id: string | null
          swimmer_id: string
          team_id: string
          type: string
        }
        Insert: {
          amount: number
          created_at?: string
          id?: string
          note?: string | null
          paid_at?: string | null
          payment_method?: string | null
          period: string
          status?: string
          stripe_invoice_id?: string | null
          stripe_payment_intent_id?: string | null
          stripe_subscription_id?: string | null
          swimmer_id: string
          team_id: string
          type: string
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          note?: string | null
          paid_at?: string | null
          payment_method?: string | null
          period?: string
          status?: string
          stripe_invoice_id?: string | null
          stripe_payment_intent_id?: string | null
          stripe_subscription_id?: string | null
          swimmer_id?: string
          team_id?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "membership_fees_swimmer_id_fkey"
            columns: ["swimmer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "membership_fees_swimmer_id_fkey"
            columns: ["swimmer_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "membership_fees_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          content: string
          created_at: string
          id: string
          read_at: string | null
          receiver_id: string
          sender_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          read_at?: string | null
          receiver_id: string
          sender_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          read_at?: string | null
          receiver_id?: string
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_receiver_id_fkey"
            columns: ["receiver_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_receiver_id_fkey"
            columns: ["receiver_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          body: string | null
          created_at: string
          id: string
          is_read: boolean
          link: string | null
          metadata: Json
          team_id: string | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          body?: string | null
          created_at?: string
          id?: string
          is_read?: boolean
          link?: string | null
          metadata?: Json
          team_id?: string | null
          title: string
          type: string
          user_id: string
        }
        Update: {
          body?: string | null
          created_at?: string
          id?: string
          is_read?: boolean
          link?: string | null
          metadata?: Json
          team_id?: string | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      platform_settings: {
        Row: {
          description: string | null
          key: string
          updated_at: string
          value: string
        }
        Insert: {
          description?: string | null
          key: string
          updated_at?: string
          value: string
        }
        Update: {
          description?: string | null
          key?: string
          updated_at?: string
          value?: string
        }
        Relationships: []
      }
      practice_sessions: {
        Row: {
          allow_point_card: boolean | null
          cancellation_days: number | null
          coach_id: string
          competition_fields: Json | null
          content: string | null
          course_rules: Json | null
          created_at: string
          description: string | null
          end_at: string | null
          gender_filter: string
          guest_price: number
          id: string
          is_external: boolean | null
          is_lp_featured: boolean | null
          location: string | null
          max_participants: number | null
          meeting_point: string | null
          member_price: number
          min_participants: number | null
          registration_deadline: string | null
          scheduled_at: string
          session_status: string
          status: string
          target_members: string[] | null
          target_tags: Json | null
          team_id: string
          title: string
          type: string
        }
        Insert: {
          allow_point_card?: boolean | null
          cancellation_days?: number | null
          coach_id: string
          competition_fields?: Json | null
          content?: string | null
          course_rules?: Json | null
          created_at?: string
          description?: string | null
          end_at?: string | null
          gender_filter?: string
          guest_price?: number
          id?: string
          is_external?: boolean | null
          is_lp_featured?: boolean | null
          location?: string | null
          max_participants?: number | null
          meeting_point?: string | null
          member_price?: number
          min_participants?: number | null
          registration_deadline?: string | null
          scheduled_at: string
          session_status?: string
          status?: string
          target_members?: string[] | null
          target_tags?: Json | null
          team_id: string
          title: string
          type?: string
        }
        Update: {
          allow_point_card?: boolean | null
          cancellation_days?: number | null
          coach_id?: string
          competition_fields?: Json | null
          content?: string | null
          course_rules?: Json | null
          created_at?: string
          description?: string | null
          end_at?: string | null
          gender_filter?: string
          guest_price?: number
          id?: string
          is_external?: boolean | null
          is_lp_featured?: boolean | null
          location?: string | null
          max_participants?: number | null
          meeting_point?: string | null
          member_price?: number
          min_participants?: number | null
          registration_deadline?: string | null
          scheduled_at?: string
          session_status?: string
          status?: string
          target_members?: string[] | null
          target_tags?: Json | null
          team_id?: string
          title?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "practice_sessions_coach_id_fkey"
            columns: ["coach_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "practice_sessions_coach_id_fkey"
            columns: ["coach_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "practice_sessions_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      price_views: {
        Row: {
          id: string
          session_id: string
          viewed_at: string
          viewer_id: string
        }
        Insert: {
          id?: string
          session_id: string
          viewed_at?: string
          viewer_id: string
        }
        Update: {
          id?: string
          session_id?: string
          viewed_at?: string
          viewer_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "price_views_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "practice_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "price_views_viewer_id_fkey"
            columns: ["viewer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "price_views_viewer_id_fkey"
            columns: ["viewer_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          achievements: string | null
          address: string | null
          avatar_url: string | null
          bio: string | null
          birthday: string | null
          career: string | null
          created_at: string
          deleted_at: string | null
          emergency_contact: string | null
          emergency_contact_name: string | null
          emergency_contact_relation: string | null
          furigana: string | null
          gender: string | null
          id: string
          jsa_number: string | null
          jsa_registered: boolean
          level: string | null
          line_user_id: string | null
          masters_number: string | null
          masters_registered: boolean
          name: string
          onboarding_completed_at: string | null
          participation_styles: string[]
          phone: string | null
          prefecture: string | null
          prefectures: string[]
          rating_avg: number
          review_count: number
          role: string
          specialties: string[] | null
          stripe_account_id: string | null
          stripe_customer_id: string | null
          stripe_payment_method_id: string | null
          swim_disciplines: string[]
          swimmer_type: string | null
          swimming_goals: string[]
          swimwear_size: string | null
          target_ages: string[] | null
        }
        Insert: {
          achievements?: string | null
          address?: string | null
          avatar_url?: string | null
          bio?: string | null
          birthday?: string | null
          career?: string | null
          created_at?: string
          deleted_at?: string | null
          emergency_contact?: string | null
          emergency_contact_name?: string | null
          emergency_contact_relation?: string | null
          furigana?: string | null
          gender?: string | null
          id: string
          jsa_number?: string | null
          jsa_registered?: boolean
          level?: string | null
          line_user_id?: string | null
          masters_number?: string | null
          masters_registered?: boolean
          name?: string
          onboarding_completed_at?: string | null
          participation_styles?: string[]
          phone?: string | null
          prefecture?: string | null
          prefectures?: string[]
          rating_avg?: number
          review_count?: number
          role?: string
          specialties?: string[] | null
          stripe_account_id?: string | null
          stripe_customer_id?: string | null
          stripe_payment_method_id?: string | null
          swim_disciplines?: string[]
          swimmer_type?: string | null
          swimming_goals?: string[]
          swimwear_size?: string | null
          target_ages?: string[] | null
        }
        Update: {
          achievements?: string | null
          address?: string | null
          avatar_url?: string | null
          bio?: string | null
          birthday?: string | null
          career?: string | null
          created_at?: string
          deleted_at?: string | null
          emergency_contact?: string | null
          emergency_contact_name?: string | null
          emergency_contact_relation?: string | null
          furigana?: string | null
          gender?: string | null
          id?: string
          jsa_number?: string | null
          jsa_registered?: boolean
          level?: string | null
          line_user_id?: string | null
          masters_number?: string | null
          masters_registered?: boolean
          name?: string
          onboarding_completed_at?: string | null
          participation_styles?: string[]
          phone?: string | null
          prefecture?: string | null
          prefectures?: string[]
          rating_avg?: number
          review_count?: number
          role?: string
          specialties?: string[] | null
          stripe_account_id?: string | null
          stripe_customer_id?: string | null
          stripe_payment_method_id?: string | null
          swim_disciplines?: string[]
          swimmer_type?: string | null
          swimming_goals?: string[]
          swimwear_size?: string | null
          target_ages?: string[] | null
        }
        Relationships: []
      }
      reviews: {
        Row: {
          booking_id: string
          comment: string | null
          created_at: string
          id: string
          instructor_id: string
          rating: number
          reviewer_id: string
        }
        Insert: {
          booking_id: string
          comment?: string | null
          created_at?: string
          id?: string
          instructor_id: string
          rating: number
          reviewer_id: string
        }
        Update: {
          booking_id?: string
          comment?: string | null
          created_at?: string
          id?: string
          instructor_id?: string
          rating?: number
          reviewer_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reviews_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: true
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_reviewer_id_fkey"
            columns: ["reviewer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_reviewer_id_fkey"
            columns: ["reviewer_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      schedule_requests: {
        Row: {
          created_at: string
          id: string
          instructor_id: string
          lesson_id: string | null
          message: string
          preferred_dates: string[] | null
          status: string
          swimmer_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          instructor_id: string
          lesson_id?: string | null
          message: string
          preferred_dates?: string[] | null
          status?: string
          swimmer_id: string
        }
        Update: {
          created_at?: string
          id?: string
          instructor_id?: string
          lesson_id?: string | null
          message?: string
          preferred_dates?: string[] | null
          status?: string
          swimmer_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "schedule_requests_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "schedule_requests_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "schedule_requests_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "schedule_requests_swimmer_id_fkey"
            columns: ["swimmer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "schedule_requests_swimmer_id_fkey"
            columns: ["swimmer_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      session_registrations: {
        Row: {
          cancelled_at: string | null
          competition_entry: Json | null
          id: string
          is_member: boolean
          payment_method: string
          payment_status: string
          registered_at: string
          session_id: string
          stripe_payment_intent_id: string | null
          swimmer_id: string
        }
        Insert: {
          cancelled_at?: string | null
          competition_entry?: Json | null
          id?: string
          is_member?: boolean
          payment_method?: string
          payment_status?: string
          registered_at?: string
          session_id: string
          stripe_payment_intent_id?: string | null
          swimmer_id: string
        }
        Update: {
          cancelled_at?: string | null
          competition_entry?: Json | null
          id?: string
          is_member?: boolean
          payment_method?: string
          payment_status?: string
          registered_at?: string
          session_id?: string
          stripe_payment_intent_id?: string | null
          swimmer_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "session_registrations_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "practice_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "session_registrations_swimmer_id_fkey"
            columns: ["swimmer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "session_registrations_swimmer_id_fkey"
            columns: ["swimmer_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      session_templates: {
        Row: {
          allow_point_card: boolean | null
          cancellation_days: number | null
          content: string | null
          course_rules: Json | null
          created_at: string
          deadline_days: number | null
          description: string | null
          guest_price: number | null
          id: string
          is_external: boolean | null
          location: string | null
          max_participants: number | null
          member_price: number | null
          min_participants: number | null
          name: string
          target_tags: Json | null
          team_id: string
          title: string
          type: string
        }
        Insert: {
          allow_point_card?: boolean | null
          cancellation_days?: number | null
          content?: string | null
          course_rules?: Json | null
          created_at?: string
          deadline_days?: number | null
          description?: string | null
          guest_price?: number | null
          id?: string
          is_external?: boolean | null
          location?: string | null
          max_participants?: number | null
          member_price?: number | null
          min_participants?: number | null
          name: string
          target_tags?: Json | null
          team_id: string
          title: string
          type?: string
        }
        Update: {
          allow_point_card?: boolean | null
          cancellation_days?: number | null
          content?: string | null
          course_rules?: Json | null
          created_at?: string
          deadline_days?: number | null
          description?: string | null
          guest_price?: number | null
          id?: string
          is_external?: boolean | null
          location?: string | null
          max_participants?: number | null
          member_price?: number | null
          min_participants?: number | null
          name?: string
          target_tags?: Json | null
          team_id?: string
          title?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "session_templates_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      stamp_purchases: {
        Row: {
          amount: number
          card_count: number
          created_at: string
          id: string
          note: string | null
          payment_method: string
          purchased_at: string
          stamp_count: number
          status: string
          swimmer_id: string
          team_id: string
        }
        Insert: {
          amount: number
          card_count?: number
          created_at?: string
          id?: string
          note?: string | null
          payment_method?: string
          purchased_at?: string
          stamp_count: number
          status?: string
          swimmer_id: string
          team_id: string
        }
        Update: {
          amount?: number
          card_count?: number
          created_at?: string
          id?: string
          note?: string | null
          payment_method?: string
          purchased_at?: string
          stamp_count?: number
          status?: string
          swimmer_id?: string
          team_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "stamp_purchases_swimmer_id_fkey"
            columns: ["swimmer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stamp_purchases_swimmer_id_fkey"
            columns: ["swimmer_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stamp_purchases_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      system_tags: {
        Row: {
          category: string
          id: string
          label: string
          sort_order: number
        }
        Insert: {
          category: string
          id: string
          label: string
          sort_order?: number
        }
        Update: {
          category?: string
          id?: string
          label?: string
          sort_order?: number
        }
        Relationships: []
      }
      team_members: {
        Row: {
          id: string
          joined_at: string
          membership_type: string
          role: string
          stamp_remaining: number | null
          status: string
          stripe_subscription_id: string | null
          subscription_status: string | null
          swimmer_id: string
          team_id: string
        }
        Insert: {
          id?: string
          joined_at?: string
          membership_type?: string
          role?: string
          stamp_remaining?: number | null
          status?: string
          stripe_subscription_id?: string | null
          subscription_status?: string | null
          swimmer_id: string
          team_id: string
        }
        Update: {
          id?: string
          joined_at?: string
          membership_type?: string
          role?: string
          stamp_remaining?: number | null
          status?: string
          stripe_subscription_id?: string | null
          subscription_status?: string | null
          swimmer_id?: string
          team_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "team_members_swimmer_id_fkey"
            columns: ["swimmer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "team_members_swimmer_id_fkey"
            columns: ["swimmer_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "team_members_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      teams: {
        Row: {
          activity_area: string | null
          annual_fee_amount: number | null
          avatar_url: string | null
          cancellation_days: number | null
          coach_id: string
          contact_email: string | null
          contact_phone: string | null
          cover_image_url: string | null
          created_at: string
          default_guest_price: number | null
          default_member_price: number | null
          description: string | null
          fee_members_exempt_session: boolean
          has_annual_fee: boolean
          has_monthly_fee: boolean
          has_point_card: boolean
          has_session_fee: boolean
          id: string
          instructor_title: string | null
          invite_code: string
          is_recruiting: boolean
          main_pool: string | null
          monthly_fee_amount: number | null
          name: string
          point_card_count: number | null
          point_card_price: number | null
          practice_days: string[] | null
          practice_frequency: string | null
          show_member_count: boolean
          status: string
          stripe_account_id: string | null
          stripe_annual_price_id: string | null
          stripe_monthly_price_id: string | null
          stripe_onboarding_completed: boolean
          stripe_product_id: string | null
          team_type: string
        }
        Insert: {
          activity_area?: string | null
          annual_fee_amount?: number | null
          avatar_url?: string | null
          cancellation_days?: number | null
          coach_id: string
          contact_email?: string | null
          contact_phone?: string | null
          cover_image_url?: string | null
          created_at?: string
          default_guest_price?: number | null
          default_member_price?: number | null
          description?: string | null
          fee_members_exempt_session?: boolean
          has_annual_fee?: boolean
          has_monthly_fee?: boolean
          has_point_card?: boolean
          has_session_fee?: boolean
          id?: string
          instructor_title?: string | null
          invite_code?: string
          is_recruiting?: boolean
          main_pool?: string | null
          monthly_fee_amount?: number | null
          name: string
          point_card_count?: number | null
          point_card_price?: number | null
          practice_days?: string[] | null
          practice_frequency?: string | null
          show_member_count?: boolean
          status?: string
          stripe_account_id?: string | null
          stripe_annual_price_id?: string | null
          stripe_monthly_price_id?: string | null
          stripe_onboarding_completed?: boolean
          stripe_product_id?: string | null
          team_type?: string
        }
        Update: {
          activity_area?: string | null
          annual_fee_amount?: number | null
          avatar_url?: string | null
          cancellation_days?: number | null
          coach_id?: string
          contact_email?: string | null
          contact_phone?: string | null
          cover_image_url?: string | null
          created_at?: string
          default_guest_price?: number | null
          default_member_price?: number | null
          description?: string | null
          fee_members_exempt_session?: boolean
          has_annual_fee?: boolean
          has_monthly_fee?: boolean
          has_point_card?: boolean
          has_session_fee?: boolean
          id?: string
          instructor_title?: string | null
          invite_code?: string
          is_recruiting?: boolean
          main_pool?: string | null
          monthly_fee_amount?: number | null
          name?: string
          point_card_count?: number | null
          point_card_price?: number | null
          practice_days?: string[] | null
          practice_frequency?: string | null
          show_member_count?: boolean
          status?: string
          stripe_account_id?: string | null
          stripe_annual_price_id?: string | null
          stripe_monthly_price_id?: string | null
          stripe_onboarding_completed?: boolean
          stripe_product_id?: string | null
          team_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "teams_coach_id_fkey"
            columns: ["coach_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "teams_coach_id_fkey"
            columns: ["coach_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      transfer_records: {
        Row: {
          amount: number
          created_at: string
          id: string
          net_amount: number
          platform_fee: number
          registration_id: string | null
          session_id: string | null
          status: string
          stripe_payment_intent_id: string
          stripe_transfer_id: string | null
          team_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          id?: string
          net_amount: number
          platform_fee: number
          registration_id?: string | null
          session_id?: string | null
          status?: string
          stripe_payment_intent_id: string
          stripe_transfer_id?: string | null
          team_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          net_amount?: number
          platform_fee?: number
          registration_id?: string | null
          session_id?: string | null
          status?: string
          stripe_payment_intent_id?: string
          stripe_transfer_id?: string | null
          team_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "transfer_records_registration_id_fkey"
            columns: ["registration_id"]
            isOneToOne: false
            referencedRelation: "session_registrations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transfer_records_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "practice_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transfer_records_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      public_profiles: {
        Row: {
          achievements: string | null
          avatar_url: string | null
          bio: string | null
          career: string | null
          created_at: string | null
          id: string | null
          name: string | null
          participation_styles: string[] | null
          prefecture: string | null
          prefectures: string[] | null
          rating_avg: number | null
          review_count: number | null
          specialties: string[] | null
          swimming_goals: string[] | null
          target_ages: string[] | null
        }
        Insert: {
          achievements?: string | null
          avatar_url?: string | null
          bio?: string | null
          career?: string | null
          created_at?: string | null
          id?: string | null
          name?: string | null
          participation_styles?: string[] | null
          prefecture?: string | null
          prefectures?: string[] | null
          rating_avg?: number | null
          review_count?: number | null
          specialties?: string[] | null
          swimming_goals?: string[] | null
          target_ages?: string[] | null
        }
        Update: {
          achievements?: string | null
          avatar_url?: string | null
          bio?: string | null
          career?: string | null
          created_at?: string | null
          id?: string | null
          name?: string | null
          participation_styles?: string[] | null
          prefecture?: string | null
          prefectures?: string[] | null
          rating_avg?: number | null
          review_count?: number | null
          specialties?: string[] | null
          swimming_goals?: string[] | null
          target_ages?: string[] | null
        }
        Relationships: []
      }
    }
    Functions: {
      decrement_stamp: {
        Args: { p_session_id: string; p_swimmer_id: string }
        Returns: undefined
      }
      get_my_admin_team_ids: { Args: never; Returns: string[] }
      get_my_team_ids: { Args: never; Returns: string[] }
      increment_stamp: {
        Args: { p_session_id: string; p_swimmer_id: string }
        Returns: undefined
      }
      increment_stamp_by: {
        Args: { p_count: number; p_team_member_id: string }
        Returns: undefined
      }
      register_for_session: {
        Args: {
          p_competition_entry: Json
          p_is_member: boolean
          p_payment_method: string
          p_payment_status: string
          p_session_id: string
          p_swimmer_id: string
        }
        Returns: {
          is_new: boolean
          registration_id: string
        }[]
      }
      send_monthly_fee_reminders: { Args: never; Returns: undefined }
      send_session_reminders: { Args: never; Returns: undefined }
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
  public: {
    Enums: {},
  },
} as const
