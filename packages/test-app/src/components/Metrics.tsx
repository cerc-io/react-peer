import React, { useContext, useEffect, useState } from 'react';
import { PeerContext } from '@cerc-io/react-peer'

import { Peer } from '@cerc-io/peer';
import { Box, Card, CardContent, Grid, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography } from '@mui/material';
import { RegistryMetricData, CollectorType } from "@cerc-io/prom-browser-metrics"

import { REFRESH_INTERVAL } from '../constants';
import LabelledMetrics from './LabelledMetrics';

const UNLABELLED_METRICS = [
  'libp2p_dialler_pending_dials',
  'libp2p_dialler_pending_dial_targets',
  'libp2p_transport_manager_listeners'
]

const LABELLED_METRICS = [
  'js_memory_usage_bytes',
  'libp2p_connection_manager_connections',
  'libp2p_protocol_streams_total',
  'libp2p_connection_manager_protocol_streams_per_connection_90th_percentile'
]

const DATA_TRANSFER_METRICS = 'libp2p_data_transfer_bytes_total'
const DATA_TRANSFER_METRICS_LABEL = 'protocol'

function Metrics() {
  const peer: Peer = useContext(PeerContext);
  const [metricsData, setMetricsData] = useState<Map<string, RegistryMetricData<CollectorType>>>();

  useEffect(() => {
    // TODO: Add event for connection close and remove refresh in interval
    const intervalID = setInterval(async () => {
      const data = await peer.metrics.getMetricsAsMap();
      setMetricsData(data);
    }, REFRESH_INTERVAL);

    return () => {
      clearInterval(intervalID);
    };
  }, [peer])

  return (
    <Box>
      <Card>
        <CardContent>
          <Typography variant="subtitle1" color="inherit" noWrap>
            <b>Metrics</b>
          </Typography>
          <Grid container spacing={1}>
            <Grid item xs={9} container spacing={1}>
              <Grid item xs={4}>
                <Typography variant="subtitle2" color="inherit" noWrap>
                  General
                </Typography>
                <TableContainer component={Paper}>
                  <Table size='small'>
                    <TableHead>
                      <TableRow>
                        <TableCell>Name</TableCell>
                        <TableCell>Value</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {
                        UNLABELLED_METRICS.map(metricsName => {
                          const data = metricsData?.get(metricsName);

                          if (!data) {
                            return null;
                          }

                          return (
                            <TableRow key={metricsName}>
                              <TableCell><b>{metricsName}</b></TableCell>
                              <TableCell>{data.instance.get()?.value}</TableCell>
                            </TableRow>
                          );
                        })
                      }
                    </TableBody>
                  </Table>
                </TableContainer>
              </Grid>
              {
                LABELLED_METRICS.map(metricsName => {
                  const data = metricsData?.get(metricsName);
                  
                  if (!data || !data.instance.collect().length) {
                    return null;
                  }

                  const [label] = Object.keys(data.instance.collect()[0].labels!);

                  return (
                    <Grid key={metricsName} item xs={4}>
                      <LabelledMetrics
                        metricsName={metricsName}
                        label={label}
                        data={data.instance.collect()}
                      />
                    </Grid>
                  );
                })
              }
            </Grid>
            <Grid item xs={3}>
              <LabelledMetrics
                metricsName={DATA_TRANSFER_METRICS}
                label={DATA_TRANSFER_METRICS_LABEL}
                data={metricsData?.get(DATA_TRANSFER_METRICS)?.instance.collect()}
              />
            </Grid>
          </Grid>
        </CardContent>
      </Card>
    </Box>
  )
}

export default Metrics;
