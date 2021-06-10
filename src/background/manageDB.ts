import sqlite3 from 'sqlite3';
import { open, Database } from 'sqlite';

import {
  convertUnixToDateAndHour,
  convertUnixToDate,
} from '../utils/manageDates';
import { getNanoPrice, getCurrentNanoPrice } from '../utils/getNanoPrice';
import { accountHistory, accountInfo } from './nanoRPC';

type DatabaseType = Database<sqlite3.Database, sqlite3.Statement>;

interface GlobalConfig {
  section_name: string;
  setting_name: string;
  setting_value: string;
  setting_type: string;
}

interface Dictionary {
  [key: string]: string;
}

interface Item {
  id: number | string;
  name: string;
  description: string | null;
  barcode: string | null;
  category: string | null;
  price: number | string;
  extra: string | null;
}

interface RawItem extends Item {
  price: number;
}

interface PrettyItem extends Item {
  price: string;
}

interface Details extends RawItem {
  amount: number;
}

interface DateFormat {
  date: string;
  hour: string;
}

interface Amount {
  nano: string | number;
  currency: string | number;
}

interface RawAmount {
  nano: number;
  currency: number;
}

interface PrettyAmount {
  nano: string;
  currency: string;
}

interface Transaction {
  hash: string;
  date: number | DateFormat;
  amount: Amount | number;
  type: string | number;
}

interface PrettyTransaction extends Transaction {
  date: DateFormat;
  amount: PrettyAmount;
  type: 'Send' | 'Receive';
}

interface RawTransaction extends Transaction {
  date: number;
  amount: RawAmount;
  type: 0 | 1;
  details: Array<Details> | null;
}

interface PureTransaction extends Transaction {
  date: number;
  amount: number;
  type: 0 | 1;
}

interface Settings {
  rpcNode: string;
  wssServer: string;
  currency: string;
}

interface Balance {
  total: string | null;
  today: string | null;
}

interface Config {
  setting: string;
  value: string;
}

interface InfoType {
  loading: boolean;
  settings: Settings;
  currentNanoPrice: number;
  balance: Balance;
  prettyTransactions: Array<PrettyTransaction>;
  rawTransactions: Array<RawTransaction>;
  prettyItems: Array<PrettyItem>;
  rawItems: Array<RawItem>;
}

function instanceOfConfig(object: any): object is Settings {
  const names: Array<string> = ['rpcNode', 'wssServer', 'currency'];

  return names.every(
    (element) => element in object && typeof element === 'string'
  );
}

export async function initializeDB(): Promise<DatabaseType | Error> {
  return new Promise((resolve, reject) => {
    open<sqlite3.Database, sqlite3.Statement>({
      filename: './db/pos.db',
      driver: sqlite3.Database,
    })
      .then((db) => {
        return resolve(db);
      })
      .catch((err) => {
        return reject(err);
      });
  });
}

export async function getConfigs(
  db: DatabaseType
): Promise<Dictionary | Error> {
  // Return the global settings added

  return new Promise((resolve, reject) => {
    db.all(
      `
            SELECT section_name, setting_name, setting_value, setting_type
            FROM global_config;
        `
    )
      .then((configs: Array<GlobalConfig>) => {
        const result: Dictionary = {};

        for (let i = 0; i < configs.length; i += 1) {
          result[configs[i].setting_name] = configs[i].setting_value;
        }

        return resolve(result);
      })
      .catch((err) => {
        return reject(err);
      });
  });
}

export async function addConfig(
  db: DatabaseType,
  sectionName: string,
  settingName: string,
  settingValue: string,
  setting_type: number
) {
  //  Insert the settings into the database

  await db.run(
    `
    INSERT INTO global_config
    (section_name, setting_name, setting_value, setting_type)
    VALUES (?, ?, ?, ?);
  `,
    [sectionName, settingName, settingValue, setting_type]
  );
}

export async function updateConfigs(db: DatabaseType, configs: Array<Config>) {
  // Update the settings from the database

  for (let i = 0; i < configs.length; i += 1) {
    const { setting, value } = configs[i];

    db.run(
      ` UPDATE global_config
            SET setting_value = ?
            WHERE setting_name = ?;`,
      [value, setting]
    );
  }
}

