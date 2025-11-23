import React, { useState, useMemo, useEffect } from 'react';
import { STORES, INITIAL_ITEMS, ADMIN_CREDENTIALS, INITIAL_SALES } from './constants';
import { Store, TransferItem, ItemStatus, SalesReport } from './types';
import { ItemCard } from './components/ItemCard';
import { AddItemModal } from './components/AddItemModal';
import { LoginPage } from './components/LoginPage';
import { AdminDashboard } from './components/AdminDashboard';
import { SalesManager } from './components/SalesManager';
import { Plus, LayoutGrid, Package, LogOut, Store as StoreIcon, BarChart3 } from 'lucide-react';

// servizi Supabase
import { getStores, createStore, updateStore, deleteStore } from './services/storeService';
import {
  getAllTransferItems,
  createTransferItems,
  updateTransferItem,
  deleteTransferItem,
} from './services/transferService';
import {
  getAllSalesReports,
  createSalesReport,
  updateSalesReport
} from './services/salesService';

// nuova card per lotti brand
import { BrandGroupCard, BrandGroup } from './components/BrandGroupCard';

const App: React.FC = () => {
  // Auth State
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [currentStore, setCurrentStore] = useState<Store | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);

  // Data State with Persistence
  const [allStores, setAllStores] = useState<Store[]>(() => {
    const saved = localStorage.getItem('tf_stores');
    return saved ? JSON.parse(saved) : STORES;
  });

  const [items, setItems] = useState<TransferItem[]>(() => {
    const saved = localStorage.getItem('tf_items');
    return saved ? JSON.parse(saved) : INITIAL_ITEMS;
  });

  const [sales, setSales] = useState<SalesReport[]>(() => {
    const saved = localStorage.getItem('tf_sales');
    return saved ? JSON.parse(saved) : INITIAL_SALES;
  });
  
  const [view, setView] = useState<'dashboard' | 'my-items' | 'sales'>('dashboard');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // --- Sync iniziale dei negozi da Supabase ---
  useEffect(() => {
    const syncStoresFromSupabase = async () => {
      try {
        const dbStores = await getStores();
        if (dbStores && dbStores.length > 0) {
          setAllStores(dbStores);
        } else {
          console.log('Nessun negozio su Supabase, uso i mock/localStorage.');
        }
      } catch (error) {
        console.error('Errore caricando negozi da Supabase:', error);
      }
    };

    syncStoresFromSupabase();
  }, []);

  // --- Sync iniziale degli articoli da Supabase ---
  useEffect(() => {
    const syncItemsFromSupabase = async () => {
      try {
        const dbItems = await getAllTransferItems();
        if (dbItems && dbItems.length > 0) {
          setItems(dbItems);
        } else {
          console.log('Nessun articolo su Supabase, uso i mock/localStorage.');
        }
      } catch (error) {
        console.error('Errore caricando articoli da Supabase:', error);
      }
    };

    syncItemsFromSupabase();
  }, []);

  // --- Sync iniziale vendite da Supabase ---
  useEffect(() => {
    const syncSalesFromSupabase = async () => {
      try {
        const dbSales = await getAllSalesReports();
        if (dbSales && dbSales.length > 0) {
          setSales(dbSales);
        } else {
          console.log("Nessun report vendite su Supabase, uso i mock/localStorage.");
        }
      } catch (error) {
        console.error("Errore caricando vendite da Supabase:", error);
      }
    };

    syncSalesFromSupabase();
  }, []);

  // --- Persistence Effects ---
  useEffect(() => {
    localStorage.setItem('tf_stores', JSON.stringify(allStores));
  }, [allStores]);

  useEffect(() => {
    localStorage.setItem('tf_items', JSON.stringify(items));
  }, [items]);

  useEffect(() => {
    localStorage.setItem('tf_sales', JSON.stringify(sales));
  }, [sales]);

  // --- Auth Handlers ---
  const handleLogin = (u: string, p: string) => {
    setAuthError(null);
    
    // Check Admin
    if (u === ADMIN_CREDENTIALS.username && p === ADMIN_CREDENTIALS.password) {
      setIsAdmin(true);
      setIsAuthenticated(true);
      return;
    }

    // Check Store
    const foundStore = allStores.find(s => s.username === u && s.password === p);
    if (foundStore) {
      setCurrentStore(foundStore);
      setIsAuthenticated(true);
      setIsAdmin(false);
    } else {
      setAuthError('Credenziali non valide. Riprova.');
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setIsAdmin(false);
    setCurrentStore(null);
    setView('dashboard');
    setAuthError(null);
  };

  // --- Admin Handlers (collegati a Supabase) ---
  const handleAdminAddStore = (newStore: Store) => {
    setAllStores(prev => [...prev, newStore]);
    showToast(`Negozio ${newStore.name} creato con successo!`);

    (async () => {
      try {
        await createStore(newStore);
      } catch (err) {
        console.error('Errore salvataggio negozio su Supabase:', err);
        showToast('Errore nel salvataggio su Supabase.');
      }
    })();
  };

  const handleAdminUpdateStore = (updatedStore: Store) => {
    setAllStores(prev => prev.map(s => s.id === updatedStore.id ? updatedStore : s));
    showToast(`Negozio ${updatedStore.name} aggiornato!`);

    (async () => {
      try {
        await updateStore(updatedStore);
      } catch (err) {
        console.error('Errore aggiornamento negozio su Supabase:', err);
        showToast("Errore nell'aggiornamento su Supabase.");
      }
    })();
  };

  const handleAdminDeleteStore = (id: string) => {
    setAllStores(prev => prev.filter(s => s.id !== id));
    setItems(prev => prev.filter(i => i.sourceStoreId !== id && i.destinationStoreId !== id));
    setSales(prev => prev.filter(s => s.storeId !== id));

    showToast("Negozio e tutti i dati correlati eliminati.");

    (async () => {
      try {
        await deleteStore(id);
      } catch (err) {
        console.error('Errore cancellazione negozio su Supabase:', err);
        showToast('Errore nella cancellazione su Supabase.');
      }
    })();
  };

  // --- Helper: costruisce i gruppi per brand ---
  const buildBrandGroups = (sourceItems: TransferItem[]): BrandGroup[] => {
    const map = new Map<string, BrandGroup>();

    for (const it of sourceItems) {
      const key = `${it.sourceStoreId}::${it.brand}`;
      const existing = map.get(key);

      const base = existing ?? {
        brand: it.brand,
        sourceStoreId: it.sourceStoreId,
        sourceStoreName: it.sourceStoreName,
        totalQuantity: 0,
        availableQuantity: 0,
        pendingQuantity: 0,
        transferredQuantity: 0,
        categories: [] as string[],
        colors: [] as string[],
        sizes: [] as string[],
        items: [] as TransferItem[],
      };

      const qty = it.quantity ?? 0;

      base.totalQuantity += qty;

      if (it.status === ItemStatus.AVAILABLE) {
        base.availableQuantity += qty;
      } else if (it.status === ItemStatus.PENDING) {
        base.pendingQuantity += qty;
      } else if (it.status === ItemStatus.TRANSFERRED) {
        base.transferredQuantity += qty;
      }

      if (it.category && !base.categories.includes(it.category)) {
        base.categories.push(it.category);
      }
      if (it.color && !base.colors.includes(it.color)) {
        base.colors.push(it.color);
      }
      if (it.size && !base.sizes.includes(it.size)) {
        base.sizes.push(it.size);
      }

      base.items.push(it);

      map.set(key, base);
    }

    return Array.from(map.values()).sort((a, b) =>
      a.brand.localeCompare(b.brand)
    );
  };

  // --- Gruppi per "I miei stock" (lotti del negozio corrente) ---
  const myBrandGroups = useMemo<BrandGroup[]>(() => {
    if (!currentStore) return [];
    const mine = items.filter(it => it.sourceStoreId === currentStore.id);
    return buildBrandGroups(mine);
  }, [items, currentStore]);

  // --- Gruppi per "Bacheca Network" (stock disponibile dagli altri) ---
  const networkBrandGroups = useMemo<BrandGroup[]>(() => {
    if (!currentStore) return [];
    const others = items.filter(
      it =>
        it.sourceStoreId !== currentStore.id &&
        it.status === ItemStatus.AVAILABLE
    );
    return buildBrandGroups(others);
  }, [items, currentStore]);

  // --- Logica caricamento nuovi articoli ---
  const handleAddItem = (
    newItems: {
      brand: string;
      gender: string;
      category: string;
      color: string;
      size: string;
      quantity: number;
      description: string;
    }[]
  ) => {
    if (!currentStore) return;
    
    const timestamp = Date.now();
    const createdItems: TransferItem[] = newItems.map((item, index) => ({
      id: `I${timestamp}-${index}`,
      sourceStoreId: currentStore.id,
      sourceStoreName: currentStore.name,
      brand: item.brand,
      gender: item.gender,
      category: item.category,
      color: item.color,
      size: item.size,
      quantity: item.quantity,
      description: item.description,
      status: ItemStatus.AVAILABLE,
      dateAdded: new Date().toISOString(),
    }));

    setItems(prev => [...createdItems, ...prev]);
    showToast(`${createdItems.length} Articoli aggiunti con successo!`);

    (async () => {
      try {
        await createTransferItems(createdItems);
      } catch (err) {
        console.error('Errore salvataggio articoli su Supabase:', err);
        showToast('Errore nel salvataggio articoli su Supabase.');
      }
    })();
  };

  // --- Richiesta blocco (lotto per brand) ---
  const handleRequestTransferGroup = (group: BrandGroup) => {
    if (!currentStore) return;

    const nowIso = new Date().toISOString();
    const toUpdate: TransferItem[] = [];

    setItems(prev =>
      prev.map(it => {
        const belongsToGroup =
          it.sourceStoreId === group.sourceStoreId &&
          it.brand === group.brand &&
          it.status === ItemStatus.AVAILABLE;

        if (belongsToGroup) {
          const updated: TransferItem = {
            ...it,
            status: ItemStatus.PENDING,
            destinationStoreId: currentStore.id,
            destinationStoreName: currentStore.name,
            dateRequested: nowIso,
          };
          toUpdate.push(updated);
          return updated;
        }
        return it;
      })
    );

    if (toUpdate.length === 0) {
      showToast('Nessun articolo disponibile in questo lotto.');
      return;
    }

    showToast(
      `Richiesta inviata per ${toUpdate.length} articoli del brand ${group.brand}.`
    );

    (async () => {
      try {
        await Promise.all(toUpdate.map(it => updateTransferItem(it)));
      } catch (err) {
        console.error('Errore aggiornamento lotto su Supabase:', err);
        showToast('Errore aggiornamento lotto su Supabase.');
      }
    })();
  };

  // --- Conferma Ricezione singolo articolo (manteniamo per logica esistente) ---
  const handleRequestTransfer = (itemId: string) => {
    if (!currentStore) return;

    let updatedItem: TransferItem | null = null;

    setItems(prev =>
      prev.map(item => {
        if (item.id === itemId) {
          const newItem: TransferItem = {
            ...item,
            status: ItemStatus.PENDING,
            destinationStoreId: currentStore.id,
            destinationStoreName: currentStore.name,
            dateRequested: new Date().toISOString(),
          };
          updatedItem = newItem;
          return newItem;
        }
        return item;
      })
    );

    showToast("Richiesta inviata! Attendi la spedizione.");

    (async () => {
      if (!updatedItem) return;
      try {
        await updateTransferItem(updatedItem);
      } catch (err) {
        console.error('Errore aggiornamento articolo su Supabase (request transfer):', err);
        showToast('Errore aggiornamento articolo su Supabase.');
      }
    })();
  };

  const handleConfirmReceipt = (itemId: string) => {
    let updatedItem: TransferItem | null = null;

    setItems(prev =>
      prev.map(item => {
        if (item.id === itemId) {
          const newItem: TransferItem = {
            ...item,
            status: ItemStatus.TRANSFERRED,
            dateReceived: new Date().toISOString(),
          };
          updatedItem = newItem;
          return newItem;
        }
        return item;
      })
    );

    showToast("Ricezione confermata! Merce in carico.");

    (async () => {
      if (!updatedItem) return;
      try {
        await updateTransferItem(updatedItem);
      } catch (err) {
        console.error('Errore aggiornamento articolo su Supabase (confirm receipt):', err);
        showToast('Errore aggiornamento articolo su Supabase.');
      }
    })();
  };

  const handleWithdrawItem = (itemId: string) => {
    setItems(prev => prev.filter(item => item.id !== itemId));
    showToast("Articolo ritirato e rimosso dalla lista.");

    (async () => {
      try {
        await deleteTransferItem(itemId);
      } catch (err) {
        console.error('Errore cancellazione articolo su Supabase:', err);
        showToast('Errore nella cancellazione articolo su Supabase.');
      }
    })();
  };

  const handleAddSale = async (saleData: Omit<SalesReport, 'id' | 'storeId' | 'storeName'>) => {
    if (!currentStore) return;

    const newSale: SalesReport = {
      id: `SALE-${Date.now()}`,
      storeId: currentStore.id,
      storeName: currentStore.name,
      ...saleData
    };

    setSales(prev => [...prev, newSale]);
    showToast("Report vendita aggiunto!");

    try {
      await createSalesReport(newSale);
    } catch (err) {
      console.error("Errore salvataggio vendite su Supabase:", err);
      showToast("Errore salvataggio su Supabase");
    }
  };

  const handleUpdateSale = async (updatedSale: SalesReport) => {
    setSales(prev => prev.map(s => s.id === updatedSale.id ? updatedSale : s));
    showToast("Report vendita modificato!");

    try {
      await updateSalesReport(updatedSale);
    } catch (err) {
      console.error("Errore aggiornamento vendite su Supabase:", err);
      showToast("Errore aggiornamento su Supabase");
    }
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // --- Render Logic ---

  if (!isAuthenticated) {
    return <LoginPage onLogin={handleLogin} error={authError} />;
  }

  if (isAdmin) {
    return (
      <AdminDashboard
        stores={allStores}
        items={items}
        sales={sales}
        onAddStore={handleAdminAddStore}
        onUpdateStore={handleAdminUpdateStore}
        onDeleteStore={handleAdminDeleteStore}
        onLogout={handleLogout}
      />
    );
  }

  // Store View (Authenticated)
  if (!currentStore) return null;

  const groupsToShow = view === 'dashboard' ? networkBrandGroups : myBrandGroups;

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      <nav className="bg-white border-b border-slate-200 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <div className="bg-indigo-600 p-2 rounded-lg mr-3">
                <ArrowRightLeftIcon className="text-white" size={20} />
              </div>
              <span className="text-xl font-bold text-slate-900 tracking-tight">TransferFlow</span>
            </div>

            <div className="flex items-center space-x-4">
              <div className="flex flex-col items-end mr-2 border-r border-slate-100 pr-4">
                <span className="text-xs text-slate-400 font-semibold uppercase">Loggato come</span>
                <span className="text-sm font-bold text-slate-800 flex items-center gap-1">
                  <StoreIcon size={14} className="text-indigo-600" />
                  {currentStore.name}
                </span>
              </div>

              <button
                onClick={handleLogout}
                className="p-2 hover:bg-slate-100 rounded-full text-slate-500 transition-colors"
              >
                <LogOut size={20} />
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
          <div className="bg-white p-1 rounded-xl border border-slate-200 shadow-sm flex overflow-x-auto max-w-full">
            <button
              onClick={() => setView('dashboard')}
              className={`flex items-center px-6 py-2.5 rounded-lg text-sm font-semibold transition-all whitespace-nowrap ${
                view === 'dashboard' ? 'bg-slate-900 text-white shadow-md' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <LayoutGrid size={18} className="mr-2" />
              Bacheca Network
            </button>
            <button
              onClick={() => setView('my-items')}
              className={`flex items-center px-6 py-2.5 rounded-lg text-sm font-semibold transition-all whitespace-nowrap ${
                view === 'my-items' ? 'bg-slate-900 text-white shadow-md' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <Package size={18} className="mr-2" />
              I miei Stock
            </button>
            <button
              onClick={() => setView('sales')}
              className={`flex items-center px-6 py-2.5 rounded-lg text-sm font-semibold transition-all whitespace-nowrap ${
                view === 'sales' ? 'bg-slate-900 text-white shadow-md' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <BarChart3 size={18} className="mr-2" />
              Venduto
            </button>
          </div>

          {view !== 'sales' && (
            <button
              onClick={() => setIsModalOpen(true)}
              className="flex items-center bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-indigo-200 transition-all transform hover:-translate-y-0.5"
            >
              <Plus size={20} className="mr-2" />
              Carica Merce
            </button>
          )}
        </div>

        {view === 'sales' ? (
          <SalesManager
            sales={sales}
            storeId={currentStore.id}
            storeName={currentStore.name}
            onAddSale={handleAddSale}
            onUpdateSale={handleUpdateSale}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {groupsToShow.length === 0 ? (
              <div className="col-span-full flex flex-col items-center justify-center py-20 text-slate-400 bg-white rounded-2xl border border-slate-200 border-dashed">
                <Package size={48} className="mb-4 opacity-20" />
                <p className="text-lg font-medium">
                  Nessun lotto trovato in questa vista.
                </p>
                {view === 'my-items' && (
                  <p className="text-sm mt-2">
                    Inizia caricando merce che non riesci a vendere.
                  </p>
                )}
              </div>
            ) : (
              groupsToShow.map(group => (
                <BrandGroupCard
                  key={`${group.sourceStoreId}::${group.brand}`}
                  group={group}
                  currentStoreId={currentStore.id}
                  mode={view === 'dashboard' ? 'network' : 'my-stock'}
                  onRequestGroup={view === 'dashboard' ? handleRequestTransferGroup : undefined}
                />
              ))
            )}
          </div>
        )}
      </main>

      <AddItemModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onAdd={handleAddItem}
      />

      {toastMessage && (
        <div className="fixed bottom-8 right-8 bg-slate-900 text-white px-6 py-3 rounded-lg shadow-2xl flex items-center animate-bounce-in z-50">
          <div className="w-2 h-2 bg-green-400 rounded-full mr-3"></div>
          {toastMessage}
        </div>
      )}
    </div>
  );
};

const ArrowRightLeftIcon = ({ size, className }: { size: number; className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M8 3 4 7l4 4" />
    <path d="M4 7h16" />
    <path d="m16 21 4-4-4-4" />
    <path d="M20 17H4" />
  </svg>
);

export default App;


