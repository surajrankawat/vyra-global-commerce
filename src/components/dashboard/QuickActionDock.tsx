import React from 'react';
import {
  PackagePlus,
  UserPlus,
  FileSpreadsheet,
  FileCheck2,
  FileText,
  ShoppingBag,
  UploadCloud,
} from 'lucide-react';

interface QuickActionDockProps {
  onAddProduct: () => void;
  onAddBuyer: () => void;
  onCreateQuote: () => void;
  onCreateRFQ: () => void;
  onAddLead: () => void;
  onCreateOrder: () => void;
  onUploadDocument: () => void;
}

export const QuickActionDock: React.FC<QuickActionDockProps> = ({
  onAddProduct,
  onAddBuyer,
  onCreateQuote,
  onCreateRFQ,
  onAddLead,
  onCreateOrder,
  onUploadDocument,
}) => {
  const actions = [
    { id: 'dock-product', label: '+ Add Product', icon: PackagePlus, onClick: onAddProduct },
    { id: 'dock-buyer', label: '+ Add Buyer', icon: UserPlus, onClick: onAddBuyer },
    { id: 'dock-quote', label: '+ Create Quote', icon: FileSpreadsheet, onClick: onCreateQuote },
    { id: 'dock-rfq', label: '+ Create RFQ', icon: FileCheck2, onClick: onCreateRFQ },
    { id: 'dock-lead', label: '+ Add Lead', icon: FileText, onClick: onAddLead },
    { id: 'dock-order', label: '+ Create Order', icon: ShoppingBag, onClick: onCreateOrder },
    { id: 'dock-doc', label: '+ Upload Document', icon: UploadCloud, onClick: onUploadDocument },
  ];

  return (
    <div
      id="vyra-quick-action-dock"
      className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-2.5 flex items-center gap-1.5 overflow-x-auto shadow-xs"
    >
      <div className="hidden lg:flex items-center px-2.5 text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider shrink-0 select-none border-r border-slate-200 dark:border-slate-800 mr-1">
        Command Actions
      </div>
      <div className="flex items-center gap-1.5 flex-nowrap">
        {actions.map((act) => {
          const Icon = act.icon;
          return (
            <button
              key={act.id}
              id={act.id}
              type="button"
              onClick={act.onClick}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-50 dark:bg-slate-800/80 hover:bg-slate-900 hover:text-white dark:hover:bg-slate-100 dark:hover:text-slate-900 border border-slate-200/90 dark:border-slate-700/80 rounded transition-all duration-150 whitespace-nowrap shrink-0"
            >
              <Icon className="w-3.5 h-3.5 shrink-0" />
              <span>{act.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
