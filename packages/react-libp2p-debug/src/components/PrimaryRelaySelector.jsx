import React, { useCallback, useState } from 'react';

import { Box, Button, FormControl, InputLabel, MenuItem, Select } from '@mui/material';

import { CustomRelayDialog } from './CustomRelayDialog';

const STYLES = {
  primaryRelaySelect: {
    marginRight: 1,
    minWidth: 200
  },
}

export function PrimaryRelaySelector ({ relayNodes = [] }) {
  const [openCustomRelayDialog, setOpenCustomRelayDialog] = useState(false);
  const [primaryRelay, setPrimaryRelay] = useState(localStorage.getItem('primaryRelay') ?? '')
  const [customRelay, setCustomRelay] = useState(localStorage.getItem('customRelay'))

  const handlePrimaryRelaySelectChange = useCallback(event => {
    // Check if value is null when custom relay option is selected
    if (event.target.value !== null) {
      setPrimaryRelay(event.target.value)
    }
  }, [])

  const handleCustomOptionClick = useCallback(event => {
    setOpenCustomRelayDialog(true);
  }, [])

  // TODO: Handle primary relay update outside debug component?
  const handlePrimaryRelayUpdate = useCallback(() => {
    // Set selected primary relay in localStorage and refresh app
    localStorage.setItem('primaryRelay', primaryRelay);
    window.location.reload(false);
  }, [primaryRelay])

  const handleCustomRelaySet = useCallback((newCustomRelay) => {
    setCustomRelay(newCustomRelay);
    // Set custom relay in localStorage
    localStorage.setItem('customRelay', newCustomRelay);
    setPrimaryRelay(newCustomRelay);
    setOpenCustomRelayDialog(false);
  }, [])

  const handleCustomRelayCancel = useCallback(() => {
    setPrimaryRelay(primaryRelay);
    setOpenCustomRelayDialog(false);
  }, [primaryRelay])

  return (
    <Box display="flex" alignItems="flex-end">
      <FormControl variant="standard" sx={STYLES.primaryRelaySelect} size="small">
        <InputLabel shrink id="primary-relay-label">Primary Relay</InputLabel>
        <Select
          displayEmpty
          labelId="primary-relay-label"
          id="primary-label"
          value={primaryRelay}
          label="Primary Relay"
          onChange={handlePrimaryRelaySelectChange}
        >
          <MenuItem value="">{"<random>"}</MenuItem>
          {relayNodes.map(relayNode => (
            <MenuItem
              value={relayNode}
              key={relayNode}
            >
              {relayNode.split('/')[2]}
            </MenuItem>
          ))}
          <MenuItem
            value={customRelay}
            onClick={handleCustomOptionClick}
          >
            {"<custom>"}
          </MenuItem>
        </Select>
      </FormControl>
      <Button
        variant="contained"
        size="small"
        disabled={primaryRelay === (localStorage.getItem('primaryRelay') ?? '')}
        onClick={handlePrimaryRelayUpdate}
      >
        UPDATE
      </Button>
      <CustomRelayDialog
        open={openCustomRelayDialog}
        oldCustomRelay={customRelay}
        onSet={handleCustomRelaySet}
        onCancel={handleCustomRelayCancel}
      />
    </Box>
  );
}
