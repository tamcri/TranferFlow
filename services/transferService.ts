import { supabase } from "./supabaseClient";
import type { TransferItem, ItemStatus } from "../types";

// Mappa una riga del DB nel tuo tipo TransferItem
function mapRowToTransferItem(row: any): TransferItem {
  return {
    id: row.id,
    brand: row.brand,
    category: row.category,
    typology: row.typology ?? undefined,              // 👈 NUOVO
    gender: row.gender,
    size: row.size,
    color: row.color,
    quantity: row.quantity,
    description: row.description ?? "",
    articleCode: row.article_code ?? undefined,       // 👈 NUOVO (se non l’avevamo ancora)
    status: row.status as ItemStatus,
    sourceStoreId: row.source_store_id,
    sourceStoreName: row.source_store_name,
    destinationStoreId: row.destination_store_id ?? undefined,
    destinationStoreName: row.destination_store_name ?? undefined,
    dateAdded: row.date_added,
    dateRequested: row.date_requested ?? undefined,
    dateReceived: row.date_received ?? undefined,
  };
}


// Mappa TransferItem -> shape della tabella
function mapTransferItemToRow(item: TransferItem): any {
  return {
    id: item.id,
    brand: item.brand,
    category: item.category,
    typology: item.typology ?? null,                 // 👈 NUOVO
    gender: item.gender,
    size: item.size,
    color: item.color,
    quantity: item.quantity,
    description: item.description ?? "",
    article_code: item.articleCode ?? null,          // 👈 NUOVO
    status: item.status,
    source_store_id: item.sourceStoreId,
    source_store_name: item.sourceStoreName,
    destination_store_id: item.destinationStoreId ?? null,
    destination_store_name: item.destinationStoreName ?? null,
    date_added: item.dateAdded,
    date_requested: item.dateRequested ?? null,
    date_received: item.dateReceived ?? null,
  };
}


// 🔹 Leggi tutti gli articoli (per Admin o per viste globali)
export async function getAllTransferItems(): Promise<TransferItem[]> {
  const { data, error } = await supabase
    .from("transfer_items")
    .select("*")
    .order("date_added", { ascending: false });

  if (error) {
    console.error("Errore getAllTransferItems:", error);
    throw error;
  }

  return (data || []).map(mapRowToTransferItem);
}

// 🔹 Leggi articoli per uno store specifico (es. "i miei stock")
export async function getTransferItemsByStore(storeId: string): Promise<TransferItem[]> {
  const { data, error } = await supabase
    .from("transfer_items")
    .select("*")
    .or(
      `source_store_id.eq.${storeId},destination_store_id.eq.${storeId}`
    )
    .order("date_added", { ascending: false });

  if (error) {
    console.error("Errore getTransferItemsByStore:", error);
    throw error;
  }

  return (data || []).map(mapRowToTransferItem);
}

// 🔹 Crea una lista di articoli (quelli che ora aggiungi in handleAddItem)
export async function createTransferItems(items: TransferItem[]): Promise<TransferItem[]> {
  const rows = items.map(mapTransferItemToRow);

  const { data, error } = await supabase
    .from("transfer_items")
    .insert(rows)
    .select("*");

  if (error) {
    console.error("Errore createTransferItems:", error);
    throw error;
  }

  return (data || []).map(mapRowToTransferItem);
}

// 🔹 Aggiorna stato + campi legati al trasferimento (PENDING, TRANSFERRED, ecc.)
export async function updateTransferItem(item: TransferItem): Promise<TransferItem> {
  const row = mapTransferItemToRow(item);

  const { data, error } = await supabase
    .from("transfer_items")
    .update(row)
    .eq("id", item.id)
    .select("*")
    .single();

  if (error) {
    console.error("Errore updateTransferItem:", error);
    throw error;
  }

  return mapRowToTransferItem(data);
}

// 🔹 Aggiorna solo lo status (se ti serve in futuro)
export async function updateTransferStatus(id: string, status: ItemStatus): Promise<void> {
  const { error } = await supabase
    .from("transfer_items")
    .update({ status })
    .eq("id", id);

  if (error) {
    console.error("Errore updateTransferStatus:", error);
    throw error;
  }
}

// 🔹 Cancella un articolo
export async function deleteTransferItem(id: string): Promise<void> {
  const { error } = await supabase
    .from("transfer_items")
    .delete()
    .eq("id", id);

  if (error) {
    console.error("Errore deleteTransferItem:", error);
    throw error;
  }
}

