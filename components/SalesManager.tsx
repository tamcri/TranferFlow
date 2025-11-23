import React, { useState, useMemo } from 'react';
import { SalesReport } from '../types';
import { Plus, Euro, Calendar, AlertCircle, Edit2, Save, X } from 'lucide-react';

interface SalesManagerProps {
  sales: SalesReport[];
  storeId: string;
  storeName: string;
  onAddSale: (sale: Omit<SalesReport, 'id' | 'storeId' | 'storeName'>) => void;
  onUpdateSale: (sale: SalesReport) => void;
}

export const SalesManager: React.FC<SalesManagerProps> = ({ sales, storeId, storeName, onAddSale, onUpdateSale }) => {
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [revenue, setRevenue] = useState('');
  const [refunds, setRefunds] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);

  // Formatta valuta in € 0.000,00
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }).format(value);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!date || !revenue) return;

    if (editingId) {
      onUpdateSale({
        id: editingId,
        storeId,
        storeName,
        date,
        revenue: parseFloat(revenue),
        refunds: parseFloat(refunds) || 0
      });
      setEditingId(null);
    } else {
      onAddSale({
        date,
        revenue: parseFloat(revenue),
        refunds: parseFloat(refunds) || 0
      });
    }

    // Reset parziale
    setRevenue('');
    setRefunds('');
    // Manteniamo la data se stiamo inserendo, se editiamo potremmo voler resettare a oggi, ma spesso è comodo rimanga
    if (editingId) {
       setDate(new Date().toISOString().split('T')[0]);
    }
  };

  const handleEdit = (sale: SalesReport) => {
    setEditingId(sale.id);
    setDate(sale.date);
    setRevenue(sale.revenue.toString());
    setRefunds(sale.refunds === 0 ? '' : sale.refunds.toString());
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setDate(new Date().toISOString().split('T')[0]);
    setRevenue('');
    setRefunds('');
  };

  // Filtra solo le vendite del negozio corrente e ordina per data crescente (dal passato al futuro)
  const mySales = useMemo(() => {
    return sales
      .filter(s => s.storeId === storeId)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [sales, storeId]);

  return (
    <div className="space-y-6">
      {/* Form Inserimento */}
      <div className={`bg-white rounded-xl shadow-sm border p-6 transition-all ${editingId ? 'border-indigo-500 ring-1 ring-indigo-500' : 'border-slate-200'}`}>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-bold text-slate-800 flex items-center">
            <Euro size={20} className="mr-2 text-indigo-600" />
            {editingId ? 'Modifica Report' : 'Inserisci Report Giornaliero'}
          </h2>
          {editingId && (
              <button 
                type="button" 
                onClick={handleCancelEdit}
                className="text-sm text-slate-500 hover:text-slate-800 flex items-center px-3 py-1 bg-slate-100 rounded-full transition-colors"
              >
                  <X size={14} className="mr-1"/> Annulla
              </button>
          )}
        </div>
        
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Data</label>
            <div className="relative">
              <input 
                type="date" 
                value={date} 
                onChange={(e) => setDate(e.target.value)} 
                className="w-full border border-slate-300 rounded-lg px-3 py-2.5 outline-none focus:ring-2 focus:ring-indigo-500"
                required
              />
              <Calendar size={16} className="absolute right-3 top-3 text-slate-400 pointer-events-none" />
            </div>
          </div>
          
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Incassato (€)</label>
            <input 
              type="number" 
              step="0.01" 
              min="0"
              value={revenue} 
              onChange={(e) => setRevenue(e.target.value)} 
              className="w-full border border-slate-300 rounded-lg px-3 py-2.5 outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="0.00"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Reso (€)</label>
            <input 
              type="number" 
              step="0.01" 
              min="0"
              value={refunds} 
              onChange={(e) => setRefunds(e.target.value)} 
              className="w-full border border-slate-300 rounded-lg px-3 py-2.5 outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="0.00"
            />
          </div>

          <button 
            type="submit" 
            className={`font-bold py-2.5 px-6 rounded-lg transition-colors shadow-md flex items-center justify-center ${
                editingId 
                ? 'bg-green-600 hover:bg-green-700 text-white' 
                : 'bg-indigo-600 hover:bg-indigo-700 text-white'
            }`}
          >
            {editingId ? (
                <>
                    <Save size={18} className="mr-2" />
                    Aggiorna
                </>
            ) : (
                <>
                    <Plus size={18} className="mr-2" />
                    Salva
                </>
            )}
          </button>
        </form>
      </div>

      {/* Tabella Storico */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-200 bg-slate-50">
          <h3 className="font-bold text-slate-800">Storico Vendite & Resi</h3>
        </div>
        
        {mySales.length === 0 ? (
          <div className="p-8 text-center text-slate-400 flex flex-col items-center">
            <AlertCircle size={48} className="mb-2 opacity-20" />
            <p>Nessun dato di vendita inserito.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-500 uppercase">
                <tr>
                  <th className="px-6 py-3">Data</th>
                  <th className="px-6 py-3 text-right text-green-700">Incassato</th>
                  <th className="px-6 py-3 text-right text-red-600">Reso</th>
                  <th className="px-6 py-3 text-center">Modifica</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {mySales.map((sale) => (
                  <tr key={sale.id} className={`transition-colors ${editingId === sale.id ? 'bg-indigo-50' : 'hover:bg-slate-50'}`}>
                    <td className="px-6 py-4 text-sm font-medium text-slate-700">
                      {new Date(sale.date).toLocaleDateString('it-IT', { weekday: 'short', year: 'numeric', month: 'long', day: 'numeric' })}
                    </td>
                    <td className="px-6 py-4 text-right font-mono font-bold text-slate-800">
                      {formatCurrency(sale.revenue)}
                    </td>
                    <td className="px-6 py-4 text-right font-mono font-medium text-red-500">
                      {sale.refunds > 0 ? formatCurrency(sale.refunds) : '-'}
                    </td>
                    <td className="px-6 py-4 text-center">
                       <button 
                         onClick={() => handleEdit(sale)}
                         className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-100 rounded transition-colors"
                         title="Modifica"
                       >
                          <Edit2 size={16} />
                       </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};