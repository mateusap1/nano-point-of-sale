import React from 'react';

import { BsFillCaretUpFill, BsFillCaretDownFill } from 'react-icons/bs';

import styles from '../styles/components/tableWrapper.scss';

interface Item {
  id: number | string;
  name: string;
  description: string | null;
  barcode: string | null;
  category: string | null;
  price: number | string;
  extra: string | null;
}

interface PrettyItem extends Item {
  id: string;
  price: string;
}

interface ItemMapped {
  id: number;
  amount: number;
  price: number;
}

interface Props {
  items: Array<PrettyItem>;
  itemsMap: Array<ItemMapped>;
  addNum: (id: number) => void;
  subtractNum: (id: number) => void;
}

export default function RPItems({
  items,
  itemsMap,
  addNum,
  subtractNum,
}: Props) {
  return (
    <div className={styles.tableWrapper}>
      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>Name</th>
            <th>Price</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item, index) => (
            <tr key={item.id}>
              <td>
                <span>{item.id}</span>
              </td>
              <td>
                <span>{item.name}</span>
              </td>
              <td>
                <span>{item.price}$</span>
              </td>
              <td className={styles.iconContainer}>
                <BsFillCaretDownFill
                  size="32px"
                  color="#e63946"
                  onClick={() => {
                    subtractNum(Number(item.id));
                  }}
                />
                <span>{itemsMap[index].amount}</span>
                <BsFillCaretUpFill
                  size="32px"
                  color="#40b64c"
                  onClick={() => {
                    addNum(Number(item.id));
                  }}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
