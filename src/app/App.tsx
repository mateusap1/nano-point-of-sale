import React, { useEffect } from 'react';

import { HashRouter, Route, Switch, Redirect } from 'react-router-dom';

import { TransactionsContextProvider } from './contexts/TransactionsContext';
import message2Background from '../utils/messageToBackground';
import updateInfo from '../utils/updateInfo';

import Authentication from './pages/authentication';
import Transactions from './pages/transactions';
import ProductsAndServices from './pages/productsAndServices';
import ReceivePayments from './pages/receivePayments';
import Settings from './pages/settings';

import './App.scss';

export default function App() {
  useEffect(() => {
    updateInfo(true);
  }, []);

  return (
    <TransactionsContextProvider>
      <HashRouter>
        <Switch>
          <Redirect
            from="/"
            exact
            to={
              localStorage.getItem('address')
                ? '/transactions'
                : '/authentication'
            }
          />
          <Route path="/authentication" exact component={Authentication} />
          <Route path="/transactions" exact component={Transactions} />
          <Route
            path="/products-and-services"
            exact
            component={ProductsAndServices}
          />
          <Route path="/receive-payments" exact component={ReceivePayments} />
          <Route path="/settings" exact component={Settings} />
        </Switch>
      </HashRouter>
    </TransactionsContextProvider>
  );
}
