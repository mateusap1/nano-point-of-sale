import React, { useEffect, useState, useRef } from 'react';

import electron from 'electron';
import LoadingWrapper from '../components/LoadingWrapper';
import EmptyWrapper from '../components/EmptyWrapper';
import ItemInput from '../components/ItemInput';
import PaSItems from '../components/PaSItems';
import Sidebar from '../components/Sidebar';
import Overlay from '../components/Overlay';

import styles from '../styles/pages/productsAndServices.scss';

import { useTransactions } from '../contexts/TransactionsContext';
import message2Background from '../../utils/messageToBackground';
import updateInfo from '../../utils/updateInfo';

const { ipcRenderer } = electron;

type PossibleInputRef = React.MutableRefObject<HTMLInputElement | null>;

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

interface RefDictionary {
  key: PossibleInputRef;
  value: string;
}

function getRefValues(refs: Array<PossibleInputRef>): Array<string | null> {
  const result: Array<string | null> = [];

  for (let i = 0; i < refs.length; i += 1) {
    if (refs[i] === null) {
      result.push(null);
    } else {
      const c = refs[i].current;
      if (c === null) {
        result.push(null);
      } else {
        result.push(c.value ? c.value : null);
      }
    }
  }

  return result;
}

function setRefValues(refs: Array<RefDictionary>): void {
  for (let i = 0; i < refs.length; i += 1) {
    if (refs[i] !== null) {
      const c = refs[i].key.current;
      if (c !== null) {
        c.value = refs[i].value;
      }
    }
  }
}

export default function ProductsAndServices() {
  const context = useTransactions();
  if (context instanceof Error) throw new Error('Context not found'); // TODO: Handle this better

  const { info, changeInfo } = context;

  const idRef: PossibleInputRef = useRef(null);
  const nameRef: PossibleInputRef = useRef(null);
  const priceRef: PossibleInputRef = useRef(null);
  const descriptionRef: PossibleInputRef = useRef(null);
  const barcodeRef: PossibleInputRef = useRef(null);
  const categoryRef: PossibleInputRef = useRef(null);
  const extraRef: PossibleInputRef = useRef(null);

  const [items, setItems] = useState(info?.prettyItems || []);
  const [overlayState, setOverlayState] = useState('deactivated');
  const [overlayContent, setOverlayContent] = useState(<></>);

  useEffect(() => {
    setItems(info?.prettyItems || []);
  }, [info]);

  function resetInputs() {
    const refs = [
      idRef,
      nameRef,
      priceRef,
      descriptionRef,
      barcodeRef,
      categoryRef,
      extraRef,
    ];
    const refList: Array<RefDictionary> = [];

    for (let i = 0; i < refs.length; i += 1) {
      refList.push({
        key: refs[i],
        value: '',
      });
    }

    setRefValues(refList);
  }

  function insertItem() {
    const [
      id,
      name,
      price,
      description,
      barcode,
      category,
      extra,
    ] = getRefValues([
      idRef,
      nameRef,
      priceRef,
      descriptionRef,
      barcodeRef,
      categoryRef,
      extraRef,
    ]);

    if (id !== null && name !== null && price !== null) {
      const prettyItemsDict: PrettyItem = {
        id,
        name,
        price: parseFloat(price).toLocaleString(undefined, {
          minimumFractionDigits: 2,
          minimumIntegerDigits: 2,
        }),
        description,
        barcode,
        category,
        extra,
      };

      const rawItemsDict = {
        id: Number(id),
        name,
        price: Number(price),
        description,
        barcode,
        category,
        extra,
      };

      message2Background('insert-item', rawItemsDict);
      updateInfo(false);
      resetInputs();
      setOverlayState('deactivated');

      const prettyItemsCopy = [...items];
      prettyItemsCopy.push(prettyItemsDict);

      const rawItemsCopy = [...info.rawItems];
      rawItemsCopy.push(rawItemsDict);

      const infoCopy = { ...info };
      infoCopy.prettyItems = prettyItemsCopy;
      infoCopy.rawItems = rawItemsCopy;

      changeInfo(infoCopy);
      setItems(prettyItemsCopy);
    }
  }

  function deleteItem(id: string) {
    message2Background('delete-item', { id });

    const prettyItemsCopy = [...items];
    const rawItemsCopy = [...info.rawItems];

    const index = prettyItemsCopy.findIndex((x) => x.id === id);

    if (index > -1) {
      prettyItemsCopy.splice(index, 1);
      rawItemsCopy.splice(index, 1);

      const infoCopy = { ...info };
      infoCopy.prettyItems = prettyItemsCopy;
      infoCopy.rawItems = rawItemsCopy;

      changeInfo(infoCopy);
      setItems(prettyItemsCopy);
    }
  }

  function importCSV() {
    ipcRenderer.invoke('show-files', {
      options: {
        properties: ['openFile'],
        filters: [{ name: 'csv', extensions: ['csv'] }],
      },
    });
  }

  return (
    <>
      <Sidebar index={1} />
      <Overlay
        state={overlayState}
        deactivate={() => setOverlayState('deactivated')}
        addItem={() => insertItem()}
      >
        {overlayContent}
      </Overlay>
      <div className={styles.pasContent}>
        <LoadingWrapper loading={info.loading}>
          <>
            <div className={styles.buttonsContainer}>
              <button
                type="button"
                onClick={() => {
                  setOverlayContent(
                    <ItemInput
                      idRef={idRef}
                      nameRef={nameRef}
                      descriptionRef={descriptionRef}
                      priceRef={priceRef}
                      barcodeRef={barcodeRef}
                      categoryRef={categoryRef}
                      extraRef={extraRef}
                    />
                  );

                  setOverlayState('add-item');
                }}
              >
                Add Item
              </button>
              <button type="button" onClick={importCSV}>
                Import CSV
              </button>
            </div>
            <hr />
            <EmptyWrapper isEmpty={items.length === 0}>
              <PaSItems
                items={items}
                setOverlayContent={setOverlayContent}
                setOverlayState={setOverlayState}
                deleteItem={deleteItem}
              />
            </EmptyWrapper>
          </>
        </LoadingWrapper>
      </div>
    </>
  );
}
