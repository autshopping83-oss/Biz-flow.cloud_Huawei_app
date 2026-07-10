/**
 * useDocumentEditor - Hook para gerenciar o estado do editor de documentos
 * 
 * Extraído do App.tsx para respeitar SRP e limite de 30 linhas por função.
 * Gerencia: formData, newItem, mobileTab, modais, histórico.
 */

import { useState, useRef } from 'react';
import { ReceiptData, CompanySettings, DocumentType, LineItem } from '../../../types';
import { generateNextReceiptNumber, saveReceipt, deleteReceipt } from '../../../services/storageService';
import { useSignatureCanvas } from '../../../app/hooks/useSignatureCanvas';
import { useDocumentActions } from '../../../app/hooks/useDocumentActions';

const InitialReceipt: ReceiptData = {
  id: '', type: 'RECEIPT', number: '', date: new Date().toISOString().split('T')[0] ?? '',
  currency: 'MZN', language: 'pt', clientName: '', clientContact: '', clientLocation: '', clientNuit: '',
  items: [], subtotal: 0, taxRate: 0, taxAmount: 0, discount: 0, total: 0,
  stampText: 'PAGO', signatureData: '', documentTheme: 'color', createdAt: Date.now(),
};

interface UseDocumentEditorProps {
  isGuest: boolean;
  history: ReceiptData[];
  companySettings: CompanySettings;
  setHistory: (h: ReceiptData[]) => void;
  setCurrentView: (v: string) => void;
  notify: (msg: string, type: 'success' | 'error' | 'info') => void;
}

export function useDocumentEditor({
  isGuest, history, companySettings,
  setHistory, setCurrentView, notify,
}: UseDocumentEditorProps) {
  const [formData, setFormData] = useState<ReceiptData>(InitialReceipt);
  const [newItem, setNewItem] = useState<Partial<LineItem>>({ description: '', quantity: 1, unitPrice: 0 });
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [mobileTab, setMobileTab] = useState<'editor' | 'preview'>('editor');
  const [showSignatureModal, setShowSignatureModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);

  const receiptRef = useRef<HTMLDivElement>(null);
  const ghostReceiptRef = useRef<HTMLDivElement>(null);
  const thermalReceiptRef = useRef<HTMLDivElement>(null);

  const { canvasRef, clearCanvas, getCanvasDataUrl } = useSignatureCanvas(showSignatureModal);

  const { isGeneratingPdf, isSharing, isPrinting, localDirHandle, requestFolderPermission, handleGeneratePDF, handleShareWhatsApp, handlePrintThermal, generatePDFBlob } = useDocumentActions({
    formData,
    receiptRef,
    ghostReceiptRef,
    thermalReceiptRef,
    notify,
    handleSave: async (silent = false) => {
      if (!formData.clientName || formData.items.length === 0) return;
      const newHistory = await saveReceipt(formData, 'local');
      setHistory(newHistory);
      if (!silent) notify('Dados guardados.', 'success');
    },
  });

  const initNewDocument = (type: DocumentType) => {
    const today = new Date().toISOString().split('T')[0] ?? '';
    setFormData({
      ...InitialReceipt,
      id: crypto.randomUUID(),
      type,
      number: generateNextReceiptNumber(history, type),
      date: today,
      taxRate: type === 'INVOICE' ? companySettings.defaultTaxRate || 0 : 0,
      currency: companySettings.currency,
      language: companySettings.language,
      companyName: companySettings.name,
      companyAddress: companySettings.address,
      companyContact: companySettings.contact,
      companyNuit: companySettings.nuit,
      companyLogo: companySettings.logo,
    });
    setMobileTab('editor');
    setCurrentView('app');
  };

  const handleDuplicateDocument = (doc: ReceiptData) => {
    const newDoc = { ...doc };
    setFormData({
      ...newDoc,
      id: crypto.randomUUID(),
      number: generateNextReceiptNumber(history, doc.type),
      date: new Date().toISOString().split('T')[0],
    });
    setCurrentView('app');
    notify('Documento duplicado com novo número e data.', 'info');
  };

  const handleFormDataChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(p => ({ ...p, [name]: value }));
  };

  const handleNewItemChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setNewItem(p => ({ ...p, [name]: value }));
  };

  const recalcular = (items: LineItem[], taxRate: number, discount: number) => {
    const subtotal = items.reduce((s, i) => s + i.quantity * i.unitPrice, 0);
    const taxAmount = taxRate > 0 ? subtotal * (taxRate / 100) : 0;
    const total = subtotal + taxAmount - discount;
    return { subtotal, taxAmount, total };
  };

  const handleAddItem = () => {
    if (!newItem.description) return;
    const q = Number(newItem.quantity) || 1;
    const p = Number(newItem.unitPrice) || 0;
    setFormData(prev => {
      const items = [...prev.items, { id: crypto.randomUUID(), description: newItem.description!, quantity: q, unitPrice: p, total: q * p }];
      return { ...prev, items, ...recalcular(items, prev.taxRate, prev.discount) };
    });
    setNewItem({ description: '', quantity: 1, unitPrice: 0 });
  };

  const handleRemoveItem = (id: string) => {
    setFormData(prev => {
      const items = prev.items.filter(i => i.id !== id);
      return { ...prev, items, ...recalcular(items, prev.taxRate, prev.discount) };
    });
  };

  const handleEnhanceDescription = async () => {
    // AI enhancement disabled - no external API
    notify('Funcionalidade de IA não disponível.', 'info');
  };

  const handleClearClient = () => {
    setFormData(p => ({ ...p, clientName: '', clientContact: '', clientLocation: '', clientNuit: '' }));
  };

  const handleThemeChange = (theme: 'color' | 'bw') => {
    setFormData(p => ({ ...p, documentTheme: theme }));
  };

  const saveSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const blank = document.createElement('canvas');
    blank.width = canvas.width;
    blank.height = canvas.height;
    if (canvas.toDataURL() === blank.toDataURL()) {
      notify('A assinatura está vazia.', 'info');
      return;
    }
    const dataUrl = canvas.toDataURL('image/png');
    setFormData(p => ({ ...p, signatureData: dataUrl }));
    setShowSignatureModal(false);
    notify('Assinatura guardada!', 'success');
  };

  const clearSignature = () => {
    clearCanvas(canvasRef.current);
  };

  const handleDeleteDocument = async (id: string) => {
    const updated = await deleteReceipt(id, 'local');
    setHistory(updated);
  };

  return {
    formData, setFormData, newItem, isEnhancing, mobileTab,
    showSignatureModal, showShareModal,
    receiptRef, ghostReceiptRef, thermalReceiptRef, canvasRef,
    isGeneratingPdf, isSharing, isPrinting, localDirHandle,
    requestFolderPermission, handleGeneratePDF, handleShareWhatsApp, handlePrintThermal, generatePDFBlob,
    setMobileTab, setShowSignatureModal, setShowShareModal,
    initNewDocument, handleDuplicateDocument,
    handleFormDataChange, handleNewItemChange, handleAddItem, handleRemoveItem,
    handleEnhanceDescription, handleClearClient, handleThemeChange,
    saveSignature, clearSignature, handleDeleteDocument,
  };
}
