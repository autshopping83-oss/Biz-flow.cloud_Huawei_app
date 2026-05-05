/**
 * Validators - Funções reutilizáveis de validação
 * Segurança: Validações de entrada para prevenir XSS, injection, etc
 */

export const validators = {
  /**
   * Valida email usando regex RFC 5322 simplificado
   */
  email: (email: string): boolean => {
    if (!email || typeof email !== 'string') return false;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email.trim());
  },

  /**
   * Valida força de senha
   * - Mínimo 6 caracteres
   * - Pelo menos uma letra maiúscula
   * - Pelo menos um número
   */
  password: (password: string): { valid: boolean; errors: string[] } => {
    const errors: string[] = [];
    
    if (!password || password.length < 6) errors.push("Mínimo 6 caracteres");
    if (!/[A-Z]/.test(password)) errors.push("Uma letra maiúscula");
    if (!/[0-9]/.test(password)) errors.push("Um número");
    
    return { valid: errors.length === 0, errors };
  },

  /**
   * Valida número de telefone
   * - Entre 10 e 15 dígitos
   * - Apenas números
   */
  phone: (phone: string): boolean => {
    if (!phone || typeof phone !== 'string') return false;
    const cleaned = phone.replace(/\D/g, '');
    return cleaned.length >= 10 && cleaned.length <= 15;
  },

  /**
   * Sanitiza nome de arquivo
   * - Remove caracteres perigosos
   * - Limita tamanho
   * - Substitui espaços por underscore
   */
  fileName: (name: string, maxLength: number = 100): string => {
    if (!name || typeof name !== 'string') return 'arquivo';
    return name
      .replace(/[^a-zA-Z0-9._-]/g, '_')
      .replace(/\s+/g, '_')
      .replace(/_+/g, '_')
      .substring(0, maxLength)
      .toLowerCase();
  },

  /**
   * Valida NUIT (Número Único de Identificação Tributária - Moçambique)
   */
  nuit: (nuit: string): boolean => {
    if (!nuit || typeof nuit !== 'string') return false;
    const cleaned = nuit.replace(/\D/g, '');
    return cleaned.length === 9;
  },

  /**
   * Verifica se arquivo é imagem permitida
   */
  imageFile: (file: File): { valid: boolean; error?: string } => {
    const allowedTypes = ['image/png', 'image/jpeg', 'image/webp'];
    const maxSize = 2 * 1024 * 1024; // 2MB

    if (!file) {
      return { valid: false, error: "Nenhum arquivo selecionado" };
    }

    if (!allowedTypes.includes(file.type)) {
      return { 
        valid: false, 
        error: "Tipo não permitido. Use PNG, JPEG ou WebP." 
      };
    }

    if (file.size > maxSize) {
      return { 
        valid: false, 
        error: "Arquivo muito grande. Máximo 2MB." 
      };
    }

    return { valid: true };
  },

  /**
   * Valida se valor é seguro (não contém XSS patterns)
   */
  isSafeText: (text: string): boolean => {
    if (!text || typeof text !== 'string') return true;
    // Padrões perigosos comuns
    const dangerous = /<|>|javascript:|onerror=|onload=|onclick=/i;
    return !dangerous.test(text);
  }
};

export default validators;
