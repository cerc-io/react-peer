import debug from 'debug';
import assert from 'assert';
import { PingService } from 'libp2p/dist/src/ping/index.js';
import type { Libp2p } from 'libp2p';

import { peerIdFromString } from '@libp2p/peer-id';
import type { PeerId } from '@libp2p/interface-peer-id';
import type { AbortOptions } from '@libp2p/interfaces';
import type { Connection } from '@libp2p/interface-connection';

import { DEFAULT_PING_INTERVAL } from './constants.js';

const log = debug('libp2p:peers-latency-tracker');

interface PeersLatencyTrackerOptions {
  pingInterval: number
}

export class PeersLatencyTracker {
  private _node: Libp2p;
  private _pingInterval: number;
  private _intervalID?: NodeJS.Timer;
  private _peersLatencyMap: Map<string, number[]> = new Map();
  private _ping?: (peer: PeerId, options?: AbortOptions) => Promise<number>;

  constructor (node: Libp2p, options: PeersLatencyTrackerOptions) {
    this._node = node;
    this._pingInterval = options.pingInterval ?? DEFAULT_PING_INTERVAL;
    this._setPingMethod();

    if (!this._ping) {
      log('Latency tracker not enabled as Ping service is not configured in libp2p');
      return;
    }

    this._addConnectionListeners();

    // Create map from already connected peers
    this._peersLatencyMap = new Map(
      this._node
        .getPeers()
        .map(peerId => [peerId.toString(), []])
    );

    this._intervalID = this._startLatencyTracker();
  }

  get enabled () {
    return Boolean(this._ping);
  }

  getLatencyValues (peerIdString: string): number[] | undefined {
    return this._peersLatencyMap.get(peerIdString);
  }

  destroy () {
    clearInterval(this._intervalID);
    this._node.removeEventListener('peer:connect', this._handlePeerConnect);
    this._node.removeEventListener('peer:disconnect', this._handlePeerDisconnect);
  }

  // Set ping method for old or new version of libp2p
  _setPingMethod () {
    // Check if ping method exists in libp2p instance for versions < 0.45.0
    if ('ping' in this._node) {
      this._ping = this._node.ping.bind(this._node);
      return;
    }

    // https://github.com/libp2p/js-libp2p/blob/master/doc/migrations/v0.44-v0.45.md#services
    // eslint-disable-next-line dot-notation
    const services = this._node['services'] as Record<string, unknown>;

    // For libp2p versions > 0.45.0 check if Ping service is configured in libp2p instance
    if (services.ping) {
      const pingService = services.ping as PingService;
      this._ping = pingService.ping.bind(pingService);
    }
  }

  _addConnectionListeners () {
    this._node.addEventListener('peer:connect', this._handlePeerConnect.bind(this));
    this._node.addEventListener('peer:disconnect', this._handlePeerDisconnect.bind(this));
  }

  // https://github.com/libp2p/js-libp2p/blob/master/doc/migrations/v0.44-v0.45.md#peerconnect
  _handlePeerConnect (event: CustomEvent<Connection | PeerId>) {
    const peerIdString = this._getPeerIdFromConnectionEvent(event).toString();

    if (!this._peersLatencyMap.has(peerIdString)) {
      // Add peer to map if it already doesn't exist
      this._peersLatencyMap.set(peerIdString, []);
    }
  }

  // https://github.com/libp2p/js-libp2p/blob/master/doc/migrations/v0.44-v0.45.md#peerdisconnect
  _handlePeerDisconnect (event: CustomEvent<Connection | PeerId>) {
    const remotePeer = this._getPeerIdFromConnectionEvent(event);
    // Remove peer as peer:disconnect event is triggered when there are no connections to a peer
    this._peersLatencyMap.delete(remotePeer.toString());
  }

  // https://github.com/libp2p/js-libp2p/blob/master/doc/migrations/v0.44-v0.45.md#event-changes
  _getPeerIdFromConnectionEvent ({ detail }: CustomEvent<Connection | PeerId>) {
    if ('remotePeer' in detail) {
      return detail.remotePeer;
    }

    return detail;
  }

  _startLatencyTracker () {
    return setInterval(() => {
      this._updatePeersLatency();
    }, this._pingInterval);
  }

  _updatePeersLatency () {
    // Ping and update latency for each peer asynchronously
    this._peersLatencyMap.forEach(async (latencyValues, peerIdString) => {
      try {
        // Ping remote peer
        const peerId = peerIdFromString(peerIdString);
        assert(this._ping);
        const latency = await this._ping(peerId);

        // Update latency values with latest
        const length = latencyValues.unshift(latency);

        if (length > 5) {
          // Pop oldest latency value from list
          latencyValues.pop();
        }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } catch (err: any) {
        // On error i.e. no pong
        log(err?.message);
      }
    });
  }
}
