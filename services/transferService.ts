import { supabase } from "./supabaseClient";
import { TransferItem } from "../types";

export async function getTransferItems() {
  const { data, error } = await supabase
    .from("transfer_items")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data;
}

export async function createTransferItem(item: Omit<TransferItem, "id">) {
  const { data, error } = await supabase
    .from("transfer_items")
    .insert([item])
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateTransferStatus(id: string, status: string) {
  const { data, error } = await supabase
    .from("transfer_items")
    .update({ status })
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteTransferItem(id: string) {
  const { error } = await supabase
    .from("transfer_items")
    .delete()
    .eq("id", id);

  if (error) throw error;
  return true;
}
