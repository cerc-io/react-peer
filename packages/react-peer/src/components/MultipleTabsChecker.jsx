import React, { useCallback, useEffect, useState } from 'react';

import { Button, Dialog, DialogActions, DialogContent, DialogContentText } from '@mui/material';

export function MultipleTabsChecker ({ children }) {
  // Set dialogOpen to false initially if no tabs are open
  const [dialogOpen, setDialogOpen] = useState(Boolean(localStorage.getItem('tabsOpen')));

  useEffect(() => {
    const tabsOpen = Boolean(localStorage.getItem('tabsOpen'));
    setDialogOpen(tabsOpen);

    if (!tabsOpen) {
      // Set tabOpens true if no other tabs are open
      localStorage.setItem('tabsOpen', true);

      // On closing of window set tabsOpen to false
      window.onunload = () => {
        localStorage.removeItem('tabsOpen');
      }
    }
  }, []);

  const handleRefresh = useCallback(() => {
    window.location.reload();
  }, []);

  const handleClear = useCallback(() => {
    localStorage.removeItem('tabsOpen');
    handleRefresh();
  }, [handleRefresh]);

  return (
    <>
      <Dialog
        open={dialogOpen}
        aria-labelledby="multiple-tabs-alert"
      >
        <DialogContent>
          <DialogContentText id="alert-dialog-description">
            App is open in another window. Close old window and click on "REFRESH".
            <br/>
            Click on "CLEAR STORAGE" if closing old window doesn't work.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button variant="outlined" onClick={handleClear}>CLEAR STORAGE</Button>
          <Button variant="contained" onClick={handleRefresh}>REFRESH</Button>
        </DialogActions>
      </Dialog>
      { !dialogOpen && children }
    </>
  )
}
