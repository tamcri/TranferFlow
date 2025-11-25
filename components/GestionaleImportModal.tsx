import React from "react";

export interface GestionaleRow {
  brand: string;
  gender: string;
  category: string;
  typology: string;
  articleCode: string;
  color: string;
  size: string;
  quantity: number;
}

interface GestionaleImportModalProps {
  isOpen: boolean;
  rows: GestionaleRow[];
  onClose: () => void;
  onRowSelected: (row: GestionaleRow) => void;
}

const GestionaleImportModal: React.FC<GestionaleImportModalProps> = ({
  isOpen,
  rows,
  onClose,
  onRowSelected,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/30">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-5xl max-h-[80vh] flex flex-col">
        <div className="px-4 py-3 border-b border-slate-200 flex items-center justify-between">
          <h2 className="text-sm font-semibold">Seleziona una riga dal gestionale</h2>
          <button
            onClick={onClose}
            className="text-xs text-slate-500 hover:text-slate-800"
          >
            Chiudi
          </button>
        </div>

        <div className="px-4 py-2 text-xs text-slate-600">
          Hai caricato {rows.length} righe. Clicca su <strong>“Usa questa riga”</strong> per compilare i campi del dettaglio.
        </div>

        <div className="flex-1 overflow-auto">
          <table className="min-w-full text-[11px]">
            <thead className="bg-slate-50 border-b border-slate-200 sticky top-0 z-10">
              <tr>
                <th className="px-2 py-1 text-left">Brand</th>
                <th className="px-2 py-1 text-left">Categoria</th>
                <th className="px-2 py-1 text-left">Sesso</th>
                <th className="px-2 py-1 text-left">Cod. Articolo</th>
                <th className="px-2 py-1 text-left">Tipologia</th>
                <th className="px-2 py-1 text-left">Colore</th>
                <th className="px-2 py-1 text-left">Taglia</th>
                <th className="px-2 py-1 text-left">Qta</th>
                <th className="px-2 py-1 text-right">Azione</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, index) => (
                <tr key={index} className="border-b border-slate-100">
                  <td className="px-2 py-1">{row.brand}</td>
                  <td className="px-2 py-1">{row.category}</td>
                  <td className="px-2 py-1">{row.gender}</td>
                  <td className="px-2 py-1">{row.articleCode}</td>
                  <td className="px-2 py-1">{row.typology}</td>
                  <td className="px-2 py-1">{row.color}</td>
                  <td className="px-2 py-1">{row.size}</td>
                  <td className="px-2 py-1">{row.quantity}</td>
                  <td className="px-2 py-1 text-right">
                    <button
                      onClick={() => onRowSelected(row)}
                      className="text-[11px] px-2 py-1 rounded-md border border-slate-300 hover:bg-slate-50"
                    >
                      Usa questa riga
                    </button>
                  </td>
                </tr>
              ))}

              {rows.length === 0 && (
                <tr>
                  <td
                    colSpan={9}
                    className="px-2 py-4 text-center text-slate-400"
                  >
                    Nessuna riga disponibile. Carica un file dal gestionale per
                    iniziare.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="px-4 py-3 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="text-xs px-3 py-1.5 rounded-md border border-slate-300 hover:bg-slate-50"
          >
            Chiudi
          </button>
        </div>
      </div>
    </div>
  );
};

export default GestionaleImportModal;
