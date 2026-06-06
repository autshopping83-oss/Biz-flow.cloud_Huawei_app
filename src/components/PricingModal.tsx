import React, { useState, useEffect } from 'react';
import { SubscriptionPlan } from '../types';
import { PaymentModal } from './PaymentModal';
import { supabase } from '../services/supabaseClient';
import { useToast } from './ToastContext';

interface PricingModalProps {
  currentPlan: SubscriptionPlan;
  onClose: () => void;
  onSelectPlan: (plan: SubscriptionPlan) => void;
  userEmail?: string;
  userName?: string;
}

const plans = [
  {
    id: 'FREE' as SubscriptionPlan,
    name: 'Grátis',
    price: '0 MT',
    description: 'Plano inicial para pequenos negócios com funcionalidades básicas de faturação.',
    features: [
      'Emissão de faturas, recibos e orçamentos',
      'Até 10 documentos por dia',
      'Controlo de receitas/despesas',
      'Exportação PDF',
      'Suporte por WhatsApp',
    ],
    highlight: false,
    color: 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800',
    badge: null,
  },
  {
    id: 'PRO' as SubscriptionPlan,
    name: 'Pro',
    price: '250 MT/mês',
    description: 'Solução completa para profissionais que querem crescer sem limites.',
    features: [
      'Documentos ilimitados',
      'Gestão de clientes (CRM)',
      'Relatórios financeiros detalhados',
      'Multi-moeda + conversão automática',
      'Links de Pagamento',
      'Suporte prioritário WhatsApp',
    ],
    highlight: true,
    color: 'bg-gradient-to-b from-blue-600 to-indigo-700 border-blue-400/30 text-white',
    badge: 'POPULAR',
  },
  {
    id: 'ENTERPRISE' as SubscriptionPlan,
    name: 'Empresarial',
    price: '500 MT/mês',
    description: 'Para empresas e equipas que precisam de contabilidade e gestão avançada.',
    features: [
      'Tudo do Pro, sem limites',
      'Contabilidade simplificada',
      'Acesso para equipa (multi-usuário)',
      'Backup diário automático',
      'Suporte prioritário 24/7',
      'Gestor de conta dedicado',
    ],
    highlight: false,
    color: 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800',
    badge: null,
  },
];

export const PricingModal: React.FC<PricingModalProps> = ({ currentPlan, onClose, onSelectPlan, userEmail, userName }) => {
  const [showPayment, setShowPayment] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan | null>(null);
  const [userId, setUserId] = useState<string>('');

  const { notify } = useToast();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUserId(session.user.id);
      }
    });
  }, []);

  const handleSubscribe = async (plan: SubscriptionPlan) => {
    if (plan === 'FREE') {
      notify('Já está no plano gratuito!', 'info');
      return;
    }
    setSelectedPlan(plan);
    setShowPayment(true);
  };

  if (showPayment && selectedPlan) {
    return (
      <PaymentModal
        onClose={() => { setShowPayment(false); setSelectedPlan(null); }}
        userEmail={userEmail}
        userName={userName}
        userId={userId}
      />
    );
  }

  return (
    <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-[70] flex items-center justify-center p-4 animate-fadeIn overflow-y-auto">
      <div className="bg-slate-50 dark:bg-slate-950 w-full max-w-5xl rounded-3xl shadow-2xl relative overflow-hidden animate-scaleIn my-auto">
        
        {/* Header */}
        <div className="p-8 text-center relative z-10">
          <button onClick={onClose} className="absolute top-6 right-6 w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center text-slate-500 hover:bg-slate-300 transition">
             <i className="fa-solid fa-times"></i>
          </button>
          
          <h2 className="text-3xl md:text-4xl font-black text-slate-900 dark:text-white tracking-tight mb-4">
            Planos e Preços
          </h2>
          <p className="text-slate-500 dark:text-slate-400 max-w-2xl mx-auto">
            Escolha o plano ideal para o seu negócio em Moçambique. Pague via M-Pesa, EMola ou cartão.
          </p>
        </div>

        {/* Plans Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-8 pt-2 md:p-10">
          {plans.map((plan) => {
            const isCurrent = currentPlan === plan.id;
            const isPaid = plan.id !== 'FREE';

            return (
              <div
                key={plan.id}
                className={`rounded-2xl p-8 shadow-sm flex flex-col relative ${plan.color} ${plan.highlight ? 'shadow-xl shadow-blue-900/20 transform md:-translate-y-4 md:scale-105 z-10' : ''}`}
              >
                {plan.badge && (
                  <div className="absolute top-0 right-0 bg-yellow-400 text-yellow-900 text-xs font-bold px-3 py-1 rounded-bl-lg rounded-tr-lg">{plan.badge}</div>
                )}
                
                <h3 className={`text-lg font-bold uppercase tracking-widest mb-2 ${plan.highlight ? 'text-blue-100' : 'text-slate-500'}`}>
                  {plan.name}
                </h3>
                
                <div className={`text-4xl font-black mb-4 ${plan.highlight ? 'text-white' : 'text-slate-900 dark:text-white'}`}>
                  {plan.price}
                </div>
                
                <p className={`text-sm mb-6 flex-grow ${plan.highlight ? 'text-blue-100 opacity-90' : 'text-slate-500'}`}>
                  {plan.description}
                </p>
                
                <ul className="space-y-3 mb-8 text-sm">
                  {plan.features.map((feature) => (
                    <li key={feature} className={`flex items-start gap-2 ${plan.highlight ? 'text-white font-medium' : 'text-slate-600 dark:text-slate-300'}`}>
                      <i className={`fa-solid fa-check mt-1 ${plan.highlight ? 'text-yellow-400' : 'text-green-500'}`}></i>
                      {feature}
                    </li>
                  ))}
                </ul>

                <button
                  onClick={() => isPaid ? handleSubscribe(plan.id) : onClose()}
                  disabled={isCurrent}
                  className={`w-full py-3 rounded-xl font-bold transition-all active:scale-95 disabled:opacity-60 disabled:cursor-default flex items-center justify-center gap-2 ${
                    isCurrent
                      ? plan.highlight
                        ? 'bg-white/20 text-white cursor-default'
                        : 'bg-slate-100 text-slate-400 border border-slate-200 cursor-default'
                      : plan.highlight
                        ? 'bg-white text-blue-700 hover:bg-blue-50 shadow-lg'
                        : 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-200'
                  }`}
                >
                  {isCurrent
                    ? 'Seu Plano Atual'
                    : isPaid
                      ? 'Assinar Agora'
                      : 'Começar Grátis'
                  }
                </button>
              </div>
            );
          })}
        </div>
        
        <div className="bg-slate-100 dark:bg-slate-900 p-4 text-center text-xs text-slate-400">
          Pagamento processado via PaySuite — M-Pesa, EMola e cartões. Cancelamento disponível a qualquer momento.
        </div>
      </div>
    </div>
  );
};
