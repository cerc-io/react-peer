import React, { useCallback, useEffect, useState } from 'react';

import { getPeerSelfInfo, getPseudonymForPeerId } from '@cerc-io/libp2p-util';
import { Box, Grid, Paper, Table, TableBody, TableCell, TableContainer, TableRow, Typography } from '@mui/material';

import { DEFAULT_REFRESH_INTERVAL, THROTTLE_WAIT_TIME } from '../constants';
import { useThrottledCallback } from '../hooks/throttledCallback';
import { PrimaryRelaySelector } from './PrimaryRelaySelector';

const STYLES = {
  selfInfoHead: {
    marginBottom: 1/2
  },
  nodeStartedTableCell: {
    width: 150
  }
}

export function SelfInfo ({
  node,
  enablePrimaryRelaySupport = false,
  relayNodes,
  primaryRelayMultiaddr,
  refreshInterval = DEFAULT_REFRESH_INTERVAL,
  ...props
}) {
  const [selfInfo, setSelfInfo] = useState();

  const updateInfo = useCallback(() => {
    setSelfInfo(getPeerSelfInfo(node))
  }, [node])
  const throttledUpdateInfo = useThrottledCallback(updateInfo, THROTTLE_WAIT_TIME);

  useEffect(() => {
    if (!node) {
      return
    }

    if (node.peerStore.addEventListener) {
      // https://github.com/libp2p/js-libp2p/blob/master/doc/migrations/v0.44-v0.45.md#atomic-peer-store-methods
      node.peerStore.addEventListener('change:multiaddrs', throttledUpdateInfo)
    } else {
      // https://github.com/libp2p/js-libp2p/blob/master/doc/migrations/v0.44-v0.45.md#selfpeerupdate
      node.addEventListener('self:peer:update', throttledUpdateInfo)
    }

    throttledUpdateInfo();

    return () => {
      if (node.peerStore.removeEventListener) {
        node.peerStore.removeEventListener('change:multiaddrs', throttledUpdateInfo)
      } else {
        node.removeEventListener('self:peer:update', throttledUpdateInfo)
      }
    }
  }, [node, throttledUpdateInfo])

  return (
    <Box {...props}>
      <Grid container sx={STYLES.selfInfoHead}>
        <Grid item xs="auto">
          <Typography variant="subtitle2" color="inherit" noWrap>
            <b>Self Node Info</b>
          </Typography>
        </Grid>
        <Grid item xs />
        {enablePrimaryRelaySupport && (
          <Grid item xs="auto">
            <PrimaryRelaySelector relayNodes={relayNodes} />
          </Grid>
        )}
      </Grid>
      <TableContainer component={Paper}>
        <Table size="small">
          <TableBody>
            <TableRow>
              <TableCell size="small"><b>Peer ID</b></TableCell>
              <TableCell size="small">{selfInfo && `${selfInfo.peerId} ( ${getPseudonymForPeerId(selfInfo.peerId)} )`}</TableCell>
              <TableCell size="small" align="right"><b>Node started</b></TableCell>
              <TableCell size="small" sx={STYLES.nodeStartedTableCell}>{node && node.isStarted().toString()}</TableCell>
            </TableRow>
            {enablePrimaryRelaySupport && (
              <TableRow>
                <TableCell size="small"><b>Relay node</b></TableCell>
                <TableCell size="small" colSpan={3}>{primaryRelayMultiaddr && `${primaryRelayMultiaddr.toString()} ( ${getPseudonymForPeerId(primaryRelayMultiaddr.getPeerId())} )`}</TableCell>
              </TableRow>
            )}
            <TableRow>
              <TableCell size="small"><b>Multiaddrs</b></TableCell>
              <TableCell size="small" colSpan={3}>
                <TableContainer>
                  <Table size="small">
                    <TableBody>
                      {
                        selfInfo && selfInfo.multiaddrs.map(multiaddr => (
                          <TableRow key={multiaddr}>
                            <TableCell size="small">
                              {multiaddr}
                            </TableCell>
                          </TableRow>
                        ))
                      }
                    </TableBody>
                  </Table>
                </TableContainer>
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  )
}
