import React from 'react';

import { ErrorBoundary } from '../components/ui';
import { ExpenseComposer } from '../features/expenses/ExpenseComposer';

export default function ExpenseNewScreen() {
  return (
    <ErrorBoundary>
      <ExpenseComposer />
    </ErrorBoundary>
  );
}
