import React from 'react';
import { Link as RouterLink, useLocation } from 'react-router-dom';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Box,
  Container,
  useTheme,
  useMediaQuery
} from '@mui/material';
import DashboardIcon from '@mui/icons-material/Dashboard';
import ShowChartIcon from '@mui/icons-material/ShowChart';
import MenuIcon from '@mui/icons-material/Menu';

const Navbar = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const location = useLocation();
  
  const isActive = (path) => location.pathname === path;
  
  return (
    <AppBar position="static" color="primary" elevation={0}>
      <Container maxWidth="lg">
        <Toolbar disableGutters>
          <Typography
            variant="h6"
            sx={{ 
              flexGrow: 1, 
              fontWeight: 'bold',
              display: 'flex',
              alignItems: 'center'
            }}
          >
            <DashboardIcon sx={{ mr: 1 }} />
            Financial AI Dashboard
          </Typography>
          
          {!isMobile ? (
            <Box sx={{ display: 'flex' }}>
              <Button
                component={RouterLink}
                to="/"
                sx={{ 
                  color: 'white',
                  borderBottom: isActive('/') ? '2px solid white' : 'none',
                  borderRadius: 0,
                  mx: 1
                }}
                startIcon={<DashboardIcon />}
              >
                Financial Dashboard
              </Button>
              
              <Button
                component={RouterLink}
                to="/stocks"
                sx={{ 
                  color: 'white',
                  borderBottom: isActive('/stocks') ? '2px solid white' : 'none',
                  borderRadius: 0,
                  mx: 1
                }}
                startIcon={<ShowChartIcon />}
              >
                Stock Dashboard
              </Button>
            </Box>
          ) : (
            <Button
              color="inherit"
              sx={{ ml: 1 }}
            >
              <MenuIcon />
            </Button>
          )}
        </Toolbar>
      </Container>
    </AppBar>
  );
};

export default Navbar; 