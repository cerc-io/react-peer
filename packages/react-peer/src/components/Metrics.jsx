import React, { useContext, useEffect, useState } from 'react';

import { Box, Card, CardContent, Grid, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography } from '@mui/material';

import LabelledMetrics from './LabelledMetrics';
import { PeerContext } from '../context/PeerContext';
import { DEFAULT_REFRESH_INTERVAL } from '../constants';

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

export function Metrics({ refreshInterval = DEFAULT_REFRESH_INTERVAL }) {
  const peer = useContext(PeerContext);
  const [metricsData, setMetricsData] = useState();

  useEffect(() => {
    const intervalID = setInterval(async () => {
      const data = await peer.metrics.getMetricsAsMap();
      setMetricsData(data);
    }, refreshInterval);

    return () => {
      clearInterval(intervalID);
    };
  }, [peer])

  return (
    <Box>
      <Typography variant="subtitle2" color="inherit" noWrap>
        <b>Metrics</b>
      </Typography>
      <Grid container spacing={1}>
        <Grid item xs={3}>
          <LabelledMetrics
            metricsName={DATA_TRANSFER_METRICS}
            label={DATA_TRANSFER_METRICS_LABEL}
            data={metricsData?.get(DATA_TRANSFER_METRICS)?.instance.collect()}
          />
        </Grid>
        <Grid item xs={9} container spacing={1}>
          <Grid item xs={4}>
            <Typography variant="subtitle2" color="inherit" noWrap>
              <b>general</b>
            </Typography>
            <TableContainer component={Paper}>
              <Table size='small'>
                <TableHead>
                  <TableRow>
                    <TableCell size="small"><b>name</b></TableCell>
                    <TableCell size="small" align="right"><b>value</b></TableCell>
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
                          <TableCell size="small">{metricsName}</TableCell>
                          <TableCell size="small" align="right">{data.instance.get()?.value}</TableCell>
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

              const [label] = Object.keys(data.instance.collect()[0].labels);

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
      </Grid>
    </Box>
  )
}
