import { supabase } from "./supabaseClient";

export async function getSalesReports() {
  const { data, error } = await supabase
    .from("sales_reports")
    .select("*")
    .order("date", { ascending: false });

  if (error) throw error;
  return data;
}

export async function addSalesReport(report: {
  store_id: string;
  store_name: string;
  date: string;
  revenue: number;
  refunds: number;
}) {
  const { data, error } = await supabase
    .from("sales_reports")
    .insert([report])
    .select()
    .single();

  if (error) throw error;
  return data;
}
