import parse from 'csv-parse/lib/sync';
import { promises as fsp } from 'fs';
import sqlite3 from 'sqlite3';
import { Database } from 'sqlite';
import { insertItem, initializeDB } from './manageDB';

type DatabaseType = Database<sqlite3.Database, sqlite3.Statement>;

interface Item {
  id: number | string;
  name: string;
  description?: string;
  barcode?: string;
  category?: string;
  price: number | string;
  extra?: string;
}

export default async function insertItemsCSV(
  db: DatabaseType,
  inputPath: string
): Promise<Error | void> {
  const fileData = await fsp.readFile(inputPath);
  const rows: Array<Item> = parse(fileData, {
    columns: true,
    trim: true,
    skipEmptyLines: true,
  });

  for (let i = 0; i < rows.length; i += 1) {
    const item = rows[i];

    const id = Number(item.id) || null;
    const name = item.name || null;
    const description = item.description || null;
    const barcode = item.barcode || null;
    const category = item.category || null;
    const price = +item.price || null;
    const extra = item.extra || null;

    // The id, name and price values are required
    if (id !== null && name !== null && price !== null) {
      insertItem(db, id, name, description, barcode, category, price, extra);
    }
  }
}
