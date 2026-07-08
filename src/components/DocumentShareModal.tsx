import React, { useState } from 'react';
import { ReceiptData, CompanySettings } from '../types';
import { DocumentShareModalView } from './DocumentShareModalView';

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
}

type ShareMethod = 'email' | 'whatsapp' | 'download' | 'print' | null;

export const DocumentShareModal: React.FC<DocumentShareModalProps> = ({
  formData, companySettings, userId, isGeneratingPdf, isPrinting,
  onGeneratePDF, onPrintThermal, onClose, t, fMoney,
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
