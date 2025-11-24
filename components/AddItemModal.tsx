import React, { useState } from 'react';
import { X, Plus, Trash2, Save } from 'lucide-react';

interface VariantRow {
  id: string;
  category: string;
  articleCode: string;
  typology: string;
  color: string;
  size: string;
  quantity: number;
}

interface AddItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (
    items: {
      brand: string;
      gender: string;
      category: string;
      typology?: string;      // 👈 NUOVO
      color: string;
      size: string;
      quantity: number;
      description: string;
      articleCode?: string;
    }[]
  ) => void;
}


const CATEGORIES = ['Abbigliamento', 'Calzature', 'Borse', 'Accessori'];

export const AddItemModal: React.FC<AddItemModalProps> = ({
  isOpen,
  onClose,
  onAdd,
}) => {
  // Testata
  const [brand, setBrand] = useState('');
  const [gender, setGender] = useState('Uomo');

  // Righe
  const [rows, setRows] = useState<VariantRow[]>([
    {
      id: '1',
      category: '',
      articleCode: '',
      typology: '',
      color: '',
      size: '',
      quantity: 1,
    },
  ]);

  if (!isOpen) return null;

  const handleAddRow = () => {
    setRows((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        category: '',
        articleCode: '',
        typology: '',
        color: '',
        size: '',
        quantity: 1,
      },
    ]);
  };

  const handleRemoveRow = (id: string) => {
    if (rows.length > 1) {
      setRows(rows.filter((r) => r.id !== id));
    }
  };

  const updateRow = (
    id: string,
    field: keyof VariantRow,
    value: string | number
  ) => {
    setRows(rows.map((r) => (r.id === id ? { ...r, [field]: value } : r)));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!brand) return;

    // Serve almeno una riga con categoria e quantità > 0
    const validRows = rows.filter((r) => r.category && r.quantity > 0);
    if (validRows.length === 0) return;

    const itemsToAdd = validRows.map((row) => {
  // Costruisco una descrizione leggibile con tutti i campi opzionali
  const parts: string[] = [];

  parts.push(brand); // sempre

  if (row.articleCode) parts.push(row.articleCode);
  if (row.typology) parts.push(row.typology);
  parts.push(row.category); // sempre se è valida

  const colorSize: string[] = [];
  if (row.color) colorSize.push(row.color);
  if (row.size) colorSize.push(row.size);

  let main = parts.join(' ');
  if (colorSize.length > 0) {
    main += ' ' + colorSize.join(' ');
  }

  const description = `${main} - ${gender} (${row.quantity} pz)`;

  return {
    brand,
    gender,
    category: row.category,
    typology: row.typology || undefined,         // 👈 NUOVO
    color: row.color,
    size: row.size,
    quantity: row.quantity,
    description,
    articleCode: row.articleCode || undefined,
  };
});


    onAdd(itemsToAdd);

    // Reset
    setBrand('');
    setGender('Uomo');
    setRows([
      {
        id: '1',
        category: '',
        articleCode: '',
        typology: '',
        color: '',
        size: '',
        quantity: 1,
      },
    ]);
    onClose();
  };

  const nonEmptyRowsCount = rows.filter(
    (r) => r.category && r.quantity > 0
  ).length;
  const displayCount = nonEmptyRowsCount || rows.length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl my-auto">
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50 rounded-t-2xl sticky top-0">
          <h2 className="font-bold text-lg text-slate-800">
            Carica Stock Invenduto (Macro)
          </h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          {/* TESTATA */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8 bg-indigo-50/50 p-4 rounded-xl border border-indigo-100">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">
                Brand
              </label>
              <input
                type="text"
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                placeholder="Es. Pinko, Nike..."
                required
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">
                Sesso / Reparto
              </label>
              <select
                value={gender}
                onChange={(e) => setGender(e.target.value)}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none bg-white"
              >
                <option value="Uomo">Uomo</option>
                <option value="Donna">Donna</option>
                <option value="Bambino">Bambino</option>
                <option value="Unisex">Unisex</option>
              </select>
            </div>
          </div>

          {/* RIGHE STOCK MACRO */}
          <div className="space-y-3">
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wide">
                Righe Stock (Categoria + dettagli opzionali)
              </h3>
              <button
                type="button"
                onClick={handleAddRow}
                className="text-xs flex items-center bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1.5 rounded-full font-semibold transition-colors"
              >
                <Plus size={14} className="mr-1" /> Aggiungi riga
              </button>
            </div>

            <div className="bg-slate-50 rounded-xl border border-slate-200 overflow-x-auto">
              <table className="w-full min-w-[900px] text-sm">
                <thead className="bg-slate-100 text-slate-500 font-semibold text-xs uppercase">
                  <tr>
                    <th className="px-4 py-3 text-left">Categoria *</th>
                    <th className="px-4 py-3 text-left">Cod. articolo</th>
                    <th className="px-4 py-3 text-left">Tipologia</th>
                    <th className="px-4 py-3 text-left">Colore</th>
                    <th className="px-4 py-3 text-left">Taglia</th>
                    <th className="px-4 py-3 text-left w-24">Q.tà *</th>
                    <th className="px-4 py-3 text-center w-10"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {rows.map((row) => (
                    <tr key={row.id}>
                      <td className="p-2">
                        <select
                          value={row.category}
                          onChange={(e) =>
                            updateRow(row.id, 'category', e.target.value)
                          }
                          className="w-full border-slate-300 border rounded px-2 py-1.5 focus:border-indigo-500 outline-none bg-white"
                          required
                        >
                          <option value="">Seleziona...</option>
                          {CATEGORIES.map((cat) => (
                            <option key={cat} value={cat}>
                              {cat}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="p-2">
                        <input
                          type="text"
                          value={row.articleCode}
                          onChange={(e) =>
                            updateRow(row.id, 'articleCode', e.target.value)
                          }
                          className="w-full border-slate-300 border rounded px-2 py-1.5 focus:border-indigo-500 outline-none"
                          placeholder="Es. 12345"
                        />
                      </td>
                      <td className="p-2">
                        <input
                          type="text"
                          value={row.typology}
                          onChange={(e) =>
                            updateRow(row.id, 'typology', e.target.value)
                          }
                          className="w-full border-slate-300 border rounded px-2 py-1.5 focus:border-indigo-500 outline-none"
                          placeholder="Es. Pantalone, Gonna..."
                        />
                      </td>
                      <td className="p-2">
                        <input
                          type="text"
                          value={row.color}
                          onChange={(e) =>
                            updateRow(row.id, 'color', e.target.value)
                          }
                          className="w-full border-slate-300 border rounded px-2 py-1.5 focus:border-indigo-500 outline-none"
                          placeholder="Es. Nero"
                        />
                      </td>
                      <td className="p-2">
                        <input
                          type="text"
                          value={row.size}
                          onChange={(e) =>
                            updateRow(row.id, 'size', e.target.value)
                          }
                          className="w-full border-slate-300 border rounded px-2 py-1.5 focus:border-indigo-500 outline-none"
                          placeholder="Es. M / 40"
                        />
                      </td>
                      <td className="p-2">
                        <input
                          type="number"
                          min="1"
                          value={row.quantity}
                          onChange={(e) =>
                            updateRow(
                              row.id,
                              'quantity',
                              parseInt(e.target.value) || 0
                            )
                          }
                          className="w-full border-slate-300 border rounded px-2 py-1.5 focus:border-indigo-500 outline-none text-center"
                          required
                        />
                      </td>
                      <td className="p-2 text-center">
                        {rows.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveRow(row.id)}
                            className="text-slate-400 hover:text-red-500 transition-colors p-1"
                            tabIndex={-1}
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-xs text-slate-400 italic px-1">
              I campi contrassegnati con * sono obbligatori. Gli altri sono
              opzionali.
            </p>
          </div>

          <div className="mt-8 pt-6 border-t border-slate-100 flex justify-end">
            <button
              type="submit"
              className="bg-indigo-600 text-white font-bold py-3 px-8 rounded-xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 flex items-center"
            >
              <Save size={18} className="mr-2" />
              Carica {displayCount}{' '}
              {displayCount === 1 ? 'Riga Stock' : 'Righe Stock'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

