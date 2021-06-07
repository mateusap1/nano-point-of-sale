import React from 'react';

interface Props {
  children: [JSX.Element, JSX.Element];
  condition: boolean;
}

export default function Wrapper({ children, condition }: Props): JSX.Element {
  return <>{condition ? children[0] : children[1] || null}</>;
}
