import React, { useState } from 'react';

import { Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, TextField } from '@mui/material';

export function CustomRelayDialog ({ open, oldCustomRelay, onSet, onCancel }) {
  const [customRelay, setCustomRelay] = useState(oldCustomRelay ?? '');

  return (
    <Dialog
      open={open}
      fullWidth
      maxWidth="md"
    >
      <DialogTitle>Custom Relay</DialogTitle>
      <DialogContent>
        <DialogContentText>
          Enter a relay node multiaddr here to set it as the custom relay node.
        </DialogContentText>
        <TextField
          autoFocus
          margin="dense"
          id="multiaddr"
          label="Relay multiaddr"
          fullWidth
          variant="standard"
          value={customRelay}
          onChange={event => {
            setCustomRelay(event.target.value);
          }}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onCancel}>Cancel</Button>
        <Button onClick={() => onSet(customRelay)}>Set</Button>
      </DialogActions>
    </Dialog>
  );
}
