import React, { useState, useCallback, useContext, useEffect, useMemo } from 'react';

import { Box } from '@mui/material';
import ScopedCssBaseline from '@mui/material/ScopedCssBaseline';
import LoadingButton from '@mui/lab/LoadingButton';
import { getPseudonymForPeerId } from '@cerc-io/peer';

import { PeerContext } from '../context/PeerContext';
import { DEFAULT_REFRESH_INTERVAL, THROTTLE_WAIT_TIME } from '../constants';
import GraphWithTooltip from './GraphWithTooltip';
import { useThrottledCallback } from '../hooks/throttledCallback';

const STYLES = {
  container: {
    position: 'relative'
  },
  udpateButton: {
    position: 'absolute',
    left: 0,
    top: 0
  }
}

export function NetworkGraph ({ refreshInterval = DEFAULT_REFRESH_INTERVAL, sx, ...props }) {
  const peer = useContext(PeerContext);
  const [isLoading, setIsLoading] = useState(false)
  const [debugInfos, setDebugInfos] = useState([])
  const [data, setData] = useState({ nodes: [], links: [] })

  const handleNetworkUpdate = useCallback(() => {
    if (!peer) {
      return
    }

    setIsLoading(true)
    setData({ nodes: [], links: [] })
    peer.requestPeerInfo();
    
    const updateSelfDebugInfo = async () => {
      const selfDebugInfo = await peer.getPeerInfo();
      selfDebugInfo.selfInfo.isSelf = true;

      setDebugInfos(prevDebugInfos => prevDebugInfos.concat(selfDebugInfo));
    }

    updateSelfDebugInfo();
  }, [peer]);

  useEffect(() => {
    if (!peer) {
      return
    }

    const unsubscribeDebugInfo = peer.subscribeDebugInfo((peerId, msg) => {
      if (msg.type === 'Response' && msg.dst === peer.peerId?.toString()) {
        setDebugInfos(prevPeerInfos => prevPeerInfos.concat(msg.peerInfo))
      }
    })

    return unsubscribeDebugInfo
  }, [peer]);

  const handleDebugInfos = useCallback((newDebugInfos) => {
    setData(prevData => {
      const nodesMap = prevData.nodes.reduce((acc, node) => {
        acc.set(node.id, node);
        return acc;
      }, new Map());

      const linksMap = prevData.links.reduce((acc, link) => {
        acc.set(link.id, link);
        return acc;
      }, new Map());

      newDebugInfos.forEach(({ selfInfo, connInfo }) => {
        nodesMap.set(selfInfo.peerId, {
          colorIndex: 0,
          ...nodesMap.get(selfInfo.peerId),
          id: selfInfo.peerId,
          pseudonym: getPseudonymForPeerId(selfInfo.peerId),
          multiaddrs: selfInfo.multiaddrs,
          ...selfInfo.isSelf && { size: 14, colorIndex: 3, label: 'Self' }
        })
  
        connInfo.forEach(conn => {
          nodesMap.set(conn.peerId, {
            colorIndex: 0,
            label: 'Peer',
            ...(conn.isPeerRelay && { colorIndex: 8, label: 'Relay (secondary)' }),
            multiaddrs: [conn.multiaddr],
            ...nodesMap.get(conn.peerId),
            id: conn.peerId,
            pseudonym: getPseudonymForPeerId(conn.peerId),
            ...(conn.multiaddr === peer.relayNodeMultiaddr.toString() && { colorIndex: 2, label: 'Relay (primary)' })
          })
  
          let target = conn.peerId

          if (conn.type === 'relayed') {
            target = conn.hopRelayPeerId
          }

          // Form unique links between peers by concatenating ids based on comparison
          const linkId =  target < selfInfo.peerId ? `${target}-${selfInfo.peerId}` : `${selfInfo.peerId}-${target}`;
  
          linksMap.set(linkId, {
            id: linkId,
            source: selfInfo.peerId,
            target
          })
        })
      });

      return {
        nodes: Array.from(nodesMap.values()),
        links: Array.from(linksMap.values())
      }
    });

    setIsLoading(false);
    setDebugInfos([]);
  }, [peer])
  const throttledHandleDebugInfos = useThrottledCallback(handleDebugInfos, THROTTLE_WAIT_TIME, { leading: false });

  useEffect(() => {
    if (debugInfos.length) {
      throttledHandleDebugInfos(debugInfos);
    }
  }, [debugInfos, throttledHandleDebugInfos])

  useEffect(() => {
    if (peer) {
      // Update network graph on mount
      handleNetworkUpdate();
      setIsLoading(false);
    }
  }, [peer, handleNetworkUpdate]);

  return (
    <ScopedCssBaseline>
      <Box
        mt={1}
        sx={{ ...STYLES.container, ...sx }}
        {...props}
      >
        <LoadingButton
          loading={isLoading}
          variant="contained"
          onClick={handleNetworkUpdate}
          size="small"
          sx={STYLES.udpateButton}
        >
          Update
        </LoadingButton>
        <GraphWithTooltip
          data={data}
          peer={peer}
          nodeCharge={-1000}
        />
      </Box>
    </ScopedCssBaseline>
  )
}
