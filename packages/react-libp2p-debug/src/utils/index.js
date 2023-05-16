import assert from 'assert';
import { uniqueNamesGenerator, adjectives, colors, names } from 'unique-names-generator';

import { multiaddr } from '@multiformats/multiaddr';

const P2P_WEBRTC_STAR_ID = 'p2p-webrtc-star';
const P2P_CIRCUIT_ID = 'p2p-circuit';

const GRAPH_NODE_COLOR = {
  blue: 0,
  green: 2,
  red: 3,
  yellow: 8
}

/**
 * Method to create/update graph data with debugInfo
 * @param selfPeerNode
 * @param debugInfo
 * @param nodesMap
 * @param linksMap
 */
export const updateGraphDataWithDebugInfo = (selfPeerNode, primaryRelayMultiaddr, debugInfo, nodesMap = new Map(), linksMap = new Map()) => {
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
  })

  // Update nodes from connections info
  connInfo.forEach(conn => {
    nodesMap.set(conn.peerId, {
      // Set node color to blue and label to Peer by default
      colorIndex: GRAPH_NODE_COLOR.blue,
      label: 'Peer',

      // Set connection multiaddr if node already does not exist
      // Self info will update with actual multiaddr
      multiaddrs: [conn.multiaddr],

      // Set existing node properties
      ...nodesMap.get(conn.peerId),

      // Set relay node in the graph
      ...(conn.isPeerRelay && { colorIndex: GRAPH_NODE_COLOR.yellow, label: 'Relay (secondary)' }),

      id: conn.peerId,
      pseudonym: getPseudonymForPeerId(conn.peerId),

      // Modify self peer's primary relay in the graph
      ...(conn.multiaddr === primaryRelayMultiaddr.toString() && { colorIndex: GRAPH_NODE_COLOR.green, label: 'Relay (primary)' })
    })
  })

  // Update links from connections info
  connInfo.forEach(conn => {
    let source = selfInfo.peerId

    // Change source node for link to relay incase of relayed connection
    // Check if relay node exists in graph
    if (conn.type === 'relayed' && nodesMap.has(conn.hopRelayPeerId)) {
      source = conn.hopRelayPeerId
    }

    // Form unique links between peers by concatenating ids based on comparison
    const linkId =  source < conn.peerId ? `${source}-${conn.peerId}` : `${conn.peerId}-${source}`;

    linksMap.set(linkId, {
      id: linkId,
      source,
      target: conn.peerId
    })
  })

  return {
    nodesMap,
    linksMap
  }
}

/**
 * Get a deterministic pseudonym of form [adjective-color-name] for a given libp2p peer id
 * Eg. 12D3KooWJLXEX2GfHPSZR3z9QKNSN8EY6pXo7FZ9XtFhiKLJATtC -> jolly-green-diann
 * @param peerId
 */
export const getPseudonymForPeerId = (peerId) => {
  return uniqueNamesGenerator({
    seed: peerId,
    dictionaries: [adjectives, colors, names],
    length: 3,
    style: 'lowerCase',
    separator: '-'
  });
};

export const getPeerSelfInfo = (node, primaryRelayMultiaddr) => {
  assert(node);

  const selfInfo = getSelfInfo(node);

  return {
    ...selfInfo,
    primaryRelayMultiaddr: primaryRelayMultiaddr?.toString(),
    primaryRelayPeerId: primaryRelayMultiaddr?.getPeerId()
  };
}

export const getPeerConnectionsInfo = (node, primaryRelayMultiaddr) => {
  assert(node);
  const connectionsInfo = getConnectionsInfo(node);

  return connectionsInfo.map(connectionInfo => {
    const peerConnectionInfo = {
      ...connectionInfo,
      isPeerRelay: isRelayPeerMultiaddr(connectionInfo.multiaddr),
      isPeerRelayPrimary: isPrimaryRelay(connectionInfo.multiaddr, primaryRelayMultiaddr)
    };


    if (peerConnectionInfo.type === 'relayed') {
      peerConnectionInfo.hopRelayPeerId = multiaddr(peerConnectionInfo.multiaddr).decapsulate('p2p-circuit/p2p').getPeerId();
    }

    return peerConnectionInfo;
  });
}

/**
 * Method to get self node info
 * @param node
 * @returns
 */
const getSelfInfo = (node) => {
  return {
    peerId: node.peerId.toString(),
    multiaddrs: node.getMultiaddrs().map(multiaddr => multiaddr.toString())
  };
};

/**
 * Method to get connections info
 * @param node
 * @returns
 */
const getConnectionsInfo = (node) => {
  return node.getConnections().map(connection => {
    return {
      id: connection.id,
      peerId: connection.remotePeer.toString(),
      multiaddr: connection.remoteAddr.toString(),
      direction: connection.stat.direction,
      status: connection.stat.status,
      // TODO Use enums when switching to TS
      type: connection.remoteAddr.toString().includes('p2p-circuit/p2p') ? 'relayed' : 'direct',
      // TODO Implement latency tracker to get latency values
      // latency: peerHeartbeatChecker.getLatencyData(connection.remotePeer)
      latency: []
    };
  });
};

const isRelayPeerMultiaddr = (multiaddrString) => {
  // Multiaddr not having p2p-circuit id or webrtc-star id is of a relay node
  return !(multiaddrString.includes(P2P_CIRCUIT_ID) || multiaddrString.includes(P2P_WEBRTC_STAR_ID));
}

const isPrimaryRelay = (multiaddrString, primaryRelayMultiaddr) => {
  return multiaddrString === primaryRelayMultiaddr.toString();
}
