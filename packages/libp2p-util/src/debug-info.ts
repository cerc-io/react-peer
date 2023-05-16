import assert from 'assert';

import type { Libp2p } from '@cerc-io/libp2p';
import type { Direction } from '@libp2p/interface-connection';
import { multiaddr, Multiaddr } from '@multiformats/multiaddr';

import { P2P_CIRCUIT_ID, P2P_WEBRTC_STAR_ID } from './constants.js';

interface SelfInfo {
  peerId: string;
  multiaddrs: string[];
}

interface PeerSelfInfo extends SelfInfo {
  primaryRelayMultiaddr: string;
  primaryRelayPeerId: string | null;
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
  latency: number[];
  type: ConnectionType;
}

export interface PeerConnectionInfo extends ConnectionInfo {
  isPeerRelay: boolean;
  isPeerRelayPrimary: boolean;
  hopRelayPeerId?: string;
}

export interface DebugInfo {
  selfInfo: SelfInfo | PeerSelfInfo;
  connInfo: ConnectionInfo[] | PeerConnectionInfo[];
}

export const getPeerSelfInfo = (node: Libp2p, primaryRelayMultiaddr: Multiaddr): PeerSelfInfo => {
  assert(node);

  const selfInfo = getSelfInfo(node);

  return {
    ...selfInfo,
    primaryRelayMultiaddr: primaryRelayMultiaddr?.toString(),
    primaryRelayPeerId: primaryRelayMultiaddr?.getPeerId()
  };
};

export const getPeerConnectionsInfo = (node: Libp2p, primaryRelayMultiaddr: Multiaddr): PeerConnectionInfo[] => {
  assert(node);
  const connectionsInfo = getConnectionsInfo(node);

  return connectionsInfo.map(connectionInfo => {
    const peerConnectionInfo: PeerConnectionInfo = {
      ...connectionInfo,
      isPeerRelay: isRelayPeerMultiaddr(connectionInfo.multiaddr),
      isPeerRelayPrimary: isPrimaryRelay(connectionInfo.multiaddr, primaryRelayMultiaddr)
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

/**
 * Method to get self node info
 * @param node
 * @returns
 */
const getSelfInfo = (node: Libp2p): SelfInfo => {
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
const getConnectionsInfo = (node: Libp2p): ConnectionInfo[] => {
  return node.getConnections().map(connection => {
    return {
      id: connection.id,
      peerId: connection.remotePeer.toString(),
      multiaddr: connection.remoteAddr.toString(),
      direction: connection.stat.direction,
      status: connection.stat.status,
      type: connection.remoteAddr.toString().includes('p2p-circuit/p2p') ? ConnectionType.Relayed : ConnectionType.Direct,
      // TODO Implement latency tracker to get latency values
      // latency: peerHeartbeatChecker.getLatencyData(connection.remotePeer)
      latency: []
    };
  });
};

const isRelayPeerMultiaddr = (multiaddrString: string): boolean => {
  // Multiaddr not having p2p-circuit id or webrtc-star id is of a relay node
  return !(multiaddrString.includes(P2P_CIRCUIT_ID) || multiaddrString.includes(P2P_WEBRTC_STAR_ID));
};

const isPrimaryRelay = (multiaddrString: string, primaryRelayMultiaddr: Multiaddr): boolean => {
  return multiaddrString === primaryRelayMultiaddr.toString();
};
