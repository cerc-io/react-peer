import React, { useContext, useEffect, useCallback } from 'react';
import throttle from 'lodash/throttle'

import { Box } from '@mui/material';
import ScopedCssBaseline from '@mui/material/ScopedCssBaseline';

import { useForceUpdate } from '../hooks/forceUpdate';
import { PeerContext } from '../context/PeerContext';
import { DEFAULT_REFRESH_INTERVAL, THROTTLE_WAIT_TIME } from '../constants';
import NetworkGraph from './NetworkGraph';

export function PeerNetwork ({ refreshInterval = DEFAULT_REFRESH_INTERVAL, ...props }) {
  const peer = useContext(PeerContext);
  const forceUpdate = useForceUpdate();
  const throttledForceUpdate = useCallback(throttle(forceUpdate, THROTTLE_WAIT_TIME), [forceUpdate]);

  useEffect(() => {
    if (!peer || !peer.node) {
      return
    }

    peer.node.addEventListener('peer:connect', throttledForceUpdate)
    peer.node.addEventListener('peer:disconnect', throttledForceUpdate)

    return () => {
      peer.node?.removeEventListener('peer:connect', throttledForceUpdate)
      peer.node?.removeEventListener('peer:disconnect', throttledForceUpdate)
    }
  }, [peer, throttledForceUpdate])

  useEffect(() => {
    // TODO: Add event for connection close and remove refresh in interval
    const intervalID = setInterval(throttledForceUpdate, refreshInterval);

    return () => {
      clearInterval(intervalID)
    }
  }, [throttledForceUpdate])

  return (
    <ScopedCssBaseline>
      <Box mt={1} {...props}>
        { peer && (
          <NetworkGraph
            peer={peer}
          />
        )}
      </Box>
    </ScopedCssBaseline>
  )
}
