import { XMLHttpRequest } from 'xmlhttprequest-ts';

/* A good part of this code was taken from https://medium.com/nanocurrency/
getting-started-developing-with-nano-currency-part-2-interacting-with-public-
and-private-nano-adb98ef57fbf */

interface InputType {
  action: string;
  account: string;
  count?: number;
  head?: string;
}

interface Block {
  type: string;
  account: string;
  amount: string | number;
  local_timestamp: string | number;
  height: string | number;
  hash: string;
}

interface RawBlock extends Block {
  amount: string;
  local_timestamp: string;
  height: string;
}

interface ParsedBlock extends Block {
  amount: number;
  local_timestamp: number;
  height: number;
}

interface AccountInfoBlock {
  frontier: string;
  open_block: string;
  representative_block: string;
  balance: string;
  modified_timestamp: number | string;
  block_count: number | string;
  account_version: number | string;
  confirmation_height: number | string;
  confirmation_height_frontier: string;
}

interface RawAccountInfoBlock extends AccountInfoBlock {
  modified_timestamp: string;
  block_count: string;
  account_version: string;
  confirmation_height: string;
}

interface ParsedAccountInfoBlock extends AccountInfoBlock {
  modified_timestamp: number;
  block_count: number;
  account_version: number;
  confirmation_height: number;
}

interface RawAccountBalance {
  balance: string;
  pending: string;
}

interface ParsedAccountBalance {
  balance: number;
  pending: number;
}

interface AccountHistory {
  account: string;
  history: Array<Block>;
  previous?: string;
}

interface RawAccountHistory extends AccountHistory {
  history: Array<RawBlock>;
}

interface ParsedAccountHistory extends AccountHistory {
  history: Array<ParsedBlock>;
}

function instanceOfAccountBalance(object: any): object is RawAccountBalance {
  const types: Array<string> = ['balance', 'pending'];

  return types.every((element) => element in object);
}

function instanceOfAccountHistory(object: any): object is AccountHistory {
  const types: Array<string> = ['account', 'history'];

  return types.every((element) => element in object);
}

function instanceOfAccountInfoBlock(
  object: any
): object is RawAccountInfoBlock {
  const types: Array<string> = [
    'frontier',
    'open_block',
    'representative_block',
    'balance',
    'modified_timestamp',
    'block_count',
    'account_version',
    'confirmation_height',
    'confirmation_height_frontier',
  ];

  return types.every((element) => element in object);
}

function parseBlock(block: RawBlock): ParsedBlock {
  return {
    ...block,
    amount: Number(block.amount),
    local_timestamp: Number(block.local_timestamp),
    height: Number(block.height),
  };
}

function parseHistory(history: Array<RawBlock>): Array<ParsedBlock> {
  const result: Array<ParsedBlock> = [];
  for (let i = 0; i < history.length; i += 1) {
    result.push(parseBlock(history[i]));
  }

  return result;
}

const REQUEST_TIMEOUT = 10 * 1000;

// Send a POST request and return a Promise
async function post(
  url: string,
  params: unknown
): Promise<
  RawAccountHistory | RawAccountBalance | RawAccountInfoBlock | Error
> {
  return new Promise((resolve, reject) => {
    const xhttp = new XMLHttpRequest();
    xhttp.timeout = REQUEST_TIMEOUT;

    xhttp.onreadystatechange = function () {
      if (this.readyState === 4 && this.status === 200) {
        try {
          resolve(JSON.parse(this.responseText));
          return;
        } catch (e) {
          console.error('Failed to parse response from node');
          console.error(this.responseText);
          reject(e);
        }
      } else if (this.readyState === 4 && this.status !== 200) {
        console.error(`Failed to connect to ${url}`);
        reject(
          new Error(`Error ${this.status} while trying to connect to ${url}`)
        );
      }
    };

    xhttp.open('POST', url, true);
    xhttp.setRequestHeader('Content-Type', 'application/json');
    xhttp.send(JSON.stringify(params));
  });
}

export async function accountBalance(
  address: string,
  rpcServer: string
): Promise<ParsedAccountBalance | Error> {
  const input: InputType = {
    action: 'account_balance',
    account: address,
  };

  return new Promise((resolve, reject) => {
    post(rpcServer, input)
      .then((info) => {
        if (!instanceOfAccountBalance(info)) {
          return reject(new Error('Received unidentified content'));
        }

        const result: ParsedAccountBalance = {
          balance: Number(info.balance),
          pending: Number(info.pending),
        };

        return resolve(result);
      })
      .catch((e) => {
        reject(e);
      });
  });
}

export async function accountHistory(
  address: string,
  rpcServer: string,
  head: string | null = null
): Promise<ParsedAccountHistory | Error> {
  const input: InputType = {
    action: 'account_history',
    account: address,
    count: -1,
  };

  if (head !== null) {
    input.head = head;
  }

  return new Promise((resolve, reject) => {
    post(rpcServer, input)
      .then((info) => {
        if (!instanceOfAccountHistory(info)) {
          return reject(new Error('Received unidentified content'));
        }

        const result: ParsedAccountHistory = {
          ...info,
          history: parseHistory(info.history),
        };

        return resolve(result);
      })
      .catch((e: Error) => {
        reject(e);
      });
  });
}

export async function accountInfo(
  address: string,
  rpcServer: string
): Promise<ParsedAccountInfoBlock | Error> {
  const input: InputType = {
    action: 'account_info',
    account: address,
  };

  return new Promise((resolve, reject) => {
    post(rpcServer, input)
      .then((info) => {
        if (!instanceOfAccountInfoBlock(info)) {
          return reject(new Error('Received unidentified content'));
        }

        const result: ParsedAccountInfoBlock = {
          ...info,
          modified_timestamp: Number(info.modified_timestamp),
          block_count: Number(info.block_count),
          account_version: Number(info.account_version),
          confirmation_height: Number(info.confirmation_height),
        };

        return resolve(result);
      })
      .catch((e) => {
        reject(e);
      });
  });
}
