// src/components/DocumentShareModal.tsx
import { useState } from 'react';
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
  onGetPdfBlob?: () => Promise<{ blob: Blob; fileName: string } | null>;
}

type ShareMethod = 'email' | 'whatsapp' | 'download' | 'print' | null;

async function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      resolve(result.split(',')[1] ?? result);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

async function uploadPdf(pdfData: { blob: Blob; fileName: string }): Promise<string | null> {
  try {
    const base64 = await blobToBase64(pdfData.blob);
    const res = await fetch('/api/upload-pdf', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pdfBase64: base64, nomeArquivo: pdfData.fileName }),
    });
    const data = await res.json();
    return data.sucesso ? data.url : null;
  } catch {
    return null;
  }
}

export const DocumentShareModal: React.FC<DocumentShareModalProps> = ({
  formData, companySettings, userId, isGeneratingPdf, isPrinting,
  onGeneratePDF, onPrintThermal, onClose, t, fMoney, onGetPdfBlob,
}) => {
  const [selectedMethod, setSelectedMethod] = useState<ShareMethod>(null);
  const [recipientEmail, setRecipientEmail] = useState(formData.clientContact || '');
  const [recipientName, setRecipientName] = useState(formData.clientName || '');
  const [recipientPhone, setRecipientPhone] = useState(formData.clientWhatsApp || formData.clientContact || '');
  const [isSending, setIsSending] = useState(false);
  const [sendResult, setSendResult] = useState<{ success: boolean; message: string } | null>(null);

  const handleSendEmail = async (destinatario: string, pdfData: { blob: Blob; fileName: string } | null) => {
    if (!userId || userId === 'local') {
      // Sem userId, abrir mailto: como fallback
      const subject = `Documento ${formData.number}`;
      const body = `Olá ${recipientName},\n\nSegue o documento ${formData.number}.\n\nCumprimentos,\n${companySettings.name}`;
      window.open(`mailto:${destinatario}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`, '_blank');
      setSendResult({ success: true, message: `Email aberto para ${recipientName}!` });
      return;
    }

    try {
      const base64 = pdfData ? await blobToBase64(pdfData.blob) : '';
      const res = await fetch('/api/enviar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          destinatario,
          assunto: `Documento ${formData.number} - ${formData.type}`,
          corpoHtml: `
            <div style="font-family:sans-serif;max-width:600px;margin:0 auto">
              <div style="background:#2563eb;padding:20px;text-align:center;border-radius:12px 12px 0 0">
                <img src="https://biz-flow.cloud/logo.svg" height="40" alt="Biz-flow" />
              </div>
              <div style="padding:30px;background:#fff;border:1px solid #e2e8f0">
                <h2 style="color:#0f172a">${formData.type === 'INVOICE' ? 'Factura' : formData.type === 'RECEIPT' ? 'Recibo' : formData.type === 'INVOICE_RECEIPT' ? 'Factura-Recibo' : 'Orçamento'} #${formData.number}</h2>
                <p style="color:#64748b">Olá <strong>${recipientName}</strong>,</p>
                <p style="color:#64748b">Segue em anexo o documento <strong>${formData.number}</strong>.</p>
                <hr style="border:none;border-top:1px solid #e2e8f0;margin:20px 0" />
                <table style="width:100%;font-size:14px;color:#475569">
                  <tr><td style="padding:4px 0">Cliente</td><td style="font-weight:bold;text-align:right">${recipientName}</td></tr>
                  <tr><td style="padding:4px 0">Data</td><td style="font-weight:bold;text-align:right">${formData.date}</td></tr>
                  <tr><td style="padding:4px 0">Valor Total</td><td style="font-weight:bold;text-align:right;color:#2563eb;font-size:18px">${formData.total.toLocaleString()} ${formData.currency}</td></tr>
                </table>
                <hr style="border:none;border-top:1px solid #e2e8f0;margin:20px 0" />
                <p style="color:#94a3b8;font-size:12px">Documento gerado pelo Biz-flow</p>
              </div>
            </div>
          `,
          pdfBase64: base64,
          pdfNome: pdfData?.fileName || `${formData.number}.pdf`,
        }),
      });
      const data = await res.json();
      if (data.sucesso) {
        setSendResult({ success: true, message: `Email enviado com PDF para ${recipientName}!` });
      } else {
        throw new Error(data.erro || 'Erro ao enviar');
      }
    } catch (erro) {
      // Fallback: mailto:
      const subject = `Documento ${formData.number}`;
      window.open(`mailto:${destinatario}?subject=${encodeURIComponent(subject)}`, '_blank');
      setSendResult({ success: true, message: `Email aberto para ${recipientName} (modo offline).` });
    }
  };

  const handleSendWhatsApp = async (telefone: string, pdfData: { blob: Blob; fileName: string } | null) => {
    // Tentar upload do PDF para obter link
    let pdfUrl = '';
    if (pdfData) {
      pdfUrl = await uploadPdf(pdfData) || '';
    }

    const cleanPhone = telefone.replace(/\D/g, '');
    const texto = pdfUrl
      ? `Olá ${recipientName}! 👋\n\nSegue o documento *${formData.number}* do Biz-flow.\n\n📄 PDF: ${pdfUrl}\n\nQualquer dúvida, estamos à disposição.`
      : `Olá ${recipientName}, segue o documento ${formData.number} no valor de ${formData.total} ${formData.currency}. Acesse: https://biz-flow.cloud`;

    window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(texto)}`, '_blank');
    setSendResult({ success: true, message: `WhatsApp aberto para ${recipientName}!${pdfUrl ? ' PDF disponivel no link.' : ''}` });
  };

  const gerarPdfFallback = async (): Promise<{ blob: Blob; fileName: string } | null> => {
    try {
      const { jsPDF } = await import('jspdf');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const doc = formData;
      const tipo = { INVOICE: 'FACTURA', RECEIPT: 'RECIBO', INVOICE_RECEIPT: 'FACTURA-RECIBO', QUOTE: 'ORÇAMENTO' }[doc.type] || doc.type;
      let y = 20;
      pdf.setFontSize(18);
      pdf.text(doc.companyName || 'Biz-flow', 105, y, { align: 'center' }); y += 10;
      pdf.setFontSize(14);
      pdf.text(tipo + ' #' + doc.number, 105, y, { align: 'center' }); y += 8;
      pdf.setFontSize(10);
      pdf.text('Data: ' + doc.date, 20, y); y += 8;
      if (doc.clientName) { pdf.text('Cliente: ' + doc.clientName, 20, y); y += 6; }
      y += 4;
      pdf.setFontSize(8);
      doc.items.forEach(item => {
        const line = `${item.description}  |  ${item.quantity}x  |  ${fMoney(item.unitPrice)}  |  ${fMoney(item.total)}`;
        if (y > 275) { pdf.addPage(); y = 20; }
        pdf.text(line, 20, y); y += 6;
      });
      y += 4; pdf.setFontSize(12);
      pdf.text('Subtotal: ' + fMoney(doc.subtotal), 190, y, { align: 'right' }); y += 7;
      if (doc.taxRate > 0) { pdf.text('IVA (' + doc.taxRate + '%): ' + fMoney(doc.taxAmount), 190, y, { align: 'right' }); y += 7; }
      if (doc.discount > 0) { pdf.text('Desconto: -' + fMoney(doc.discount), 190, y, { align: 'right' }); y += 7; }
      pdf.setFontSize(16);
      pdf.setTextColor(37, 99, 235);
      pdf.text('Total: ' + fMoney(doc.total), 190, y + 4, { align: 'right' });
      const blob = pdf.output('blob');
      const fileName = (doc.number || 'documento').replace(/[^a-zA-Z0-9]/g, '_') + '.pdf';
      return { blob, fileName };
    } catch { return null; }
  };

  const handleSend = async (method: 'email' | 'whatsapp') => {
    const recipient = method === 'email' ? recipientEmail : recipientPhone;
    if (!recipient || !recipientName) return;
    setIsSending(true);
    setSendResult(null);

    // 1. GERAR PDF — tentar html2canvas, se falhar usar jsPDF direto
    let pdfData: { blob: Blob; fileName: string } | null = null;
    if (onGetPdfBlob) {
      pdfData = await onGetPdfBlob();
    }
    if (!pdfData) {
      pdfData = await gerarPdfFallback();
    }
    if (!pdfData) {
      setSendResult({ success: false, message: 'Erro ao gerar PDF. Tente novamente.' });
      setIsSending(false);
      return;
    }

    try {
      if (method === 'email') {
        await handleSendEmail(recipient, pdfData);
      } else {
        await handleSendWhatsApp(recipient, pdfData);
      }
    } catch (err: unknown) {
      // Fallback: download do PDF para envio manual
      const url = URL.createObjectURL(pdfData.blob);
      const a = document.createElement('a');
      a.href = url; a.download = pdfData.fileName;
      document.body.appendChild(a); a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setSendResult({
        success: true,
        message: `PDF descarregado (${pdfData.fileName}). Envie manualmente.`,
      });
    } finally {
      setIsSending(false);
    }
  };

  const handleDownload = async () => {
    if (onGetPdfBlob) {
      const pdfData = await onGetPdfBlob();
      if (pdfData) {
        const url = URL.createObjectURL(pdfData.blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = pdfData.fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        setSendResult({ success: true, message: `PDF "${pdfData.fileName}" descarregado!` });
        return;
      }
    }
    await onGeneratePDF();
    onClose();
  };

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
