import React from 'react';
import ReactDOM from 'react-dom/client';
import { PeerProvider, MultipleTabsChecker } from '@cerc-io/react-peer';

import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import config from './config.json';

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);
root.render(
  // TODO: StrictMode renders component twice in development which currently causes problems with instantiating peer node.
  // <React.StrictMode>
  <MultipleTabsChecker>
    <PeerProvider relayNodes={config.relayNodes ?? []} peerConfig={config.peer}>
      <App />
    </PeerProvider>
  </MultipleTabsChecker>
  // </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
