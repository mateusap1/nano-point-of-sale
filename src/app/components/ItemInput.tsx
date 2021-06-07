import React from 'react';

import styles from '../styles/components/itemInput.scss';
import overlayStyles from '../styles/components/overlay.scss';

type PossibleInputRef = React.MutableRefObject<HTMLInputElement | null>;

interface Props {
  idRef: PossibleInputRef;
  nameRef: PossibleInputRef;
  descriptionRef: PossibleInputRef;
  priceRef: PossibleInputRef;
  barcodeRef: PossibleInputRef;
  categoryRef: PossibleInputRef;
  extraRef: PossibleInputRef;
}

export default function ItemInput({
  idRef,
  nameRef,
  descriptionRef,
  priceRef,
  barcodeRef,
  categoryRef,
  extraRef,
}: Props) {
  return (
    <div className={styles.itemInput}>
      <div className={overlayStyles.overlayElement}>
        <label htmlFor="id">
          <span>
            <b>ID</b>
          </span>
          <input ref={idRef} type="number" name="id" min={0} step="1" />
        </label>
      </div>
      <br />
      <div className={overlayStyles.overlayElement}>
        <label htmlFor="name">
          <span>
            <b>Name</b>
          </span>
          <input ref={nameRef} type="text" name="name" />
        </label>
      </div>
      <br />
      <div className={overlayStyles.overlayElement}>
        <label htmlFor="price">
          <span>
            <b>Price</b>
          </span>
          <input ref={priceRef} type="number" name="price" min={0} step="any" />
        </label>
      </div>
      <br />
      <div className={overlayStyles.overlayElement}>
        <label htmlFor="description">
          <span>
            <b>Description</b>
          </span>
          <input ref={descriptionRef} type="text" name="description" />
        </label>
      </div>
      <br />
      <div className={overlayStyles.overlayElement}>
        <label htmlFor="barcode">
          <span>
            <b>Barcode</b>
          </span>
          <input ref={barcodeRef} type="text" name="barcode" />
        </label>
      </div>
      <br />
      <div className={overlayStyles.overlayElement}>
        <label htmlFor="category">
          <span>
            <b>Category</b>
          </span>
          <input ref={categoryRef} type="text" name="category" />
        </label>
      </div>
      <br />
      <div className={overlayStyles.overlayElement}>
        <label htmlFor="extra">
          <span>
            <b>Extra</b>
          </span>
          <input ref={extraRef} type="text" name="extra" />
        </label>
      </div>
    </div>
  );
}
