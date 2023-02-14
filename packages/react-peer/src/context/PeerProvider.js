import React from 'react';

import { Peer, createPeerId } from '@cerc-io/peer';

import { PeerContext } from './PeerContext';

export const PeerProvider = ({ relayNode, children }) => {
  const [peer, setPeer] = React.useState(null);

  React.useEffect(() => {
    const init = async () => {
      // TODO: Validate prop relayNode
      if (!relayNode) {
        throw new Error('REACT_APP_RELAY_NODE not set');
      }

      const peer = new Peer(relayNode);

      // Try to get peer id from browser's local storage
      let peerIdFromStorage = localStorage.getItem('PeerId');
      let peerIdObj;

      if (peerIdFromStorage) {
        console.log('Using saved peer id; keep the app open in only one browser tab at a time');
        peerIdObj = JSON.parse(peerIdFromStorage);
      } else {
        console.log('Creating a new peer id');
        peerIdObj = await createPeerId();
      }

      await peer.init(peerIdObj);

      // Debug
      console.log(`Peer ID: ${peer.peerId.toString()}`);

      localStorage.setItem('PeerId', JSON.stringify(peerIdObj));
      setPeer(peer);
    };

    init();

    return () => {
      if (peer.node) {
        // TODO: Await for peer close
        peer.close();
      }
    }
  }, []);

  return (
    <PeerContext.Provider value={peer}>
      {children}
    </PeerContext.Provider>
  );
};
