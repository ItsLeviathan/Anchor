import React from 'react';

import { ErrorBoundary } from '../components/ui';
import { AddSheet } from '../features/add/AddSheet';

export default function AddSheetScreen() {
  return (
    <ErrorBoundary>
      <AddSheet />
    </ErrorBoundary>
  );
}
