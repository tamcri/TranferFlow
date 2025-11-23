import { Store, TransferItem, ItemStatus, SalesReport } from './types';

export const ADMIN_CREDENTIALS = {
  username: 'admin',
  password: '2400300'
};

export const STORES: Store[] = [
  { id: 'S1', name: 'Fashion Milano Centro', city: 'Milano', username: 'NEG01', password: '2400301' },
  { id: 'S2', name: 'Roma Via Del Corso', city: 'Roma', username: 'NEG02', password: '2400302' },
  { id: 'S3', name: 'Napoli Chiaia', city: 'Napoli', username: 'NEG03', password: '2400303' },
  { id: 'S4', name: 'Torino Porta Nuova', city: 'Torino', username: 'NEG04', password: '2400304' },
  { id: 'S5', name: 'Outlet Firenze', city: 'Firenze', username: 'NEG05', password: '2400305' },
];

export const INITIAL_ITEMS: TransferItem[] = [
  {
    id: 'I1',
    sourceStoreId: 'S1',
    sourceStoreName: 'Fashion Milano Centro',
    brand: 'Nike',
    gender: 'Uomo',
    category: 'Sneakers',
    color: 'Bianco/Rosso',
    size: '42',
    quantity: 12,
    description: 'Stock invenduto collezione invernale.',
    status: ItemStatus.AVAILABLE,
    dateAdded: new Date(Date.now() - 86400000 * 10).toISOString()
  },
  {
    id: 'I2',
    sourceStoreId: 'S2',
    sourceStoreName: 'Roma Via Del Corso',
    brand: 'Gucci',
    gender: 'Donna',
    category: 'Accessori',
    color: 'Nero',
    size: 'Unica',
    quantity: 5,
    description: 'Cinture in pelle, piccoli difetti.',
    status: ItemStatus.AVAILABLE,
    dateAdded: new Date(Date.now() - 86400000 * 5).toISOString()
  },
  {
    id: 'I3',
    sourceStoreId: 'S3',
    sourceStoreName: 'Napoli Chiaia',
    destinationStoreId: 'S1',
    destinationStoreName: 'Fashion Milano Centro',
    brand: 'Zara',
    gender: 'Uomo',
    category: 'Camicie',
    color: 'Bianco',
    size: 'L',
    quantity: 50,
    description: 'Eccesso di magazzino.',
    status: ItemStatus.PENDING,
    dateAdded: new Date(Date.now() - 86400000 * 15).toISOString(),
    dateRequested: new Date(Date.now() - 86400000 * 2).toISOString()
  },
  {
    id: 'I4',
    sourceStoreId: 'S4',
    sourceStoreName: 'Torino Porta Nuova',
    destinationStoreId: 'S5',
    destinationStoreName: 'Outlet Firenze',
    brand: 'Moncler',
    gender: 'Donna',
    category: 'Piumini',
    color: 'Blu Navy',
    size: 'M',
    quantity: 2,
    description: 'Modelli anno precedente.',
    status: ItemStatus.TRANSFERRED,
    dateAdded: new Date(Date.now() - 86400000 * 30).toISOString(),
    dateRequested: new Date(Date.now() - 86400000 * 10).toISOString(),
    dateReceived: new Date(Date.now() - 86400000 * 8).toISOString()
  }
];

export const INITIAL_SALES: SalesReport[] = [
  { id: 'SALE1', storeId: 'S1', storeName: 'Fashion Milano Centro', date: '2023-10-25', revenue: 1250.50, refunds: 0 },
  { id: 'SALE2', storeId: 'S1', storeName: 'Fashion Milano Centro', date: '2023-10-26', revenue: 980.00, refunds: 120.00 },
  { id: 'SALE3', storeId: 'S2', storeName: 'Roma Via Del Corso', date: '2023-10-25', revenue: 2400.00, refunds: 0 },
  { id: 'SALE4', storeId: 'S2', storeName: 'Roma Via Del Corso', date: '2023-10-26', revenue: 1850.20, refunds: 50.00 },
  { id: 'SALE5', storeId: 'S3', storeName: 'Napoli Chiaia', date: '2023-10-26', revenue: 3100.00, refunds: 300.00 },
];