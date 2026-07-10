import React, { useState } from 'react';
import { ReceiptData, CompanySettings } from '../types';
import { DocumentShareModalView } from './DocumentShareModalView';

// URL do servico WhatsApp — configurar conforme o ambiente
const WHATSAPP_SERVICE_URL = import.meta.env.VITE_WHATSAPP_SERVICE_URL || 'http://localhost:3001';

interface DocumentShareModalProps {
  formData: ReceiptData;
  companySettings: CompanySettings;
  userId?: string;
  isGeneratingPdf: boolean;
  isPrinting: boolean;
  onGeneratePDF: () => Promise<void>;
  onPrintThermal: () => Promise<void>;
  onClose: () => void;
  t: (key: string) => string;
  fMoney: (val: number) => string;
  onGetPdfBlob?: () => Promise<{ blob: Blob; fileName: string } | null>;
}

type ShareMethod = 'email' | 'whatsapp' | 'download' | 'print' | null;

export const DocumentShareModal: React.FC<DocumentShareModalProps> = ({
  formData, companySettings, userId, isGeneratingPdf, isPrinting,
  onGeneratePDF, onPrintThermal, onClose, t, fMoney, onGetPdfBlob,
}) => {
  const [selectedMethod, setSelectedMethod] = useState<ShareMethod>(null);
  const [recipientEmail, setRecipientEmail] = useState(formData.clientContact || '');
  const [recipientName, setRecipientName] = useState(formData.clientName || '');
  const [recipientPhone, setRecipientPhone] = useState(formData.clientContact || '');
  const [isSending, setIsSending] = useState(false);
  const [sendResult, setSendResult] = useState<{ success: boolean; message: string } | null>(null);

  const handleSend = async (method: 'email' | 'whatsapp') => {
    const recipient = method === 'email' ? recipientEmail : recipientPhone;
    if (!recipient || !recipientName) return;
    setIsSending(true);
    setSendResult(null);

    try {
      if (method === 'whatsapp') {
        // Tentar enviar via servico WhatsApp (Baileys)
        if (onGetPdfBlob) {
          try {
            const pdfData = await onGetPdfBlob();
            if (pdfData) {
              const reader = new FileReader();
              const base64 = await new Promise<string>((resolve, reject) => {
                reader.onload = () => {
                  const result = reader.result as string;
                  resolve(result.split(',')[1] ?? result);
                };
                reader.onerror = reject;
                reader.readAsDataURL(pdfData.blob);
              });

              const resposta = await fetch(`${WHATSAPP_SERVICE_URL}/enviar`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  numero: recipient.replace(/\D/g, ''),
                  pdfBase64: base64,
                  nomeArquivo: pdfData.fileName,
                }),
              });

              const data = await resposta.json();
              if (data.sucesso) {
                setSendResult({ success: true, message: `PDF enviado via WhatsApp para ${recipientName}!` });
                setIsSending(false);
                return;
              }
              throw new Error(data.erro || 'Erro no servico WhatsApp');
            }
          } catch (erro) {
            // Fallback: abrir wa.me se o servico nao estiver disponivel
            console.warn('WhatsApp service unavailable, falling back to wa.me:', erro);
          }
        }
        // Fallback: wa.me
        const cleanPhone = recipient.replace(/\D/g, '');
        const text = `Olá ${recipientName}, segue o documento ${formData.number} no valor de ${formData.total} ${formData.currency}.`;
        window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}`, '_blank');
        setSendResult({ success: true, message: `WhatsApp aberto para ${recipient}!` });
      } else {
        const subject = `Documento ${formData.number}`;
        const body = `Olá ${recipientName},\n\nSegue o documento ${formData.number} no valor de ${formData.total} ${formData.currency}.\n\nCumprimentos,\n${companySettings.name}`;
        window.open(`mailto:${recipient}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`, '_blank');
        setSendResult({ success: true, message: `Email aberto para ${recipient}!` });
      }
    } catch (err: unknown) {
      setSendResult({ success: false, message: err instanceof Error ? err.message : 'Erro ao enviar. Tente novamente.' });
    } finally {
      setIsSending(false);
    }
  };

  const handleDownload = async () => { await onGeneratePDF(); onClose(); };
  const handlePrint = async () => { await onPrintThermal(); onClose(); };

  const viewProps = {
    formData, companySettings, userId, isGeneratingPdf, isPrinting,
    onGeneratePDF, onPrintThermal, onClose, t, fMoney,
    selectedMethod, setSelectedMethod,
    recipientEmail, setRecipientEmail,
    recipientName, setRecipientName,
    recipientPhone, setRecipientPhone,
    isSending, sendResult,
    handleSend, handleDownload, handlePrint,
  };

  return <DocumentShareModalView {...viewProps} />;
};

export default DocumentShareModal;
