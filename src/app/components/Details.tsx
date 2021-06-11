import React from 'react';

import { AiFillInfoCircle } from 'react-icons/ai';
import Wrapper from './Wrapper';
import styles from '../styles/components/details.scss';

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

interface Props {
  details: Array<ItemDetails> | null;
  setOverlayContent: (element: JSX.Element) => void;
  setOverlayState: (state: string) => void;
}

export default function Details({
  details,
  setOverlayContent,
  setOverlayState,
}: Props): JSX.Element {
  return (
    <Wrapper condition={!!details}>
      <AiFillInfoCircle
        size="32px"
        color="#457b9d"
        className={styles.activated}
        onClick={() => {
          setOverlayContent(
            <>
              {details!.map((item) => (
                <table key={item.id} className={styles.details}>
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Amount</th>
                      <th>Price</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>{item.name}</td>
                      <td>{item.amount}</td>
                      <td>{item.price * item.amount}</td>
                    </tr>
                  </tbody>
                </table>
              ))}
            </>
          );
          setOverlayState('get-info');
        }}
      />
      <AiFillInfoCircle
        size="32px"
        color="#808080"
        className={styles.deactivated}
      />
    </Wrapper>
  );
}
