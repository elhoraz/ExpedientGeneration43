import { createAdminClient } from "@/lib/supabase/admin";

export interface DbFilter {
  column: string;
  operator: "eq" | "neq" | "ilike" | "like" | "in" | "is" | "gt" | "lt";
  value: any;
}

export interface DbQueryPlan {
  table: string;
  operation: "select" | "count" | "update" | "insert";
  selectFields?: string;
  filters?: DbFilter[];
  order?: { column: string; ascending?: boolean };
  limit?: number;
  updateData?: Record<string, any>;
  insertData?: Record<string, any>;
  purpose?: string;
}

/**
 * Peta Schema Database Supabase Expedient Generation 43
 */
export const DB_SCHEMA_DOC = `
TABLES AND COLUMNS:
1. profiles:
   - id: uuid (primary key)
   - email: string
   - nama_lengkap: string
   - nama_panggilan: string
   - no_whatsapp: string
   - role: string ("admin" | "superadmin" | "member" | "alumni")
   - is_active: boolean
   - bio: string
   - avatar_url: string
   - created_at: timestamp

2. whatsapp_queue:
   - id: uuid
   - no_whatsapp: string
   - message: string
   - status: string ("sent" | "failed" | "pending" | "received")
   - error_message: string
   - created_at: timestamp
   - updated_at: timestamp

3. activity_logs:
   - id: uuid
   - user_id: uuid
   - action: string ("login" | "logout" | "register" | "update_profile" | etc.)
   - details: json / string
   - created_at: timestamp

4. notifications:
   - id: uuid
   - user_id: uuid
   - title: string
   - message: string
   - is_read: boolean
   - link: string
   - created_at: timestamp

5. site_content:
   - id: uuid
   - content_key: string
   - content_value: string / json
   - content_type: string
   - updated_at: timestamp

6. baitul_maal:
   - id: uuid
   - user_id: uuid
   - amount: number
   - type: string
   - status: string
   - notes: string
   - created_at: timestamp

7. wasiats:
   - id: uuid
   - user_id: uuid
   - content: string
   - created_at: timestamp

8. buku_tamu:
   - id: uuid
   - nama: string
   - pesan: string
   - created_at: timestamp
`.trim();

/**
 * Eksekusi Query Supabase Berdasarkan Rencana AI
 */
export async function executeSupabasePlan(plan: DbQueryPlan): Promise<{
  success: boolean;
  data?: any;
  count?: number;
  error?: string;
}> {
  try {
    const supabase = createAdminClient();
    const table = plan.table.trim().toLowerCase();

    // 1. COUNT QUERY
    if (plan.operation === "count") {
      let query = supabase.from(table).select("*", { count: "exact", head: true });
      if (plan.filters) {
        for (const f of plan.filters) {
          if (f.operator === "eq") query = query.eq(f.column, f.value);
          else if (f.operator === "neq") query = query.neq(f.column, f.value);
          else if (f.operator === "ilike") query = query.ilike(f.column, f.value);
          else if (f.operator === "is") query = query.is(f.column, f.value);
        }
      }
      const { count, error } = await query;
      if (error) return { success: false, error: error.message };
      return { success: true, count: count || 0 };
    }

    // 2. SELECT QUERY
    if (plan.operation === "select") {
      const selectFields = plan.selectFields || "*";
      let query = supabase.from(table).select(selectFields);

      if (plan.filters) {
        for (const f of plan.filters) {
          if (f.operator === "eq") query = query.eq(f.column, f.value);
          else if (f.operator === "neq") query = query.neq(f.column, f.value);
          else if (f.operator === "ilike") query = query.ilike(f.column, f.value);
          else if (f.operator === "like") query = query.like(f.column, f.value);
          else if (f.operator === "in" && Array.isArray(f.value)) query = query.in(f.column, f.value);
          else if (f.operator === "is") query = query.is(f.column, f.value);
          else if (f.operator === "gt") query = query.gt(f.column, f.value);
          else if (f.operator === "lt") query = query.lt(f.column, f.value);
        }
      }

      if (plan.order) {
        query = query.order(plan.order.column, { ascending: plan.order.ascending ?? false });
      }

      const limit = plan.limit || 15;
      query = query.limit(limit);

      const { data, error } = await query;
      if (error) return { success: false, error: error.message };
      return { success: true, data: data || [] };
    }

    // 3. UPDATE QUERY
    if (plan.operation === "update" && plan.updateData) {
      let query = supabase.from(table).update(plan.updateData);
      if (plan.filters && plan.filters.length > 0) {
        for (const f of plan.filters) {
          if (f.operator === "eq") query = query.eq(f.column, f.value);
          else if (f.operator === "ilike") query = query.ilike(f.column, f.value);
        }
        const { data, error } = await query.select();
        if (error) return { success: false, error: error.message };
        return { success: true, data };
      } else {
        return { success: false, error: "Update dibatalkan karena tidak ada filter spesifik (mencegah overwrite global)." };
      }
    }

    // 4. INSERT QUERY
    if (plan.operation === "insert" && plan.insertData) {
      const { data, error } = await supabase.from(table).insert([plan.insertData]).select();
      if (error) return { success: false, error: error.message };
      return { success: true, data };
    }

    return { success: false, error: `Operasi database '${plan.operation}' tidak didukung.` };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}
