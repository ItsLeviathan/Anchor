import React from 'react';

import { ErrorBoundary } from '../components/ui';
import { BillComposer } from '../features/bills/BillComposer';

export default function BillNewScreen() {
  return (
    <ErrorBoundary>
      <BillComposer />
    </ErrorBoundary>
  );
}