export async function deleteConfigs(db: DatabaseType) {
  // Delete any settings inside the database

  await db.run('DELETE FROM global_config;');
}

export async function insertItem(
  db: DatabaseType,
  id: number,
  name: string,
  description: string | null,
  barcode: string | null,
  category: string | null,
  price: number,
  extra: string | null
) {
  // Insert the items into the database

  await db.run(
    `INSERT OR IGNORE INTO items (
      id,
      name,
      description,
      barcode,
      category,
      price,
      extra
    ) VALUES (?, ?, ?, ?, ?, ?, ?);`,
    [id, name, description, barcode, category, price, extra]
  );
}

export async function deleteItem(db: DatabaseType, id: number) {
  // Delete item with the corresponding ID

  await db.run('DELETE FROM items WHERE id = ?;', [id]);
}

export async function deleteItems(db: DatabaseType) {
  // Delete any items inside the database

  await db.run('DELETE FROM items;');
}

export async function insertBill(
  db: DatabaseType,
  transactionHash: string,
  itemsId: Array<number>
) {
  const date = Math.floor(Date.now() / 1000);

  let price = await db.get(`
        SELECT SUM(price)
        FROM items
        WHERE id IN (${itemsId.join(',')})
    `);
  price = Number(price['SUM(price)'].toFixed(2));

  await db.run(
    `INSERT INTO bills (
            transaction_hash, price, date
        ) VALUES (?, ?, ?);`,
    [transactionHash, Number(price), date]
  );

  for (let i = 0; i < itemsId.length; i += 1) {
    db.run('INSERT INTO bill_items (bill_id, item_id) VALUES (?, ?);', [
      transactionHash,
      itemsId[i],
    ]);
  }
}

export async function insertTransaction(
  db: DatabaseType,
  hash: string,
  account: string,
  amount: number,
  date: number,
  type: 0 | 1
) {
  await db.run('INSERT INTO transactions VALUES (?, ?, ?, ?, ?);', [
    hash,
    account,
    amount,
    date,
    type,
  ]);
}

export async function syncTransactions(
  db: DatabaseType,
  address: string
): Promise<null | Error> {
  // Add all new transactions to the database

  const config = await getConfigs(db);
  const rows = await db.all(
    `SELECT hash FROM transactions WHERE account = :account;`,
    { ':account': address }
  );

  if (config instanceof Error) {
    return config;
  }

  if (!Object.prototype.hasOwnProperty.call(config, 'rpcNode')) {
    return new Error('Property "rpcNode" not found');
  }

  const { rpcNode } = config;
  const info = await accountInfo(address, rpcNode);

  if (info instanceof Error) {
    return info;
  }

  const head = info.confirmation_height_frontier;
  const historyBlock = await accountHistory(address, rpcNode, head);

  if (historyBlock instanceof Error) {
    return historyBlock;
  }

  const { history } = historyBlock;

  for (let i = 0; i < history.length; i += 1) {
    const block = history[i];

    if (!rows.some((row) => row.hash === block.hash)) {
      insertTransaction(
        db,
        block.hash,
        address,
        block.amount,
        block.local_timestamp,
        block.type === 'send' ? 0 : 1
      ).catch((e) => console.error(e));
    }
  }

  return null;
}

