import React from 'react';
import { TransferItem, ItemStatus } from '../types';
import {
  ShoppingBag,
  ArrowRightLeft,
  Clock,
  MapPin,
  CheckCircle,
  Truck,
  Trash2,
  Tag
} from 'lucide-react';

interface ItemCardProps {
  item: TransferItem;
  currentStoreId: string;
  onRequestTransfer?: (id: string) => void;
  onConfirmReceipt?: (id: string) => void;
  onWithdrawItem?: (id: string) => void;

  // nuovo: modalità "solo visualizzazione"
  readOnly?: boolean;
}

export const ItemCard: React.FC<ItemCardProps> = ({
  item,
  currentStoreId,
  onRequestTransfer,
  onConfirmReceipt,
  onWithdrawItem,
  readOnly = false
}) => {
  const isMySourceItem = item.sourceStoreId === currentStoreId;
  const isMyDestinationItem = item.destinationStoreId === currentStoreId;

  const isAvailable = item.status === ItemStatus.AVAILABLE;
  const isPending = item.status === ItemStatus.PENDING;
  const isTransferred = item.status === ItemStatus.TRANSFERRED;

  const getStatusBadge = () => {
    switch (item.status) {
      case ItemStatus.AVAILABLE:
        return (
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-green-100 text-green-700">
            DISPONIBILE
          </span>
        );
      case ItemStatus.PENDING:
        return (
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-yellow-100 text-yellow-700 flex items-center">
            <Truck size={12} className="mr-1" /> IN TRANSITO
          </span>
        );
      case ItemStatus.TRANSFERRED:
        return (
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-600">
            RICEVUTO
          </span>
        );
    }
  };

  return (
    <div
      className={`bg-white rounded-xl shadow-sm border border-slate-200 p-5 transition-all hover:shadow-md flex flex-col justify-between ${
        isTransferred ? 'opacity-60 grayscale-[0.5]' : ''
      }`}
    >
      <div>
        <div className="flex justify-between items-start mb-3">
          <div className="flex items-center space-x-2">
            <div className="bg-indigo-50 p-2 rounded-lg text-indigo-600">
              <ShoppingBag size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-slate-800 text-lg">{item.brand}</h3>
                <span className="text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded border border-slate-200">
                  {item.gender}
                </span>
              </div>
              <p className="text-sm text-slate-500 font-medium">{item.category}</p>
              {item.articleCode && (
              <p className="text-xs text-slate-500 mt-1">
              Cod. articolo: <span className="font-semibold">{item.articleCode}</span>
             </p>
              )}

            </div>
          </div>
          {getStatusBadge()}
        </div>

        <div className="mb-4">
          <div className="flex flex-wrap gap-2 mb-3">
            <span className="inline-flex items-center text-xs font-medium text-slate-600 bg-slate-50 px-2 py-1 rounded border border-slate-100">
              <Tag size={10} className="mr-1 text-slate-400" /> {item.color}
            </span>
            <span className="inline-flex items-center text-xs font-medium text-slate-600 bg-slate-50 px-2 py-1 rounded border border-slate-100">
              Tg: {item.size}
            </span>
            <span className="inline-flex items-center text-xs font-medium text-slate-600 bg-slate-50 px-2 py-1 rounded border border-slate-100">
              Qtà: {item.quantity}
            </span>
          </div>

          <div className="space-y-1">
            <div className="flex items-center text-xs text-slate-500">
              <MapPin size={14} className="mr-1.5 text-slate-400" />
              Da: <span className="font-medium ml-1">{item.sourceStoreName}</span>
            </div>

            {item.destinationStoreName && (
              <div className="flex items-center text-xs text-slate-500">
                <ArrowRightLeft size={14} className="mr-1.5 text-indigo-400" />
                A: <span className="font-medium ml-1">{item.destinationStoreName}</span>
              </div>
            )}

            <div className="flex items-center text-xs text-slate-500 pt-1">
              <Clock size={14} className="mr-1.5 text-slate-400" />
              Caricato il: {new Date(item.dateAdded).toLocaleDateString('it-IT')}
            </div>
          </div>
        </div>
      </div>

      {/* --- BOTTONI AZIONE (DISATTIVATI SE readOnly=true) --- */}
      {!readOnly && (
        <div className="mt-2 pt-4 border-t border-slate-100">
          {isMySourceItem && (
            <div className="space-y-2">
              <div className="w-full py-2 px-4 bg-slate-50 text-slate-500 rounded-lg text-sm font-medium border border-slate-100 text-center">
                {isPending
                  ? `Richiesto da ${item.destinationStoreName}`
                  : isTransferred
                  ? 'Trasferimento Completato'
                  : 'Il tuo articolo'}
              </div>
              {isAvailable && (
                <button
                  onClick={() => onWithdrawItem?.(item.id)}
                  className="w-full py-1.5 px-4 text-red-500 hover:text-red-700 text-xs font-semibold flex items-center justify-center transition-colors hover:bg-red-50 rounded"
                >
                  <Trash2 size={12} className="mr-1" />
                  Ritira / Cancella
                </button>
              )}
            </div>
          )}

          {isMyDestinationItem && isPending && (
            <button
              onClick={() => onConfirmReceipt?.(item.id)}
              className="w-full py-2 px-4 rounded-lg text-sm font-semibold flex items-center justify-center transition-colors bg-green-600 text-white hover:bg-green-700 shadow-sm hover:shadow"
            >
              <CheckCircle size={16} className="mr-2" />
              Conferma Ricezione
            </button>
          )}

          {isMyDestinationItem && isTransferred && (
            <div className="w-full py-2 px-4 bg-slate-50 text-green-600 rounded-lg text-sm font-medium border border-slate-100 text-center flex items-center justify-center">
              <CheckCircle size={14} className="mr-2" />
              Merce Ricevuta
            </div>
          )}

          {!isMySourceItem && !isMyDestinationItem && (
            <button
              onClick={() => onRequestTransfer?.(item.id)}
              disabled={!isAvailable}
              className={`w-full py-2 px-4 rounded-lg text-sm font-semibold flex items-center justify-center transition-colors ${
                isAvailable
                  ? 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm hover:shadow'
                  : 'bg-slate-200 text-slate-400 cursor-not-allowed'
              }`}
            >
              <ArrowRightLeft size={16} className="mr-2" />
              {isAvailable ? 'Richiedi Merce' : 'Non Disponibile'}
            </button>
          )}
        </div>
      )}
    </div>
  );
};
