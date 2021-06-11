import React from 'react';

import Details from './Details';

import styles from '../styles/components/transactionsList.scss';

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

interface ItemDetails extends RawItem {
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
  details: Array<ItemDetails> | null;
}

interface Props {
  transactions: Array<PrettyTransaction>;
  raw: Array<RawTransaction>;
  setOverlayContent: (element: JSX.Element) => void;
  setOverlayState: (state: string) => void;
}

export default function TransactionsList({
  transactions,
  raw,
  setOverlayContent,
  setOverlayState,
}: Props) {
  return (
    <table className={styles.transactionsList}>
      <thead>
        <tr>
          <th>Date</th>
          <th>Amount</th>
          <th>Type</th>
        </tr>
      </thead>
      <tbody>
        {transactions.map((transaction, index) => (
          <tr key={transaction.hash}>
            <td>
              <span>{transaction.date.date}</span>
              <br />
              <span>{transaction.date.hour}</span>
            </td>
            <td>
              <span>{transaction.amount.nano} Nano</span>
              <br />
              <span>{transaction.amount.currency}</span>
            </td>
            <td>
              <span>{transaction.type}</span>
            </td>
            <td>
              <Details
                details={raw[index].details}
                setOverlayContent={setOverlayContent}
                setOverlayState={setOverlayState}
              />
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