export async function getInfo(
  db: DatabaseType,
  address: string
): Promise<InfoType | Error> {
  /* Get all essential information and return it */

  // Formatted in a user-readable way
  const prettyTransactions: Array<PrettyTransaction> = [];

  // The content exactly as it is
  const rawTransactions: Array<RawTransaction> = [];

  let balanceTotal = 0;
  let balanceToday = 0;

  const pureTransactions: Array<PureTransaction> = await db.all(
    `SELECT hash, amount, date, type
            FROM transactions
            WHERE account = :account
            ORDER BY date DESC;`,
    { ':account': address }
  );

  const config = await getConfigs(db);
  if (config instanceof Error) {
    return config;
  }
  if (!instanceOfConfig(config)) {
    return new Error("Configuration table don't match necessary arguments");
  }

  const settings: Settings = config;

  const { currency } = config;

  const currentNanoPrice = getCurrentNanoPrice(currency);

  const rawItems = await db.all('SELECT * FROM items;');
  const prettyItems: Array<PrettyItem> = [];

  for (let i = 0; i < rawItems.length; i += 1) {
    prettyItems.push({
      id: rawItems[i].id,
      name: rawItems[i].name,
      description: rawItems[i].description,
      barcode: rawItems[i].barcode,
      category: rawItems[i].category,
      price: rawItems[i].price.toLocaleString(undefined, {
        minimumFractionDigits: 2,
        minimumIntegerDigits: 2,
      }),
      extra: rawItems[i].extra,
    });
  }

  for (let i = 0; i < pureTransactions.length; i += 1) {
    const { hash, amount, date, type } = pureTransactions[i];

    const parsedDate = convertUnixToDate(date * 1000);

    /* eslint-disable no-await-in-loop */
    const cachedNanoPrice = await db.get(
      'SELECT price FROM nano_price WHERE date = ? AND currency = ?',
      [date, currency]
    );
    let nanoPrice: number;

    if (typeof cachedNanoPrice !== 'undefined') {
      nanoPrice = cachedNanoPrice.price;
    } else {
      const priceResult = await getNanoPrice(currency, parsedDate);

      if (priceResult instanceof Error) {
        return priceResult;
      }
      nanoPrice = priceResult;
    }

    await db.run(
      `INSERT INTO nano_price (
                currency, price, date
            ) VALUES (?, ?, ?)`,
      [currency, nanoPrice, date]
    );

    let details: Array<Details> = await db.all(
      `SELECT *, COUNT(id) as amount FROM items WHERE id IN (
              SELECT item_id FROM bill_items WHERE bill_id = ?);`,
      hash
    );

    details = details.filter((data) => data.amount > 0);

    const convertedAmount: number =
      Math.round((amount / 10 ** 30 + Number.EPSILON) * 100) / 100;
    const parsedAmount: string = convertedAmount.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      minimumIntegerDigits: 2,
    });

    if (convertedAmount !== 0) {
      // Exact transaction amount in the user's currency
      const price = nanoPrice * (amount / 10 ** 30);

      // Transaction amount rounded two decimal digitals
      const roundPrice = Math.round((price + Number.EPSILON) * 100) / 100;

      // Transaction amount in a nicely formatted way
      const parsedPrice = `${roundPrice.toLocaleString(undefined, {
        minimumFractionDigits: 2,
        minimumIntegerDigits: 2,
      })} ${currency.toUpperCase()}`;

      const prettyAmount: PrettyAmount = {
        nano: parsedAmount,
        currency: parsedPrice,
      };

      const prettyDate = convertUnixToDateAndHour(date * 1000);
      const prettyType = type === 0 ? 'Send' : 'Receive';

      const rawAmount: RawAmount = {
        nano: amount,
        currency: price,
      };

      prettyTransactions.push({
        hash,
        date: prettyDate,
        amount: prettyAmount,
        type: prettyType,
      });

      rawTransactions.push({
        hash,
        date,
        amount: rawAmount,
        type,
        details: details.length > 0 ? details : null,
      });

      if (type === 1) {
        balanceTotal += amount;
      } else {
        balanceTotal -= amount;
      }

      if (
        new Date(date * 1000).setHours(0, 0, 0, 0) ===
          new Date().setHours(0, 0, 0, 0) &&
        type === 1
      ) {
        balanceToday += amount;
      }
    }
  }

  const waitedNanoPrice = await currentNanoPrice;
  return new Promise((resolve, reject) => {
    if (waitedNanoPrice instanceof Error) {
      return reject(waitedNanoPrice);
    }

    return resolve({
      loading: false,
      settings,
      currentNanoPrice: waitedNanoPrice,
      balance: {
        total: (
          Math.round((balanceTotal / 10 ** 30 + Number.EPSILON) * 100) / 100
        ).toLocaleString(undefined, {
          minimumFractionDigits: 2,
          minimumIntegerDigits: 2,
        }),
        today: (
          Math.round((balanceToday / 10 ** 30 + Number.EPSILON) * 100) / 100
        ).toLocaleString(undefined, {
          minimumFractionDigits: 2,
          minimumIntegerDigits: 2,
        }),
      },
      prettyTransactions,
      rawTransactions,
      prettyItems,
      rawItems,
    });
  });
}

export async function deleteTransactions(db: DatabaseType) {
  // Delete any transactions inside the database

  await db.run('DELETE FROM transactions;');
}
