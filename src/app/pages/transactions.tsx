import React, { useState } from 'react';

import LoadingWrapper from '../components/LoadingWrapper';
import EmptyWrapper from '../components/EmptyWrapper';
import TransactionsList from '../components/TransactionsList';
import Sidebar from '../components/Sidebar';
import Overlay from '../components/Overlay';

import { useTransactions } from '../contexts/TransactionsContext';

import styles from '../styles/pages/transactions.scss';

export default function Transactions() {
  const context = useTransactions();
  if (context instanceof Error) throw new Error('Context not found'); // TODO: Handle this better
  const { info } = context;

  const [overlayState, setOverlayState] = useState('deactivated');
  const [overlayContent, setOverlayContent] = useState(<></>);

  return (
    <div className={styles.transactions}>
      <Sidebar index={0} />
      <Overlay
        state={overlayState}
        deactivate={() => setOverlayState('deactivated')}
      >
        {overlayContent}
      </Overlay>
      <div className={styles.mainContent}>
        <LoadingWrapper loading={info.loading}>
          <EmptyWrapper isEmpty={info.prettyTransactions.length === 0}>
            <TransactionsList
              transactions={info.prettyTransactions}
              raw={info.rawTransactions}
              setOverlayContent={setOverlayContent}
              setOverlayState={setOverlayState}
            />
          </EmptyWrapper>
        </LoadingWrapper>
      </div>
    </div>
  );
}
