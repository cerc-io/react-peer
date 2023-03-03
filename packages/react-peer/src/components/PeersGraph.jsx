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

    const newConnections = peer.getConnectionsInfo();

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
    const { peerId: selfPeerId, multiaddrs: selfMultiaddrs } = peer.getSelfInfo()

    const remotePeerNodes = connections.map(connection => {
      const nodeData = {
        id: connection.peerId,
        pseudonym: getPseudonymForPeerId(connection.peerId),
        multiaddrs: [connection.multiaddr],
        colorIndex: 0,
        label: 'Peer'
      }
      
      if (connection.isPeerRelay) {
        links.push({ source: selfPeerId, target: connection.peerId })
        
        nodeData.colorIndex = 8;
        nodeData.label = 'Relay (secondary)'
  
        if (connection.isPeerRelayPrimary) {
          nodeData.colorIndex = 2;
          nodeData.label = 'Relay (primary)'
        }
      } else {
        // If relayed connection
        if (connection.type === 'relayed') {
          links.push({ source: connection.hopRelayPeerId, target: selfPeerId });
        } else {
          links.push({ source: selfPeerId, target: connection.peerId });
        }
      }
    
      return nodeData;
    })

    return {
      nodes: [
        {
          id: selfPeerId,
          pseudonym: getPseudonymForPeerId(selfPeerId),
          size: 14,
          colorIndex: 3,
          label: 'Self',
          multiaddrs: selfMultiaddrs
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
