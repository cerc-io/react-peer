import React, { useState, useCallback, useContext, useEffect, useMemo } from 'react';

import { Box } from '@mui/material';
import ScopedCssBaseline from '@mui/material/ScopedCssBaseline';
import { getPseudonymForPeerId } from '@cerc-io/peer';

import { PeerContext } from '../context/PeerContext';
import { DEFAULT_REFRESH_INTERVAL, THROTTLE_WAIT_TIME } from '../constants';
import GraphWithTooltip from './GraphWithTooltip';
import { useThrottledCallback } from '../hooks/throttledCallback';

export function PeersGraph ({ refreshInterval = DEFAULT_REFRESH_INTERVAL, ...props }) {
  const peer = useContext(PeerContext);
  const [connections, setConnections] = useState([]);

  // Callback to update connections state only on some change
  const updateConnections = useCallback(() => {
    if (!peer || !peer.node) {
      return
    }

    const newConnections = peer.node.getConnections();

    setConnections(prevConnections => {
      // Compare and check if connections changed
      if (JSON.stringify(prevConnections) === JSON.stringify(newConnections)){
        // Return previous connections to prevent re-render
        return prevConnections;
      }

      return newConnections;
    })
  }, [peer]);
  const throttledUpdateConnections = useThrottledCallback(updateConnections, THROTTLE_WAIT_TIME, { leading: false });

  useEffect(() => {
    if (!peer || !peer.node) {
      return
    }

    peer.node.addEventListener('peer:connect', throttledUpdateConnections)
    peer.node.addEventListener('peer:disconnect', throttledUpdateConnections)

    return () => {
      peer.node?.removeEventListener('peer:connect', throttledUpdateConnections)
      peer.node?.removeEventListener('peer:disconnect', throttledUpdateConnections)
    }
  }, [peer, throttledUpdateConnections])

  useEffect(() => {
    // TODO: Add event for connection close and remove refresh in interval
    const intervalID = setInterval(throttledUpdateConnections, refreshInterval);

    // Update connections immediately on first render
    throttledUpdateConnections();

    return () => {
      clearInterval(intervalID)
    }
  }, [throttledUpdateConnections])

  const data = useMemo(() => {
    if (!peer) {
      return
    }

    const links = [];
    const relayMultiaddr = peer.relayNodeMultiaddr

    const remotePeerNodes = connections.map(connection => {
      const connectionMultiAddr = connection.remoteAddr
      
      const nodeData = {
        id: connection.remotePeer.toString(),
        pseudonym: getPseudonymForPeerId(connection.remotePeer.toString()),
        multiaddrs: [connectionMultiAddr.toString()],
        colorIndex: 0,
        label: 'Peer'
      }
      
      if (peer.isRelayPeerMultiaddr(connectionMultiAddr.toString())) {
        links.push({ source: peer.peerId.toString(), target: connection.remotePeer.toString() })
        
        nodeData.colorIndex = 8;
        nodeData.label = 'Relay (secondary)'
  
        if (connectionMultiAddr.equals(relayMultiaddr)) {
          nodeData.colorIndex = 2;
          nodeData.label = 'Relay (primary)'
        }
      } else {
        // If relayed connection
        if (connectionMultiAddr.protoNames().includes('p2p-circuit')) {
          const relayPeerId = connectionMultiAddr.decapsulate('p2p-circuit/p2p').getPeerId();
          links.push({ source: relayPeerId.toString(), target: connection.remotePeer.toString() });
        } else {
          links.push({ source: peer.peerId.toString(), target: connection.remotePeer.toString() });
        }
      }
    
      return nodeData;
    })

    return {
      nodes: [
        {
          id: peer.peerId.toString(),
          pseudonym: getPseudonymForPeerId(peer.peerId.toString()),
          size: 14,
          colorIndex: 3,
          label: 'Self',
          multiaddrs: peer.node.getMultiaddrs().map(multiaddr => multiaddr.toString())
        },
        ...remotePeerNodes
      ],
      links
    };
  }, [peer, connections]);

  return (
    <ScopedCssBaseline>
      <Box mt={1} {...props}>
        { peer && (
          <GraphWithTooltip
            data={data}
            connections={connections}
            peer={peer}
          />
        )}
      </Box>
    </ScopedCssBaseline>
  )
}
