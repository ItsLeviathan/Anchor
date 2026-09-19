import React from 'react';

import { ErrorBoundary } from '../components/ui';
import { ShoppingItemComposer } from '../features/shopping/ShoppingItemComposer';

export default function ShoppingItemNewScreen() {
  return (
    <ErrorBoundary>
      <ShoppingItemComposer />
    </ErrorBoundary>
  );
}
