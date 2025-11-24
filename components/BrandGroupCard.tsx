import React, { useState } from "react";
import { TransferItem } from "../types";
import {
  Boxes,
  Store as StoreIcon,
  ChevronDown,
  ChevronUp,
  ArrowRightLeft,
  Package,
  AlertTriangle,
} from "lucide-react";

export interface BrandGroup {
  lotKey: string;
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

  const isSource = group.sourceStoreId === currentStoreId;
  const isDestination = group.destinationStoreId === currentStoreId;

  const canRequest = mode === "network" && !!onRequestGroup;
  const canConfirm = mode === "my-stock" && isDestination && !!onConfirmGroup;

  const categoriesLabel =
    group.categories.length === 0
      ? "-"
      : group.categories.slice(0, 3).join(", ") +
        (group.categories.length > 3 ? "…" : "");

  const loadedAt = group.items[0]?.dateAdded;

  const handleRequest = () => {
    if (onRequestGroup) onRequestGroup(group);
  };

  const handleConfirm = () => {
    if (onConfirmGroup) onConfirmGroup(group);
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 flex flex-col gap-3">
      {/* HEADER */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0">
          <div className="mt-1">
            <Boxes size={20} className="text-slate-500" />
          </div>

          <div className="min-w-0">
            {/* BRAND + TOTALE PEZZI */}
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-sm font-semibold truncate">
                {group.brand.toUpperCase()}
              </span>
              <span className="text-[10px] px-1.5 py-0.5 rounded-full border border-slate-200 text-slate-500 whitespace-nowrap">
                Pezzi: {group.totalQuantity}
              </span>
            </div>

            {/* DISP / TRANSITO / RICEVUTI */}
            <div className="mt-1 flex flex-wrap gap-1 text-[10px] text-slate-600">
              <span className="px-1.5 py-0.5 rounded-full bg-slate-50 border border-slate-200">
                DISP: {group.availableQuantity}
              </span>
              <span className="px-1.5 py-0.5 rounded-full bg-amber-50 border border-amber-200 text-amber-700">
                TRANSITO: {group.pendingQuantity}
              </span>
              <span className="px-1.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700">
                RICEVUTI: {group.transferredQuantity}
              </span>
            </div>

            {/* DA / A */}
            <div className="flex items-center text-[11px] text-slate-500 mt-1 whitespace-nowrap overflow-hidden">
              <StoreIcon size={13} className="mr-1 text-slate-400 shrink-0" />
              <span className="truncate">
                Da:{" "}
                <span className="font-medium">{group.sourceStoreName}</span>
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

        {/* CONTROLLI HEADER (APRI / CHIUDI) */}
        <div className="flex flex-col items-end gap-1 ml-2">
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="inline-flex items-center text-xs text-slate-500 hover:text-slate-800"
          >
            {open ? (
              <>
                Nascondi dettaglio
                <ChevronUp size={14} className="ml-1" />
              </>
            ) : (
              <>
                Vedi dettaglio lotto
                <ChevronDown size={14} className="ml-1" />
              </>
            )}
          </button>
        </div>
      </div>

      {/* STATO LOTTO / MESSAGGI */}
      <div className="mb-1">
        {mode === "network" && canRequest && (
          <div className="text-[11px] text-green-700 bg-emerald-50 px-2 py-1 rounded flex items-center gap-1">
            <ArrowRightLeft size={11} className="shrink-0" />
            <span className="truncate">
              Lotto disponibile per richiesta trasferimento.
            </span>
          </div>
        )}

        {mode === "my-stock" && isDestination && group.pendingQuantity > 0 && (
          <div className="text-[11px] text-amber-700 bg-amber-50 px-2 py-1 rounded flex items-center gap-1">
            <AlertTriangle size={11} className="shrink-0" />
            <span className="truncate">
              Hai pezzi in arrivo su questo lotto. Conferma quando arrivano.
            </span>
          </div>
        )}
      </div>

      {/* METADATI COMPATTI */}
      <div className="mb-2 text-[11px] text-slate-600 space-y-1">
        <div className="flex items-center whitespace-nowrap overflow-hidden">
          <Package size={12} className="mr-1 text-slate-400 shrink-0" />
          <span className="font-semibold mr-1">Categorie:</span>
          <span className="truncate">{categoriesLabel}</span>
        </div>

        {loadedAt && (
          <div className="flex items-center whitespace-nowrap overflow-hidden">
            <span className="font-semibold mr-1">Caricato:</span>
            <span className="truncate">
              {new Date(loadedAt).toLocaleDateString()}
            </span>
          </div>
        )}
      </div>

      {/* FOOTER: BOTTONI + DETTAGLIO */}
      <div className="mt-2 pt-3 border-t border-slate-100 flex flex-col gap-2">
        {/* BOTTONI AZIONE */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            {canRequest && (
              <button
                type="button"
                onClick={handleRequest}
                className="text-xs px-3 py-1.5 rounded-md bg-slate-900 text-white hover:bg-slate-800 flex items-center gap-1"
              >
                <ArrowRightLeft size={12} />
                Richiedi trasferimento
              </button>
            )}

            {canConfirm && (
              <button
                type="button"
                onClick={handleConfirm}
                className="text-xs px-3 py-1.5 rounded-md border border-emerald-600 text-emerald-700 hover:bg-emerald-50"
              >
                Conferma ricezione
              </button>
            )}
          </div>
        </div>

        {/* DETTAGLIO LOTTO – RIGHE COMPATTE */}
        {open && (
          <div className="mt-2 space-y-1 max-h-72 overflow-y-auto pr-1">
            {group.items.map((it) => {
              const typology = it.typology;


              return (
                <div
                  key={it.id}
                  className="text-[11px] text-slate-700 flex justify-between gap-2 border-t border-slate-100 pt-1"
                >
                  <div className="truncate">
                    {/* Categoria - Cod. Articolo - Tipologia - Colore - Taglia */}
                    <span className="font-semibold">{it.category || "-"}</span>
                    {" - "}
                    {it.articleCode && (
                      <>
                        <span>{it.articleCode}</span>
                        {" - "}
                      </>
                    )}
                    {typology && (
                      <>
                        <span>{typology}</span>
                        {" - "}
                      </>
                    )}
                    <span>{it.color || "-"}</span>
                    {" - "}
                    <span>{it.size || "-"}</span>
                  </div>

                  <div className="flex-shrink-0 text-right">
                    <span className="font-semibold">Qta: {it.quantity}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};




