import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Box } from '@mui/material';

import Layout from './components/Layout/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Combustible from './pages/Combustible';
import Presupuestos from './pages/Presupuestos';
import Facturas from './pages/Facturas';
import Asistencia from './pages/Asistencia';
import Vales from './pages/Vales';
import Documentacion from './pages/Documentacion';
import Mantenimiento from './pages/Mantenimiento';
import Usuarios from './pages/Usuarios';
import Firmas from './pages/Firmas';
import Configuracion from './pages/Configuracion';

import { useAuth } from './context/AuthContext';
import LoadingScreen from './components/Common/LoadingScreen';

function App() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <LoadingScreen />;
  }

  if (!user) {
    return <Login />;
  }

  return (
    <Box sx={{ display: 'flex', height: '100vh' }}>
      <Layout>
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/combustible" element={<Combustible />} />
          <Route path="/presupuestos" element={<Presupuestos />} />
          <Route path="/facturas" element={<Facturas />} />
          <Route path="/asistencia" element={<Asistencia />} />
          <Route path="/vales" element={<Vales />} />
          <Route path="/documentacion" element={<Documentacion />} />
          <Route path="/mantenimiento" element={<Mantenimiento />} />
          <Route path="/usuarios" element={<Usuarios />} />
          <Route path="/firmas" element={<Firmas />} />
          <Route path="/configuracion" element={<Configuracion />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </Layout>
    </Box>
  );
}

export default App;