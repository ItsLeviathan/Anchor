import React from 'react';

import { ErrorBoundary } from '../components/ui';
import { TaskComposer } from '../features/tasks/TaskComposer';

export default function TaskNewScreen() {
  return (
    <ErrorBoundary>
      <TaskComposer />
    </ErrorBoundary>
  );
}
