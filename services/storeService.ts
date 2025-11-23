import { supabase } from "./supabaseClient";
import type { Store } from "../types";

// Leggi tutti i negozi
export async function getStores(): Promise<Store[]> {
  const { data, error } = await supabase
    .from("stores")
    .select("*")
    .order("id", { ascending: true });

  if (error) {
    console.error("Errore getStores:", error);
    throw error;
  }

  return data || [];
}

// Crea un nuovo negozio
export async function createStore(store: Store): Promise<void> {
  const { error } = await supabase.from("stores").insert([
    {
      id: store.id,
      name: store.name,
      city: store.city,
      username: store.username,
      password: store.password ?? null,
    },
  ]);

  if (error) {
    console.error("Errore createStore:", error);
    throw error;
  }
}

// Aggiorna un negozio esistente
export async function updateStore(store: Store): Promise<void> {
  const { error } = await supabase
    .from("stores")
    .update({
      name: store.name,
      city: store.city,
      username: store.username,
      password: store.password ?? null,
    })
    .eq("id", store.id);

  if (error) {
    console.error("Errore updateStore:", error);
    throw error;
  }
}

// Cancella un negozio
export async function deleteStore(id: string): Promise<void> {
  const { error } = await supabase
    .from("stores")
    .delete()
    .eq("id", id);

  if (error) {
    console.error("Errore deleteStore:", error);
    throw error;
  }
}

