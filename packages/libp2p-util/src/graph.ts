import { Libp2p } from 'libp2p';
import { Multiaddr } from '@multiformats/multiaddr';

import { getPseudonymForPeerId } from './peer-id-pseudonym.js';
import { DebugInfo, ConnectionInfo, PeerConnectionInfo, ConnectionType } from './debug-info.js';

enum GRAPH_NODE_COLOR {
  blue = 0,
  green = 2,
  red = 3,
  yellow = 8
}

interface GraphNode {
  colorIndex: GRAPH_NODE_COLOR;
  label: string;
  multiaddrs: string[];
  id: string;
  pseudonym: string;
}

interface GraphLink {
  id: string;
  source: string;
  target: string;
}

interface UpdateGraphDataOptions {
  nodesMap?: Map<string, GraphNode>;
  linksMap?: Map<string, GraphLink>;
  primaryRelayMultiaddr?: Multiaddr;
}

/**
 * Method to create/update graph data with debugInfo
 * @param selfPeerNode
 * @param primaryRelayMultiaddr
 * @param debugInfo
 * @param nodesMap
 * @param linksMap
 */
export const updateGraphDataWithDebugInfo = (
  selfPeerNode: Libp2p,
  debugInfo: DebugInfo,
  options: UpdateGraphDataOptions
) => {
  const { nodesMap, linksMap, primaryRelayMultiaddr } = {
    nodesMap: new Map<string, GraphNode>(),
    linksMap: new Map<string, GraphLink>(),
    ...options
  };

  const { selfInfo, connInfo } = debugInfo;

  // Update from selfInfo
  nodesMap.set(selfInfo.peerId, {
    // Set node color to blue and label to Peer by default
    colorIndex: GRAPH_NODE_COLOR.blue,
    label: 'Peer',

    // Set existing node properties
    ...nodesMap.get(selfInfo.peerId),

    id: selfInfo.peerId,
    pseudonym: getPseudonymForPeerId(selfInfo.peerId),

    // Override multiaddrs from selfInfo
    multiaddrs: selfInfo.multiaddrs,

    // Modify self node in graph
    ...(selfPeerNode.peerId.toString() === selfInfo.peerId) && { size: 14, colorIndex: GRAPH_NODE_COLOR.red, label: 'Self' }
  });

  // Update nodes from connections info
  connInfo.forEach((conn: ConnectionInfo | PeerConnectionInfo) => {
    const nodeData = {
      // Set node color to blue and label to Peer by default
      colorIndex: GRAPH_NODE_COLOR.blue,
      label: 'Peer',

      // Set connection multiaddr if node already does not exist
      // Self info will update with actual multiaddr
      multiaddrs: [conn.multiaddr],

      // Set existing node properties
      ...nodesMap.get(conn.peerId),

      id: conn.peerId,
      pseudonym: getPseudonymForPeerId(conn.peerId)
    };

    // Set relay node in the graph if primary relay passed
    if (primaryRelayMultiaddr) {
      if ('isPeerRelay' in conn && conn.isPeerRelay) {
        nodeData.colorIndex = GRAPH_NODE_COLOR.yellow;
        nodeData.label = 'Relay (secondary)';

        // Modify self peer's primary relay (if provided) in the graph
        if (conn.multiaddr === primaryRelayMultiaddr.toString()) {
          nodeData.colorIndex = GRAPH_NODE_COLOR.green;
          nodeData.label = 'Relay (primary)';
        }
      }
    }

    nodesMap.set(conn.peerId, nodeData);
  });

  // Update links from connections info
  connInfo.forEach((conn: ConnectionInfo | PeerConnectionInfo) => {
    let source = selfInfo.peerId;

    // Change source node for link to relay incase of relayed connection
    // Check if relay node exists in graph
    if (
      conn.type === ConnectionType.Relayed &&
      ('hopRelayPeerId' in conn) &&
      conn.hopRelayPeerId &&
      nodesMap.has(conn.hopRelayPeerId)
    ) {
      source = conn.hopRelayPeerId;
    }

    // Form unique links between peers by concatenating ids based on comparison
    const linkId = source < conn.peerId ? `${source}-${conn.peerId}` : `${conn.peerId}-${source}`;

    linksMap.set(linkId, {
      id: linkId,
      source,
      target: conn.peerId
    });
  });

  return {
    nodesMap,
    linksMap
  };
};
