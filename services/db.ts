
import Dexie, { Table } from 'dexie';
import { ReceiptData, Transaction, SavedClient, SavedProduct, CompanySettings } from '../types';

export interface SyncQueueItem {
  id?: number;
  table: string;
  action: 'INSERT' | 'UPDATE' | 'DELETE';
  data: any;
  timestamp: number;
}

export class BizFlowDB extends Dexie {
  receipts!: Table<ReceiptData>;
  transactions!: Table<Transaction>;
  clients!: Table<SavedClient>;
  products!: Table<SavedProduct>;
  settings!: Table<CompanySettings & { id: string }>;
  syncQueue!: Table<SyncQueueItem>;

  constructor() {
    super('BizFlowDB');
    this.version(1).stores({
      receipts: 'id, userId, clientName, date, type',
      transactions: 'id, userId, date, type',
      clients: '++id, userId, name',
      products: '++id, userId, description',
      settings: 'id, userId',
      syncQueue: '++id, table, timestamp'
    });
  }
}

export const db = new BizFlowDB();
