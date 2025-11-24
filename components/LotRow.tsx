// components/LotRow.tsx
import React from "react";
import { TransferItem } from "../types";

interface LotRowProps {
  items: TransferItem[];
  onOpen?: () => void; // apre il dettaglio
}

const LotRow: React.FC<LotRowProps> = ({ items, onOpen }) => {
  if (!items || items.length === 0) return null;

  const first = items[0];

  const totalQuantity = items.reduce(
    (sum, item) => sum + (item.quantity || 0),
    0
  );

  return (
    <div className="flex items-center justify-between px-4 py-3 text-sm hover:bg-gray-50">
      {/* INFO LOTTO */}
      <div className="flex flex-col gap-1 min-w-0">
        {/* Riga 1: BRAND · STORE */}
        <div className="flex items-center gap-2 min-w-0">
          <span className="font-semibold truncate">
            {first.brand?.toUpperCase() || "-"}
          </span>

          {first.sourceStoreName && (
            <span className="text-xs text-gray-400 truncate">
              · {first.sourceStoreName}
            </span>
          )}
        </div>

        {/* Riga 2: COD, pezzi, varianti, data */}
        <div className="text-xs text-gray-500 flex flex-wrap gap-x-3 gap-y-1">
          {first.articleCode && (
            <span className="truncate">
              <span className="font-medium">COD:</span> {first.articleCode}
            </span>
          )}
          <span>
            <span className="font-medium">Pezzi:</span> {totalQuantity}
          </span>
          <span>
            <span className="font-medium">Varianti:</span> {items.length}
          </span>
          {first.dateAdded && (
            <span className="truncate">
              <span className="font-medium">Data:</span>{" "}
              {new Date(first.dateAdded).toLocaleDateString()}
            </span>
          )}
        </div>
      </div>

      {/* ACTION */}
      <div className="flex items-center gap-2 flex-shrink-0 ml-4">
        <button
          onClick={onOpen}
          className="text-xs px-2 py-1 rounded-md border border-gray-300 hover:bg-gray-100 whitespace-nowrap"
        >
          Vedi dettaglio
        </button>
      </div>
    </div>
  );
};

export default LotRow;
