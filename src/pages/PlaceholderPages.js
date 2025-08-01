import React from 'react';
import { Box, Typography, Card, CardContent, Button } from '@mui/material';
import { Assignment, Add } from '@mui/icons-material';

const pageComponents = {
  Presupuestos: {
    title: 'Gestión de Presupuestos',
    description: 'Creación y seguimiento de propuestas comerciales',
    icon: <Assignment />,
  },
  Facturas: {
    title: 'Gestión de Facturas',
    description: 'Control de pagos y vencimientos',
    icon: <Assignment />,
  },
  Asistencia: {
    title: 'Control de Asistencia',
    description: 'Registro de asistencia y cálculo de sueldos',
    icon: <Assignment />,
  },
  Vales: {
    title: 'Vales y Anexos',
    description: 'Documentación de contratos y vales',
    icon: <Assignment />,
  },
  Documentacion: {
    title: 'Documentación',
    description: 'Gestión de archivos por trabajador',
    icon: <Assignment />,
  },
  Mantenimiento: {
    title: 'Mantenimiento',
    description: 'Control de vehículos y maquinaria',
    icon: <Assignment />,
  },
  Usuarios: {
    title: 'Usuarios y Permisos',
    description: 'Gestión de usuarios del sistema',
    icon: <Assignment />,
  },
  Firmas: {
    title: 'Firmas Digitales',
    description: 'Timbres empresariales y certificados',
    icon: <Assignment />,
  },
  Configuracion: {
    title: 'Configuración',
    description: 'Configuración del sistema',
    icon: <Assignment />,
  },
};

const createPageComponent = (pageName) => {
  return function PageComponent() {
    const config = pageComponents[pageName];
    
    return (
      <Box>
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" sx={{ fontWeight: 600, mb: 1 }}>
            {config.title}
          </Typography>
          <Typography variant="body1" color="text.secondary">
            {config.description}
          </Typography>
        </Box>

        <Card>
          <CardContent sx={{ textAlign: 'center', py: 8 }}>
            <Box sx={{ mb: 3, fontSize: '4rem', color: 'primary.main' }}>
              {config.icon}
            </Box>
            
            <Typography variant="h5" sx={{ mb: 2 }}>
              Módulo en Desarrollo
            </Typography>
            
            <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
              Este módulo será implementado en una próxima versión de JURMAQ Gestión Empresarial.
              <br />
              Funcionalidad completa disponible próximamente.
            </Typography>
            
            <Button
              variant="contained"
              startIcon={<Add />}
              size="large"
              disabled
            >
              Funcionalidad Próximamente
            </Button>
          </CardContent>
        </Card>
      </Box>
    );
  };
};

// Export all page components
export const Presupuestos = createPageComponent('Presupuestos');
export const Facturas = createPageComponent('Facturas');
export const Asistencia = createPageComponent('Asistencia');
export const Vales = createPageComponent('Vales');
export const Documentacion = createPageComponent('Documentacion');
export const Mantenimiento = createPageComponent('Mantenimiento');
export const Usuarios = createPageComponent('Usuarios');
export const Firmas = createPageComponent('Firmas');
export const Configuracion = createPageComponent('Configuracion');