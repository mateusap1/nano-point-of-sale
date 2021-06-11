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
  changes: Array<Config>;
}

interface UpdateInfoArgs {
  sync: boolean;
}

interface Arguments {
  command: string;
  payload:
    | ImportCsvArgs
    | RawItem
    | DeleteItemArgs
    | WatchArgs
    | SaveChangesArgs
    | Error
    | UpdateInfoArgs;
}

interface Match {
  [key: string]: Array<string | null>;
}

interface Config {
  setting: string;
  value: string;
}

const nano = 10 ** 30;
let socket: WebSocket;

// InstanceOf functions

function instanceOfAny(object: any, match: Match): boolean {
  if (typeof object !== 'object' || object === null) return false;

  for (let i = 0; i < Object.keys(match).length; i += 1) {
    const key = Object.keys(match)[i];

    if (key === null) return false;
    if (!(key in object)) return false;

    if (!(object[key] === null && match[key].includes(null))) {
      if (!match[key].includes(typeof object[key])) {
        return false;
      }
    }
  }

  return true;
}

function instanceOfImportCsvArgs(object: unknown): object is ImportCsvArgs {
  if (typeof object !== 'object' || object === null) return false;

  const match: Match = { csvPath: ['string'] };

  return instanceOfAny(object, match);
}

function instanceRawItem(object: unknown): object is RawItem {
  if (typeof object !== 'object' || object === null) return false;

  const match: Match = {
    id: ['number'],
    name: ['string'],
    description: ['string', null],
    price: ['number'],
    barcode: ['string', null],
    category: ['string', null],
    extra: ['string', null],
  };

  return instanceOfAny(object, match);
}

function instanceOfDeleteItemArgs(object: unknown): object is DeleteItemArgs {
  if (typeof object !== 'object' || object === null) return false;

  const match: Match = { id: ['number'] };

  return instanceOfAny(object, match);
}

function instanceOfWatchArgs(object: unknown): object is WatchArgs {
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

function instanceOfSaveChangesArgs(object: unknown): object is SaveChangesArgs {
  if (typeof object !== 'object' || object === null) return false;

  const keys = Object.keys(object);
  const values = Object.values(object);

  if (keys.length === 0 || values.length === 0) return false;
  if (keys[0] !== 'changes') return false;
  if (!Array.isArray(values[0])) return false;

  const match: Match = { setting: ['string'], value: ['string'] };

  instanceOfAny(object, match);

  for (let i = 0; i < values[0].length; i += 1) {
    if (!instanceOfAny(values[0][i], match)) return false;
  }

  return true;
}

function instanceOfUpdateInfoArgs(object: unknown): object is UpdateInfoArgs {
  if (typeof object !== 'object' || object === null) return false;

  const match: Match = { sync: ['boolean'] };

  return instanceOfAny(object, match);
}

function message2UI(command: string, payload: unknown): void {
  // Send message to main renderer

  ipcRenderer.invoke('message-from-worker', {
    command,
    payload,
  });
}

function error(message: string): void {
  // Send message to main, which will display an error with it

  ipcRenderer.invoke('renderer-error', { message });
}

async function updateInfo(
  db: DatabaseType,
  sync: boolean
): Promise<Error | null> {
  // Synchronize transactions and update data stored

  message2UI('set-loading', { value: true });

  const address = localStorage.getItem('address');
  if (!address) {
    return null;
  }

  if (sync) {
    await syncTransactions(db, address);
  }

  return new Promise((resolve, reject) => {
    getInfo(db, address)
      .then((info) => {
        message2UI('update-info', {
          updatedInfo: info,
        });

        return resolve(null);
      })
      .catch((e) => {
        error('Program crashed, try restarting it');
        return reject(e);
      });
  });
}

async function handleWatch(db: DatabaseType, payload: unknown) {
  // Start watching for new txs
  if (!instanceOfWatchArgs(payload)) return;

  const { itemsId } = payload;
  const configs = await getConfigs(db);

  if (configs instanceof Error) {
    error(configs.message);
    return;
  }

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

  startWatch(db, socket, address, (data) => {
    if (socket.readyState === socket.OPEN) {
      console.log('Closing WebSocket...');
      socket.close();
    }

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
          if (!instanceOfUpdateInfoArgs(payload)) break;

          const { sync } = payload;

          updateInfo(db, sync);
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
          // updateInfo(db);
          break;
        }
        case 'delete-item': {
          // Delete item with given ID
          if (!instanceOfDeleteItemArgs(payload)) break;

          const dId = payload.id;

          deleteItem(db, dId);
          updateInfo(db, false);
          break;
        }
        case 'watch': {
          handleWatch(db, payload);

          break;
        }
        case 'stop-watch': {
          if (socket.readyState === socket.OPEN) {
            console.log('Closing WebSocket...');
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
          console.error('Hidden: Command not found!');
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
