// api/oauth2.js — Configuracao OAuth2 Google para serverless
import { google } from 'googleapis';

const CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI || 'https://biz-flow.cloud/api/auth/callback';

if (!CLIENT_ID || !CLIENT_SECRET) {
  console.error('FATAL: GOOGLE_CLIENT_ID e GOOGLE_CLIENT_SECRET nao configurados');
}

export function criarCliente(refreshToken) {
  const cliente = new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI);
  if (refreshToken) cliente.setCredentials({ refresh_token: refreshToken });
  return cliente;
}

export function gerarAuthUrl(userId) {
  if (!CLIENT_ID) throw new Error('GOOGLE_CLIENT_ID nao configurado');
  const cliente = criarCliente();
  return cliente.generateAuthUrl({
    access_type: 'offline',
    prompt: 'consent',
    scope: ['https://www.googleapis.com/auth/gmail.send'],
    state: userId,
  });
}
