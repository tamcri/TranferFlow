export enum ItemStatus {
  AVAILABLE = 'DISPONIBILE',
  PENDING = 'IN_TRANSITO', // Rinominato per chiarezza
  TRANSFERRED = 'RICEVUTO' // Rinominato per chiarezza
}

export interface Store {
  id: string;
  name: string;
  city: string;
  username: string;
  password?: string;
}

export interface TransferItem {
  id: string;
  sourceStoreId: string;
  sourceStoreName: string;
  
  // Campi aggiunti per tracciamento destinazione
  destinationStoreId?: string;
  destinationStoreName?: string;

  brand: string;
  gender: string;   // Nuovo
  category: string;
  color: string;    // Nuovo
  size: string;     // Nuovo
  quantity: number;
  description: string;
  status: ItemStatus;

  // Tracciabilità temporale
  dateAdded: string;      // Data inserimento
  dateRequested?: string; // Data richiesta trasferimento
  dateReceived?: string;  // Data conferma ricezione
}

export interface SalesReport {
  id: string;
  storeId: string;
  storeName: string;
  date: string; // YYYY-MM-DD
  revenue: number; // Incassato
  refunds: number; // Reso
}

export interface AIAnalysisResult {
  summary: string;
  trendingCategory: string;
  suggestion: string;
}