import React from 'react';

import { ErrorBoundary } from '../components/ui';
import { AssignmentComposer } from '../features/assignments/AssignmentComposer';

export default function AssignmentNewScreen() {
  return (
    <ErrorBoundary>
      <AssignmentComposer />
    </ErrorBoundary>
  );
}
