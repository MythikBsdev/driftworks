export type InvoiceStatus = "draft" | "sent" | "paid" | "overdue";

export type Database = {
  public: {
    Tables: {
      app_users: {
        Row: {
          id: string;
          username: string;
          password_hash: string;
          full_name: string | null;
          role: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          username: string;
          password_hash: string;
          full_name?: string | null;
          role?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          username?: string;
          password_hash?: string;
          full_name?: string | null;
          role?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      user_sessions: {
        Row: {
          token: string;
          user_id: string;
          created_at: string;
          expires_at: string;
        };
        Insert: {
          token?: string;
          user_id: string;
          created_at?: string;
          expires_at: string;
        };
        Update: {
          token?: string;
          user_id?: string;
          created_at?: string;
          expires_at?: string;
        };
      };
      inventory_items: {
        Row: {
          id: string;
          owner_id: string;
          name: string;
          category: string;
          description: string | null;
          price: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          owner_id: string;
          name: string;
          category?: string;
          description?: string | null;
          price?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          owner_id?: string;
          name?: string;
          category?: string;
          description?: string | null;
          price?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      discounts: {
        Row: {
          id: string;
          owner_id: string;
          name: string;
          percentage: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          owner_id: string;
          name: string;
          percentage: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          owner_id?: string;
          name?: string;
          percentage?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      commission_rates: {
        Row: {
          id: string;
          owner_id: string;
          role: string;
          rate: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          owner_id: string;
          role: string;
          rate: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          owner_id?: string;
          role?: string;
          rate?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      sales_orders: {
        Row: {
          id: string;
          owner_id: string;
          cid: string | null;
          invoice_number: string;
          loyalty_action: string;
          subtotal: number;
          discount: number;
          total: number;
          status: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          owner_id: string;
          cid?: string | null;
          invoice_number: string;
          loyalty_action?: string;
          subtotal?: number;
          discount?: number;
          total?: number;
          status?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          owner_id?: string;
          cid?: string | null;
          invoice_number?: string;
          loyalty_action?: string;
          subtotal?: number;
          discount?: number;
          total?: number;
          status?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      sales_order_items: {
        Row: {
          id: string;
          order_id: string;
          item_name: string;
          catalog_item_id: string | null;
          quantity: number;
          unit_price: number;
          total: number;
        };
        Insert: {
          id?: string;
          order_id: string;
          item_name: string;
          catalog_item_id?: string | null;
          quantity: number;
          unit_price: number;
          total: number;
        };
        Update: {
          id?: string;
          order_id?: string;
          item_name?: string;
          catalog_item_id?: string | null;
          quantity?: number;
          unit_price?: number;
          total?: number;
        };
      };
      employee_sales: {
        Row: {
          id: string;
          owner_id: string;
          employee_id: string;
          invoice_number: string;
          amount: number;
          notes: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          owner_id: string;
          employee_id: string;
          invoice_number: string;
          amount: number;
          notes?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          owner_id?: string;
          employee_id?: string;
          invoice_number?: string;
          amount?: number;
          notes?: string | null;
          created_at?: string;
        };
      };
      clients: {
        Row: {
          id: string;
          owner_id: string;
          name: string;
          company: string | null;
          email: string | null;
          phone: string | null;
          address: string | null;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          owner_id: string;
          name: string;
          company?: string | null;
          email?: string | null;
          phone?: string | null;
          address?: string | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          owner_id?: string;
          name?: string;
          company?: string | null;
          email?: string | null;
          phone?: string | null;
          address?: string | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      invoices: {
        Row: {
          id: string;
          owner_id: string;
          client_id: string;
          invoice_number: string;
          issue_date: string;
          due_date: string;
          status: InvoiceStatus;
          subtotal: number;
          tax: number;
          total: number;
          currency: string;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          owner_id: string;
          client_id: string;
          invoice_number: string;
          issue_date: string;
          due_date: string;
          status?: InvoiceStatus;
          subtotal: number;
          tax?: number;
          total: number;
          currency?: string;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          owner_id?: string;
          client_id?: string;
          invoice_number?: string;
          issue_date?: string;
          due_date?: string;
          status?: InvoiceStatus;
          subtotal?: number;
          tax?: number;
          total?: number;
          currency?: string;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      invoice_items: {
        Row: {
          id: string;
          invoice_id: string;
          description: string;
          quantity: number;
          unit_price: number;
          amount: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          invoice_id: string;
          description: string;
          quantity: number;
          unit_price: number;
          amount: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          invoice_id?: string;
          description?: string;
          quantity?: number;
          unit_price?: number;
          amount?: number;
          created_at?: string;
        };
      };
      loyalty_accounts: {
        Row: {
          id: string;
          owner_id: string;
          cid: string;
          stamp_count: number;
          total_stamps: number;
          total_redemptions: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          owner_id: string;
          cid: string;
          stamp_count?: number;
          total_stamps?: number;
          total_redemptions?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          owner_id?: string;
          cid?: string;
          stamp_count?: number;
          total_stamps?: number;
          total_redemptions?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      invoice_status: InvoiceStatus;
    };
  };
};
