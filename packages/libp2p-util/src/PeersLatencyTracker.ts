import type { Libp2p } from '@cerc-io/libp2p';
import { peerIdFromString } from '@libp2p/peer-id';

import debug from 'debug';

import { DEFAULT_PING_INTERVAL } from './constants.js';
import { Connection } from '@libp2p/interface-connection';

const log = debug('libp2p:peers-latecy-tracker');

interface PeersLatencyTrackerOptions {
  pingInterval: number
}

export class PeersLatencyTracker {
  private _node: Libp2p;
  private _peersLatencyMap: Map<string, number[]> = new Map();
  private _intervalID: NodeJS.Timer;
  private _pingInterval: number;

  constructor (node: Libp2p, options: PeersLatencyTrackerOptions) {
    this._node = node;
    this._pingInterval = options.pingInterval ?? DEFAULT_PING_INTERVAL;
    this._addConnectionListeners();
    this._intervalID = this._startLatencyTracker();
  }

  getLatencyValues (peerIdString: string): number[] | undefined {
    return this._peersLatencyMap.get(peerIdString);
  }

  _addConnectionListeners () {
    this._node.addEventListener('peer:connect', this._handlePeerConnect);
    this._node.addEventListener('peer:disconnect', this._handlePeerDisconnect);
  }

  _handlePeerConnect ({ detail: connection }: { detail: Connection }) {
    const peerIdString = connection.remotePeer.toString();

    if (!this._peersLatencyMap.has(peerIdString)) {
      // Add peer to map if it already doesn't exist
      this._peersLatencyMap.set(peerIdString, []);
    }
  }

  _handlePeerDisconnect ({ detail: connection }: { detail: Connection }) {
    // Remove peer as peer:disconnect event is triggered when there are no connections to a peer
    this._peersLatencyMap.delete(connection.remotePeer.toString());
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
        // TODO: Pass optional abort for ping timeout (lesser than this._pingInterval)
        const latency = await this._node.ping(peerId);

        // TODO: Update latency when ping fails?

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

  destroy () {
    clearInterval(this._intervalID);
  }
}
