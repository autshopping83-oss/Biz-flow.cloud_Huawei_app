
import { supabase } from './supabaseClient';
import { PaymentRequest } from '../types';

const WALLET_ID = "1764016232895x517043067934736400";
const RETURN_URL = "https://biz-flow.cloud";

// Endpoints (Mantidos para referência futura se a API voltar)
const MPESA_CHECKOUT_URL = "https://mozpayment.co.mz/api/1.1/wf/pagamentorotativompesa";
const EMOLA_CHECKOUT_URL = "https://mozpayment.co.mz/api/1.1/wf/pagamentorotativoemola";
const INTERNATIONAL_CHECKOUT_URL = "https://mozpayment.co.mz/api/1.1/wf/internacional";
const CHECK_STATUS_URL = "https://mozpayment.co.mz/api/1.1/wf/payment_history";

// --- MANUAL FLOW (SUPABASE) ---

export const uploadPaymentProof = async (file: File, userId: string, userName: string): Promise<boolean> => {
  try {
    // 1. Upload File to Storage
    const fileName = `${userId}_${Date.now()}.${file.name.split('.').pop()}`;
    const { data: storageData, error: storageError } = await supabase.storage
      .from('payment_proofs')
      .upload(fileName, file);

    if (storageError) throw storageError;

    // Get Public URL
    const { data: { publicUrl } } = supabase.storage
      .from('payment_proofs')
      .getPublicUrl(fileName);

    // 2. Insert Request into Database
    const { error: dbError } = await supabase
      .from('payment_requests')
      .insert({
        user_id: userId,
        user_name: userName,
        proof_url: publicUrl,
        status: 'pending'
      });

    if (dbError) throw dbError;

    return true;
  } catch (error) {
    console.error("Erro ao enviar comprovativo:", error);
    return false;
  }
};

// --- ADMIN FUNCTIONS ---

export const getPendingRequests = async (): Promise<PaymentRequest[]> => {
  try {
    const { data, error } = await supabase
      .from('payment_requests')
      .select('*')
      .eq('status', 'pending')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error("Error fetching requests", error);
    return [];
  }
};

export const approveRequest = async (requestId: string, userId: string): Promise<boolean> => {
  try {
    // 1. Update Request Status
    const { error: reqError } = await supabase
      .from('payment_requests')
      .update({ status: 'approved' })
      .eq('id', requestId);

    if (reqError) throw reqError;

    // 2. Update User Profile to PRO
    const { error: profileError } = await supabase
      .from('profiles')
      .update({ plan: 'PRO' })
      .eq('id', userId);

    if (profileError) throw profileError;

    return true;
  } catch (error) {
    console.error("Error approving request", error);
    return false;
  }
};

export const rejectRequest = async (requestId: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('payment_requests')
      .update({ status: 'rejected' })
      .eq('id', requestId);
    if (error) throw error;
    return true;
  } catch (error) {
    console.error("Error rejecting request", error);
    return false;
  }
};


// --- LEGACY / API DOWN FUNCTIONS (Mantidas para compatibilidade) ---

export const initiateMpesaCheckout = async (name: string, phoneNumber: string): Promise<string> => {
  console.warn("API Down - Use Manual Method");
  return ""; 
};

export const initiateEmolaCheckout = async (name: string, phoneNumber: string): Promise<string> => {
  console.warn("API Down - Use Manual Method");
  return "";
};

export const initiateInternationalCheckout = async (name: string): Promise<string> => {
  console.warn("API Down - Use Manual Method");
  return "";
};

export const checkPaymentStatus = async (referencia: string) => {
    return 'FAILED'; 
};
