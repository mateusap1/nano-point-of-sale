import React from 'react';

import LoadingWrapper from '../components/LoadingWrapper';
import Sidebar from '../components/Sidebar';
import { useTransactions } from '../contexts/TransactionsContext';
import message2Background from '../../utils/messageToBackground';

import styles from '../styles/pages/settings.scss';

type PossibleInputRef = React.MutableRefObject<HTMLInputElement | null>;
type PossibleSelectRef = React.MutableRefObject<HTMLSelectElement | null>;

export default function Settings() {
  const context = useTransactions();
  if (context instanceof Error) throw new Error('Context not found'); // TODO: Handle this better
  const { info } = context;

  const rpcNodeRef: PossibleInputRef = React.createRef();
  const wssServerRef: PossibleInputRef = React.createRef();
  const currencyRef: PossibleSelectRef = React.createRef();

  function updateChanges(): void {
    if (rpcNodeRef === null || wssServerRef === null || currencyRef === null) {
      return;
    }

    const rpcNodeC = rpcNodeRef.current;
    const wssServerC = wssServerRef.current;
    const currencyC = currencyRef.current;

    if (rpcNodeC === null || wssServerC === null || currencyC === null) {
      return;
    }

    message2Background('save-changes', {
      changes: [
        { setting: 'rpcNode', value: rpcNodeC.value },
        { setting: 'wssServer', value: wssServerC.value },
        { setting: 'currency', value: currencyC.value },
      ],
    });

    message2Background('update-info', {});
  }

  return (
    <>
      <Sidebar index={3} />
      <div className={styles.settings}>
        <LoadingWrapper loading={info.loading}>
          <div className={styles.container} id="rpcNode">
            <div className={styles.containerItem}>
              <label htmlFor="node-name">
                <span>
                  <b>RPC Node</b>
                </span>
                <input
                  name="node-name"
                  defaultValue={info.settings?.rpcNode}
                  ref={rpcNodeRef}
                />
              </label>
            </div>
            <br />
            <div className={styles.containerItem} id="wssServer">
              <label htmlFor="wss-server">
                <span>
                  <b>WebSocket Server</b>
                </span>
                <input
                  name="wss-server"
                  defaultValue={info.settings?.wssServer}
                  ref={wssServerRef}
                />
              </label>
            </div>
            <br />
            <div className={styles.containerItem} id="wssServer">
              <label htmlFor="currency">
                <span>
                  <b>Currency</b>
                </span>
                <select
                  name="currency"
                  defaultValue={info.settings?.currency}
                  ref={currencyRef}
                >
                  <option value="brl">BRL</option>
                  <option value="usd">USD</option>
                </select>
              </label>
            </div>
            <br />
            <div className={styles.bottom}>
              <button type="button" onClick={updateChanges}>
                Save
              </button>
            </div>
          </div>
        </LoadingWrapper>
      </div>
    </>
  );
}
