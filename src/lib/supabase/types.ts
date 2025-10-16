export type InvoiceStatus = "draft" | "sent" | "paid" | "overdue";

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          created_at: string | null;
          full_name: string | null;
          username: string | null;
          avatar_url: string | null;
          role: "admin" | "staff" | "viewer" | null;
        };
        Insert: {
          id: string;
          created_at?: string | null;
          full_name?: string | null;
          username?: string | null;
          avatar_url?: string | null;
          role?: "admin" | "staff" | "viewer" | null;
        };
        Update: {
          id?: string;
          created_at?: string | null;
          full_name?: string | null;
          username?: string | null;
          avatar_url?: string | null;
          role?: "admin" | "staff" | "viewer" | null;
        };
        Relationships: [];
      };
      clients: {
        Row: {
          id: string;
          created_at: string;
          updated_at: string;
          owner_id: string;
          name: string;
          company: string | null;
          email: string | null;
          phone: string | null;
          address: string | null;
          notes: string | null;
        };
        Insert: {
          id?: string;
          created_at?: string;
          updated_at?: string;
          owner_id: string;
          name: string;
          company?: string | null;
          email?: string | null;
          phone?: string | null;
          address?: string | null;
          notes?: string | null;
        };
        Update: {
          id?: string;
          created_at?: string;
          updated_at?: string;
          owner_id?: string;
          name?: string;
          company?: string | null;
          email?: string | null;
          phone?: string | null;
          address?: string | null;
          notes?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "clients_owner_id_fkey";
            columns: ["owner_id"];
            referencedRelation: "users";
            referencedColumns: ["id"];
          }
        ];
      };
      invoices: {
        Row: {
          id: string;
          created_at: string;
          updated_at: string;
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
        };
        Insert: {
          id?: string;
          created_at?: string;
          updated_at?: string;
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
        };
        Update: {
          id?: string;
          created_at?: string;
          updated_at?: string;
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
        };
        Relationships: [
          {
            foreignKeyName: "invoices_owner_id_fkey";
            columns: ["owner_id"];
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "invoices_client_id_fkey";
            columns: ["client_id"];
            referencedRelation: "clients";
            referencedColumns: ["id"];
          }
        ];
      };
      invoice_items: {
        Row: {
          id: string;
          created_at: string;
          invoice_id: string;
          description: string;
          quantity: number;
          unit_price: number;
          amount: number;
        };
        Insert: {
          id?: string;
          created_at?: string;
          invoice_id: string;
          description: string;
          quantity: number;
          unit_price: number;
          amount: number;
        };
        Update: {
          id?: string;
          created_at?: string;
          invoice_id?: string;
          description?: string;
          quantity?: number;
          unit_price?: number;
          amount?: number;
        };
        Relationships: [
          {
            foreignKeyName: "invoice_items_invoice_id_fkey";
            columns: ["invoice_id"];
            referencedRelation: "invoices";
            referencedColumns: ["id"];
          }
        ];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      invoice_status: InvoiceStatus;
    };
    CompositeTypes: never;
  };
};
