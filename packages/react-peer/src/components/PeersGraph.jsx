import React, { useState, useCallback, useEffect, useMemo } from 'react';

import { Box } from '@mui/material';
import ScopedCssBaseline from '@mui/material/ScopedCssBaseline';
import { getPeerConnectionsInfo, getPeerSelfInfo, updateGraphDataWithDebugInfo, DEFAULT_REFRESH_INTERVAL, THROTTLE_WAIT_TIME } from '@cerc-io/react-libp2p-debug';

import GraphWithTooltip from './GraphWithTooltip';
import { useThrottledCallback } from '../hooks/throttledCallback';

export function PeersGraph ({ node, primaryRelayMultiaddr, refreshInterval = DEFAULT_REFRESH_INTERVAL, containerHeight, ...props }) {
  const [connections, setConnections] = useState([]);

  // Callback to update connections state only on some change
  const updateConnections = useCallback(() => {
    if (!node) {
      return
    }

    const newConnections = getPeerConnectionsInfo(node, primaryRelayMultiaddr);

    setConnections(prevConnections => {
      // Compare and check if connections changed
      if (JSON.stringify(prevConnections) === JSON.stringify(newConnections)){
        // Return previous connections to prevent re-render
        return prevConnections;
      }

      return newConnections;
    })
  }, [node, primaryRelayMultiaddr]);
  const throttledUpdateConnections = useThrottledCallback(updateConnections, THROTTLE_WAIT_TIME, { leading: false });

  useEffect(() => {
    if (!node) {
      return
    }

    node.addEventListener('peer:connect', throttledUpdateConnections)
    node.addEventListener('peer:disconnect', throttledUpdateConnections)

    return () => {
      node?.removeEventListener('peer:connect', throttledUpdateConnections)
      node?.removeEventListener('peer:disconnect', throttledUpdateConnections)
    }
  }, [node, throttledUpdateConnections])

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
    if (!node) {
      return {
        nodes: [],
        links: []
      }
    }

    const debugInfo = {
      selfInfo: getPeerSelfInfo(node, primaryRelayMultiaddr),
      connInfo: connections
    }

    const {nodesMap, linksMap} = updateGraphDataWithDebugInfo(node, primaryRelayMultiaddr, debugInfo);

    return {
      nodes: Array.from(nodesMap.values()),
      links: Array.from(linksMap.values())
    }
  }, [node, primaryRelayMultiaddr, connections]);

  return (
    <ScopedCssBaseline>
      <Box mt={1} {...props}>
        <GraphWithTooltip
          data={data}
          containerHeight={containerHeight}
        />
      </Box>
    </ScopedCssBaseline>
  )
}
