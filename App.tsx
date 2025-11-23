import React, { useState, useMemo, useEffect } from 'react';
import { STORES, INITIAL_ITEMS, ADMIN_CREDENTIALS, INITIAL_SALES } from './constants';
import { Store, TransferItem, ItemStatus, SalesReport } from './types';
import { ItemCard } from './components/ItemCard';
import { AddItemModal } from './components/AddItemModal';
import { LoginPage } from './components/LoginPage';
import { AdminDashboard } from './components/AdminDashboard';
import { SalesManager } from './components/SalesManager';
import { Plus, LayoutGrid, Package, LogOut, Store as StoreIcon, BarChart3 } from 'lucide-react';

const App: React.FC = () => {
  // Auth State
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [currentStore, setCurrentStore] = useState<Store | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);

  // Data State with Persistence
  // Inizializza leggendo da LocalStorage, se vuoto usa i dati mock (constants.ts)
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

  // --- Persistence Effects ---
  // Salva automaticamente su LocalStorage ogni volta che i dati cambiano
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

  // --- Admin Handlers ---
  const handleAdminAddStore = (newStore: Store) => {
    setAllStores(prev => [...prev, newStore]);
    showToast(`Negozio ${newStore.name} creato con successo!`);
  };

  const handleAdminUpdateStore = (updatedStore: Store) => {
    setAllStores(prev => prev.map(s => s.id === updatedStore.id ? updatedStore : s));
    showToast(`Negozio ${updatedStore.name} aggiornato!`);
  };

  const handleAdminDeleteStore = (id: string) => {
    // 1. Rimuovi il negozio
    setAllStores(prev => prev.filter(s => s.id !== id));
    
    // 2. Rimuovi tutti gli items associati (sia come sorgente che come destinazione per pulire lo storico)
    setItems(prev => prev.filter(i => i.sourceStoreId !== id && i.destinationStoreId !== id));

    // 3. Rimuovi tutte le vendite associate
    setSales(prev => prev.filter(s => s.storeId !== id));

    showToast("Negozio e tutti i dati correlati eliminati.");
  };

  // --- Store App Logic ---
  const displayItems = useMemo(() => {
    if (!currentStore) return [];
    
    if (view === 'dashboard') {
      return items.filter(item => {
        const isFromOthers = item.sourceStoreId !== currentStore.id;
        const isAvailable = item.status === ItemStatus.AVAILABLE;
        const isIncomingForMe = item.destinationStoreId === currentStore.id;
        return (isFromOthers && isAvailable) || isIncomingForMe;
      });
    } else {
      return items.filter(item => item.sourceStoreId === currentStore.id);
    }
  }, [items, currentStore, view]);

  const handleAddItem = (newItems: { brand: string; gender: string; category: string; color: string; size: string; quantity: number; description: string }[]) => {
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
      dateAdded: new Date().toISOString()
    }));

    setItems(prev => [...createdItems, ...prev]);
    showToast(`${createdItems.length} Articoli aggiunti con successo!`);
  };

  const handleRequestTransfer = (itemId: string) => {
    if (!currentStore) return;
    setItems(prev => prev.map(item => {
      if (item.id === itemId) {
        return { 
          ...item, 
          status: ItemStatus.PENDING,
          destinationStoreId: currentStore.id,
          destinationStoreName: currentStore.name,
          dateRequested: new Date().toISOString()
        };
      }
      return item;
    }));
    showToast("Richiesta inviata! Attendi la spedizione.");
  };

  const handleConfirmReceipt = (itemId: string) => {
    setItems(prev => prev.map(item => {
      if (item.id === itemId) {
        return {
          ...item,
          status: ItemStatus.TRANSFERRED,
          dateReceived: new Date().toISOString()
        };
      }
      return item;
    }));
    showToast("Ricezione confermata! Merce in carico.");
  };

  const handleWithdrawItem = (itemId: string) => {
    setItems(prev => prev.filter(item => item.id !== itemId));
    showToast("Articolo ritirato e rimosso dalla lista.");
  };

  const handleAddSale = (saleData: Omit<SalesReport, 'id' | 'storeId' | 'storeName'>) => {
    if (!currentStore) return;
    const newSale: SalesReport = {
      id: `SALE-${Date.now()}`,
      storeId: currentStore.id,
      storeName: currentStore.name,
      ...saleData
    };
    setSales(prev => [...prev, newSale]);
    showToast("Report vendita aggiunto!");
  };

  const handleUpdateSale = (updatedSale: SalesReport) => {
    setSales(prev => prev.map(s => s.id === updatedSale.id ? updatedSale : s));
    showToast("Report vendita modificato!");
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
                  <StoreIcon size={14} className="text-indigo-600"/>
                  {currentStore.name}
                </span>
              </div>
              
              <button onClick={handleLogout} className="p-2 hover:bg-slate-100 rounded-full text-slate-500 transition-colors">
                <LogOut size={20} />
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
          <div className="bg-white p-1 rounded-xl border border-slate-200 shadow-sm flex overflow-x-auto max-w-full">
            <button onClick={() => setView('dashboard')} className={`flex items-center px-6 py-2.5 rounded-lg text-sm font-semibold transition-all whitespace-nowrap ${view === 'dashboard' ? 'bg-slate-900 text-white shadow-md' : 'text-slate-500 hover:text-slate-900'}`}>
              <LayoutGrid size={18} className="mr-2" />
              Bacheca Network
            </button>
            <button onClick={() => setView('my-items')} className={`flex items-center px-6 py-2.5 rounded-lg text-sm font-semibold transition-all whitespace-nowrap ${view === 'my-items' ? 'bg-slate-900 text-white shadow-md' : 'text-slate-500 hover:text-slate-900'}`}>
              <Package size={18} className="mr-2" />
              I miei Stock
            </button>
            <button onClick={() => setView('sales')} className={`flex items-center px-6 py-2.5 rounded-lg text-sm font-semibold transition-all whitespace-nowrap ${view === 'sales' ? 'bg-slate-900 text-white shadow-md' : 'text-slate-500 hover:text-slate-900'}`}>
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
            {displayItems.length === 0 ? (
              <div className="col-span-full flex flex-col items-center justify-center py-20 text-slate-400 bg-white rounded-2xl border border-slate-200 border-dashed">
                <Package size={48} className="mb-4 opacity-20" />
                <p className="text-lg font-medium">Nessun articolo trovato in questa vista.</p>
                {view === 'my-items' && <p className="text-sm mt-2">Inizia caricando merce che non riesci a vendere.</p>}
              </div>
            ) : (
              displayItems.map(item => (
                <ItemCard 
                  key={item.id} 
                  item={item} 
                  currentStoreId={currentStore.id}
                  onRequestTransfer={handleRequestTransfer}
                  onConfirmReceipt={handleConfirmReceipt}
                  onWithdrawItem={handleWithdrawItem}
                />
              ))
            )}
          </div>
        )}
      </main>

      <AddItemModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onAdd={handleAddItem} />

      {toastMessage && (
        <div className="fixed bottom-8 right-8 bg-slate-900 text-white px-6 py-3 rounded-lg shadow-2xl flex items-center animate-bounce-in z-50">
          <div className="w-2 h-2 bg-green-400 rounded-full mr-3"></div>
          {toastMessage}
        </div>
      )}
    </div>
  );
};

const ArrowRightLeftIcon = ({ size, className }: { size: number, className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M8 3 4 7l4 4" /><path d="M4 7h16" /><path d="m16 21 4-4-4-4" /><path d="M20 17H4" /></svg>
);

export default App;