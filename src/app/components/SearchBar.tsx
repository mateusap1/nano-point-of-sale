import React from 'react';

import { IoSearch } from 'react-icons/io5';

import styles from '../styles/components/searchBar.scss';

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

interface Props {
  items: Array<PrettyItem>;
  updateItems: (newItems: Array<PrettyItem>) => void;
}

function filterItems(
  element: React.ChangeEvent<HTMLInputElement>,
  items: Array<PrettyItem>,
  updateItems: (newItems: Array<PrettyItem>) => void
): void {
  const searchString = element.target.value.toLowerCase();
  updateItems(
    items.filter((item) => {
      return (
        item.name.toLowerCase().includes(searchString) ||
        item.id.toString().toLowerCase().includes(searchString) ||
        item.price.includes(searchString)
      );
    })
  );
}

export default function SearchBar({ items, updateItems }: Props) {
  return (
    <div className={styles.searchBar}>
      <input
        type="text"
        placeholder="Search"
        onChange={(el) => filterItems(el, items, updateItems)}
      />
      <IoSearch id="searchIcon" size="24px" color="#3c3c3c" />
    </div>
  );
}
