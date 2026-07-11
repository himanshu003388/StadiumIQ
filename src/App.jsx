import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import Layout from './components/Layout';

import { ErrorBoundary } from './components/ErrorBoundary';

function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <Layout />
      </BrowserRouter>
    </ErrorBoundary>
  );
}

export default App;
