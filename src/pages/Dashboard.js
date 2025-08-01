import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  IconButton,
  Avatar,
  Chip,
  LinearProgress,
  Alert,
} from '@mui/material';
import {
  TrendingUp,
  LocalGasStation,
  Assignment,
  Receipt,
  People,
  Refresh,
  Warning,
  CheckCircle,
  Schedule,
} from '@mui/icons-material';

import { useAuth } from '../context/AuthContext';
import { useDatabase } from '../context/DatabaseContext';

const Dashboard = () => {
  const { user } = useAuth();
  const { isConnected, syncOneDrive } = useDatabase();
  const [stats, setStats] = useState({
    combustible: { total: 0, mes: 0 },
    presupuestos: { total: 0, pendientes: 0 },
    facturas: { total: 0, vencidas: 0 },
    trabajadores: { total: 0, activos: 0 },
  });
  const [recentActivity, setRecentActivity] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setIsLoading(true);
    try {
      if (!window.electronAPI) {
        console.warn('Electron API not available - running in demo mode');
        setDemoData();
        return;
      }

      // Load statistics
      await loadStats();
      await loadRecentActivity();
      await loadAlerts();
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      setDemoData();
    } finally {
      setIsLoading(false);
    }
  };

  const setDemoData = () => {
    setStats({
      combustible: { total: 150000, mes: 25000 },
      presupuestos: { total: 15, pendientes: 5 },
      facturas: { total: 28, vencidas: 3 },
      trabajadores: { total: 25, activos: 23 },
    });

    setRecentActivity([
      { id: 1, type: 'combustible', description: 'Vale de combustible registrado - Vehículo AB-1234', date: new Date() },
      { id: 2, type: 'presupuesto', description: 'Nuevo presupuesto creado para Cliente XYZ', date: new Date(Date.now() - 86400000) },
      { id: 3, type: 'factura', description: 'Factura #001234 marcada como pagada', date: new Date(Date.now() - 172800000) },
    ]);

    setAlerts([
      { id: 1, type: 'warning', message: '3 facturas próximas a vencer esta semana' },
      { id: 2, type: 'info', message: 'Mantenimiento programado para vehículo CD-5678' },
    ]);
  };

  const loadStats = async () => {
    try {
      // Combustible stats
      const combustibleTotal = await window.electronAPI.dbQuery(
        'SELECT SUM(total) as total FROM combustible WHERE fecha >= date("now", "start of year")'
      );
      const combustibleMes = await window.electronAPI.dbQuery(
        'SELECT SUM(total) as total FROM combustible WHERE fecha >= date("now", "start of month")'
      );

      // Presupuestos stats
      const presupuestosTotal = await window.electronAPI.dbQuery(
        'SELECT COUNT(*) as total FROM presupuestos WHERE fecha_creacion >= date("now", "start of year")'
      );
      const presupuestosPendientes = await window.electronAPI.dbQuery(
        'SELECT COUNT(*) as total FROM presupuestos WHERE estado = "Pendiente"'
      );

      // Facturas stats
      const facturasTotal = await window.electronAPI.dbQuery(
        'SELECT COUNT(*) as total FROM facturas WHERE fecha_emision >= date("now", "start of year")'
      );
      const facturasVencidas = await window.electronAPI.dbQuery(
        'SELECT COUNT(*) as total FROM facturas WHERE fecha_vencimiento < date("now") AND estado != "Pagada"'
      );

      // Trabajadores stats
      const trabajadoresTotal = await window.electronAPI.dbQuery(
        'SELECT COUNT(*) as total FROM trabajadores'
      );
      const trabajadoresActivos = await window.electronAPI.dbQuery(
        'SELECT COUNT(*) as total FROM trabajadores WHERE activo = 1'
      );

      setStats({
        combustible: {
          total: combustibleTotal[0]?.total || 0,
          mes: combustibleMes[0]?.total || 0,
        },
        presupuestos: {
          total: presupuestosTotal[0]?.total || 0,
          pendientes: presupuestosPendientes[0]?.total || 0,
        },
        facturas: {
          total: facturasTotal[0]?.total || 0,
          vencidas: facturasVencidas[0]?.total || 0,
        },
        trabajadores: {
          total: trabajadoresTotal[0]?.total || 0,
          activos: trabajadoresActivos[0]?.total || 0,
        },
      });
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const loadRecentActivity = async () => {
    try {
      const activities = await window.electronAPI.dbQuery(`
        SELECT 'combustible' as type, 'Vale de combustible registrado' as description, created_at as date
        FROM combustible 
        ORDER BY created_at DESC 
        LIMIT 3
      `);
      
      setRecentActivity(activities.map((activity, index) => ({
        id: index + 1,
        ...activity,
        date: new Date(activity.date),
      })));
    } catch (error) {
      console.error('Error loading recent activity:', error);
    }
  };

  const loadAlerts = async () => {
    try {
      const alertsList = [];
      
      // Check for overdue invoices
      const overdueInvoices = await window.electronAPI.dbQuery(
        'SELECT COUNT(*) as count FROM facturas WHERE fecha_vencimiento < date("now") AND estado != "Pagada"'
      );
      
      if (overdueInvoices[0]?.count > 0) {
        alertsList.push({
          id: 1,
          type: 'error',
          message: `${overdueInvoices[0].count} facturas vencidas requieren atención`,
        });
      }

      // Check for upcoming maintenance
      const upcomingMaintenance = await window.electronAPI.dbQuery(
        'SELECT COUNT(*) as count FROM mantenimientos WHERE fecha_programada BETWEEN date("now") AND date("now", "+7 days") AND estado = "Programado"'
      );
      
      if (upcomingMaintenance[0]?.count > 0) {
        alertsList.push({
          id: 2,
          type: 'warning',
          message: `${upcomingMaintenance[0].count} mantenciones programadas esta semana`,
        });
      }

      setAlerts(alertsList);
    } catch (error) {
      console.error('Error loading alerts:', error);
    }
  };

  const handleSync = async () => {
    setIsSyncing(true);
    try {
      await syncOneDrive();
      await loadDashboardData(); // Refresh data after sync
    } catch (error) {
      console.error('Sync error:', error);
    } finally {
      setIsSyncing(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const getActivityIcon = (type) => {
    switch (type) {
      case 'combustible':
        return <LocalGasStation />;
      case 'presupuesto':
        return <Assignment />;
      case 'factura':
        return <Receipt />;
      default:
        return <CheckCircle />;
    }
  };

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 600, mb: 1 }}>
            Bienvenido, {user?.nombre}
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Panel de control - JURMAQ Gestión Empresarial
          </Typography>
        </Box>
        
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          <Chip
            icon={isConnected ? <CheckCircle /> : <Warning />}
            label={isConnected ? 'Conectado' : 'Desconectado'}
            color={isConnected ? 'success' : 'error'}
            variant="outlined"
          />
          
          <Button
            variant="outlined"
            startIcon={<Refresh className={isSyncing ? 'spinner' : ''} />}
            onClick={handleSync}
            disabled={isSyncing}
          >
            {isSyncing ? 'Sincronizando...' : 'Sincronizar'}
          </Button>
        </Box>
      </Box>

      {/* Alerts */}
      {alerts.length > 0 && (
        <Box sx={{ mb: 4 }}>
          {alerts.map((alert) => (
            <Alert key={alert.id} severity={alert.type} sx={{ mb: 1 }}>
              {alert.message}
            </Alert>
          ))}
        </Box>
      )}

      {/* Statistics Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Avatar sx={{ bgcolor: 'warning.main', mr: 2 }}>
                  <LocalGasStation />
                </Avatar>
                <Typography variant="h6">Combustible</Typography>
              </Box>
              <Typography variant="h4" sx={{ mb: 1 }}>
                {formatCurrency(stats.combustible.mes)}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Este mes
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Total año: {formatCurrency(stats.combustible.total)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Avatar sx={{ bgcolor: 'info.main', mr: 2 }}>
                  <Assignment />
                </Avatar>
                <Typography variant="h6">Presupuestos</Typography>
              </Box>
              <Typography variant="h4" sx={{ mb: 1 }}>
                {stats.presupuestos.pendientes}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Pendientes
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Total: {stats.presupuestos.total}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Avatar sx={{ bgcolor: stats.facturas.vencidas > 0 ? 'error.main' : 'success.main', mr: 2 }}>
                  <Receipt />
                </Avatar>
                <Typography variant="h6">Facturas</Typography>
              </Box>
              <Typography variant="h4" sx={{ mb: 1 }}>
                {stats.facturas.vencidas}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Vencidas
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Total: {stats.facturas.total}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Avatar sx={{ bgcolor: 'primary.main', mr: 2 }}>
                  <People />
                </Avatar>
                <Typography variant="h6">Trabajadores</Typography>
              </Box>
              <Typography variant="h4" sx={{ mb: 1 }}>
                {stats.trabajadores.activos}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Activos
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Total: {stats.trabajadores.total}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Recent Activity */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 3 }}>
                Actividad Reciente
              </Typography>
              
              {isLoading && <LinearProgress sx={{ mb: 2 }} />}
              
              {recentActivity.length > 0 ? (
                <Box>
                  {recentActivity.map((activity) => (
                    <Box
                      key={activity.id}
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        mb: 2,
                        pb: 2,
                        borderBottom: '1px solid',
                        borderColor: 'divider',
                      }}
                    >
                      <Avatar sx={{ mr: 2, bgcolor: 'primary.main' }}>
                        {getActivityIcon(activity.type)}
                      </Avatar>
                      <Box sx={{ flexGrow: 1 }}>
                        <Typography variant="body1">
                          {activity.description}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {activity.date.toLocaleString('es-CL')}
                        </Typography>
                      </Box>
                    </Box>
                  ))}
                </Box>
              ) : (
                <Typography color="text.secondary">
                  No hay actividad reciente
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 3 }}>
                Accesos Rápidos
              </Typography>
              
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Button
                  variant="outlined"
                  startIcon={<LocalGasStation />}
                  fullWidth
                  sx={{ justifyContent: 'flex-start' }}
                >
                  Registrar Combustible
                </Button>
                
                <Button
                  variant="outlined"
                  startIcon={<Assignment />}
                  fullWidth
                  sx={{ justifyContent: 'flex-start' }}
                >
                  Crear Presupuesto
                </Button>
                
                <Button
                  variant="outlined"
                  startIcon={<Receipt />}
                  fullWidth
                  sx={{ justifyContent: 'flex-start' }}
                >
                  Nueva Factura
                </Button>
                
                <Button
                  variant="outlined"
                  startIcon={<Schedule />}
                  fullWidth
                  sx={{ justifyContent: 'flex-start' }}
                >
                  Registrar Asistencia
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Dashboard;