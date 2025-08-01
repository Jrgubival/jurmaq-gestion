import React from 'react';
import { Box, CircularProgress, Typography } from '@mui/material';

const LoadingScreen = ({ message = 'Cargando...' }) => {
  return (
    <Box
      sx={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'background.default',
        zIndex: 9999,
      }}
    >
      <Box
        sx={{
          width: 80,
          height: 80,
          margin: '0 auto 20px',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          borderRadius: '20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          fontSize: '32px',
          fontWeight: 'bold',
          mb: 3,
        }}
      >
        J
      </Box>
      
      <Typography variant="h5" sx={{ mb: 2, fontWeight: 600 }}>
        JURMAQ Gestión Empresarial
      </Typography>
      
      <CircularProgress sx={{ mb: 2 }} />
      
      <Typography variant="body2" color="text.secondary">
        {message}
      </Typography>
    </Box>
  );
};

export default LoadingScreen;