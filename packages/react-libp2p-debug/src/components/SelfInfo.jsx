import React, { useCallback, useEffect, useState } from 'react';

import { Box, Button, FormControl, Grid, InputLabel, MenuItem, Paper, Select, Table, TableBody, TableCell, TableContainer, TableRow, Typography } from '@mui/material';

import { DEFAULT_REFRESH_INTERVAL, THROTTLE_WAIT_TIME } from '../constants';
import { useThrottledCallback } from '../hooks/throttledCallback';
import { CustomRelayDialog } from './CustomRelayDialog';
import { getPeerSelfInfo, getPseudonymForPeerId } from '../utils';

const STYLES = {
  selfInfoHead: {
    marginBottom: 1/2
  },
  primaryRelaySelect: {
    marginRight: 1,
    minWidth: 200
  },
  nodeStartedTableCell: {
    width: 150
  }
}

export function SelfInfo ({ relayNodes, node, primaryRelayMultiaddr, refreshInterval = DEFAULT_REFRESH_INTERVAL, ...props }) {
  const [selfInfo, setSelfInfo] = useState();
  const [openCustomRelayDialog, setOpenCustomRelayDialog] = useState(false);
  const [primaryRelay, setPrimaryRelay] = useState(localStorage.getItem('primaryRelay') ?? '')
  const [customRelay, setCustomRelay] = useState(localStorage.getItem('customRelay'))

  const updateInfo = useCallback(() => {
    setSelfInfo(getPeerSelfInfo(node, primaryRelayMultiaddr))
  }, [node, primaryRelayMultiaddr])
  const throttledUpdateInfo = useThrottledCallback(updateInfo, THROTTLE_WAIT_TIME);

  const handlePrimaryRelaySelectChange = useCallback(event => {
    // Check if value is null when custom relay option is selected
    if (event.target.value !== null) {
      setPrimaryRelay(event.target.value)
    }
  }, [])

  const handlePrimaryRelayUpdate = useCallback(() => {
    // Set selected primary relay in localStorage and refresh app
    localStorage.setItem('primaryRelay', primaryRelay);
    window.location.reload(false);
  }, [primaryRelay])

  const handleCustomOptionClick = useCallback(event => {
    setOpenCustomRelayDialog(true);
  }, [])

  const handleCustomRelaySet = useCallback((newCustomRelay) => {
    setCustomRelay(newCustomRelay);
    // Set custom relay in localStorage
    localStorage.setItem('customRelay', newCustomRelay);
    setPrimaryRelay(newCustomRelay);
    setOpenCustomRelayDialog(false);
  }, [])

  const handleCustomRelayCancel = useCallback(() => {
    setPrimaryRelay(primaryRelay);
    setOpenCustomRelayDialog(false);
  }, [primaryRelay])

  useEffect(() => {
    if (!node) {
      return
    }

    node.peerStore.addEventListener('change:multiaddrs', throttledUpdateInfo)
    throttledUpdateInfo();

    return () => {
      node.peerStore.removeEventListener('change:multiaddrs', throttledUpdateInfo)
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
        <Grid item xs="auto">
          <Box display="flex" alignItems="flex-end">
            <FormControl variant="standard" sx={STYLES.primaryRelaySelect} size="small">
              <InputLabel shrink id="primary-relay-label">Primary Relay</InputLabel>
              <Select
                displayEmpty
                labelId="primary-relay-label"
                id="primary-label"
                value={primaryRelay}
                label="Primary Relay"
                onChange={handlePrimaryRelaySelectChange}
              >
                <MenuItem value="">{"<random>"}</MenuItem>
                {relayNodes.map(relayNode => (
                  <MenuItem
                    value={relayNode}
                    key={relayNode}
                  >
                    {relayNode.split('/')[2]}
                  </MenuItem>
                ))}
                <MenuItem
                  value={customRelay}
                  onClick={handleCustomOptionClick}
                >
                  {"<custom>"}
                </MenuItem>
              </Select>
            </FormControl>
            <Button
              variant="contained"
              size="small"
              disabled={primaryRelay === (localStorage.getItem('primaryRelay') ?? '')}
              onClick={handlePrimaryRelayUpdate}
              sx={STYLES.primaryRelayButton}
            >
              UPDATE
            </Button>
          </Box>
        </Grid>
      </Grid>
      <CustomRelayDialog
        open={openCustomRelayDialog}
        oldCustomRelay={customRelay}
        onSet={handleCustomRelaySet}
        onCancel={handleCustomRelayCancel}
      />
      <TableContainer component={Paper}>
        <Table size="small">
          <TableBody>
            <TableRow>
              <TableCell size="small"><b>Peer ID</b></TableCell>
              <TableCell size="small">{selfInfo && `${selfInfo.peerId} ( ${getPseudonymForPeerId(selfInfo.peerId)} )`}</TableCell>
              <TableCell size="small" align="right"><b>Node started</b></TableCell>
              <TableCell size="small" sx={STYLES.nodeStartedTableCell}>{node && node.isStarted().toString()}</TableCell>
            </TableRow>
            <TableRow>
              <TableCell size="small"><b>Relay node</b></TableCell>
              <TableCell size="small" colSpan={3}>{selfInfo && `${selfInfo.primaryRelayMultiaddr} ( ${getPseudonymForPeerId(selfInfo.primaryRelayPeerId)} )`}</TableCell>
            </TableRow>
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
