import React from 'react';

import Wrapper from './Wrapper';
import styles from '../styles/components/empty.scss';

interface Props {
  children: JSX.Element;
  isEmpty: boolean;
}

export default function EmptyWrapper({
  children,
  isEmpty,
}: Props): JSX.Element {
  return (
    <Wrapper condition={isEmpty}>
      <div className={styles.emptyContainer}>
        <span>Empty</span>
      </div>
      {children}
    </Wrapper>
  );
}
