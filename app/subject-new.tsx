import React from 'react';

import { ErrorBoundary } from '../components/ui';
import { SubjectComposer } from '../features/subjects/SubjectComposer';

export default function SubjectNewScreen() {
  return (
    <ErrorBoundary>
      <SubjectComposer />
    </ErrorBoundary>
  );
}
