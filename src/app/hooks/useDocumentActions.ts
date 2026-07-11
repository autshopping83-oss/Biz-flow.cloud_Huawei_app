import { useCallback, useState } from 'react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { validators } from '../../utils/validators';
import { ReceiptData } from '../../types';

interface UseDocumentActionsParams {
  formData: ReceiptData;
  receiptRef: React.RefObject<HTMLDivElement | null>;
  ghostReceiptRef: React.RefObject<HTMLDivElement | null>;
  thermalReceiptRef: React.RefObject<HTMLDivElement | null>;
  notify: (message: string, type: 'success' | 'error' | 'info') => void;
  handleSave: (silent?: boolean) => Promise<void>;
}

// Detecta ambiente Capacitor nativo
const isCapacitor = !!(window as any).Capacitor?.isNativePlatform?.();

export const useDocumentActions = ({
  formData,
  receiptRef,
  ghostReceiptRef,
  thermalReceiptRef,
  notify,
  handleSave,
}: UseDocumentActionsParams) => {
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);

  // Helper: salvar Blob via Capacitor Filesystem
  const saveBlobNative = async (blob: Blob, fileName: string, directory: 'Documents' | 'Cache' = 'Documents'): Promise<string | null> => {
    try {
      const { Filesystem, Directory } = await import('@capacitor/filesystem');
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve((reader.result as string).split(',')[1] ?? '');
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
      const dir = directory === 'Documents' ? Directory.Documents : Directory.Cache;
      const path = `${directory === 'Documents' ? 'Documents' : 'temp'}/${fileName}`;
      await Filesystem.writeFile({ path, data: base64, directory: dir });
      const uri = await Filesystem.getUri({ path, directory: dir });
      return uri.uri;
    } catch { return null; }
  };

  const generatePDFBlob = useCallback(async (): Promise<{ blob: Blob; fileName: string } | null> => {
    const targetRef = ghostReceiptRef.current || receiptRef.current;
    if (!targetRef) return null;

    try {
      const canvas = await html2canvas(targetRef, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        width: 794,
        height: 1123,
        windowWidth: 1280,
        onclone: (clonedDoc: Document) => {
          const el = clonedDoc.getElementById('receipt-capture-ghost');
          if (el) {
            el.style.transform = 'none';
            el.style.boxShadow = 'none';
            el.style.margin = '0';
            el.style.padding = '25mm';
            el.style.position = 'static';
            el.style.width = '210mm';
            el.style.minHeight = '297mm';
          }
        },
      });

      const imgData = canvas.toDataURL('image/jpeg', 0.9);
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight);

      const sanitizedNumber = validators.fileName(formData.number);
      const sanitizedClientName = validators.fileName(formData.clientName);
      const fileName = sanitizedClientName
        ? `${sanitizedNumber}_${sanitizedClientName}.pdf`
        : `${sanitizedNumber}_documento.pdf`;

      return { blob: pdf.output('blob'), fileName };
    } catch (error) {
      console.error(error);
      return null;
    }
  }, [formData, ghostReceiptRef, receiptRef]);

  const handleGeneratePDF = useCallback(async () => {
    setIsGeneratingPdf(true);
    notify('Preparando Documento A4...', 'info');

    try {
      const pdfData = await generatePDFBlob();
      if (!pdfData) throw new Error('Falha ao gerar PDF.');
      const { blob, fileName } = pdfData;

      if (isCapacitor) {
        // Nativo: guarda no dispositivo
        const uri = await saveBlobNative(blob, fileName);
        if (uri) {
          notify(`PDF guardado em: Documentos/${fileName}`, 'success');
        } else {
          notify('Erro ao guardar PDF.', 'error');
        }
      } else {
        // Web: download
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = fileName;
        link.click();
        notify('Documento descarregado!', 'success');
      }
      await handleSave(true);
    } catch {
      notify('Erro na geração do PDF. Tente novamente.', 'error');
    } finally {
      setIsGeneratingPdf(false);
    }
  }, [formData, generatePDFBlob, handleSave, notify]);

  const handleShareWhatsApp = useCallback(async () => {
    if (isSharing) return;
    setIsSharing(true);
    notify('Preparando partilha...', 'info');

    try {
      const pdfData = await generatePDFBlob();
      if (!pdfData) throw new Error('Erro ao gerar ficheiro.');

      // Tentar share nativo via Capacitor
      if (isCapacitor) {
        try {
          const uri = await saveBlobNative(pdfData.blob, pdfData.fileName, 'Cache');
          if (uri) {
            const { Share } = await import('@capacitor/share');
            await Share.share({ title: pdfData.fileName, url: uri, dialogTitle: 'Compartilhar Documento' });
            notify('Partilha concluída!', 'success');
          } else {
            throw new Error('Erro ao preparar ficheiro');
          }
        } catch {
          // Fallback: WhatsApp link via AppLauncher
          if (!validators.phone(formData.clientContact || '')) {
            notify('Número de telefone inválido.', 'error');
          } else {
            const cleanPhone = formData.clientContact!.replace(/\D/g, '');
            const waUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(`Olá, segue o documento ${formData.number}.`)}`;
            try {
              const { AppLauncher } = await import('@capacitor/app-launcher');
              await AppLauncher.openUrl({ url: waUrl });
            } catch {
              window.open(waUrl, '_blank');
            }
            notify('WhatsApp aberto!', 'success');
          }
        }
      } else {
        // Web: navigator.share ou WhatsApp fallback
        const file = new File([pdfData.blob], pdfData.fileName, { type: 'application/pdf' });
        if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
          await navigator.share({ files: [file], title: pdfData.fileName, text: `Envio de ${formData.number}` });
          notify('Partilha concluída!', 'success');
        } else if (formData.clientContact && validators.phone(formData.clientContact)) {
          const cleanPhone = formData.clientContact.replace(/\D/g, '');
          window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(`Olá, segue o documento ${formData.number}.`)}`, '_blank');
        } else {
          notify('Número de telefone inválido.', 'error');
        }
      }
    } catch {
      notify('Erro ao partilhar documento.', 'error');
    } finally {
      setIsSharing(false);
    }
  }, [formData, generatePDFBlob, isSharing, notify]);

  const buildThermalHtml = (doc: ReceiptData): string => {
    const fM = (val: number) => `${val.toLocaleString()} ${doc.currency || 'MT'}`;
    const tipo = { INVOICE: 'FATURA', RECEIPT: 'RECIBO', INVOICE_RECEIPT: 'FACTURA-RECIBO', QUOTE: 'ORÇAMENTO' }[doc.type] || doc.type;

    const itemsHtml = doc.items.map(item => `
        <tr>
          <td style="padding:2px 0;font-size:10px">${item.description}</td>
          <td style="padding:2px 0;font-size:10px;text-align:right">${item.quantity}x</td>
          <td style="padding:2px 0;font-size:10px;text-align:right">${fM(item.unitPrice)}</td>
          <td style="padding:2px 0;font-size:10px;text-align:right;font-weight:bold">${fM(item.total)}</td>
        </tr>`).join('');

    return `<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>Imprimir Talão</title>
<style>
  @page { width: 80mm; margin: 0; padding: 0; }
  body { width: 72mm; margin: 0 auto; padding: 5mm 0; font-family: 'Courier New', monospace; font-size: 11px; color: #000; }
  .center { text-align: center; }
  .bold { font-weight: bold; }
  .h1 { font-size: 14px; font-weight: bold; margin: 2px 0; }
  .h2 { font-size: 12px; margin: 2px 0; }
  hr { border: none; border-top: 1px dashed #000; margin: 6px 0; }
  table { width: 100%; border-collapse: collapse; }
  td { padding: 1px 0; }
  .total { font-size: 16px; font-weight: bold; margin: 8px 0; }
  .footer { margin-top: 10px; font-size: 10px; }
  @media print { body { width: 58mm; } }
</style></head><body>
  <div class="center">
    ${doc.companyName ? `<div class="h1">${doc.companyName}</div>` : ''}
    ${doc.companyNuit ? `<div class="h2">NUIT: ${doc.companyNuit}</div>` : ''}
    ${doc.companyAddress ? `<div style="font-size:10px">${doc.companyAddress}</div>` : ''}
  </div>
  <hr>
  <div class="center">
    <div class="h1">${tipo}</div>
    <div class="h2">Nº ${doc.number}</div>
    <div class="h2">${doc.date}</div>
  </div>
  <hr>
  ${doc.clientName ? `<div><b>Cliente:</b> ${doc.clientName}</div>` : ''}
  ${doc.clientNuit ? `<div><b>NUIT:</b> ${doc.clientNuit}</div>` : ''}
  <hr>
  <table>
    <tr style="font-weight:bold;font-size:10px">
      <td>Descrição</td><td style="text-align:right">Qtd</td><td style="text-align:right">Preço</td><td style="text-align:right">Total</td>
    </tr>
    ${itemsHtml}
  </table>
  <hr>
  <div style="text-align:right">
    <div><b>Subtotal:</b> ${fM(doc.subtotal)}</div>
    ${doc.taxRate > 0 ? `<div><b>IVA (${doc.taxRate}%):</b> ${fM(doc.taxAmount)}</div>` : ''}
    ${doc.discount > 0 ? `<div><b>Desconto:</b> -${fM(doc.discount)}</div>` : ''}
    <div class="total">Total: ${fM(doc.total)}</div>
  </div>
  ${doc.stampText ? `<hr><div class="center bold" style="font-size:14px">${doc.stampText}</div>` : ''}
  <hr>
  <div class="center footer">
    <p>Obrigado pela preferência!</p>
    <p>Gerado por Biz-flow</p>
  </div>
</body></html>`;
  };

  const handlePrintThermal = useCallback(async () => {
    if (isPrinting) return;
    setIsPrinting(true);

    try {
      if (isCapacitor) {
        // Android: tentar BLE nativo
        try {
          const { BLEPrinterService } = await import('../../features/bluetooth/BLEPrinterService');
          const { ThermalPrinter } = await import('../../features/bluetooth/thermalPrinterProtocol');

          if (BLEPrinterService.isConnected()) {
            const printer = new ThermalPrinter();
            const data = printer.buildDocument({
              companyName: formData.companyName || 'Biz-flow',
              companyNuit: formData.companyNuit,
              documentType: { INVOICE: 'FATURA', RECEIPT: 'RECIBO', INVOICE_RECEIPT: 'FACTURA-RECIBO', QUOTE: 'ORÇAMENTO' }[formData.type] || formData.type,
              documentNumber: formData.number,
              date: formData.date,
              clientName: formData.clientName,
              clientNuit: formData.clientNuit,
              items: formData.items.map(i => ({
                description: i.description,
                quantity: i.quantity,
                unitPrice: i.unitPrice,
                total: i.total,
              })),
              subtotal: formData.subtotal,
              taxRate: formData.taxRate,
              taxAmount: formData.taxAmount,
              discount: formData.discount,
              total: formData.total,
              currency: formData.currency,
              stampText: formData.stampText,
            }).getData();

            await BLEPrinterService.print(data);
            notify('Documento enviado para impressão!', 'success');
          } else {
            notify('Nenhuma impressora Bluetooth conectada. Conecte uma em "Mais > Configurações".', 'info');
          }
        } catch {
          notify('Erro na impressão Bluetooth. Verifique se a impressora está ligada.', 'error');
        }
      } else {
        // Web: impressão via browser
        const printWindow = window.open('', '_blank');
        if (!printWindow) {
          notify('Bloqueador de pop-ups ativo. Permita pop-ups para imprimir.', 'error');
          setIsPrinting(false);
          return;
        }
        printWindow.document.write(buildThermalHtml(formData));
        printWindow.document.close();
        printWindow.focus();
        setTimeout(() => { printWindow.print(); }, 500);
        notify('Talão enviado para impressão.', 'success');
      }
    } catch (erro) {
      console.error('Erro impressão:', erro);
      notify('Erro ao imprimir talão.', 'error');
    } finally {
      setIsPrinting(false);
    }
  }, [isPrinting, formData, notify]);

  return {
    isGeneratingPdf,
    isSharing,
    isPrinting,
    handleGeneratePDF,
    handleShareWhatsApp,
    handlePrintThermal,
    generatePDFBlob,
  };
};
