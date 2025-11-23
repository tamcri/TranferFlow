import { supabase } from "./supabaseClient";

export async function getStores() {
  const { data, error } = await supabase
    .from("stores")
    .select("*")
    .order("id", { ascending: true });

  if (error) throw error;
  return data;
}

export async function getStoreById(id: string) {
  const { data, error } = await supabase
    .from("stores")
    .select("*")
    .eq("id", id)
    .single();

  if (error) throw error;
  return data;
}
