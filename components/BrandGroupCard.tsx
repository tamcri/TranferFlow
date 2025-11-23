import React, { useState } from "react";
import { TransferItem } from "../types";
import {
  Boxes,
  Store as StoreIcon,
  ChevronDown,
  ChevronUp,
  ArrowRightLeft,
  Tag,
  Package,
} from "lucide-react";
import { ItemCard } from "./ItemCard";

export interface BrandGroup {
  brand: string;
  sourceStoreId: string;
  sourceStoreName: string;
  totalQuantity: number;
  availableQuantity: number;
  pendingQuantity: number;
  transferredQuantity: number;
  categories: string[];
  colors: string[];
  sizes: string[];
  items: TransferItem[];
}

interface BrandGroupCardProps {
  group: BrandGroup;
  currentStoreId: string;
  mode: "my-stock" | "network";
  onRequestGroup?: (group: BrandGroup) => void;
}

export const BrandGroupCard: React.FC<BrandGroupCardProps> = ({
  group,
  currentStoreId,
  mode,
  onRequestGroup,
}) => {
  const [open, setOpen] = useState(false);
  const isMine = group.sourceStoreId === currentStoreId;
  const canRequest =
    mode === "network" &&
    !isMine &&
    group.availableQuantity > 0 &&
    !!onRequestGroup;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 flex flex-col justify-between hover:shadow-md transition-all">
      <div>
        {/* HEADER */}
        <div className="flex justify-between items-start mb-4">
          <div className="flex items-center gap-3">
            <div className="bg-indigo-50 text-indigo-600 p-2 rounded-lg">
              <Boxes size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-slate-900">
                  {group.brand}
                </h3>
                {mode === "my-stock" && isMine && (
                  <span className="text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded border border-slate-200">
                    Lotto del tuo negozio
                  </span>
                )}
              </div>
              <div className="flex items-center text-xs text-slate-500 mt-1">
                <StoreIcon size={14} className="mr-1 text-slate-400" />
                Da:{" "}
                <span className="font-medium ml-1">
                  {group.sourceStoreName}
                </span>
              </div>
            </div>
          </div>

          {/* QUANTITÀ */}
          <div className="text-right">
            <div className="text-xs text-slate-400 uppercase font-semibold">
              Totale pezzi
            </div>
            <div className="text-xl font-extrabold text-slate-900">
              {group.totalQuantity}
            </div>
            <div className="flex gap-1 mt-1 justify-end">
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-green-50 text-green-700 font-semibold border border-green-100">
                DISP: {group.availableQuantity}
              </span>
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-yellow-50 text-yellow-700 font-semibold border border-yellow-100">
                IN TRANSITO: {group.pendingQuantity}
              </span>
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-slate-50 text-slate-500 font-semibold border border-slate-200">
                RICEVUTI: {group.transferredQuantity}
              </span>
            </div>
          </div>
        </div>

        {/* METADATI: categorie, colori, taglie */}
        <div className="mb-4 space-y-2">
          <div className="flex flex-wrap gap-2">
            <span className="inline-flex items-center text-xs font-medium text-slate-600 bg-slate-50 px-2 py-1 rounded border border-slate-100">
              <Package size={12} className="mr-1 text-slate-400" />
              {group.categories.slice(0, 3).join(", ")}
              {group.categories.length > 3 && "…"}
            </span>
            <span className="inline-flex items-center text-xs font-medium text-slate-600 bg-slate-50 px-2 py-1 rounded border border-slate-100">
              <Tag size={12} className="mr-1 text-slate-400" />
              Colori: {group.colors.slice(0, 3).join(", ")}
              {group.colors.length > 3 && "…"}
            </span>
            <span className="inline-flex items-center text-xs font-medium text-slate-600 bg-slate-50 px-2 py-1 rounded border border-slate-100">
              Taglie: {group.sizes.slice(0, 4).join(", ")}
              {group.sizes.length > 4 && "…"}
            </span>
          </div>
        </div>
      </div>

      {/* FOOTER: BOTTONI */}
      <div className="mt-2 pt-4 border-t border-slate-100 flex flex-col gap-2">
        {canRequest && (
          <button
            onClick={() => onRequestGroup?.(group)}
            className="w-full py-2 px-4 rounded-lg text-sm font-semibold flex items-center justify-center transition-colors bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm hover:shadow"
          >
            <ArrowRightLeft size={16} className="mr-2" />
            Richiedi tutto il lotto
          </button>
        )}

        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="w-full py-1.5 px-4 rounded-lg text-xs font-semibold flex items-center justify-center text-slate-600 bg-slate-50 hover:bg-slate-100 border border-slate-200 transition-colors"
        >
          {open ? (
            <>
              <ChevronUp size={14} className="mr-1" />
              Nascondi dettaglio ({group.items.length} righe)
            </>
          ) : (
            <>
              <ChevronDown size={14} className="mr-1" />
              Vedi dettaglio lotto
            </>
          )}
        </button>

        {open && (
          <div className="mt-3 space-y-3 max-h-72 overflow-y-auto pr-1">
            {group.items.map((it) => (
              <ItemCard
                key={it.id}
                item={it}
                currentStoreId={currentStoreId}
                readOnly
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
