import React, { useContext, useEffect } from 'react';

import {
  PeerContext,
  Metrics,
  NetworkGraph
} from '@cerc-io/react-peer'
import {
  SelfInfo,
  PeersGraph,
  Connections
} from '@cerc-io/react-libp2p-debug'
import { getPseudonymForPeerId } from '@cerc-io/libp2p-util';
import { Peer } from '@cerc-io/peer';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import { AppBar, Box, Card, CardContent, CssBaseline, Toolbar, Typography } from '@mui/material';

import config from './config.json';
import './App.css';

const TEST_TOPIC = 'test';

const STYLES = {
  container: {
    bgcolor: 'background.paper',
    py: 3,
    px: 3
  },
  cardContent: {
    padding: 1,
    '&:last-child': {
      padding: 1
    }
  },
  debugCard: {
    '&:not(:first-of-type)': {
      marginTop: 2
    }
  }
}

declare global {
  interface Window {
    broadcast: (message: string) => void;
    floodMessage: (message: string) => Promise<void>;
    peer: Peer;
  }
}

const theme = createTheme();

function App() {
  const peer: Peer = useContext(PeerContext);

  useEffect(() => {
    if (!peer || !peer.node) {
      return
    }

    // For debugging
    window.peer = peer;

    // Subscribe to messages from remote peers
    const unsubscribeMessage = peer.subscribeMessage((peerId, message) => {
      console.log(`${peerId.toString()} (${getPseudonymForPeerId(peerId.toString())}) > ${message}`)
    })

    // Expose broadcast method in browser to send messages
    window.broadcast = (message: string) => {
      peer.broadcastMessage(message)
    }

    const unsubscribeTopic = peer.subscribeTopic(TEST_TOPIC, (peerId, data) => {
      console.log(`${peerId.toString()} (${getPseudonymForPeerId(peerId.toString())}) > ${data}`)
    })

    window.floodMessage = async (message: string) => {
      return peer.floodMessage(TEST_TOPIC, message)
    }

    return () => {
      unsubscribeMessage()
      unsubscribeTopic()
    }
  }, [peer])

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AppBar position="relative">
        <Toolbar>
          <Typography variant="h6" color="inherit" noWrap>
            Peer Test App
          </Typography>
        </Toolbar>
      </AppBar>
      <main>
        <Box
          sx={STYLES.container}
        >
          <Card sx={STYLES.debugCard} raised>
            <CardContent sx={STYLES.cardContent}>
              <SelfInfo
                enablePrimaryRelaySupport
                relayNodes={config.relayNodes ?? []}
                node={peer?.node}
                primaryRelayMultiaddr={peer?.relayNodeMultiaddr}
              />
            </CardContent>
          </Card>
          <Card sx={STYLES.debugCard} raised>
            <CardContent sx={STYLES.cardContent}>
              <Typography><b>Graph (Peers)</b></Typography>
              <PeersGraph node={peer?.node} primaryRelayMultiaddr={peer?.relayNodeMultiaddr} />
            </CardContent>
          </Card>
          <Card sx={STYLES.debugCard} raised>
            <CardContent sx={STYLES.cardContent}>
              <Connections node={peer?.node} primaryRelayMultiaddr={peer?.relayNodeMultiaddr} />
            </CardContent>
          </Card>
          <Card sx={STYLES.debugCard} raised>
            <CardContent sx={STYLES.cardContent}>
              <Typography><b>Metrics</b></Typography>
              <Metrics />
            </CardContent>
          </Card>
          {Boolean(config.peer.enableDebugInfo) && (
            <Card sx={STYLES.debugCard} raised>
              <CardContent sx={STYLES.cardContent}>
                <Typography><b>Graph (Network)</b></Typography>
                <NetworkGraph />
              </CardContent>
            </Card>
          )}
        </Box>
      </main>
    </ThemeProvider>
  );
}

export default App;
