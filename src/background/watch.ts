import sqlite3 from 'sqlite3';
import { Database } from 'sqlite';
import WebSocket from 'isomorphic-ws';
import { insertTransaction } from './manageDB';

type DatabaseType = Database<sqlite3.Database, sqlite3.Statement>;

interface SucceededData {
  hash: string;
  amount: number;
}

// Action to subscribe to a particular address
function subscribeAddresses(socket: WebSocket, addresses: Array<string>) {
  const input = {
    action: 'subscribe',
    topic: 'confirmation',
    ack: true,
    options: {
      all_local_accounts: false,
      accounts: addresses,
    },
  };

  socket.send(JSON.stringify(input));
}

// Action to subscribe to a particular address
function unsubscribeAddresses(socket: WebSocket, addresses: Array<string>) {
  const input = {
    action: 'unsubscribe',
    topic: 'confirmation',
    ack: true,
    options: {
      accounts: addresses,
    },
  };

  socket.send(JSON.stringify(input));
}

// Action to send ping
function ping(socket: WebSocket) {
  const input = {
    action: 'ping',
  };

  socket.send(JSON.stringify(input));
}

export default async function startWatch(
  db: DatabaseType,
  socket: WebSocket,
  address: string,
  callback: (data: SucceededData | Error) => void
) {
  setInterval(function () {
    ping(socket);
  }, 5000);

  // Called when WebSocket is opened successfully
  socket.onopen = function () {
    console.log('WebSocket is now open');

    unsubscribeAddresses(socket, []);
    subscribeAddresses(socket, [address]);
  };

  // Called when WebSocket fails to open
  socket.onerror = function (error) {
    console.error('Unable to set up WebSocket');

    callback(new Error(error.message));
  };

  // Called with each new inbound WebSocket message
  socket.onmessage = function (response) {
    const { data } = response;
    if (!(typeof data === 'string')) return;

    const parsed = JSON.parse(data);

    if (parsed.topic === 'confirmation') {
      const { hash } = parsed.message;
      const { account } = parsed.message;
      const { amount } = parsed.message;
      const date = Math.floor(new Date().getTime() / 1000);
      const type = parsed.message.block.subtype;

      console.log(JSON.stringify(parsed));

      if (type === 'send' || account !== address) return;

      insertTransaction(db, hash, account, amount, date, 1);
      callback({
        hash,
        amount,
      });
    }
  };
}
