import assert from 'assert';

import type { Libp2p } from 'libp2p';
import type { Direction } from '@libp2p/interface-connection';
import { multiaddr, Multiaddr } from '@multiformats/multiaddr';

import { P2P_CIRCUIT_ID, P2P_WEBRTC_STAR_ID } from './constants.js';

interface SelfInfo {
  peerId: string;
  multiaddrs: string[];
}

export enum ConnectionType {
  Relayed = 'relayed',
  Direct = 'direct'
}

export interface ConnectionInfo {
  id: string;
  peerId: string;
  multiaddr: string;
  direction: Direction;
  status: string;
  type: ConnectionType;
}

export interface PeerConnectionInfo extends ConnectionInfo {
  isPeerRelay: boolean;
  hopRelayPeerId?: string;
}

export interface DebugInfo {
  selfInfo: SelfInfo;
  connInfo: ConnectionInfo[] | PeerConnectionInfo[];
}

/**
 * Method to get self node info
 * @param node
 * @returns
 */
export const getPeerSelfInfo = (node: Libp2p): SelfInfo => {
  assert(node);

  return {
    peerId: node.peerId.toString(),
    multiaddrs: node.getMultiaddrs().map(multiaddr => multiaddr.toString())
  };
};

export const getPeerConnectionsInfo = (node: Libp2p): PeerConnectionInfo[] => {
  assert(node);
  const connectionsInfo = getConnectionsInfo(node);

  return connectionsInfo.map(connectionInfo => {
    const peerConnectionInfo: PeerConnectionInfo = {
      ...connectionInfo,
      isPeerRelay: isRelayPeerMultiaddr(connectionInfo.multiaddr)
    };

    if (peerConnectionInfo.type === ConnectionType.Relayed) {
      const relayPeerId = multiaddr(peerConnectionInfo.multiaddr).decapsulate('p2p-circuit/p2p').getPeerId();
      if (relayPeerId !== null) {
        peerConnectionInfo.hopRelayPeerId = relayPeerId;
      }
    }

    return peerConnectionInfo;
  });
};

export const isPrimaryRelay = (multiaddrString: string, primaryRelayMultiaddr: Multiaddr): boolean => {
  return multiaddrString === primaryRelayMultiaddr.toString();
};

/**
 * Method to get connections info
 * @param node
 * @returns
 */
const getConnectionsInfo = (node: Libp2p): ConnectionInfo[] => {
  return node.getConnections().map(connection => {
    return {
      id: connection.id,
      peerId: connection.remotePeer.toString(),
      multiaddr: connection.remoteAddr.toString(),
      direction: connection.stat.direction,
      status: connection.stat.status,
      type: connection.remoteAddr.toString().includes('p2p-circuit/p2p') ? ConnectionType.Relayed : ConnectionType.Direct
    };
  });
};

const isRelayPeerMultiaddr = (multiaddrString: string): boolean => {
  // Multiaddr not having p2p-circuit id or webrtc-star id is of a relay node
  return !(multiaddrString.includes(P2P_CIRCUIT_ID) || multiaddrString.includes(P2P_WEBRTC_STAR_ID));
};
