import React from 'react';

import { Box, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography } from '@mui/material';

function LabelledMetrics ({ metricsName, label, data = [] }) {
  return (
    <Box>
      <Typography variant="subtitle2" color="inherit" noWrap>
        <b>{metricsName}</b>
      </Typography>
      <TableContainer component={Paper}>
        <Table size='small'>
          <TableHead>
            <TableRow>
              <TableCell size="small"><b>{label}</b></TableCell>
              <TableCell size="small" align="right"><b>value</b></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {
              data.map(({ labels = {}, value }) => {
                return (
                  <TableRow key={labels[label]}>
                    <TableCell size="small">{labels[label]}</TableCell>
                    <TableCell size="small" align="right">{value}</TableCell>
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
