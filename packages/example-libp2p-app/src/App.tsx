import React, { useEffect, useState } from 'react';

import { Libp2p } from 'libp2p';
import { DebugPanel } from '@cerc-io/react-libp2p-debug';

import logo from './logo.svg';
import './App.css';
import { initLibp2p } from './utils';

function App() {
  const [libp2pNode, setLibp2pNode] = useState<Libp2p | null>(null)

  useEffect(() => {
    let node: Libp2p | null = null;

    initLibp2p().then(libp2p => {
      node = libp2p;
      setLibp2pNode(node);
    })

    return () => {
      if (node) {
        node.stop();
        setLibp2pNode(null);
      }
    }
  }, [])

  return (
    <div className="App">
      <header className="App-header">
        <img src={logo} className="App-logo" alt="logo" />
        <p>
          Edit <code>src/App.tsx</code> and save to reload.
        </p>
        <a
          className="App-link"
          href="https://reactjs.org"
          target="_blank"
          rel="noopener noreferrer"
        >
          Learn React
        </a>
      </header>
      <DebugPanel node={libp2pNode} />
    </div>
  );
}

export default App;
