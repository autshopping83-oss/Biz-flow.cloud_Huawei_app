import { useCallback, useState } from 'react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { saveDirectoryHandle } from '../../services/storageService';
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
  const [localDirHandle, setLocalDirHandle] = useState<FileSystemDirectoryHandle | null>(null);

  const requestFolderPermission = useCallback(async () => {
    if (!window.showDirectoryPicker) return null;
    try {
      const handle = await window.showDirectoryPicker({ mode: 'readwrite' });
      setLocalDirHandle(handle);
      await saveDirectoryHandle(handle);
      notify('Pasta de armazenamento ativada!', 'success');
      return handle;
    } catch {
      notify('Permissão de pasta não concedida.', 'info');
      return null;
    }
  }, [notify]);

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

      let dirHandle = localDirHandle;
      if (!dirHandle && window.showDirectoryPicker) {
        dirHandle = await requestFolderPermission();
      }

      if (dirHandle) {
        try {
          const permission = await (dirHandle as FileSystemDirectoryHandle & { queryPermission(opts: { mode: 'read' | 'readwrite' }): Promise<PermissionState> }).queryPermission({ mode: 'readwrite' });
          if (permission !== 'granted') await (dirHandle as FileSystemDirectoryHandle & { requestPermission(opts: { mode: 'read' | 'readwrite' }): Promise<PermissionState> }).requestPermission({ mode: 'readwrite' });
          const subfolderName = formData.type === 'INVOICE' ? 'Faturas' : formData.type === 'INVOICE_RECEIPT' ? 'Faturas-Recibos' : formData.type === 'QUOTE' ? 'Orcamentos' : 'Recibos';
          const subDir = await dirHandle.getDirectoryHandle(subfolderName, { create: true });
          const fileHandle = await subDir.getFileHandle(fileName, { create: true });
          const writable = await fileHandle.createWritable();
          await writable.write(blob);
          await writable.close();
          notify(`Salvo com sucesso na pasta: ${subfolderName}`, 'success');
        } catch {
          const link = document.createElement('a');
          link.href = URL.createObjectURL(blob);
          link.download = fileName;
          link.click();
        }
      } else {
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = fileName;
        link.click();
      }

      await handleSave(true);
    } catch {
      notify('Erro na geração do PDF. Tente novamente.', 'error');
    } finally {
      setIsGeneratingPdf(false);
    }
  }, [formData, generatePDFBlob, handleSave, localDirHandle, notify, requestFolderPermission]);

  const handleShareWhatsApp = useCallback(async () => {
    if (isSharing) return;
    setIsSharing(true);
    notify('Preparando partilha direta...', 'info');

    try {
      const pdfData = await generatePDFBlob();
      if (!pdfData) throw new Error('Erro ao gerar ficheiro.');

      const { blob, fileName } = pdfData;
      const file = new File([blob], fileName, { type: 'application/pdf' });

      if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({ files: [file], title: fileName, text: `Envio de ${formData.number}` });
        notify('Partilha concluída!', 'success');
      } else {
        if (!formData.clientContact || !validators.phone(formData.clientContact)) {
          notify('Número de telefone inválido. Verifique o contato do cliente.', 'error');
          setIsSharing(false);
          return;
        }
        const cleanPhone = formData.clientContact.replace(/\D/g, '');
        window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(`Olá, segue o documento ${formData.number}.`)}`, '_blank');
        notify('Aviso: Seu navegador não suporta partilha de ficheiros direta. Abrindo chat...', 'info');
      }
    } catch {
      notify('Erro ao partilhar documento.', 'error');
    } finally {
      setIsSharing(false);
    }
  }, [formData, generatePDFBlob, isSharing, notify]);

  const handlePrintThermal = useCallback(async () => {
    if (isPrinting) return;
    const targetRef = thermalReceiptRef.current;
    if (!targetRef) {
      notify('Erro: Recibo térmico não encontrado.', 'error');
      return;
    }

    setIsPrinting(true);
    notify('Impressão térmica requer Bluetooth. Use um navegador compatível.', 'info');
    setIsPrinting(false);
  }, [isPrinting, notify, thermalReceiptRef]);

  return {
    isGeneratingPdf,
    isSharing,
    isPrinting,
    localDirHandle,
    requestFolderPermission,
    handleGeneratePDF,
    handleShareWhatsApp,
    handlePrintThermal,
    generatePDFBlob,
  };
};
