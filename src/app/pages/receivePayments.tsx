import React, { useState, useEffect } from 'react';

import Wrapper from '../components/Wrapper';
import LoadingWrapper from '../components/LoadingWrapper';
import EmptyWrapper from '../components/EmptyWrapper';
import SearchBar from '../components/SearchBar';
import RPItems from '../components/RPItems';
import PaymentState from '../components/PaymentState';
import Sidebar from '../components/Sidebar';
import { useTransactions } from '../contexts/TransactionsContext';
import message2Background from '../../utils/messageToBackground';

export default function ReceivePayments() {
  const context = useTransactions();
  if (context instanceof Error) throw new Error('Context not found'); // TODO: Handle this better

  const { info, receivingState, setReceivingState } = context;

  const [filteredItems, setFilteredItems] = useState(info?.prettyItems || []);

  const [itemsMap, setItems] = useState(
    (info?.rawItems || []).map((item) => ({
      id: item.id,
      amount: 0,
      price: item.price,
    }))
  );

  const [total, setTotal] = useState(0);
  const [tip, setTip] = useState('');

  useEffect(() => {
    setFilteredItems(info?.prettyItems || []);
    setItems(
      (info?.rawItems || []).map((item) => {
        return {
          id: item.id,
          amount: 0,
          price: item.price,
        };
      })
    );
  }, [info]);

  useEffect(() => {
    const { receivedAmount, waitingAmount } = receivingState;

    if (![receivedAmount, waitingAmount].includes(null)) {
      const tipValue = receivedAmount! - waitingAmount!;

      setTip(
        tipValue.toLocaleString(undefined, {
          minimumFractionDigits: 2,
          minimumIntegerDigits: 2,
        })
      );
    }
  }, [receivingState]);

  function cancelWait() {
    message2Background('stop-watch', {});

    setReceivingState({
      name: 'default',
      waitingAmount: null,
      receivedAmount: null,
    });
  }

  function correctPrice() {
    let currentTotal = 0;
    for (let i = 0; i < itemsMap.length; i += 1) {
      currentTotal += itemsMap[i].amount * itemsMap[i].price;
    }

    setTotal(currentTotal);

    if (receivingState.name === 'waiting') {
      cancelWait();
    }
  }

  function addNum(id: number) {
    const itemsMapCopy = [...itemsMap];
    const idIndex = itemsMapCopy.findIndex((value) => value.id === id);

    itemsMapCopy[idIndex].amount += 1;
    setItems(itemsMapCopy);
    correctPrice();
  }

  function subtractNum(id: number) {
    const itemsMapCopy = [...itemsMap];

    const idIndex = itemsMapCopy.findIndex((value) => value.id === id);

    if (itemsMapCopy[idIndex].amount > 0) {
      itemsMapCopy[idIndex].amount -= 1;
      setItems(itemsMapCopy);
      correctPrice();
    }
  }

  function waitForPayment() {
    const ids: Array<number> = [];
    itemsMap.forEach((item) => {
      for (let i = 0; i < item.amount; i += 1) {
        const { id } = item;
        ids.push(id);
      }
    });

    if (ids.length > 0) {
      setReceivingState({
        ...receivingState,
        name: 'waiting',
        waitingAmount: Number(
          (total / info.currentNanoPrice).toLocaleString(undefined, {
            minimumFractionDigits: 2,
          })
        ),
      });

      message2Background('watch', { itemsId: ids });
    }
  }

  function restartState() {
    setReceivingState({
      name: 'default',
      waitingAmount: null,
      receivedAmount: null,
    });

    message2Background('update-info', {});
  }

  return (
    <>
      <Sidebar index={2} />
      <LoadingWrapper loading={info.loading}>
        <div style={{ marginLeft: '250px', padding: '50px' }}>
          <SearchBar items={filteredItems} updateItems={setFilteredItems} />

          <EmptyWrapper isEmpty={filteredItems.length === 0}>
            <RPItems
              items={filteredItems}
              itemsMap={itemsMap}
              addNum={addNum}
              subtractNum={subtractNum}
            />
          </EmptyWrapper>
          <br />
          <Wrapper condition={filteredItems.length !== 0}>
            <PaymentState
              state={receivingState.name}
              tempAmount={{
                currency: total,
                nano: total / info.currentNanoPrice,
              }}
              receivedAmount={receivingState.receivedAmount}
              waitingAmount={receivingState.waitingAmount}
              waitForPayment={waitForPayment}
              cancelWait={cancelWait}
              restartState={restartState}
            />
            <></>
          </Wrapper>
        </div>
      </LoadingWrapper>
    </>
  );
}
