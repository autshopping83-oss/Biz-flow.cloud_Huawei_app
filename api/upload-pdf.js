// api/upload-pdf.js — Upload de PDF para Supabase Storage e retorno de URL publica
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.bizflowcloud_SUPABASE_URL;
const supabaseKey = process.env.bizflowcloud_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const BUCKET = 'documentos';

export const config = { api: { bodyParser: { sizeLimit: '50mb' } } };

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ sucesso: false, erro: 'Metodo nao permitido' });

  const { pdfBase64, nomeArquivo } = req.body;
  if (!pdfBase64) return res.status(400).json({ sucesso: false, erro: 'pdfBase64 obrigatorio' });

  try {
    atob(pdfBase64);
  } catch {
    return res.status(400).json({ sucesso: false, erro: 'pdfBase64 invalido' });
  }

  try {
    // Garantir que o bucket existe
    const { data: buckets } = await supabase.storage.listBuckets();
    if (!buckets?.find(b => b.name === BUCKET)) {
      await supabase.storage.createBucket(BUCKET, { public: true });
    }

    const buffer = Buffer.from(pdfBase64, 'base64');
    const fileName = `${Date.now()}_${nomeArquivo || 'documento.pdf'}`;

    const { data, error } = await supabase.storage
      .from(BUCKET)
      .upload(fileName, buffer, {
        contentType: 'application/pdf',
        upsert: true,
      });

    if (error) throw error;

    const { data: { publicUrl } } = supabase.storage
      .from(BUCKET)
      .getPublicUrl(fileName);

    res.json({ sucesso: true, url: publicUrl, nome: fileName });
  } catch (erro) {
    console.error('Erro upload PDF:', erro.message);
    res.status(500).json({ sucesso: false, erro: erro.message });
  }
}
