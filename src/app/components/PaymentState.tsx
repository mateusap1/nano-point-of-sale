import React, { useEffect, useState } from 'react';

import { AiOutlineLoading3Quarters, AiFillCheckCircle } from 'react-icons/ai';
import { IoCloseCircle } from 'react-icons/io5';

import styles from '../styles/components/paymentState.scss';
import rotStyles from '../styles/components/rotate.scss';

import parseNum from '../../utils/parseNum';

interface Props {
  state: 'default' | 'waiting' | 'received' | 'fail';
  tempAmount: {
    currency: number;
    nano: number;
  };
  receivedAmount: number | null;
  waitingAmount: number | null;
  waitForPayment: () => void;
  cancelWait: () => void;
  restartState: () => void;
}

export default function PaymentState({
  state,
  tempAmount,
  receivedAmount,
  waitingAmount,
  waitForPayment,
  cancelWait,
  restartState,
}: Props) {
  const [waitingAmountStr, setWaitingAmountStr] = useState(
    parseNum(waitingAmount || 0)
  );

  const [receivedAmountStr, setReceivedAmountStr] = useState(
    parseNum(receivedAmount || 0)
  );

  const [exceed, setExceed] = useState(
    receivedAmount !== null && waitingAmount !== null
      ? receivedAmount - waitingAmount
      : 0
  );

  useEffect(() => {
    if (waitingAmount !== null) {
      setWaitingAmountStr(parseNum(waitingAmount));

      if (receivedAmount !== null) {
        setExceed(receivedAmount - waitingAmount);
      }
    }
  }, [waitingAmount]);

  useEffect(() => {
    if (receivedAmount !== null) {
      setReceivedAmountStr(parseNum(receivedAmount));

      if (waitingAmount !== null) {
        setExceed(receivedAmount - waitingAmount);
      }
    }
  }, [receivedAmount]);

  if (state === 'default') {
    return (
      <div className={styles.receiversContent}>
        <div className={styles.priceContent}>
          <span>{parseNum(tempAmount.currency)}$</span>
          <br />
          <span>{parseNum(tempAmount.nano, 4)} Nano</span>
        </div>
        <hr />
        <button type="button" onClick={waitForPayment}>
          Wait for payment
        </button>
      </div>
    );
  }
  if (state === 'waiting') {
    return (
      <div className={styles.receiversContent}>
        <div className={styles.priceContent}>
          <AiOutlineLoading3Quarters
            className={rotStyles.rotate}
            color="#3c3c3c"
            size="32px"
          />
          <hr />
          <span>Waiting for {waitingAmountStr} Nano</span>
        </div>
        <hr />
        <button type="button" onClick={cancelWait}>
          Cancel
        </button>

        {/* TODO: Add bill when user click in this button */}
        <button type="button" onClick={cancelWait}>
          Received
        </button>
      </div>
    );
  }
  if (state === 'received') {
    return (
      <div className={styles.receiversContent}>
        <div className={styles.priceContent}>
          <AiFillCheckCircle color="#40b64c" size="32px" />
          {exceed > 0 ? (
            <p>Thank your costumer for a tip of {parseNum(exceed)} Nanos</p>
          ) : null}
        </div>
        <hr />
        <button type="button" onClick={restartState}>
          Confirm
        </button>
      </div>
    );
  }
  return (
    <div className={styles.receiversContent}>
      <div className={styles.priceContent}>
        <IoCloseCircle size="32px" color="#e63946" />
        <p>Received {parseNum(exceed * -1)} Nanos less than expected</p>
      </div>
      <hr />
      <button type="button" onClick={restartState}>
        Confirm
      </button>
    </div>
  );
}
