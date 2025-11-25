import React, { useState } from "react";
import * as XLSX from "xlsx";
import { X, Plus, Trash2, Save } from "lucide-react";
import GestionaleImportModal, { GestionaleRow } from "./GestionaleImportModal";

interface VariantRow {
  id: string;
  category: string;
  gender: string;       // sesso per riga
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
      typology?: string;
      color: string;
      size: string;
      quantity: number;
      description: string;
      articleCode?: string;
    }[]
  ) => void;
}

const CATEGORIES = ["Abbigliamento", "Calzature", "Borse", "Accessori"];
const GENDERS = ["Uomo", "Donna", "Bambino", "Unisex"];

export const AddItemModal: React.FC<AddItemModalProps> = ({
  isOpen,
  onClose,
  onAdd,
}) => {
  // -----------------------------
  // Stati per il file gestionale
  // -----------------------------
  const [gestionaleRows, setGestionaleRows] = useState<GestionaleRow[]>([]);
  const [isGestionaleModalOpen, setIsGestionaleModalOpen] = useState(false);
  const [activeRowIndex, setActiveRowIndex] = useState<number | null>(null);

  // -----------------------------
  // Testata (solo BRAND)
  // -----------------------------
  const [brand, setBrand] = useState("");

  // -----------------------------
  // Righe stock
  // -----------------------------
  const [rows, setRows] = useState<VariantRow[]>([
    {
      id: "1",
      category: "",
      gender: "Uomo",
      articleCode: "",
      typology: "",
      color: "",
      size: "",
      quantity: 1,
    },
  ]);

  if (!isOpen) return null;

  // -----------------------------
  // Reset completo (per chiusura o dopo submit)
  // -----------------------------
  const resetState = () => {
    setBrand("");
    setRows([
      {
        id: "1",
        category: "",
        gender: "Uomo",
        articleCode: "",
        typology: "",
        color: "",
        size: "",
        quantity: 1,
      },
    ]);
    setGestionaleRows([]);
    setIsGestionaleModalOpen(false);
    setActiveRowIndex(null);
  };

  const handleClose = () => {
    resetState();
    onClose();
  };

  // Helper per normalizzare il sesso dal file
  const normalizeGender = (raw: string): string => {
    const v = raw.trim().toUpperCase();
    if (!v) return "";
    if (v === "UOMO" || v === "U") return "Uomo";
    if (v === "DONNA" || v === "D" || v === "F") return "Donna";
    if (v === "BAMBINO" || v === "BAMBINA" || v === "BIMBO" || v === "BIMBA")
      return "Bambino";
    if (v === "UNISEX" || v === "UNI") return "Unisex";
    return ""; // se non riconosciuto, lascio vuoto così non forzo nulla
  };

  // -----------------------------
  // Lettura file gestionale .xlsx
  // -----------------------------
  const handleGestionaleFileChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();

    reader.onload = (e) => {
      const data = e.target?.result;
      if (!data) return;

      const workbook = XLSX.read(data, { type: "binary" });
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      const json = XLSX.utils.sheet_to_json<any>(sheet);

      const parsed: GestionaleRow[] = json
        .map((row) => {
          const qtyRaw =
            row["Qtà Giacenza                                      "] ?? 0;

          const rawGender = (row["Sesso"] ?? "").toString();
          const normalizedGender = normalizeGender(rawGender);

          return {
            brand: (row["Marchio"] ?? "").toString().trim(),
            gender: normalizedGender, // 👈 normalizzato per combaciare con il select
            category: (row["Categoria"] ?? "").toString().trim(),
            typology: (row["Tipologia"] ?? "").toString().trim(),
            articleCode: (row["Codice Articolo"] ?? "").toString().trim(),
            color: (row["Colore"] ?? "").toString().trim(),
            size: (row["Taglia"] ?? "").toString().trim(),
            quantity: Number(qtyRaw) || 0,
          } as GestionaleRow;
        })
        .filter((row) => row.articleCode); // solo righe con codice articolo

      setGestionaleRows(parsed);

      // auto-fill brand se il campo è vuoto e il file ha un brand
      if (!brand && parsed.length > 0 && parsed[0].brand) {
        setBrand(parsed[0].brand);
      }

      event.target.value = "";
    };

    reader.readAsBinaryString(file);
  };

  // -----------------------------
  // Aggiungi / rimuovi righe
  // -----------------------------
  const handleAddRow = () => {
    setRows((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        category: "",
        gender: "Uomo",
        articleCode: "",
        typology: "",
        color: "",
        size: "",
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
    setRows((current) =>
      current.map((r) => (r.id === id ? { ...r, [field]: value } : r))
    );
  };

  // -----------------------------
  // Usa riga dal gestionale
  // (resta aperto e avanza alla riga successiva)
  // -----------------------------
  const handleGestionaleRowSelected = (row: GestionaleRow) => {
    if (activeRowIndex === null) return;

    setRows((prev) => {
      const copy = [...prev];
      const current = copy[activeRowIndex];

      copy[activeRowIndex] = {
        ...current,
        category: row.category || current.category,
        gender: row.gender || current.gender,
        articleCode: row.articleCode || current.articleCode,
        typology: row.typology || current.typology,
        color: row.color || current.color,
        size: row.size || current.size,
        quantity: row.quantity || current.quantity,
      };

      return copy;
    });

    // passa automaticamente alla riga successiva, lasciando il modal aperto
    setActiveRowIndex((prevIndex) => {
      if (prevIndex === null) return null;
      const nextIndex = prevIndex + 1;
      if (nextIndex >= rows.length) {
        // se non ci sono altre righe, chiudo il modal
        setIsGestionaleModalOpen(false);
        return null;
      }
      return nextIndex;
    });
  };

  // -----------------------------
  // Calcolo righe da caricare (tutte quelle valide)
  // -----------------------------
  const validRows = rows.filter((r) => r.category && r.quantity > 0);
  const displayCount = validRows.length || rows.length;

  // -----------------------------
  // Salva
  // -----------------------------
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!brand) return;

    if (validRows.length === 0) return;

    const itemsToAdd = validRows.map((row) => {
      const parts: string[] = [];

      parts.push(brand);
      if (row.articleCode) parts.push(row.articleCode);
      if (row.typology) parts.push(row.typology);
      parts.push(row.category);

      const colorSize: string[] = [];
      if (row.color) colorSize.push(row.color);
      if (row.size) colorSize.push(row.size);

      let main = parts.join(" ");
      if (colorSize.length > 0) {
        main += " " + colorSize.join(" ");
      }

      const genderLabel = row.gender || "Uomo";
      const description = `${main} - ${genderLabel} (${row.quantity} pz)`;

      return {
        brand,
        gender: genderLabel,
        category: row.category,
        typology: row.typology || undefined,
        color: row.color,
        size: row.size,
        quantity: row.quantity,
        description,
        articleCode: row.articleCode || undefined,
      };
    });

    onAdd(itemsToAdd);
    resetState();
    onClose();
  };

  // -----------------------------
  // RENDER
  // -----------------------------
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl my-auto">
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50 rounded-t-2xl sticky top-0">
          <h2 className="font-bold text-lg text-slate-800">
            Carica Stock Invenduto (Macro)
          </h2>
          <button
            onClick={handleClose}
            className="text-slate-400 hover:text-slate-600"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          {/* FILE GESTIONALE */}
          <div className="mb-6 flex justify-between items-center">
            <div className="text-xs text-slate-600">
              Carica file Excel dal gestionale per compilare automaticamente le
              righe stock.
            </div>

            <label className="text-xs px-3 py-1.5 rounded-md border border-slate-300 hover:bg-slate-100 cursor-pointer">
              Carica file gestionale
              <input
                type="file"
                accept=".xlsx,.xls"
                className="hidden"
                onChange={handleGestionaleFileChange}
              />
            </label>
          </div>

          {/* TESTATA: solo BRAND (auto-compilato dal file se presente) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8 bg-indigo-50/50 p-4 rounded-xl border border-indigo-100">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">
                Brand
              </label>
              <input
                type="text"
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
                className="w-full border border-slate-300 rounded-lg px-3 py-2"
                placeholder="Es. Pinko, Nike..."
                required
              />
            </div>
          </div>

          {/* RIGHE STOCK */}
          <div className="space-y-3">
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wide">
                Righe Stock
              </h3>
              <button
                type="button"
                onClick={handleAddRow}
                className="text-xs flex items-center bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1.5 rounded-full"
              >
                <Plus size={14} className="mr-1" /> Aggiungi riga
              </button>
            </div>

            <div className="bg-slate-50 rounded-xl border border-slate-200 overflow-x-auto">
              <table className="w-full min-w-[950px] text-sm">
                <thead className="bg-slate-100 text-slate-500 font-semibold text-xs uppercase">
                  <tr>
                    <th className="px-4 py-3 text-left">Categoria *</th>
                    <th className="px-4 py-3 text-left">Sesso</th>
                    <th className="px-4 py-3 text-left">Cod. articolo</th>
                    <th className="px-4 py-3 text-left">Tipologia</th>
                    <th className="px-4 py-3 text-left">Colore</th>
                    <th className="px-4 py-3 text-left">Taglia</th>
                    <th className="px-4 py-3 text-left w-24">Q.tà *</th>
                    <th className="px-4 py-3 text-center">Da file</th>
                    <th className="px-4 py-3"></th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-200">
                  {rows.map((row, index) => (
                    <tr key={row.id}>
                      {/* Categoria */}
                      <td className="p-2">
                        <select
                          value={row.category}
                          onChange={(e) =>
                            updateRow(row.id, "category", e.target.value)
                          }
                          className="w-full border-slate-300 border rounded px-2 py-1.5"
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

                      {/* Sesso per riga */}
                      <td className="p-2">
                        <select
                          value={row.gender}
                          onChange={(e) =>
                            updateRow(row.id, "gender", e.target.value)
                          }
                          className="w-full border-slate-300 border rounded px-2 py-1.5"
                        >
                          {GENDERS.map((g) => (
                            <option key={g} value={g}>
                              {g}
                            </option>
                          ))}
                        </select>
                      </td>

                      {/* Cod. articolo */}
                      <td className="p-2">
                        <input
                          type="text"
                          value={row.articleCode}
                          onChange={(e) =>
                            updateRow(row.id, "articleCode", e.target.value)
                          }
                          className="w-full border-slate-300 border rounded px-2 py-1.5"
                          placeholder="Es. 12345"
                        />
                      </td>

                      {/* Tipologia */}
                      <td className="p-2">
                        <input
                          type="text"
                          value={row.typology}
                          onChange={(e) =>
                            updateRow(row.id, "typology", e.target.value)
                          }
                          className="w-full border-slate-300 border rounded px-2 py-1.5"
                          placeholder="Es. Pantalone, Gonna..."
                        />
                      </td>

                      {/* Colore */}
                      <td className="p-2">
                        <input
                          type="text"
                          value={row.color}
                          onChange={(e) =>
                            updateRow(row.id, "color", e.target.value)
                          }
                          className="w-full border-slate-300 border rounded px-2 py-1.5"
                          placeholder="Es. Nero"
                        />
                      </td>

                      {/* Taglia */}
                      <td className="p-2">
                        <input
                          type="text"
                          value={row.size}
                          onChange={(e) =>
                            updateRow(row.id, "size", e.target.value)
                          }
                          className="w-full border-slate-300 border rounded px-2 py-1.5"
                          placeholder="Es. M / 40"
                        />
                      </td>

                      {/* Quantità */}
                      <td className="p-2">
                        <input
                          type="number"
                          min="1"
                          value={row.quantity}
                          onChange={(e) =>
                            updateRow(
                              row.id,
                              "quantity",
                              parseInt(e.target.value) || 0
                            )
                          }
                          className="w-full border-slate-300 border rounded px-2 py-1.5 text-center"
                          required
                        />
                      </td>

                      {/* Pulsante "Usa dal file" DOPO la quantità */}
                      <td className="p-2 text-center">
                        {gestionaleRows.length > 0 && (
                          <button
                            type="button"
                            onClick={() => {
                              setActiveRowIndex(index);
                              setIsGestionaleModalOpen(true);
                            }}
                            className="text-[11px] px-2 py-1 border border-slate-300 rounded hover:bg-slate-100 whitespace-nowrap"
                          >
                            Usa dal file
                          </button>
                        )}
                      </td>

                      {/* Elimina riga */}
                      <td className="p-2 text-center">
                        {rows.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveRow(row.id)}
                            className="text-slate-400 hover:text-red-500"
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

            <p className="text-xs text-slate-400 italic px-1 mt-1">
              I campi * sono obbligatori.
            </p>
          </div>

          {/* Pulsante salva */}
          <div className="mt-8 pt-6 border-t border-slate-100 flex justify-end">
            <button
              type="submit"
              className="bg-indigo-600 text-white font-bold py-3 px-8 rounded-xl hover:bg-indigo-700 shadow-lg shadow-indigo-200 flex items-center"
            >
              <Save size={18} className="mr-2" />
              Carica {displayCount}{" "}
              {displayCount === 1 ? "Riga Stock" : "Righe Stock"}
            </button>
          </div>
        </form>
      </div>

      {/* MODAL RIGHE GESTIONALE */}
      <GestionaleImportModal
        isOpen={isGestionaleModalOpen}
        rows={gestionaleRows}
        onClose={() => {
          setIsGestionaleModalOpen(false);
          setActiveRowIndex(null);
        }}
        onRowSelected={handleGestionaleRowSelected}
      />
    </div>
  );
};






