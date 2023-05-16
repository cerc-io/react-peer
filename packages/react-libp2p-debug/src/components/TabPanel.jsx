import React, { useEffect, useState } from 'react';

import { useTabContext } from '@mui/lab/TabContext';
import { Box } from '@mui/material';

// Custom TabPanel component to keep mounted after switching to other tab
export function TabPanel({
  children,
  value: id,
  ...props
}) {
  const context = useTabContext()
  const [visited, setVisited] = useState(false)

  if (context === null) {
    throw new TypeError("No TabContext provided")
  }
  const tabId = context.value

  useEffect(() => {
    if(id === tabId) {
      setVisited(true)
    }
  }, [id, tabId]);

  return (
    <Box
      hidden={id !== tabId}
      {...props}
    >
      {visited && children}
    </Box>
  )
}
