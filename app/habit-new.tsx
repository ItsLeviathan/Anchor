import React from 'react';

import { ErrorBoundary } from '../components/ui';
import { HabitComposer } from '../features/habits/HabitComposer';

export default function HabitNewScreen() {
  return (
    <ErrorBoundary>
      <HabitComposer />
    </ErrorBoundary>
  );
}
