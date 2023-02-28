import React, { useCallback, useEffect, useState } from 'react';
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
  const [prevConnections, setPrevConnections] = useState(connections.map(connection => connection.id))
  const [graphKey, setGraphKey] = useState('')

  // Issue with links in graph not getting removed after disconnect
  // Workaround to re render graph after disconnects between peers
  useEffect(() => {
    const connectionIds = connections.map(connection => connection.id)
    // Compare connections and check if any previous connection missing
    const isConnectionMissing = prevConnections.some(connectionId => !connectionIds.includes(connectionId));
    
    if (isConnectionMissing) {
      setGraphKey(JSON.stringify(connectionIds));
    }

    return () => {
      setPrevConnections(connections.map(connection => connection.id))
    }
  }, [connections])

  const remotePeerNodes = connections.map(connection => {
    const connectionMultiAddr = connection.remoteAddr
    
    const nodeData = {
      id: connection.remotePeer.toString(),
      pseudonym: getPseudonymForPeerId(connection.remotePeer.toString()),
      multiaddr: connectionMultiAddr.toString(),
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

  const onMouseOverNode = useCallback((nodeId) => {
    let multiaddrs = peer.node.getMultiaddrs().map(multiaddr => multiaddr.toString());

    if (nodeId !== peer.peerId.toString()) {
      const remotePeerNode = remotePeerNodes.find(remotePeerNode => remotePeerNode.id === nodeId);
      multiaddrs = [remotePeerNode.multiaddr];
    }

    setHoveredPeer({
      id: nodeId,
      multiaddrs
    });

    setAnchorEl(document.getElementById(nodeId));
  }, [peer, remotePeerNodes])

  const data = {
    nodes: [
      {
        id: peer.peerId.toString(),
        pseudonym: getPseudonymForPeerId(peer.peerId.toString()),
        size: 14,
        colorIndex: 3,
        label: 'Self',
        multiaddr: peer.node.getMultiaddrs().map(multiaddr => multiaddr.toString()).join(', ')
      },
      ...remotePeerNodes
    ],
    links
  };

  return (
    <Box>
      <ForceDirectedGraph
        nodes={data.nodes}
        links={data.links}
        containerHeight={CONTAINER_HEIGHT}
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
