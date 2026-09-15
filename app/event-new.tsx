import React from 'react';

import { ErrorBoundary } from '../components/ui';
import { EventComposer } from '../features/events/EventComposer';

export default function EventNewScreen() {
  return (
    <ErrorBoundary>
      <EventComposer />
    </ErrorBoundary>
  );
}
