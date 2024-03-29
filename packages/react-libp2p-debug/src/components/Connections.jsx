import React, { useCallback, useEffect, useRef } from 'react';

import { PeersLatencyTracker, getPeerConnectionsInfo, getPseudonymForPeerId, isPrimaryRelay } from '@cerc-io/libp2p-util';
import { Box, Chip, Paper, Table, TableBody, TableCell, TableContainer, TableRow, Typography } from '@mui/material';

import { useForceUpdate } from '../hooks/forceUpdate';
import { DEFAULT_REFRESH_INTERVAL, THROTTLE_WAIT_TIME } from '../constants';
import { useThrottledCallback } from '../hooks/throttledCallback';

const STYLES = {
  connectionsTable: {
    marginTop: 1
  },
  connectionsTableFirstColumn: {
    width: 150
  }
}

export function Connections ({
  node,
  enablePrimaryRelaySupport,
  primaryRelayMultiaddr,
  refreshInterval = DEFAULT_REFRESH_INTERVAL,
  ...props
}) {
  const forceUpdate = useForceUpdate();
  const peersLatencyTrackerRef = useRef(null);

  // Set leading false to render UI after the events have triggered
  const throttledForceUpdate = useThrottledCallback(forceUpdate, THROTTLE_WAIT_TIME, { leading: false });

  useEffect(() => {
    if (node) {
      peersLatencyTrackerRef.current = new PeersLatencyTracker(node, { pingInterval: refreshInterval });

      return () => {
        peersLatencyTrackerRef.current.destroy();
      };
    }
  }, [node, refreshInterval]);

  useEffect(() => {
    if (!node) {
      return;
    }

    node.addEventListener('peer:connect', throttledForceUpdate);
    node.addEventListener('peer:disconnect', throttledForceUpdate);

    return () => {
      node.removeEventListener('peer:connect', throttledForceUpdate);
      node.removeEventListener('peer:disconnect', throttledForceUpdate);
    }
  }, [node, throttledForceUpdate])

  useEffect(() => {
    // TODO: Add event for connection close and remove refresh in interval
    const intervalID = setInterval(throttledForceUpdate, refreshInterval);

    return () => {
      clearInterval(intervalID);
    }
  }, [throttledForceUpdate])

  const getNodeType = useCallback((connection) => {
    let nodeType = 'Peer'

    if (enablePrimaryRelaySupport) {
      if (connection.isPeerRelay) {
        nodeType = isPrimaryRelay(connection.multiaddr, primaryRelayMultiaddr) ? 'Relay (Primary)' : 'Relay (Secondary)';
      }
    }

    return nodeType;
  }, [enablePrimaryRelaySupport, primaryRelayMultiaddr])

  return (
    <Box {...props}>
      <Typography variant="subtitle2" color="inherit" noWrap>
        <b>
          Remote Peer Connections
          &nbsp;
          <Chip size="small" label={node?.getConnections().length ?? 0} variant="outlined" />
        </b>
      </Typography>
      {node && getPeerConnectionsInfo(node).map(connection => (
        <TableContainer sx={STYLES.connectionsTable} key={connection.id} component={Paper}>
          <Table size="small">
            <TableBody>
              <TableRow>
                <TableCell size="small" sx={STYLES.connectionsTableFirstColumn}><b>Connection ID</b></TableCell>
                <TableCell size="small">{connection.id}</TableCell>
                <TableCell size="small" align="right"><b>Direction</b></TableCell>
                <TableCell size="small">{connection.direction}</TableCell>
                <TableCell size="small" align="right"><b>Status</b></TableCell>
                <TableCell size="small">{connection.status}</TableCell>
                <TableCell size="small" align="right"><b>Type</b></TableCell>
                <TableCell size="small">{connection.type}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell size="small" sx={STYLES.connectionsTableFirstColumn}><b>Peer ID</b></TableCell>
                <TableCell size="small" colSpan={peersLatencyTrackerRef.current?.enabled ? 1 : 5}>{`${connection.peerId} ( ${getPseudonymForPeerId(connection.peerId)} )`}</TableCell>
                <TableCell align="right"><b>Node type</b></TableCell>
                <TableCell>{getNodeType(connection)}</TableCell>
                {
                  peersLatencyTrackerRef.current?.enabled && (
                    <>
                      <TableCell size="small" align="right"><b>Latency (ms)</b></TableCell>
                      <TableCell size="small" colSpan={3}>
                        {
                          peersLatencyTrackerRef.current?.getLatencyValues(connection.peerId)?.map((value, index) => {
                              return index === 0 ?
                                (<span key={index}><b>{value}</b>&nbsp;</span>) :
                                (<span key={index}>{value}&nbsp;</span>)
                            })
                        }
                      </TableCell>
                    </>
                  )
                }
              </TableRow>
              <TableRow>
                <TableCell size="small" sx={STYLES.connectionsTableFirstColumn}><b>Connected multiaddr</b></TableCell>
                <TableCell size="small" colSpan={7}>{connection.multiaddr}</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </TableContainer>
      ))}
    </Box>
  )
}
