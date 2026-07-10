import React from 'react';
import { ReceiptData, LineItem, DocumentType, SavedClient, SavedProduct, Product } from '../types';
import { addProduct } from '../services/storageService';
import { useToast } from './ToastContext';
import { EditorFormView } from './EditorFormView';

export interface EditorFormProps {
  formData: ReceiptData;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
  newItem: Partial<LineItem>;
  onNewItemChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onAddItem: () => void;
  onRemoveItem: (id: string) => void;
  onEnhanceDescription: () => void;
  isEnhancing: boolean;
  t: (key: string) => string;
  fMoney: (val: number) => string;
  onInitNew: (type: DocumentType) => void;
  onSign: () => void;
  statusOptions: string[];
  onClearClient: () => void;
  savedClients: SavedClient[];
  savedProducts: SavedProduct[];
  onConvertQuote?: () => void;
  userId?: string;
  onThemeChange?: (theme: 'color' | 'bw') => void;
  onViewClientHistory?: (clientName: string) => void;
}

export const EditorForm: React.FC<EditorFormProps> = (props) => {
  const {
    formData, onChange, newItem, onNewItemChange, onAddItem, onRemoveItem,
    onEnhanceDescription, isEnhancing, t, fMoney, onInitNew, onSign, statusOptions, onClearClient,
    savedClients, savedProducts, onConvertQuote, userId, onThemeChange
  } = props;

  const [showSaveProductModal, setShowSaveProductModal] = React.useState(false);
  const [pendingItem, setPendingItem] = React.useState<Partial<LineItem> | null>(null);
  const [isSavingProduct, setIsSavingProduct] = React.useState(false);
  const [selectedCatalogProduct, setSelectedCatalogProduct] = React.useState<Product | null>(null);
  const { notify } = useToast();

  const handleProductSelect = (product: Product) => {
    onNewItemChange({ target: { name: 'description', value: product.name } } as React.ChangeEvent<HTMLInputElement>);
    onNewItemChange({ target: { name: 'unitPrice', value: product.price.toString() } } as React.ChangeEvent<HTMLInputElement>);
    setSelectedCatalogProduct(product);
  };

  const handleProductSearch = (value: string) => {
    onNewItemChange({ target: { name: 'description', value } } as React.ChangeEvent<HTMLInputElement>);
  };

  const handleShowNewProductModal = (productName: string) => {
    setPendingItem({ ...newItem, description: productName });
    setShowSaveProductModal(true);
  };

  const handleSaveProductAndAdd = async () => {
    if (!pendingItem || !userId) return;
    setIsSavingProduct(true);
    try {
      await addProduct({
        name: pendingItem.description || '',
        price: pendingItem.unitPrice || 0,
        userId,
        category: ''
      });
      notify(`Produto "${pendingItem.description}" salvo no catálogo`, 'success');
      setShowSaveProductModal(false);
      setPendingItem(null);
      onAddItem();
    } catch {
      notify('Erro ao salvar produto', 'error');
    } finally {
      setIsSavingProduct(false);
    }
  };

  const handleAddWithoutSaving = () => {
    setShowSaveProductModal(false);
    setPendingItem(null);
    onAddItem();
  };

  const handleAddItem = () => {
    if (!newItem.description?.trim()) return;
    const existingProduct = savedProducts.find(p =>
      p.description.toLowerCase() === newItem.description!.toLowerCase()
    );
    if (!existingProduct) {
      setPendingItem(newItem);
      setShowSaveProductModal(true);
    } else {
      onAddItem();
    }
  };

  const handleSendWhatsApp = async () => {
    if (!formData.clientContact) { notify("Adicione um contacto do cliente primeiro", "error"); return; }
    notify("Use o botão de partilha do navegador para enviar via WhatsApp", "info");
  };

  const handleSendEmail = async () => {
    if (!formData.clientContact) { notify("Adicione um email do cliente primeiro", "error"); return; }
    notify("Use o botão de partilha do navegador para enviar via Email", "info");
  };

  const viewProps = {
    formData, onChange, newItem, onNewItemChange, onAddItem: handleAddItem, onRemoveItem,
    onEnhanceDescription, isEnhancing, t, fMoney, onInitNew, onSign, statusOptions, onClearClient,
    savedClients, savedProducts, onConvertQuote, userId, onThemeChange,
    selectedCatalogProduct,
    showSaveProductModal, pendingItem, isSavingProduct,
    handleAddWithoutSaving, handleSaveProductAndAdd, handleProductSelect, handleProductSearch,
    handleShowNewProductModal,
    onSendWhatsApp: handleSendWhatsApp, onSendEmail: handleSendEmail,
    setShowSaveProductModal,
    onViewClientHistory: props.onViewClientHistory,
  };

  return <EditorFormView {...viewProps} />;
};
