import React, { useState } from 'react';
import { n8nWebhookService, N8nWebhookResponse } from '../services/n8nWebhookService';
import { useToast } from './ToastContext';

export const N8nWebhookTester: React.FC<{ userId?: string }> = ({ userId }) => {
  const [isTesting, setIsTesting] = useState(false);
  const [lastResult, setLastResult] = useState<N8nWebhookResponse | null>(null);
  const [showPanel, setShowPanel] = useState(false);
  const { notify } = useToast();

  const handleTestConnection = async () => {
    setIsTesting(true);
    setLastResult(null);
    
    try {
      const result = await n8nWebhookService.testConnection();
      setLastResult(result);
      
      if (result.success) {
        notify('✅ Webhook n8n conectado com sucesso!', 'success');
      } else {
        notify(`❌ Falha: ${result.error}`, 'error');
      }
    } catch (error: any) {
      setLastResult({ success: false, error: error.message });
      notify(`❌ Erro: ${error.message}`, 'error');
    } finally {
      setIsTesting(false);
    }
  };

  const handleTestEmail = async () => {
    setIsTesting(true);
    try {
      const result = await n8nWebhookService.sendEmail(
        'teste@exemplo.com',
        'Teste BizFlow Cloud',
        'Este é um email de teste do BizFlow Cloud via n8n',
        userId
      );
      setLastResult(result);
      notify(result.success ? '📧 Email de teste enviado!' : `❌ ${result.error}`, result.success ? 'success' : 'error');
    } catch (error: any) {
      notify(`❌ Erro: ${error.message}`, 'error');
    } finally {
      setIsTesting(false);
    }
  };

  const handleTestWhatsApp = async () => {
    setIsTesting(true);
    try {
      const result = await n8nWebhookService.sendWhatsApp(
        '258840000000',
        '🧾 Teste BizFlow Cloud: Seu documento foi gerado com sucesso!',
        userId
      );
      setLastResult(result);
      notify(result.success ? '💬 WhatsApp de teste enviado!' : `❌ ${result.error}`, result.success ? 'success' : 'error');
    } catch (error: any) {
      notify(`❌ Erro: ${error.message}`, 'error');
    } finally {
      setIsTesting(false);
    }
  };

  const handleTestChatbot = async () => {
    setIsTesting(true);
    try {
      const result = await n8nWebhookService.sendChatbotMessage(
        'telegram',
        '123456789',
        '🤖 Teste BizFlow Cloud: Chatbot integrado com sucesso!',
        userId
      );
      setLastResult(result);
      notify(result.success ? '🤖 Chatbot de teste enviado!' : `❌ ${result.error}`, result.success ? 'success' : 'error');
    } catch (error: any) {
      notify(`❌ Erro: ${error.message}`, 'error');
    } finally {
      setIsTesting(false);
    }
  };

  const handleTestDocumentNotification = async () => {
    setIsTesting(true);
    try {
      const result = await n8nWebhookService.notifyDocumentCreated({
        id: 'test-' + Date.now(),
        number: 'TEST-001',
        type: 'RECEIPT',
        clientName: 'Cliente Teste',
        total: 1500.00,
        currency: 'MZN',
        date: new Date().toISOString().split('T')[0],
      }, userId);
      setLastResult(result);
      notify(result.success ? '📄 Notificação de documento enviada!' : `❌ ${result.error}`, result.success ? 'success' : 'error');
    } catch (error: any) {
      notify(`❌ Erro: ${error.message}`, 'error');
    } finally {
      setIsTesting(false);
    }
  };

  const handleSendCustomPayload = async () => {
    setIsTesting(true);
    try {
      const result = await n8nWebhookService.send('test.connection', {
        test: true,
        message: 'Payload personalizado de teste',
        appName: 'BizFlow Cloud',
        version: '1.0.0',
        features: ['documentos', 'whatsapp', 'email', 'chatbot'],
        timestamp: new Date().toISOString(),
        environment: import.meta.env.MODE || 'production',
      }, userId, {
        customField: 'valor personalizado',
        source: 'N8nWebhookTester',
      });
      setLastResult(result);
      notify(result.success ? '🚀 Payload personalizado enviado!' : `❌ ${result.error}`, result.success ? 'success' : 'error');
    } catch (error: any) {
      notify(`❌ Erro: ${error.message}`, 'error');
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <div className="border-t dark:border-slate-800">
      <button
        onClick={() => setShowPanel(!showPanel)}
        className="w-full flex items-center justify-between p-4 text-sm font-bold text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
      >
        <span className="flex items-center gap-2">
          <i className={`fa-solid fa-plug ${showPanel ? 'text-green-500' : ''}`}></i>
          Integrações Externas (n8n)
        </span>
        <i className={`fa-solid fa-chevron-down transition-transform ${showPanel ? 'rotate-180' : ''}`}></i>
      </button>

      {showPanel && (
        <div className="px-4 pb-4 space-y-3">
          <p className="text-xs text-slate-400 dark:text-slate-500">
            Conecte serviços externos via n8n: Email, WhatsApp, Chatbot e mais.
          </p>

          {/* Test Connection */}
          <button
            onClick={handleTestConnection}
            disabled={isTesting}
            className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl p-3 text-sm font-bold hover:from-purple-700 hover:to-blue-700 transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isTesting ? (
              <i className="fa-solid fa-spinner animate-spin"></i>
            ) : (
              <i className="fa-solid fa-plug"></i>
            )}
            {isTesting ? 'Testando...' : '🔌 Testar Conexão n8n'}
          </button>

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={handleTestEmail}
              disabled={isTesting}
              className="bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-xl p-3 text-xs font-bold hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <i className="fa-solid fa-envelope"></i>
              Testar Email
            </button>

            <button
              onClick={handleTestWhatsApp}
              disabled={isTesting}
              className="bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 rounded-xl p-3 text-xs font-bold hover:bg-emerald-100 dark:hover:bg-emerald-900/30 transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <i className="fa-brands fa-whatsapp"></i>
              Testar WhatsApp
            </button>

            <button
              onClick={handleTestChatbot}
              disabled={isTesting}
              className="bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 rounded-xl p-3 text-xs font-bold hover:bg-amber-100 dark:hover:bg-amber-900/30 transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <i className="fa-solid fa-robot"></i>
              Testar Chatbot
            </button>

            <button
              onClick={handleTestDocumentNotification}
              disabled={isTesting}
              className="bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 rounded-xl p-3 text-xs font-bold hover:bg-rose-100 dark:hover:bg-rose-900/30 transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <i className="fa-solid fa-file-invoice"></i>
              Notificar Documento
            </button>
          </div>

          {/* Custom Payload */}
          <button
            onClick={handleSendCustomPayload}
            disabled={isTesting}
            className="w-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl p-3 text-xs font-bold hover:bg-slate-200 dark:hover:bg-slate-700 transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2"
          >
            <i className="fa-solid fa-code"></i>
            Enviar Payload Personalizado
          </button>

          {/* Result Display */}
          {lastResult && (
            <div className={`rounded-xl p-3 text-xs font-mono ${
              lastResult.success 
                ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300' 
                : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300'
            }`}>
              <div className="font-bold mb-1">
                {lastResult.success ? '✅ Sucesso' : '❌ Erro'}
              </div>
              <div>{lastResult.message || lastResult.error}</div>
              {lastResult.data && (
                <pre className="mt-1 opacity-70 text-[10px] overflow-x-auto">
                  {JSON.stringify(lastResult.data, null, 2)}
                </pre>
              )}
            </div>
          )}

          {/* Info */}
          <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-3">
            <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400 mb-2 flex items-center gap-1">
              <i className="fa-solid fa-info-circle"></i>
              Como configurar no n8n:
            </h4>
            <ol className="text-[10px] text-slate-400 dark:text-slate-500 space-y-1 list-decimal list-inside">
              <li>Crie um webhook no n8n com esta URL</li>
              <li>Conecte os serviços desejados (Email, WhatsApp, etc.)</li>
              <li>Os eventos do app serão enviados automaticamente</li>
              <li>Use os botões acima para testar cada integração</li>
            </ol>
          </div>
        </div>
      )}
    </div>
  );
};
