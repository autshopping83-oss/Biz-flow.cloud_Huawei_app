import Dexie, { Table } from 'dexie';
import { ReceiptData, Transaction, SavedClient, SavedProduct, CompanySettings, Product, Comment } from '../types';

export class BizFlowDB extends Dexie {
  receipts!: Table<ReceiptData>;
  transactions!: Table<Transaction>;
  clients!: Table<SavedClient>;
  products!: Table<SavedProduct>;
  catalog!: Table<Product>;
  settings!: Table<CompanySettings & { id: string }>;
  comments!: Table<Comment>;

  constructor() {
    super('BizFlowDB');
    this.version(3).stores({
      receipts: 'id, userId, clientName, date, type',
      transactions: 'id, userId, date, type, receiptId',
      clients: '++id, userId, name',
      products: '++id, userId, description',
      catalog: 'id, userId, name, category',
      settings: 'id, userId',
      comments: 'id, timestamp'
    });
  }
}

export const db = new BizFlowDB();
