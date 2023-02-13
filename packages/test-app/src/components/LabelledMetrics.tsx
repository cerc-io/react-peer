import React from 'react';

import { Box, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography } from '@mui/material';
import { Metric } from 'promjs'

type LabelledMetricsProps = {
  metricsName: string;
  label: string;
  data?: Metric<number>[];
};

function LabelledMetrics ({ metricsName, label, data = [] }: LabelledMetricsProps) {
  return (
    <Box>
      <Typography variant="subtitle2" color="inherit" noWrap>
        {metricsName}
      </Typography>
      <TableContainer component={Paper}>
        <Table size='small'>
          <TableHead>
            <TableRow>
              <TableCell>{label}</TableCell>
              <TableCell>Value</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {
              data.map(({ labels = {}, value }) => {
                return (
                  <TableRow key={labels[label]}>
                    <TableCell><b>{labels[label]}</b></TableCell>
                    <TableCell>{value}</TableCell>
                  </TableRow>
                );
              })
            }
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  )
}

export default LabelledMetrics;
