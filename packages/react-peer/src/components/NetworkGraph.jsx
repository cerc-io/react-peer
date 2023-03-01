import React, { useCallback, useMemo, useState } from 'react';
import { Box, Popover, Table, TableBody, TableCell, TableContainer, TableRow, Typography } from '@mui/material';
import { getPseudonymForPeerId } from '@cerc-io/peer';
import ForceDirectedGraph from './ForceDirectedGraph';

// TODO: Change height on changing browser window size
const CONTAINER_HEIGHT = (window.innerHeight / 2) - 80

function NetworkGraph ({ peer, connections }) {
  const links = [];
  const relayMultiaddr = peer.relayNodeMultiaddr
  const [anchorEl, setAnchorEl] = useState(null)
  const [hoveredPeer, setHoveredPeer] = useState(null)

  const data = useMemo(() => {
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

export default NetworkGraph;
