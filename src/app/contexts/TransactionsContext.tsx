import { ipcRenderer } from 'electron';
import React, { createContext, useState, useContext, useEffect } from 'react';

import updateInfo from '../../utils/updateInfo';

export const TransactionsContext = createContext({});

interface ContextProps {
  children: JSX.Element;
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

interface PrettyItem extends Item {
  id: string;
  price: string;
}

interface Details extends RawItem {
  amount: number;
}

interface Transaction {
  hash: string;
  date: number | unknown;
  amount: number | unknown;
  type: string | number;
}

interface PrettyTransaction extends Transaction {
  date: {
    date: string;
    hour: string;
  };
  amount: {
    nano: string;
    currency: string;
  };
  type: 'Send' | 'Receive';
}

interface RawTransaction extends Transaction {
  date: number;
  amount: number;
  type: 0 | 1;
  details: Array<Details> | null;
}

interface InfoType {
  loading: boolean;
  settings: {
    rpcNode: string;
    wssServer: string;
    currency: string;
  };
  currentNanoPrice: number;
  balance: {
    total: string | null;
    today: string | null;
  };
  prettyTransactions: Array<PrettyTransaction>;
  rawTransactions: Array<RawTransaction>;
  prettyItems: Array<PrettyItem>;
  rawItems: Array<RawItem>;
}

interface ReceivingStateType {
  name: 'default' | 'waiting' | 'received' | 'fail';
  waitingAmount: number | null;
  receivedAmount: number | null;
}

interface MessageArg {
  command: string;
  payload: {
    amount?: number;
    value?: boolean;
    updatedInfo?: InfoType;
  };
}

interface Context {
  info: InfoType;
  changeInfo: (info: InfoType) => void;
  updateInfo: () => void;
  receivingState: ReceivingStateType;
  setReceivingState: React.Dispatch<React.SetStateAction<ReceivingStateType>>;
}

function instanceOfContext(object: any): object is Context {
  const types: Array<string> = [
    'info',
    'changeInfo',
    'updateInfo',
    'receivingState',
    'setReceivingState',
  ];

  return types.every((element) => element in object);
}

export function TransactionsContextProvider({
  children,
}: ContextProps): JSX.Element {
  const [receivingState, setReceivingState] = useState<ReceivingStateType>({
    name: 'default',
    waitingAmount: null,
    receivedAmount: null,
  });

  function initializeInfo(): InfoType {
    const storedInfo: string | null = localStorage.getItem('info');

    const tempInfo: InfoType = storedInfo
      ? JSON.parse(storedInfo)
      : {
          loading: true,
          settings: { rpcNode: '', wssServer: '', currency: 'usd' },
          balance: { total: null, today: null },
          prettyTransactions: [],
          rawTransactions: [],
          prettyItems: [],
          rawItems: [],
        };

    return tempInfo;
  }

  const [info, setInfo] = useState<InfoType>(initializeInfo());

  function changeInfo(infoC: InfoType): void {
    setInfo(infoC);
    localStorage.setItem('info', JSON.stringify(infoC));
  }

  function error(message: string): void {
    ipcRenderer.invoke('renderer-error', { message });
  }

  const messageHandler = (_: Electron.IpcRendererEvent, arg: MessageArg) => {
    const { command } = arg;
    const { payload } = arg;

    switch (command) {
      case 'cancel-payment': {
        setReceivingState({
          ...receivingState,
          name: 'default',
        });

        break;
      }
      case 'receive-payment': {
        const { amount } = payload;
        if (typeof amount === 'undefined') break;

        const threshold = 0.01;
        const tempRcvState = { ...receivingState };

        tempRcvState.receivedAmount = amount;

        if (receivingState.waitingAmount === null) {
          error('Unexpected Payment');
        } else if (amount + threshold >= receivingState.waitingAmount) {
          tempRcvState.name = 'received';
        } else {
          tempRcvState.name = 'fail';
        }

        setReceivingState(tempRcvState);

        break;
      }
      case 'set-loading': {
        const { value } = payload;
        if (typeof value === 'undefined') break;

        const tempInfo = { ...info };

        tempInfo.loading = value;
        changeInfo(tempInfo);

        break;
      }
      case 'update-info': {
        const { updatedInfo } = payload;
        if (typeof updatedInfo === 'undefined') break;

        setInfo(updatedInfo);
        localStorage.setItem('info', JSON.stringify(updatedInfo));

        break;
      }
      default: {
        console.error('Command not found!');
      }
    }
  };

  useEffect(() => {
    return () => {
      ipcRenderer.removeListener('message-from-worker', messageHandler);
    };
  });

  ipcRenderer.on('message-from-worker', messageHandler);

  return (
    <TransactionsContext.Provider
      value={{
        info,
        changeInfo,
        updateInfo,
        receivingState,
        setReceivingState,
      }}
    >
      {children}
    </TransactionsContext.Provider>
  );
}

export function useTransactions(): Context | Error {
  const context = useContext(TransactionsContext);

  if (!instanceOfContext(context)) return new Error('Unexpected context');
  return context;
}
