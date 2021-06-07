import React from 'react';

import { AiFillInfoCircle } from 'react-icons/ai';
import { IoCloseCircle } from 'react-icons/io5';

import styles from '../styles/components/pasItems.scss';
import overlayStyles from '../styles/components/overlay.scss';

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

interface Props {
  items: Array<PrettyItem>;
  setOverlayContent: (element: JSX.Element) => void;
  setOverlayState: (state: string) => void;
  deleteItem: (id: string) => void;
}

export default function PaSItems({
  items,
  setOverlayContent,
  setOverlayState,
  deleteItem,
}: Props) {
  return (
    <table className={styles.pasItems}>
      <thead>
        <tr>
          <th>ID</th>
          <th>Name</th>
          <th>Price</th>
        </tr>
      </thead>
      <tbody>
        {items.map((item) => (
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
              <AiFillInfoCircle
                size="32px"
                color="#457b9d"
                onClick={() => {
                  setOverlayContent(
                    <>
                      <div key={item.id}>
                        <div className={overlayStyles.overlayElement}>
                          <span>
                            <b>ID</b>
                          </span>
                          <span>{item.id}</span>
                        </div>
                        <br />
                        <div className={overlayStyles.overlayElement}>
                          <span>
                            <b>Name</b>
                          </span>
                          <span>{item.name}</span>
                        </div>
                        <br />
                        <div className={overlayStyles.overlayElement}>
                          <span>
                            <b>Price</b>
                          </span>
                          <span>{item.price}$ USD</span>
                        </div>
                        <br />
                        <div className={overlayStyles.overlayElement}>
                          <span>
                            <b>Description</b>
                          </span>
                          <span>{item.description}</span>
                        </div>
                        <br />
                        <div className={overlayStyles.overlayElement}>
                          <span>
                            <b>Barcode</b>
                          </span>
                          <span>{item.barcode}</span>
                        </div>
                        <br />
                        <div className={overlayStyles.overlayElement}>
                          <span>
                            <b>Category</b>
                          </span>
                          <span>{item.category}</span>
                        </div>
                        <br />
                        <div className={overlayStyles.overlayElement}>
                          <span>
                            <b>Extra</b>
                          </span>
                          <span>{item.extra}</span>
                        </div>
                      </div>
                    </>
                  );
                  setOverlayState('get-info');
                }}
              />
              <IoCloseCircle
                size="32px"
                color="#e63946"
                onClick={() => {
                  deleteItem(item.id);
                }}
              />
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
