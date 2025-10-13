import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Database = {
  public: {
    Tables: {
      companies: {
        Row: {
          id: string;
          name: string;
          industry: string;
          employee_count: number;
          subscription_tier: string;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['companies']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['companies']['Insert']>;
      };
      users: {
        Row: {
          id: string;
          company_id: string;
          email: string;
          full_name: string;
          role: string;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['users']['Row'], 'created_at'>;
        Update: Partial<Database['public']['Tables']['users']['Insert']>;
      };
      ai_modules: {
        Row: {
          id: string;
          name: string;
          category: string;
          description: string;
          icon: string;
          features: string[];
          pricing_tier: string;
          is_active: boolean;
          created_at: string;
        };
      };
      company_modules: {
        Row: {
          id: string;
          company_id: string;
          module_id: string;
          installed_at: string;
          config: Record<string, any>;
          is_enabled: boolean;
        };
        Insert: Omit<Database['public']['Tables']['company_modules']['Row'], 'id' | 'installed_at'>;
      };
      reports: {
        Row: {
          id: string;
          company_id: string;
          module_id: string | null;
          title: string;
          content: string;
          report_type: string;
          created_by: string | null;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['reports']['Row'], 'id' | 'created_at'>;
      };
      alerts: {
        Row: {
          id: string;
          company_id: string;
          module_id: string | null;
          severity: string;
          title: string;
          message: string;
          is_read: boolean;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['alerts']['Row'], 'id' | 'created_at'>;
        Update: { is_read?: boolean };
      };
      data_connections: {
        Row: {
          id: string;
          company_id: string;
          connection_type: string;
          connection_name: string;
          connection_config: Record<string, any>;
          status: string;
          last_sync: string | null;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['data_connections']['Row'], 'id' | 'created_at'>;
      };
    };
  };
};
