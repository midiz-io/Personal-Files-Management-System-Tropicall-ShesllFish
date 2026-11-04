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
      employees: {
        Row: {
          address: string | null
          approved_at: string | null
          approved_by: string | null
          bank_account_no: string | null
          bank_branch: string | null
          bank_name: string | null
          bank_passbook_url: string | null
          branch: string | null
          certificates_url: string | null
          created_at: string
          date_of_birth: string | null
          date_of_joining: string | null
          department: string | null
          designation: string | null
          email: string | null
          emergency_contact_name: string | null
          emergency_contact_phone: string | null
          employee_code: string | null
          epf_number: string | null
          etf_number: string | null
          full_name: string | null
          gender: string | null
          gs_certificate_url: string | null
          id: string
          nic: string | null
          nic_copy_url: string | null
          phone: string | null
          photo_url: string | null
          rejection_reason: string | null
          signature_url: string | null
          status: Database["public"]["Enums"]["file_status"]
          submitted_at: string | null
          updated_at: string
          user_id: string
          religion: string | null
          marital_status: string | null
          spouse_name: string | null
          children: Json | null
          bank_account_holder: string | null
          section: string | null
          employment_conditions: string | null
          salary: string | null
          training_from: string | null
          training_to: string | null
          permanent_date: string | null
          retirement_date: string | null
          telephone: string | null
          chk_cv: boolean | null
          chk_nic_copy: boolean | null
          chk_birth_certificate: boolean | null
          chk_gs_copy: boolean | null
          chk_edu_al: boolean | null
          chk_edu_ol: boolean | null
          chk_edu_degree: boolean | null
          chk_edu_post_graduate: boolean | null
          chk_prof_nvq: boolean | null
          chk_prof_vta_naita: boolean | null
          chk_prof_other: boolean | null
          previous_employments: Json | null
        }
        Insert: {
          address?: string | null
          approved_at?: string | null
          approved_by?: string | null
          bank_account_no?: string | null
          bank_branch?: string | null
          bank_name?: string | null
          bank_passbook_url?: string | null
          branch?: string | null
          certificates_url?: string | null
          created_at?: string
          date_of_birth?: string | null
          date_of_joining?: string | null
          department?: string | null
          designation?: string | null
          email?: string | null
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          employee_code?: string | null
          epf_number?: string | null
          etf_number?: string | null
          full_name?: string | null
          gender?: string | null
          gs_certificate_url?: string | null
          id?: string
          nic?: string | null
          nic_copy_url?: string | null
          phone?: string | null
          photo_url?: string | null
          rejection_reason?: string | null
          signature_url?: string | null
          status?: Database["public"]["Enums"]["file_status"]
          submitted_at?: string | null
          updated_at?: string
          user_id: string
          religion?: string | null
          marital_status?: string | null
          spouse_name?: string | null
          children?: Json | null
          bank_account_holder?: string | null
          section?: string | null
          employment_conditions?: string | null
          salary?: string | null
          training_from?: string | null
          training_to?: string | null
          permanent_date?: string | null
          retirement_date?: string | null
          telephone?: string | null
          chk_cv?: boolean | null
          chk_nic_copy?: boolean | null
          chk_birth_certificate?: boolean | null
          chk_gs_copy?: boolean | null
          chk_edu_al?: boolean | null
          chk_edu_ol?: boolean | null
          chk_edu_degree?: boolean | null
          chk_edu_post_graduate?: boolean | null
          chk_prof_nvq?: boolean | null
          chk_prof_vta_naita?: boolean | null
          chk_prof_other?: boolean | null
          previous_employments?: Json | null
        }
        Update: {
          address?: string | null
          approved_at?: string | null
          approved_by?: string | null
          bank_account_no?: string | null
          bank_branch?: string | null
          bank_name?: string | null
          bank_passbook_url?: string | null
          branch?: string | null
          certificates_url?: string | null
          created_at?: string
          date_of_birth?: string | null
          date_of_joining?: string | null
          department?: string | null
          designation?: string | null
          email?: string | null
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          employee_code?: string | null
          epf_number?: string | null
          etf_number?: string | null
          full_name?: string | null
          gender?: string | null
          gs_certificate_url?: string | null
          id?: string
          nic?: string | null
          nic_copy_url?: string | null
          phone?: string | null
          photo_url?: string | null
          rejection_reason?: string | null
          signature_url?: string | null
          status?: Database["public"]["Enums"]["file_status"]
          submitted_at?: string | null
          updated_at?: string
          user_id?: string
          religion?: string | null
          marital_status?: string | null
          spouse_name?: string | null
          children?: Json | null
          bank_account_holder?: string | null
          section?: string | null
          employment_conditions?: string | null
          salary?: string | null
          training_from?: string | null
          training_to?: string | null
          permanent_date?: string | null
          retirement_date?: string | null
          telephone?: string | null
          chk_cv?: boolean | null
          chk_nic_copy?: boolean | null
          chk_birth_certificate?: boolean | null
          chk_gs_copy?: boolean | null
          chk_edu_al?: boolean | null
          chk_edu_ol?: boolean | null
          chk_edu_degree?: boolean | null
          chk_edu_post_graduate?: boolean | null
          chk_prof_nvq?: boolean | null
          chk_prof_vta_naita?: boolean | null
          chk_prof_other?: boolean | null
          previous_employments?: Json | null
        }
        Relationships: []
      }
      invites: {
        Row: {
          created_at: string
          created_by: string | null
          email: string | null
          expires_at: string
          id: string
          token: string
          used_at: string | null
          used_by: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          email?: string | null
          expires_at?: string
          id?: string
          token: string
          used_at?: string | null
          used_by?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          email?: string | null
          expires_at?: string
          id?: string
          token?: string
          used_at?: string | null
          used_by?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          photo_url: string | null
          registered_at: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          full_name?: string | null
          id: string
          photo_url?: string | null
          registered_at?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          photo_url?: string | null
          registered_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      service_letters: {
        Row: {
          body: string
          created_at: string
          created_by: string | null
          employee_id: string
          hr_manager_name: string | null
          hr_manager_title: string | null
          id: string
          joined_date: string | null
          last_day: string | null
          letter_date: string
          letter_type: Database["public"]["Enums"]["letter_type"]
          notice_until: string | null
          pdf_url: string | null
          positions: Json | null
          recipient: string | null
          recipient_address: string | null
          subject: string | null
          updated_at: string
        }
        Insert: {
          body: string
          created_at?: string
          created_by?: string | null
          employee_id: string
          hr_manager_name?: string | null
          hr_manager_title?: string | null
          id?: string
          joined_date?: string | null
          last_day?: string | null
          letter_date?: string
          letter_type: Database["public"]["Enums"]["letter_type"]
          notice_until?: string | null
          pdf_url?: string | null
          positions?: Json | null
          recipient?: string | null
          recipient_address?: string | null
          subject?: string | null
          updated_at?: string
        }
        Update: {
          body?: string
          created_at?: string
          created_by?: string | null
          employee_id?: string
          hr_manager_name?: string | null
          hr_manager_title?: string | null
          id?: string
          joined_date?: string | null
          last_day?: string | null
          letter_date?: string
          letter_type?: Database["public"]["Enums"]["letter_type"]
          notice_until?: string | null
          pdf_url?: string | null
          positions?: Json | null
          recipient?: string | null
          recipient_address?: string | null
          subject?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "service_letters_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      work_sessions: {
        Row: {
          created_at: string
          employee_id: string
          ended_at: string | null
          id: string
          started_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          employee_id: string
          ended_at?: string | null
          id?: string
          started_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          employee_id?: string
          ended_at?: string | null
          id?: string
          started_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "work_sessions_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      consume_invite: { Args: { _token: string }; Returns: boolean }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      validate_invite: {
        Args: { _token: string }
        Returns: {
          email: string
          invite_id: string
          valid: boolean
        }[]
      }
      verify_employee: {
        Args: { _employee_id: string }
        Returns: {
          designation: string
          employee_code: string
          full_name: string
          id: string
          photo_url: string
          registered_at: string
          signature_url: string
          status: string
        }[]
      }
    }
    Enums: {
      app_role: "admin" | "employee"
      file_status: "draft" | "submitted" | "approved" | "rejected"
      letter_type: "final_service" | "recommendation"
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
      app_role: ["admin", "employee"],
      file_status: ["draft", "submitted", "approved", "rejected"],
      letter_type: ["final_service", "recommendation"],
    },
  },
} as const
