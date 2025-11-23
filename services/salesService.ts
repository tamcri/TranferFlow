import { supabase } from "./supabaseClient";
import type { SalesReport } from "../types";

// Legge tutti i report vendite
export async function getAllSalesReports(): Promise<SalesReport[]> {
  const { data, error } = await supabase
    .from("sales_reports")
    .select("*")
    .order("date", { ascending: false });

  if (error) {
    console.error("Errore getAllSalesReports:", error);
    throw error;
  }

  // Mappa le colonne del DB nei nomi del tipo SalesReport
  return (data || []).map((row: any) => ({
    id: row.id,
    storeId: row.store_id,
    storeName: row.store_name,
    date: row.date,
    revenue: Number(row.revenue),
    refunds: Number(row.refunds),
  }));
}

// Crea un nuovo report vendite
export async function createSalesReport(report: SalesReport): Promise<void> {
  const payload = {
    id: report.id,
    store_id: report.storeId,
    store_name: report.storeName,
    date: report.date,          // stringa "YYYY-MM-DD", Postgres la castera a date
    revenue: report.revenue,
    refunds: report.refunds,
  };

  const { error } = await supabase
    .from("sales_reports")
    .insert(payload);

  if (error) {
    console.error("Errore createSalesReport:", error);
    throw error;
  }
}

// Aggiorna un report vendite esistente
export async function updateSalesReport(report: SalesReport): Promise<void> {
  const payload = {
    store_id: report.storeId,
    store_name: report.storeName,
    date: report.date,
    revenue: report.revenue,
    refunds: report.refunds,
  };

  const { error } = await supabase
    .from("sales_reports")
    .update(payload)
    .eq("id", report.id);

  if (error) {
    console.error("Errore updateSalesReport:", error);
    throw error;
  }
}


