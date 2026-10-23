// ========================================
// Supabase 連線設定（選購頁與訂單管理頁共用）
// ========================================
// 前端只能使用 Publishable Key（或 legacy anon key），不要放 service_role / secret key。
const SUPABASE_URL = "https://rvswrupfkswlvlsleduj.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_n7vI6heyLD4gUR5p8Z9JzQ_nr_R-cFu";

const supabaseClient = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_PUBLISHABLE_KEY
);
