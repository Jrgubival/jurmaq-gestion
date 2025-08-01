import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Box,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
  Divider,
  Chip,
} from '@mui/material';
import {
  Dashboard,
  LocalGasStation,
  Assignment,
  Receipt,
  AccessTime,
  Description,
  FolderOpen,
  Build,
  People,
  Draw,
  Settings,
} from '@mui/icons-material';

import { useAuth } from '../../context/AuthContext';

const menuItems = [
  {
    text: 'Dashboard',
    icon: <Dashboard />,
    path: '/dashboard',
    roles: ['Usuario', 'RRHH', 'Admin'],
  },
  {
    text: 'Control de Combustible',
    icon: <LocalGasStation />,
    path: '/combustible',
    roles: ['Usuario', 'RRHH', 'Admin'],
  },
  {
    text: 'Presupuestos',
    icon: <Assignment />,
    path: '/presupuestos',
    roles: ['RRHH', 'Admin'],
  },
  {
    text: 'Facturas',
    icon: <Receipt />,
    path: '/facturas',
    roles: ['RRHH', 'Admin'],
  },
  {
    text: 'Control de Asistencia',
    icon: <AccessTime />,
    path: '/asistencia',
    roles: ['RRHH', 'Admin'],
  },
  {
    text: 'Vales y Anexos',
    icon: <Description />,
    path: '/vales',
    roles: ['RRHH', 'Admin'],
  },
  {
    text: 'Documentación',
    icon: <FolderOpen />,
    path: '/documentacion',
    roles: ['Usuario', 'RRHH', 'Admin'],
  },
  {
    text: 'Mantenimiento',
    icon: <Build />,
    path: '/mantenimiento',
    roles: ['Usuario', 'RRHH', 'Admin'],
  },
  {
    text: 'Usuarios y Permisos',
    icon: <People />,
    path: '/usuarios',
    roles: ['Admin'],
  },
  {
    text: 'Firmas Digitales',
    icon: <Draw />,
    path: '/firmas',
    roles: ['Admin'],
  },
];

const Sidebar = ({ onItemClick }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, hasPermission } = useAuth();

  const handleItemClick = (path) => {
    navigate(path);
    if (onItemClick) {
      onItemClick();
    }
  };

  const filteredMenuItems = menuItems.filter(item => 
    item.roles.some(role => hasPermission(role))
  );

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Box
          sx={{
            width: 60,
            height: 60,
            margin: '0 auto 16px',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            borderRadius: '16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontSize: '24px',
            fontWeight: 'bold',
          }}
        >
          J
        </Box>
        <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
          JURMAQ
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Gestión Empresarial
        </Typography>
        
        {user && (
          <Box sx={{ mt: 2 }}>
            <Chip
              label={user.rol}
              size="small"
              color="primary"
              variant="outlined"
            />
          </Box>
        )}
      </Box>

      <Divider />

      {/* Navigation Menu */}
      <Box sx={{ flexGrow: 1, overflow: 'auto' }}>
        <List sx={{ px: 2, py: 1 }}>
          {filteredMenuItems.map((item) => {
            const isActive = location.pathname === item.path;
            
            return (
              <ListItem key={item.path} disablePadding sx={{ mb: 0.5 }}>
                <ListItemButton
                  onClick={() => handleItemClick(item.path)}
                  sx={{
                    borderRadius: 2,
                    minHeight: 48,
                    backgroundColor: isActive ? 'primary.main' : 'transparent',
                    color: isActive ? 'primary.contrastText' : 'text.primary',
                    '&:hover': {
                      backgroundColor: isActive 
                        ? 'primary.dark' 
                        : 'action.hover',
                    },
                    transition: 'all 0.2s ease-in-out',
                  }}
                >
                  <ListItemIcon
                    sx={{
                      color: isActive ? 'primary.contrastText' : 'text.secondary',
                      minWidth: 40,
                    }}
                  >
                    {item.icon}
                  </ListItemIcon>
                  <ListItemText
                    primary={item.text}
                    primaryTypographyProps={{
                      fontSize: '0.875rem',
                      fontWeight: isActive ? 600 : 500,
                    }}
                  />
                </ListItemButton>
              </ListItem>
            );
          })}
        </List>
      </Box>

      <Divider />

      {/* Footer */}
      <Box sx={{ p: 2 }}>
        <ListItem disablePadding>
          <ListItemButton
            onClick={() => handleItemClick('/configuracion')}
            sx={{
              borderRadius: 2,
              minHeight: 48,
              backgroundColor: location.pathname === '/configuracion' ? 'primary.main' : 'transparent',
              color: location.pathname === '/configuracion' ? 'primary.contrastText' : 'text.primary',
              '&:hover': {
                backgroundColor: location.pathname === '/configuracion' 
                  ? 'primary.dark' 
                  : 'action.hover',
              },
            }}
          >
            <ListItemIcon
              sx={{
                color: location.pathname === '/configuracion' ? 'primary.contrastText' : 'text.secondary',
                minWidth: 40,
              }}
            >
              <Settings />
            </ListItemIcon>
            <ListItemText
              primary="Configuración"
              primaryTypographyProps={{
                fontSize: '0.875rem',
                fontWeight: location.pathname === '/configuracion' ? 600 : 500,
              }}
            />
          </ListItemButton>
        </ListItem>
        
        <Typography
          variant="caption"
          color="text.secondary"
          sx={{ display: 'block', textAlign: 'center', mt: 2 }}
        >
          Versión 1.0.0
        </Typography>
      </Box>
    </Box>
  );
};

export default Sidebar;