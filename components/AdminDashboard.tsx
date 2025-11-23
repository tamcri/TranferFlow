import React, { useState, useMemo } from 'react';
import { Store, TransferItem, ItemStatus, SalesReport } from '../types';
import { Plus, Store as StoreIcon, LogOut, Trash2, Edit2, Save, X, History, Box, ArrowRight, AlertTriangle, TrendingUp, Calendar, Filter, Download } from 'lucide-react';

interface AdminDashboardProps {
  stores: Store[];
  items: TransferItem[];
  sales: SalesReport[];
  onAddStore: (store: Store) => void;
  onUpdateStore: (store: Store) => void;
  onDeleteStore: (id: string) => void;
  onLogout: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ 
  stores, 
  items, 
  sales,
  onAddStore, 
  onUpdateStore, 
  onDeleteStore, 
  onLogout 
}) => {
  const [activeTab, setActiveTab] = useState<'stores' | 'history' | 'sales'>('stores');
  
  // Store Management State
  const [newStoreName, setNewStoreName] = useState('');
  const [newStoreCity, setNewStoreCity] = useState('');
  const [newStoreUser, setNewStoreUser] = useState('');
  const [newStorePass, setNewStorePass] = useState('');
  const [editingStoreId, setEditingStoreId] = useState<string | null>(null);
  const [editPass, setEditPass] = useState('');
  const [deleteConfirmation, setDeleteConfirmation] = useState<{id: string, name: string} | null>(null);

    // Sales Filter State
  const [salesFilterStore, setSalesFilterStore] = useState('all');
  const [salesDateStart, setSalesDateStart] = useState('');
  const [salesDateEnd, setSalesDateEnd] = useState('');
  const [openHistoryGroupKey, setOpenHistoryGroupKey] = useState<string | null>(null);


  // --- Handlers ---
  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newStoreName && newStoreCity && newStoreUser && newStorePass) {
      onAddStore({
        id: `S${Date.now()}`,
        name: newStoreName,
        city: newStoreCity,
        username: newStoreUser,
        password: newStorePass
      });
      setNewStoreName('');
      setNewStoreCity('');
      setNewStoreUser('');
      setNewStorePass('');
    }
  };

  const startEditing = (store: Store) => {
    setEditingStoreId(store.id);
    setEditPass(store.password || '');
  };

  const saveEdit = (store: Store) => {
    onUpdateStore({ ...store, password: editPass });
    setEditingStoreId(null);
  };

  const confirmDelete = () => {
    if (deleteConfirmation) {
      onDeleteStore(deleteConfirmation.id);
      setDeleteConfirmation(null);
    }
  };

  const calculateDays = (start: string, end?: string) => {
    const startDate = new Date(start).getTime();
    const endDate = end ? new Date(end).getTime() : Date.now();
    const diffTime = Math.abs(endDate - startDate);
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }).format(value);
  };

    interface HistoryGroup {
    key: string;
    brand: string;
    sourceStoreId: string;
    sourceStoreName: string;
    destinationStoreId?: string;
    destinationStoreName?: string;
    totalQuantity: number;
    availableQuantity: number;
    pendingQuantity: number;
    transferredQuantity: number;
    categories: string[];
    colors: string[];
    sizes: string[];
    genders: string[];
    dateAddedMin: string;
    dateRequestedMin?: string;
    dateReceivedMax?: string;
    status: ItemStatus;
    items: TransferItem[];
  }

  // --- Grouped History Logic (lotti) ---
  const historyGroups: HistoryGroup[] = useMemo(() => {
    const map = new Map<string, HistoryGroup>();

    items.forEach((item) => {
      const key = `${item.sourceStoreId}::${item.brand}::${item.destinationStoreId || 'none'}`;
      const existing = map.get(key);

      if (!existing) {
        map.set(key, {
          key,
          brand: item.brand,
          sourceStoreId: item.sourceStoreId,
          sourceStoreName: item.sourceStoreName,
          destinationStoreId: item.destinationStoreId,
          destinationStoreName: item.destinationStoreName,
          totalQuantity: item.quantity,
          availableQuantity: item.status === ItemStatus.AVAILABLE ? item.quantity : 0,
          pendingQuantity: item.status === ItemStatus.PENDING ? item.quantity : 0,
          transferredQuantity: item.status === ItemStatus.TRANSFERRED ? item.quantity : 0,
          categories: item.category ? [item.category] : [],
          colors: item.color ? [item.color] : [],
          sizes: item.size ? [item.size] : [],
          genders: item.gender ? [item.gender] : [],
          dateAddedMin: item.dateAdded,
          dateRequestedMin: item.dateRequested,
          dateReceivedMax: item.dateReceived,
          status: item.status,
          items: [item],
        });
      } else {
        existing.totalQuantity += item.quantity;
        if (item.status === ItemStatus.AVAILABLE) existing.availableQuantity += item.quantity;
        if (item.status === ItemStatus.PENDING) existing.pendingQuantity += item.quantity;
        if (item.status === ItemStatus.TRANSFERRED) existing.transferredQuantity += item.quantity;

        if (item.category && !existing.categories.includes(item.category)) {
          existing.categories.push(item.category);
        }
        if (item.color && !existing.colors.includes(item.color)) {
          existing.colors.push(item.color);
        }
        if (item.size && !existing.sizes.includes(item.size)) {
          existing.sizes.push(item.size);
        }
        if (item.gender && !existing.genders.includes(item.gender)) {
          existing.genders.push(item.gender);
        }

        if (item.dateAdded < existing.dateAddedMin) {
          existing.dateAddedMin = item.dateAdded;
        }
        if (item.dateRequested) {
          if (!existing.dateRequestedMin || item.dateRequested < existing.dateRequestedMin) {
            existing.dateRequestedMin = item.dateRequested;
          }
        }
        if (item.dateReceived) {
          if (!existing.dateReceivedMax || item.dateReceived > existing.dateReceivedMax) {
            existing.dateReceivedMax = item.dateReceived;
          }
        }

        // Priorità stato: PENDING > TRANSFERRED > AVAILABLE
        if (item.status === ItemStatus.PENDING) {
          existing.status = ItemStatus.PENDING;
        } else if (item.status === ItemStatus.TRANSFERRED && existing.status !== ItemStatus.PENDING) {
          existing.status = ItemStatus.TRANSFERRED;
        } else if (!existing.status) {
          existing.status = ItemStatus.AVAILABLE;
        }

        existing.items.push(item);
      }
    });

    // Ordina per data inserimento (più recenti in alto)
    return Array.from(map.values()).sort((a, b) => b.dateAddedMin.localeCompare(a.dateAddedMin));
  }, [items]);


  // --- Filtered Sales Logic ---
  const filteredSales = useMemo(() => {
    return sales.filter(sale => {
      const matchStore = salesFilterStore === 'all' || sale.storeId === salesFilterStore;
      const matchStart = !salesDateStart || sale.date >= salesDateStart;
      const matchEnd = !salesDateEnd || sale.date <= salesDateEnd;
      return matchStore && matchStart && matchEnd;
    });
  }, [sales, salesFilterStore, salesDateStart, salesDateEnd]);

  const salesTotals = useMemo(() => {
    return filteredSales.reduce((acc, curr) => ({
      revenue: acc.revenue + curr.revenue,
      refunds: acc.refunds + curr.refunds
    }), { revenue: 0, refunds: 0 });
  }, [filteredSales]);

  // --- Export Logic ---
  const handleDownloadReport = () => {
    if (filteredSales.length === 0) return;

    // Intestazioni (uso ; per compatibilità Excel Italiano)
    const headers = ["Data", "Negozio", "Incassato", "Reso", "Saldo Netto"];
    
    // Righe Dati
    const rows = filteredSales.map(sale => {
      const net = sale.revenue - sale.refunds;
      // Formatta numeri con virgola per Excel Italiano
      const revStr = sale.revenue.toFixed(2).replace('.', ',');
      const refStr = sale.refunds.toFixed(2).replace('.', ',');
      const netStr = net.toFixed(2).replace('.', ',');

      return [
        sale.date,
        `"${sale.storeName}"`, // Escape per evitare problemi con spazi
        revStr,
        refStr,
        netStr
      ].join(';'); 
    });

    // Unisci tutto
    const csvContent = [headers.join(';'), ...rows].join('\n');

    // Crea Blob e Link
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    const filename = `Report_Vendite_${new Date().toISOString().slice(0,10)}.csv`;
    
    link.setAttribute("href", url);
    link.setAttribute("download", filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      <nav className="bg-slate-900 text-white sticky top-0 z-30 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center gap-3">
              <span className="text-xl font-bold tracking-tight text-white">TransferFlow <span className="text-indigo-400">Admin</span></span>
              <div className="h-6 w-px bg-slate-700 mx-2"></div>
              <div className="flex space-x-1">
                <button 
                  onClick={() => setActiveTab('stores')}
                  className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${activeTab === 'stores' ? 'bg-indigo-600 text-white' : 'text-slate-300 hover:text-white hover:bg-slate-800'}`}
                >
                  Gestione Negozi
                </button>
                <button 
                  onClick={() => setActiveTab('history')}
                  className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${activeTab === 'history' ? 'bg-indigo-600 text-white' : 'text-slate-300 hover:text-white hover:bg-slate-800'}`}
                >
                  Storico Movimentazioni
                </button>
                <button 
                  onClick={() => setActiveTab('sales')}
                  className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${activeTab === 'sales' ? 'bg-indigo-600 text-white' : 'text-slate-300 hover:text-white hover:bg-slate-800'}`}
                >
                  Venduto
                </button>
              </div>
            </div>
            <button onClick={onLogout} className="flex items-center text-sm font-medium text-red-300 hover:text-red-100 transition-colors">
              <LogOut size={16} className="mr-2" /> Esci
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* --- Tab: Gestione Negozi --- */}
        {activeTab === 'stores' && (
          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-1">
              <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 sticky top-24">
                <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center">
                  <Plus size={20} className="mr-2 text-indigo-600" />
                  Nuovo Negozio
                </h2>
                <form onSubmit={handleCreateSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Nome Negozio</label>
                    <input type="text" value={newStoreName} onChange={e => setNewStoreName(e.target.value)} className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm outline-none focus:border-indigo-500" placeholder="Es. Milano Centro" required />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Città</label>
                    <input type="text" value={newStoreCity} onChange={e => setNewStoreCity(e.target.value)} className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm outline-none focus:border-indigo-500" placeholder="Es. Milano" required />
                  </div>
                  <div className="pt-2 border-t border-slate-100">
                     <p className="text-xs text-slate-400 mb-2">Credenziali Accesso</p>
                     <div className="grid grid-cols-2 gap-2">
                       <input type="text" value={newStoreUser} onChange={e => setNewStoreUser(e.target.value)} className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm outline-none focus:border-indigo-500 font-mono" placeholder="User" required />
                       <input type="text" value={newStorePass} onChange={e => setNewStorePass(e.target.value)} className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm outline-none focus:border-indigo-500 font-mono" placeholder="Pass" required />
                     </div>
                  </div>
                  <button type="submit" className="w-full bg-indigo-600 text-white font-bold py-2 rounded-lg hover:bg-indigo-700 transition-colors shadow mt-2">Crea Negozio</button>
                </form>
              </div>
            </div>

            <div className="lg:col-span-2">
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <table className="w-full text-left">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                      <th className="px-6 py-3 text-xs font-bold text-slate-500 uppercase">Negozio</th>
                      <th className="px-6 py-3 text-xs font-bold text-slate-500 uppercase">Credenziali</th>
                      <th className="px-6 py-3 text-xs font-bold text-slate-500 uppercase text-right">Azioni</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {stores.map((store) => (
                      <tr key={store.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center">
                            <div className="bg-indigo-100 p-2 rounded-lg mr-3 text-indigo-600">
                              <StoreIcon size={18} />
                            </div>
                            <div>
                              <p className="font-bold text-slate-800 text-sm">{store.name}</p>
                              <p className="text-xs text-slate-500">{store.city}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm flex flex-col gap-1">
                            <div><span className="text-slate-400 text-xs w-8 inline-block">User:</span> <span className="font-mono font-bold text-slate-700">{store.username}</span></div>
                            {editingStoreId === store.id ? (
                              <div className="flex items-center gap-2">
                                <span className="text-slate-400 text-xs w-8 inline-block">Pass:</span>
                                <input type="text" value={editPass} onChange={e => setEditPass(e.target.value)} className="w-24 border border-indigo-300 rounded px-1 py-0.5 text-xs font-mono" />
                                <button type="button" onClick={() => saveEdit(store)} className="text-green-600 hover:text-green-700"><Save size={14}/></button>
                                <button type="button" onClick={() => setEditingStoreId(null)} className="text-slate-400 hover:text-slate-600"><X size={14}/></button>
                              </div>
                            ) : (
                              <div><span className="text-slate-400 text-xs w-8 inline-block">Pass:</span> <span className="font-mono text-slate-600">{store.password}</span></div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex justify-end gap-2">
                            {editingStoreId !== store.id && (
                              <button type="button" onClick={(e) => { e.stopPropagation(); startEditing(store); }} className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-colors" title="Modifica"><Edit2 size={16} /></button>
                            )}
                            <button type="button" onClick={(e) => { e.preventDefault(); e.stopPropagation(); setDeleteConfirmation({ id: store.id, name: store.name }); }} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors" title="Elimina"><Trash2 size={16} /></button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* --- Tab: Storico Movimentazioni --- */}
        {activeTab === 'history' && (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
              <h3 className="font-bold text-slate-800 flex items-center">
                <History size={18} className="mr-2 text-indigo-600" />
                Tracciamento & Movimentazioni
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3 font-bold text-slate-500 uppercase">Lotto / Brand</th>
                    <th className="px-4 py-3 font-bold text-slate-500 uppercase">Dettaglio lotto</th>
                    <th className="px-4 py-3 font-bold text-slate-500 uppercase">
                      Origine <ArrowRight size={12} className="inline mx-1" /> Destinazione
                    </th>
                    <th className="px-4 py-3 font-bold text-slate-500 uppercase">Stato</th>
                    <th className="px-4 py-3 font-bold text-slate-500 uppercase">Date</th>
                    <th className="px-4 py-3 font-bold text-slate-500 uppercase text-right">Permanenza</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {historyGroups.map((group) => {
                    const daysSinceAdded = calculateDays(group.dateAddedMin);

                    const categoriesLabel =
                      group.categories.length === 0
                        ? "-"
                        : group.categories.slice(0, 3).join(", ") +
                          (group.categories.length > 3 ? "…" : "");

                    const colorsLabel =
                      group.colors.length === 0
                        ? "-"
                        : group.colors.slice(0, 3).join(", ") +
                          (group.colors.length > 3 ? "…" : "");

                    const sizesLabel =
                      group.sizes.length === 0
                        ? "-"
                        : group.sizes.slice(0, 4).join(", ") +
                          (group.sizes.length > 4 ? "…" : "");

                    const gendersLabel =
                      group.genders.length === 0
                        ? "-"
                        : group.genders.join(", ");

                    const isOpen = openHistoryGroupKey === group.key;

                    return (
                      <React.Fragment key={group.key}>
                        <tr
                          className="hover:bg-slate-50 cursor-pointer align-top"
                          onClick={() =>
                            setOpenHistoryGroupKey(isOpen ? null : group.key)
                          }
                        >
                          <td className="px-4 py-3">
                            <div className="font-bold text-slate-800 flex items-center gap-2">
                              <span>{group.brand}</span>
                              <span className="text-[10px] uppercase tracking-wide text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
                                Lotto ({group.items.length} righe)
                              </span>
                            </div>
                            <div className="text-slate-500 text-xs">
                              {categoriesLabel}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-xs text-slate-600">
                            <div className="space-y-0.5">
                              <div>
                                <span className="text-slate-400">Sesso:</span>{" "}
                                {gendersLabel}
                              </div>
                              <div>
                                <span className="text-slate-400">Colori:</span>{" "}
                                {colorsLabel}
                              </div>
                              <div>
                                <span className="text-slate-400">Taglie:</span>{" "}
                                {sizesLabel}
                              </div>
                              <div>
                                <span className="text-slate-400">
                                  Qtà totale:
                                </span>{" "}
                                {group.totalQuantity}
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex flex-col gap-1 text-xs">
                              <span className="text-red-500 text-[11px] font-semibold bg-red-50 px-2 py-0.5 rounded w-fit">
                                DA: {group.sourceStoreName}
                              </span>
                              {group.destinationStoreName ? (
                                <span className="text-green-600 text-[11px] font-semibold bg-green-50 px-2 py-0.5 rounded w-fit">
                                  A: {group.destinationStoreName}
                                </span>
                              ) : (
                                <span className="text-slate-400 text-xs italic pl-2">
                                  - Nessuna richiesta -
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className={`px-2 py-1 rounded text-xs font-bold ${
                                group.status === ItemStatus.AVAILABLE
                                  ? "bg-slate-100 text-slate-600"
                                  : group.status === ItemStatus.PENDING
                                  ? "bg-yellow-100 text-yellow-700"
                                  : "bg-green-100 text-green-700"
                              }`}
                            >
                              {group.status}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-xs text-slate-600 space-y-1">
                            <div>
                              <span className="text-slate-400">Ins:</span>{" "}
                              {new Date(group.dateAddedMin).toLocaleDateString(
                                "it-IT"
                              )}
                            </div>
                            {group.dateRequestedMin && (
                              <div>
                                <span className="text-slate-400">Rich:</span>{" "}
                                {new Date(
                                  group.dateRequestedMin
                                ).toLocaleDateString("it-IT")}
                              </div>
                            )}
                            {group.dateReceivedMax && (
                              <div>
                                <span className="text-slate-400">Ricev:</span>{" "}
                                {new Date(
                                  group.dateReceivedMax
                                ).toLocaleDateString("it-IT")}
                              </div>
                            )}
                          </td>
                          <td className="px-4 py-3 text-right">
                            <div className="flex flex-col items-end">
                              <span
                                className={`font-bold text-lg ${
                                  daysSinceAdded > 30
                                    ? "text-red-500"
                                    : "text-slate-700"
                                }`}
                              >
                                {daysSinceAdded} gg
                              </span>
                              <span className="text-[10px] text-slate-400 uppercase">
                                In stock
                              </span>
                              <span className="text-[10px] text-slate-400 mt-1 flex items-center gap-1">
                                <span className="inline-block w-1.5 h-1.5 rounded-full bg-slate-300" />
                                {isOpen
                                  ? "Nascondi dettaglio lotto"
                                  : "Vedi dettaglio lotto"}
                              </span>
                            </div>
                          </td>
                        </tr>

                        {isOpen && (
                          <tr>
                            <td
                              colSpan={6}
                              className="bg-slate-50 px-4 py-3 text-xs text-slate-700"
                            >
                              <div className="mb-2 font-semibold text-[11px] text-slate-500 uppercase">
                                Dettaglio righe lotto
                              </div>
                              <div className="border border-slate-200 rounded-lg overflow-hidden">
                                <table className="w-full text-xs">
                                  <thead className="bg-white border-b border-slate-200">
                                    <tr>
                                      <th className="px-3 py-2 text-left font-semibold text-slate-500">
                                        Articolo
                                      </th>
                                      <th className="px-3 py-2 text-left font-semibold text-slate-500">
                                        Dettagli
                                      </th>
                                      <th className="px-3 py-2 text-left font-semibold text-slate-500">
                                        Origine → Destinazione
                                      </th>
                                      <th className="px-3 py-2 text-left font-semibold text-slate-500">
                                        Stato
                                      </th>
                                      <th className="px-3 py-2 text-left font-semibold text-slate-500">
                                        Date
                                      </th>
                                      <th className="px-3 py-2 text-right font-semibold text-slate-500">
                                        Qtà
                                      </th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-slate-100 bg-white">
                                    {group.items.map((item) => (
                                      <tr key={item.id} className="align-top">
                                        <td className="px-3 py-2">
                                          <div className="font-semibold text-slate-800">
                                            {item.brand}
                                          </div>
                                          <div className="text-slate-500 text-[11px]">
                                            {item.category}
                                          </div>
                                        </td>
                                        <td className="px-3 py-2 text-[11px] text-slate-600">
                                          <div>Sesso: {item.gender}</div>
                                          <div>Colore: {item.color}</div>
                                          <div>Taglia: {item.size}</div>
                                        </td>
                                        <td className="px-3 py-2 text-[11px] text-slate-600">
                                          <div>Da: {item.sourceStoreName}</div>
                                          {item.destinationStoreName && (
                                            <div>
                                              A: {item.destinationStoreName}
                                            </div>
                                          )}
                                        </td>
                                        <td className="px-3 py-2">
                                          <span
                                            className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                                              item.status ===
                                              ItemStatus.AVAILABLE
                                                ? "bg-slate-100 text-slate-600"
                                                : item.status ===
                                                  ItemStatus.PENDING
                                                ? "bg-yellow-100 text-yellow-700"
                                                : "bg-green-100 text-green-700"
                                            }`}
                                          >
                                            {item.status}
                                          </span>
                                        </td>
                                        <td className="px-3 py-2 text-[11px] text-slate-600">
                                          <div>
                                            Ins:{" "}
                                            {new Date(
                                              item.dateAdded
                                            ).toLocaleDateString("it-IT")}
                                          </div>
                                          {item.dateRequested && (
                                            <div>
                                              Rich:{" "}
                                              {new Date(
                                                item.dateRequested
                                              ).toLocaleDateString("it-IT")}
                                            </div>
                                          )}
                                          {item.dateReceived && (
                                            <div>
                                              Ricev:{" "}
                                              {new Date(
                                                item.dateReceived
                                              ).toLocaleDateString("it-IT")}
                                            </div>
                                          )}
                                        </td>
                                        <td className="px-3 py-2 text-right text-sm font-semibold">
                                          {item.quantity}
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
        
        {/* --- Tab: Venduto --- */}


        {/* --- Tab: Venduto --- */}
        {activeTab === 'sales' && (
          <div className="space-y-6">
            {/* Filtri */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
              <div className="flex flex-col md:flex-row gap-4 items-end">
                <div className="w-full md:w-1/3">
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1 flex items-center">
                    <Filter size={14} className="mr-1"/> Filtra Negozio
                  </label>
                  <select 
                    value={salesFilterStore} 
                    onChange={(e) => setSalesFilterStore(e.target.value)}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="all">Tutti i Negozi</option>
                    {stores.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>
                <div className="w-full md:w-1/3">
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1 flex items-center">
                    <Calendar size={14} className="mr-1"/> Dal...
                  </label>
                  <input 
                    type="date" 
                    value={salesDateStart} 
                    onChange={(e) => setSalesDateStart(e.target.value)} 
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div className="w-full md:w-1/3">
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1 flex items-center">
                     <Calendar size={14} className="mr-1"/> Al...
                  </label>
                  <input 
                    type="date" 
                    value={salesDateEnd} 
                    onChange={(e) => setSalesDateEnd(e.target.value)} 
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>
            </div>

            {/* Totali Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
               <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                  <h4 className="text-xs font-bold text-slate-400 uppercase">Totale Incassato</h4>
                  <p className="text-2xl font-bold text-slate-800 mt-1">{formatCurrency(salesTotals.revenue)}</p>
               </div>
               <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                  <h4 className="text-xs font-bold text-slate-400 uppercase">Totale Reso</h4>
                  <p className="text-2xl font-bold text-red-500 mt-1">{formatCurrency(salesTotals.refunds)}</p>
               </div>
               <div className="bg-slate-900 p-6 rounded-xl shadow-lg border border-slate-800 text-white">
                  <h4 className="text-xs font-bold text-slate-400 uppercase">Saldo Netto</h4>
                  <p className="text-2xl font-bold text-emerald-400 mt-1">{formatCurrency(salesTotals.revenue - salesTotals.refunds)}</p>
               </div>
            </div>

            {/* Tabella Dati */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
               <div className="p-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
                  <h3 className="font-bold text-slate-800 flex items-center">
                    <TrendingUp size={18} className="mr-2 text-indigo-600"/>
                    Report Dettagliato
                  </h3>
                  <button 
                    onClick={handleDownloadReport}
                    disabled={filteredSales.length === 0}
                    className={`flex items-center text-sm font-semibold px-4 py-2 rounded-lg transition-colors ${
                      filteredSales.length === 0 
                        ? 'bg-slate-100 text-slate-400 cursor-not-allowed' 
                        : 'bg-green-600 text-white hover:bg-green-700 shadow hover:shadow-md'
                    }`}
                  >
                    <Download size={16} className="mr-2" />
                    Scarica Report CSV (Excel)
                  </button>
               </div>
               <div className="overflow-x-auto">
                 <table className="w-full text-left">
                    <thead className="bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-500 uppercase">
                      <tr>
                        <th className="px-6 py-3">Data</th>
                        <th className="px-6 py-3">Negozio</th>
                        <th className="px-6 py-3 text-right text-green-700">Incassato</th>
                        <th className="px-6 py-3 text-right text-red-600">Reso</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredSales.length === 0 ? (
                        <tr><td colSpan={4} className="px-6 py-8 text-center text-slate-400 italic">Nessun dato trovato per i filtri selezionati</td></tr>
                      ) : (
                        filteredSales.map((sale) => (
                          <tr key={sale.id} className="hover:bg-slate-50">
                            <td className="px-6 py-4 text-sm font-medium text-slate-700">
                              {new Date(sale.date).toLocaleDateString()}
                            </td>
                            <td className="px-6 py-4 text-sm text-slate-600">
                              {sale.storeName}
                            </td>
                            <td className="px-6 py-4 text-right font-mono font-bold text-slate-800">
                              {formatCurrency(sale.revenue)}
                            </td>
                            <td className="px-6 py-4 text-right font-mono font-medium text-red-500">
                              {sale.refunds > 0 ? formatCurrency(sale.refunds) : '-'}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                 </table>
               </div>
            </div>
          </div>
        )}

        {/* Delete Modal */}
        {deleteConfirmation && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm overflow-hidden transform transition-all scale-100">
              <div className="p-6 text-center">
                <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
                  <AlertTriangle className="h-6 w-6 text-red-600" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">Eliminare Negozio?</h3>
                <p className="text-sm text-slate-500 mb-6">
                  Stai per eliminare <strong>{deleteConfirmation.name}</strong>. L'azione è irreversibile.
                </p>
                <div className="flex space-x-3">
                  <button onClick={() => setDeleteConfirmation(null)} className="flex-1 px-4 py-2 bg-white text-slate-700 border border-slate-300 rounded-lg font-semibold hover:bg-slate-50 transition-colors">Annulla</button>
                  <button onClick={confirmDelete} className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition-colors shadow-lg shadow-red-200">Elimina Definitivamente</button>
                </div>
              </div>
            </div>
          </div>
        )}

      </main>
    </div>
  );
};