// src/features/clients/ClientHistory.tsx
import { ReceiptData } from '../../types';

interface Props {
  clientName: string;
  history: ReceiptData[];
  onBack: () => void;
  onLoadDocument: (doc: ReceiptData) => void;
}

export const ClientHistory = ({ clientName, history, onBack, onLoadDocument }: Props) => {
  const clientDocs = history.filter(d =>
    d.clientName.toLowerCase() === clientName.toLowerCase()
  ).sort((a, b) => b.createdAt - a.createdAt);

  const total = clientDocs.reduce((s, d) => s + d.total, 0);
  const typeLabels: Record<string, string> = { INVOICE: 'Factura', RECEIPT: 'Recibo', INVOICE_RECEIPT: 'Factura-Recibo', QUOTE: 'Orçamento' };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-6">
      <div className="max-w-4xl mx-auto">
        <button onClick={onBack} className="text-sm text-blue-600 hover:underline mb-2">&larr; Voltar</button>

        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-6 mb-6">
          <h1 className="text-2xl font-bold dark:text-white mb-1">{clientName}</h1>
          <p className="text-sm text-slate-400">
            {clientDocs.length} documentos · Total: <span className="font-bold text-blue-600">{total.toLocaleString()} MT</span>
          </p>
        </div>

        {clientDocs.length === 0 ? (
          <div className="text-center py-16 text-slate-400">
            <i className="fa-solid fa-file-invoice text-5xl mb-4"></i>
            <p>Nenhum documento encontrado para este cliente.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {clientDocs.map(doc => (
              <div key={doc.id}
                className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-5 flex items-center justify-between hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => onLoadDocument(doc)}>
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400">
                    <i className="fa-solid fa-file-invoice"></i>
                  </div>
                  <div>
                    <p className="font-medium text-sm dark:text-white">{typeLabels[doc.type] || doc.type}</p>
                    <p className="text-xs text-slate-400">Nº {doc.number} · {doc.date}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-sm dark:text-white">{doc.total.toLocaleString()} MT</p>
                  <span className={`text-[10px] font-bold uppercase ${doc.status === 'PAID' ? 'text-green-600' : doc.status === 'OVERDUE' ? 'text-red-600' : 'text-slate-400'}`}>
                    {doc.status || 'Rascunho'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
