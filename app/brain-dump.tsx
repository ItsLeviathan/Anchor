import React from 'react';

import { ErrorBoundary } from '../components/ui';
import { BrainDumpComposer } from '../features/brain-dump/BrainDumpComposer';

export default function BrainDumpScreen() {
  return (
    <ErrorBoundary>
      <BrainDumpComposer />
    </ErrorBoundary>
  );
}
