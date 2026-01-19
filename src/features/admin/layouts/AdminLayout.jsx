// Admin Layout Component
import React, { useState } from 'react';
import { Box, Drawer, useMediaQuery, useTheme } from '@mui/material';
import { Outlet } from 'react-router-dom';
import Sidebar from '../../../shared/components/Sidebar';
import TopNavbar from '../../../shared/components/TopNavbar';

const AdminLayout = () => {
  const sidebarWidth = 240;
  const leftGap = 16;
  const [mobileOpen, setMobileOpen] = useState(false);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: '#f3f4f6' }}>
      
      {/* Mobile Drawer */}
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={handleDrawerToggle}
        ModalProps={{
          keepMounted: true, // Better open performance on mobile.
        }}
        sx={{
          display: { xs: 'block', md: 'none' },
          '& .MuiDrawer-paper': { 
            boxSizing: 'border-box', 
            width: sidebarWidth,
            border: 'none',
          },
        }}
      >
        <Sidebar isMobile={true} onClose={handleDrawerToggle} />
      </Drawer>

      {/* Desktop Static Sidebar */}
      <Box sx={{ display: { xs: 'none', md: 'block' } }}>
        <Sidebar isMobile={false} />
      </Box>

      {/* Right Side Content with Top Navbar */}
      <Box
        sx={{
          flexGrow: 1,
          ml: { xs: 0, md: `${sidebarWidth + leftGap}px` },
          minWidth: 0,
          width: { xs: '100%', md: `calc(100% - ${sidebarWidth + leftGap}px)` },
          display: 'flex',
          flexDirection: 'column',
          p: { xs: 1, sm: 2 },
        }}
      >
        {/* Top Navbar */}
        <TopNavbar onMenuClick={handleDrawerToggle} isMobile={isMobile} />

        {/* Main Content Area */}
        <Box
          component="main"
          sx={{
            flexGrow: 1,
            p: { xs: 2, sm: 3 },
            mt: 2,
            bgcolor: 'background.paper',
            borderRadius: 1,
            overflowX: 'hidden',
          }}
        >
          <Outlet />
        </Box>
      </Box>

    </Box>
  );
};

export default AdminLayout;
