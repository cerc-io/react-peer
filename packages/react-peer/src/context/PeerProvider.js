import React from 'react';

import { Peer, createPeerId } from '@cerc-io/peer';

import { PeerContext } from './PeerContext';

export const PeerProvider = ({ relayNode, children }) => {
  const [peer, setPeer] = React.useState(null);

  React.useEffect(() => {
    const init = async () => {
      // TODO: Validate prop relayNode
      if (!relayNode) {
        throw new Error('REACT_APP_RELAY_NODE not set')
      }

      const peer = new Peer(relayNode)

      // Try to get peer id from browser's local storage
      let peerIdFromStorage = localStorage.getItem('PeerId');
      let peerIdJson

      if (peerIdFromStorage) {
        console.log('Using saved peer id; keep the app open in only one browser tab at a time')
        peerIdJson = JSON.parse(peerIdFromStorage)
      } else {
        console.log('Creating a new peer id')
        peerIdJson = await createPeerId();
      }

      await peer.init(peerIdJson);

      // Debug
      console.log(`Peer ID: ${peer.peerId.toString()}`);

      setPeer(peer);
      localStorage.setItem('PeerId', JSON.stringify(peerIdJson));
    };

    init();

    return () => {
      if (peer.node) {
        // TODO: Await for peer close
        peer.close()
      }
    }
  }, []);

  return (
    <PeerContext.Provider value={peer}>
      {children}
    </PeerContext.Provider>
  );
};
