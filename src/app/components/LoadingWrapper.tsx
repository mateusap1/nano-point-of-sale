import React from 'react';

import { AiOutlineLoading3Quarters } from 'react-icons/ai';
import Wrapper from './Wrapper';

import styles from '../styles/components/void.scss';
import rotateStyle from '../styles/components/rotate.scss';

interface Props {
  children: JSX.Element;
  loading: boolean;
}

export default function LoadingWrapper({
  children,
  loading,
}: Props): JSX.Element {
  return (
    <Wrapper condition={loading}>
      <div className={styles.voidContent}>
        <AiOutlineLoading3Quarters
          className={rotateStyle.rotate}
          color="#3c3c3c"
          size="32px"
        />
      </div>
      {children}
    </Wrapper>
  );
}
