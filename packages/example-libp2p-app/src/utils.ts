import { createLibp2p, Libp2p } from 'libp2p';

import { webSockets } from '@libp2p/websockets';
import { webRTCStar } from '@libp2p/webrtc-star';
import { noise } from '@chainsafe/libp2p-noise';
import { mplex } from '@libp2p/mplex';

// Reference for using libp2p in browser
// https://github.com/libp2p/js-libp2p/blob/v0.42.2/examples/libp2p-in-the-browser/index.js

const wrtcStar = webRTCStar()

export const initLibp2p = async (): Promise<Libp2p> => {
  // Create libp2p node
  const libp2p = await createLibp2p({
    addresses: {
      // Add the signaling server address, along with our PeerId to our multiaddrs list
      // libp2p will automatically attempt to dial to the signaling server so that it can
      // receive inbound connections from other peers
      listen: [
        '/dns4/wrtc-star2.sjc.dwebops.pub/tcp/443/wss/p2p-webrtc-star'
      ]
    },
    transports: [
      webSockets(),
      wrtcStar.transport
    ],
    connectionEncryption: [noise()],
    streamMuxers: [mplex()],
    peerDiscovery: [
      wrtcStar.discovery
    ]
  })

  // Listen for new peers
  libp2p.addEventListener('peer:discovery', (evt) => {
    const peer = evt.detail
    console.log(`Found peer ${peer.id.toString()}`)

    // Dial them when we discover them
    libp2p.dial(evt.detail.id).catch(err => {
      console.log(`Could not dial ${evt.detail.id}`, err)
    })
  })

  // Listen for new connections to peers
  libp2p.addEventListener('peer:connect', (evt) => {
    const connection = evt.detail
    console.log(`Connected to ${connection.remotePeer.toString()}`)
  })

  // Listen for peers disconnecting
  libp2p.addEventListener('peer:disconnect', (evt) => {
    const connection = evt.detail
    console.log(`Disconnected from ${connection.remotePeer.toString()}`)
  })

  console.log('libp2p started!')
  console.log(`libp2p id is ${libp2p.peerId.toString()}`)

  return libp2p;
}
