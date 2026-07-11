// src/services/nativeShareService.ts
// Serviço de compartilhamento nativo usando Capacitor Share

import { Share } from '@capacitor/share';
import { AppLauncher } from '@capacitor/app-launcher';

export const NativeShareService = {
  /**
   * Abre o share sheet nativo do Android com um ficheiro
   */
  async shareFile(fileUri: string, title: string, dialogTitle?: string): Promise<void> {
    try {
      await Share.share({
        title,
        url: fileUri,
        dialogTitle: dialogTitle || 'Compartilhar Documento',
      });
    } catch (error: any) {
      // Utilizador cancelou ou erro - ignorar
      if (error?.message !== 'canceled') {
        console.warn('Share error:', error);
      }
    }
  },

  /**
   * Abre o share sheet com texto apenas
   */
  async shareText(text: string, title?: string): Promise<void> {
    try {
      await Share.share({
        title: title || 'Biz-flow.cloud',
        text,
        dialogTitle: 'Compartilhar',
      });
    } catch {
      // Silencioso
    }
  },

  /**
   * Abre o WhatsApp com uma mensagem (fallback para wa.me)
   */
  async shareWhatsApp(text: string): Promise<void> {
    try {
      // Tenta usar AppLauncher para abrir WhatsApp
      const encoded = encodeURIComponent(text);
      await AppLauncher.openUrl({ url: `https://wa.me/?text=${encoded}` });
    } catch {
      // Fallback: abrir no browser
      const encoded = encodeURIComponent(text);
      window.open(`https://wa.me/?text=${encoded}`, '_blank');
    }
  },
};
