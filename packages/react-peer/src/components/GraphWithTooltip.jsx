import React, { useCallback, useMemo, useState } from 'react';
import { Box, Popover, Table, TableBody, TableCell, TableContainer, TableRow, Typography } from '@mui/material';
import { getPseudonymForPeerId } from '@cerc-io/peer';
import ForceDirectedGraph from './ForceDirectedGraph';

// TODO: Change height on changing browser window size
const CONTAINER_HEIGHT = (window.innerHeight / 2) - 80

function GraphWithTooltip ({ data }) {
  const [anchorEl, setAnchorEl] = useState(null)
  const [hoveredPeer, setHoveredPeer] = useState(null)

  const onMouseOverNode = useCallback((data) => {
    const { id: nodeId, multiaddrs } = data;

    setHoveredPeer({
      id: nodeId,
      multiaddrs
    });

    setAnchorEl(document.getElementById(nodeId));
  }, []);

  return (
    <Box>
      <ForceDirectedGraph
        data={data}
        containerHeight={CONTAINER_HEIGHT}
        onMouseOverNode={onMouseOverNode}
        onMouseOutNode={() => setAnchorEl(null)}
      />
      <Popover
        id="mouse-over-popover"
        sx={{
          pointerEvents: 'none',
        }}
        open={Boolean(anchorEl)}
        anchorEl={anchorEl}
        onClose={() => setAnchorEl(null)}
        disableRestoreFocus
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'center',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'center',
        }}
      >
        <TableContainer>
          <Table size="small">
            <TableBody>
              <TableRow>
                <TableCell size="small"><b>Peer ID</b></TableCell>
                <TableCell size="small">{hoveredPeer && `${hoveredPeer.id} ( ${getPseudonymForPeerId(hoveredPeer.id)} )`}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell size="small"><b>Multiaddr</b></TableCell>
                <TableCell size="small">
                  {hoveredPeer && hoveredPeer.multiaddrs.map(multiaddr => (<Typography key={multiaddr} variant="body2">{multiaddr}</Typography>))}
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </TableContainer>
      </Popover>
    </Box>
  )
}

export default GraphWithTooltip;
