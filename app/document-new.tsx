import React from 'react';

import { ErrorBoundary } from '../components/ui';
import { DocumentComposer } from '../features/documents/DocumentComposer';

export default function DocumentNewScreen() {
  return (
    <ErrorBoundary>
      <DocumentComposer />
    </ErrorBoundary>
  );
}
