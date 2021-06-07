import React from 'react';
import { useHistory } from 'react-router-dom';
import message2Background from '../../utils/messageToBackground';

import styles from '../styles/pages/authentication.scss';

export default function Authentication() {
  const addressRef: React.RefObject<HTMLTextAreaElement> = React.createRef();
  const history = useHistory();

  function updateInput() {
    if (addressRef === null) return;

    const { current } = addressRef;
    if (current === null) return;

    current.style.height = '1px';
    current.style.height = `${current.scrollHeight}px`;
  }

  function submitAddress() {
    if (addressRef === null) return;

    const { current } = addressRef;
    if (current === null) return;

    if (current.value !== '') {
      localStorage.setItem('address', current.value);
      history.push('/transactions');
      message2Background('update-info', {});
    }
  }

  return (
    <div>
      <div className={styles.authContent}>
        <div>
          <label htmlFor="address">
            <b>Nano address</b>
            <div>
              <textarea
                name="address"
                ref={addressRef}
                rows={1}
                onKeyUp={updateInput}
              />
              <button type="button" onClick={submitAddress}>
                Next
              </button>
            </div>
          </label>
        </div>
      </div>
    </div>
  );
}
