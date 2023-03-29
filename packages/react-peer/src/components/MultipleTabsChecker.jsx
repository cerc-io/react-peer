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
      localStorage.setItem('tabsOpen', true)

      // On closing of window set tabsOpen to false
      window.onunload = () => {
        localStorage.removeItem('tabsOpen')
      }
    }
  }, []);

  const handleRefresh = useCallback(() => {
    window.location.reload();
  });

  return (
    <>
      <Dialog
        open={dialogOpen}
        aria-labelledby="multiple-tabs-alert"
      >
        <DialogContent>
          <DialogContentText id="alert-dialog-description">
            App is open in another window. Close old window and click on "REFRESH".
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleRefresh}>REFRESH</Button>
        </DialogActions>
      </Dialog>
      { !dialogOpen && children }
    </>
  )
}
