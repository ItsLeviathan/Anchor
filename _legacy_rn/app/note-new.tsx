import React from 'react';

import { ErrorBoundary } from '../components/ui';
import { NoteComposer } from '../features/notes/NoteComposer';

export default function NoteNewScreen() {
  return (
    <ErrorBoundary>
      <NoteComposer />
    </ErrorBoundary>
  );
}
