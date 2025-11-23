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
  AlertTriangle,
} from "lucide-react";
import { ItemCard } from "./ItemCard";

export interface BrandGroup {
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
  items: TransferItem[];
}

interface BrandGroupCardProps {
  group: BrandGroup;
  currentStoreId: string;
  mode: "my-stock" | "network";
  onRequestGroup?: (group: BrandGroup) => void;
  onConfirmGroup?: (group: BrandGroup) => void;
}

export const BrandGroupCard: React.FC<BrandGroupCardProps> = ({
  group,
  currentStoreId,
  mode,
  onRequestGroup,
  onConfirmGroup,
}) => {
  const [open, setOpen] = useState(false);

  const isMineAsSource = group.sourceStoreId === currentStoreId;
  const isDestination = group.destinationStoreId === currentStoreId;
  const isRequested = !!group.destinationStoreId;
  const isRequestedByMe = isDestination;
  const isRequestedByOther = isRequested && !isDestination;

  const canRequest =
    mode === "network" &&
    !isMineAsSource &&
    group.availableQuantity > 0 &&
    !isRequested &&
    !!onRequestGroup;

  const canConfirm =
    mode === "my-stock" &&
    isDestination &&
    group.pendingQuantity > 0 &&
    !!onConfirmGroup;

  // stringhe compatte per una sola riga
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

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 flex flex-col justify-between hover:shadow-md transition-all">
      <div>
        {/* HEADER COMPATTO */}
        <div className="flex justify-between items-start mb-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="bg-indigo-50 text-indigo-600 p-2 rounded-lg shrink-0">
              <Boxes size={20} />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <h3 className="text-base font-bold text-slate-900 truncate max-w-[160px]">
                  {group.brand}
                </h3>
                {mode === "my-stock" && isMineAsSource && (
                  <span className="text-[9px] font-bold uppercase tracking-wider bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded border border-slate-200 whitespace-nowrap">
                    Lotto del tuo negozio
                  </span>
                )}
                {mode === "my-stock" && isDestination && (
                  <span className="text-[9px] font-bold uppercase tracking-wider bg-green-50 text-green-700 px-1.5 py-0.5 rounded border border-green-200 whitespace-nowrap">
                    Lotto in arrivo
                  </span>
                )}
              </div>

              {/* riga unica Da / Dest */}
              <div className="flex items-center text-[11px] text-slate-500 whitespace-nowrap overflow-hidden">
                <StoreIcon size={13} className="mr-1 text-slate-400 shrink-0" />
                <span className="truncate">
                  Da: <span className="font-medium">{group.sourceStoreName}</span>
                  {group.destinationStoreName && (
                    <>
                      {"  ·  A: "}
                      <span className="font-medium">
                        {group.destinationStoreName}
                      </span>
                    </>
                  )}
                </span>
              </div>
            </div>
          </div>

          {/* NUMERI PEZZI */}
          <div className="text-right ml-2 shrink-0">
            <div className="text-[10px] text-slate-400 uppercase font-semibold">
              Totale pezzi
            </div>
            <div className="text-xl font-extrabold text-slate-900 leading-tight">
              {group.totalQuantity}
            </div>
            <div className="flex gap-1 mt-1 justify-end">
              <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-green-50 text-green-700 font-semibold border border-green-100 whitespace-nowrap">
                DISP: {group.availableQuantity}
              </span>
              <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-yellow-50 text-yellow-700 font-semibold border border-yellow-100 whitespace-nowrap">
                TRANSITO: {group.pendingQuantity}
              </span>
              <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-slate-50 text-slate-500 font-semibold border border-slate-200 whitespace-nowrap">
                RICEVUTI: {group.transferredQuantity}
              </span>
            </div>
          </div>
        </div>

        {/* STATO LOTTO – UNA RIGA, COMPATTA */}
        <div className="mb-3">
          {mode === "network" && canRequest && (
            <div className="text-[11px] text-green-700 bg-green-50 border border-green-100 rounded-lg px-2 py-1 flex items-center whitespace-nowrap overflow-hidden">
              <ArrowRightLeft size={11} className="mr-1 shrink-0" />
              <span className="truncate">
                Lotto disponibile per richiesta.
              </span>
            </div>
          )}

          {mode === "network" && isRequestedByOther && (
            <div className="text-[11px] text-amber-700 bg-amber-50 border border-amber-100 rounded-lg px-2 py-1 flex items-center whitespace-nowrap overflow-hidden">
              <AlertTriangle size={11} className="mr-1 shrink-0" />
              <span className="truncate">
                Lotto richiesto da{" "}
                <span className="font-semibold">
                  {group.destinationStoreName}
                </span>
                . Non disponibile.
              </span>
            </div>
          )}

          {mode === "network" && isRequestedByMe && (
            <div className="text-[11px] text-indigo-700 bg-indigo-50 border border-indigo-100 rounded-lg px-2 py-1 flex items-center whitespace-nowrap overflow-hidden">
              <ArrowRightLeft size={11} className="mr-1 shrink-0" />
              <span className="truncate">
                Lotto richiesto da te. In attesa di spedizione.
              </span>
            </div>
          )}

          {mode === "my-stock" && isMineAsSource && group.pendingQuantity > 0 && (
            <div className="text-[11px] text-amber-700 bg-amber-50 border border-amber-100 rounded-lg px-2 py-1 flex items-center whitespace-nowrap overflow-hidden">
              <AlertTriangle size={11} className="mr-1 shrink-0" />
              <span className="truncate">
                Lotto richiesto da{" "}
                <span className="font-semibold">
                  {group.destinationStoreName ?? "altro negozio"}
                </span>
                .
              </span>
            </div>
          )}

          {mode === "my-stock" && isDestination && group.pendingQuantity > 0 && (
            <div className="text-[11px] text-indigo-700 bg-indigo-50 border border-indigo-100 rounded-lg px-2 py-1 flex items-center whitespace-nowrap overflow-hidden">
              <ArrowRightLeft size={11} className="mr-1 shrink-0" />
              <span className="truncate">
                Lotto in arrivo da{" "}
                <span className="font-semibold">{group.sourceStoreName}</span>.
              </span>
            </div>
          )}
        </div>

        {/* METADATI IN TRE RIGHETTE ORDINATE */}
        <div className="mb-3 text-[11px] text-slate-600 space-y-1">
          <div className="flex items-center whitespace-nowrap overflow-hidden">
            <Package size={12} className="mr-1 text-slate-400 shrink-0" />
            <span className="font-semibold mr-1">Articoli:</span>
            <span className="truncate">{categoriesLabel}</span>
          </div>
          <div className="flex items-center whitespace-nowrap overflow-hidden">
            <Tag size={12} className="mr-1 text-slate-400 shrink-0" />
            <span className="font-semibold mr-1">Colori:</span>
            <span className="truncate">{colorsLabel}</span>
          </div>
          <div className="flex items-center whitespace-nowrap overflow-hidden">
            <span className="w-[12px] h-[12px] rounded-full border border-slate-300 mr-1 shrink-0" />
            <span className="font-semibold mr-1">Taglie:</span>
            <span className="truncate">{sizesLabel}</span>
          </div>
        </div>
      </div>

      {/* FOOTER: BOTTONI + DETTAGLIO */}
      <div className="mt-2 pt-3 border-t border-slate-100 flex flex-col gap-2">
        {canRequest && (
          <button
            onClick={() => onRequestGroup?.(group)}
            className="w-full py-2 px-4 rounded-lg text-sm font-semibold flex items-center justify-center transition-colors bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm hover:shadow whitespace-nowrap"
          >
            <ArrowRightLeft size={16} className="mr-2" />
            Richiedi tutto il lotto
          </button>
        )}

        {canConfirm && (
          <button
            onClick={() => onConfirmGroup?.(group)}
            className="w-full py-2 px-4 rounded-lg text-sm font-semibold flex items-center justify-center transition-colors bg-green-600 text-white hover:bg-green-700 shadow-sm hover:shadow whitespace-nowrap"
          >
            <ArrowRightLeft size={16} className="mr-2" />
            Conferma ricezione lotto
          </button>
        )}

        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="w-full py-1.5 px-4 rounded-lg text-xs font-semibold flex items-center justify-center text-slate-600 bg-slate-50 hover:bg-slate-100 border border-slate-200 transition-colors whitespace-nowrap"
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
          <div className="mt-2 space-y-3 max-h-72 overflow-y-auto pr-1">
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


