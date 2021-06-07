import React, { useEffect } from 'react';
import { ipcRenderer } from 'electron';
import WebSocket from 'isomorphic-ws';
import sqlite3 from 'sqlite3';
import { Database } from 'sqlite';

import insertItemsCSV from '../background/manageCSV';
import startWatch from '../background/watch';
import {
  initializeDB,
  syncTransactions,
  getInfo,
  insertItem,
  deleteItem,
  insertBill,
  updateConfigs,
  getConfigs,
} from '../background/manageDB';

type DatabaseType = Database<sqlite3.Database, sqlite3.Statement>;

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
  id: number;
  price: number;
}

interface ImportCsvArgs {
  csvPath: string;
}

interface DeleteItemArgs {
  id: number;
}

interface WatchArgs {
  itemsId: Array<number>;
}

interface SaveChangesArgs {
  changes: Array<Dictionary>;
}

interface Arguments {
  command: string;
  payload:
    | ImportCsvArgs
    | RawItem
    | DeleteItemArgs
    | WatchArgs
    | SaveChangesArgs
    | Error;
}

interface Match {
  [key: string]: Array<string | null>;
}

const nano = 10 ** 30;
let socket: WebSocket;

function instanceOfAny(object: any, match: Match): boolean {
  if (typeof object !== 'object' || object === null) return false;

  for (let i = 0; i < Object.keys(match).length; i += 1) {
    const key = Object.keys(match)[i];

    if (key === null) return false;
    if (!(key in object)) return false;
    if (!(object === null && match[key].includes(null))) {
      if (!(typeof object[key] in match[key])) return false;
    }
  }

  return true;
}

function instanceOfImportCsvArgs(object: any): object is ImportCsvArgs {
  if (typeof object !== 'object' || object === null) return false;

  const match: Match = { csvPath: ['string'] };

  return instanceOfAny(object, match);
}

function instanceRawItem(object: any): object is RawItem {
  if (typeof object !== 'object' || object === null) return false;

  const match: Match = {
    id: ['number', null],
    name: ['string', null],
    description: ['string', null],
    price: ['number', null],
    barcode: ['string', null],
    category: ['string', null],
    extra: ['string', null],
  };

  return instanceOfAny(object, match);
}

function instanceOfDeleteItemArgs(object: any): object is DeleteItemArgs {
  if (typeof object !== 'object' || object === null) return false;

  const match: Match = { id: ['number'] };

  return instanceOfAny(object, match);
}

function instanceOfWatchArgs(object: any): object is WatchArgs {
  if (typeof object !== 'object' || object === null) return false;

  const keys = Object.keys(object);
  const values = Object.values(object);

  if (keys.length === 0 || values.length === 0) return false;
  if (keys[0] !== 'itemsId') return false;
  if (!Array.isArray(values[0])) return false;

  for (let i = 0; i < values[0].length; i += 1) {
    if (typeof values[0][i] !== 'number') return false;
  }

  return true;
}

function instanceOfSaveChangesArgs(object: any): object is SaveChangesArgs {
  if (typeof object !== 'object' || object === null) return false;

  const keys = Object.keys(object);
  const values = Object.values(object);

  if (keys !== ['changes']) return false;
  if (!Array.isArray(values[0])) return false;

  for (let i = 0; i < values[0].length; i += 1) {
    if (typeof values[0][i] !== 'object' || values[0][i] === null) return false;
  }

  return true;
}

// Send message to main renderer
function message2UI(command: string, payload: unknown): void {
  ipcRenderer.invoke('message-from-worker', {
    command,
    payload,
  });
}

function error(message: string): void {
  // Send message to main, which will display an error with it

  ipcRenderer.invoke('renderer-error', { message });
}

async function updateInfo(db: DatabaseType): Promise<Error | void> {
  // Synchronize transactions and update data stored

  message2UI('set-loading', { value: true });

  const address = localStorage.getItem('address');
  if (!address) {
    return;
  }

  await syncTransactions(db, address);
  getInfo(db, address)
    .then((info) => {
      message2UI('update-info', {
        updatedInfo: info,
      });

      return null;
    })
    .catch((e) => {
      error('Program crashed, try restarting it');
      return new Promise((resolve, reject) => reject(e));
    });
}

async function handleWatch(db: DatabaseType, payload: unknown) {
  console.log('Starting "handleWatch"');

  // Start watching for new txs
  if (!instanceOfWatchArgs(payload)) return;

  const { itemsId } = payload;
  const configs = await getConfigs(db);

  if (configs instanceof Error) {
    error(configs.message);
    return;
  }
  console.log(JSON.stringify(configs));
  if (!Object.prototype.hasOwnProperty.call(configs, 'wssServer')) {
    error('No "wssServer" property');
    return;
  }

  const { wssServer } = configs;
  const address = localStorage.getItem('address');
  if (!address) {
    error('Address not found');
    return;
  }

  socket = new WebSocket(wssServer);

  console.log(socket);

  startWatch(db, socket, address, (data) => {
    socket.close();

    if (!(data instanceof Error)) {
      message2UI('receive-payment', {
        amount: data.amount / nano,
      });
      insertBill(db, data.hash, itemsId);
    } else {
      error(data.message);
      message2UI('cancel-payment', {});
    }
  });
}

function handleMessageFromMain(_: Electron.IpcRendererEvent, arg: Arguments) {
  const { command, payload } = arg;

  initializeDB()
    .then((db) => {
      if (db instanceof Error) {
        error(db.message);
        return db;
      }

      switch (command) {
        case 'update-info': {
          // Sync and update data
          updateInfo(db);
          break;
        }
        case 'import-csv': {
          // Add items according to csv
          if (!instanceOfImportCsvArgs(payload)) break; // Problem here or before here

          const { csvPath } = payload;

          insertItemsCSV(db, csvPath);
          break;
        }
        case 'insert-item': {
          // Insert item
          if (!instanceRawItem(payload)) break;

          const {
            id,
            name,
            price,
            description,
            barcode,
            category,
            extra,
          } = payload;

          insertItem(
            db,
            id,
            name,
            description,
            barcode,
            category,
            price,
            extra
          );
          updateInfo(db);
          break;
        }
        case 'delete-item': {
          // Delete item with given ID
          if (!instanceOfDeleteItemArgs(payload)) break;

          const dId = payload.id;

          deleteItem(db, dId);
          updateInfo(db);
          break;
        }
        case 'watch': {
          handleWatch(db, payload);

          break;
        }
        case 'stop-watch': {
          if (socket) {
            // Stop watching for new txs
            socket.close();
          }
          break;
        }
        case 'save-changes': {
          // Update db if config changes
          if (!instanceOfSaveChangesArgs(payload)) break;
          const { changes } = payload;
          updateConfigs(db, changes);

          break;
        }
        default:
          console.log('Hidden: Command not found!');
      }

      return null;
    })
    .catch((err) => {
      error(err.message);
    });
}

export default function App() {
  ipcRenderer.on('message-from-main', (event, arg) => {
    handleMessageFromMain(event, arg);
  });

  return <></>;
}
