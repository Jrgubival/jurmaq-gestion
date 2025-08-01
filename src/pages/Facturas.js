import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Badge,
} from '@mui/material';
import {
  Add,
  Edit,
  Delete,
  Receipt,
  GetApp,
  Search,
  Visibility,
  Warning,
  CheckCircle,
  Schedule,
  MoneyOff,
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import dayjs from 'dayjs';

import { useDatabase } from '../context/DatabaseContext';

const Facturas = () => {
  const { generatePDF } = useDatabase();
  const [records, setRecords] = useState([]);
  const [open, setOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Filters
  const [filters, setFilters] = useState({
    dateFrom: dayjs().startOf('month'),
    dateTo: dayjs().endOf('month'),
    estado: '',
    cliente: '',
    vencidas: false,
  });

  // Form data
  const [formData, setFormData] = useState({
    numero: '',
    cliente: '',
    monto: '',
    fecha_emision: dayjs(),
    fecha_vencimiento: dayjs().add(30, 'days'),
    estado: 'Pendiente',
    observaciones: '',
  });

  const estados = [
    { value: 'Pendiente', label: 'Pendiente', color: 'warning', icon: <Schedule /> },
    { value: 'Pagada', label: 'Pagada', color: 'success', icon: <CheckCircle /> },
    { value: 'Vencida', label: 'Vencida', color: 'error', icon: <Warning /> },
    { value: 'Anulada', label: 'Anulada', color: 'default', icon: <MoneyOff /> },
  ];

  useEffect(() => {
    loadRecords();
  }, [filters]);

  useEffect(() => {
    // Check for overdue invoices
    const checkOverdueInvoices = () => {
      setRecords(prev => prev.map(record => {
        if (record.estado === 'Pendiente' && dayjs(record.fecha_vencimiento).isBefore(dayjs(), 'day')) {
          return { ...record, estado: 'Vencida' };
        }
        return record;
      }));
    };

    checkOverdueInvoices();
    const interval = setInterval(checkOverdueInvoices, 60000); // Check every minute

    return () => clearInterval(interval);
  }, []);

  const loadRecords = async () => {
    setIsLoading(true);
    try {
      if (!window.electronAPI) {
        // Demo data
        setRecords([
          {
            id: 1,
            numero: 'FAC-2024-001',
            cliente: 'Constructora ABC S.A.',
            monto: 5500000,
            fecha_emision: '2024-01-15',
            fecha_vencimiento: '2024-02-15',
            estado: 'Pagada',
            observaciones: 'Trabajo realizado en enero',
          },
          {
            id: 2,
            numero: 'FAC-2024-002',
            cliente: 'Municipalidad de Santiago',
            monto: 3200000,
            fecha_emision: '2024-01-20',
            fecha_vencimiento: '2024-02-20',
            estado: 'Pendiente',
            observaciones: 'Reparación pavimento calle principal',
          },
          {
            id: 3,
            numero: 'FAC-2024-003',
            cliente: 'Empresa XYZ Ltda.',
            monto: 1800000,
            fecha_emision: '2024-01-10',
            fecha_vencimiento: '2024-01-25',
            estado: 'Vencida',
            observaciones: 'Ampliación oficinas - Pendiente pago',
          },
          {
            id: 4,
            numero: 'FAC-2024-004',
            cliente: 'Comercio Local SpA',
            monto: 950000,
            fecha_emision: '2024-01-25',
            fecha_vencimiento: '2024-02-25',
            estado: 'Pendiente',
            observaciones: 'Reparaciones menores',
          }
        ]);
        setIsLoading(false);
        return;
      }

      let query = `
        SELECT * FROM facturas 
        WHERE fecha_emision BETWEEN ? AND ? 
      `;
      
      const params = [
        filters.dateFrom.format('YYYY-MM-DD'),
        filters.dateTo.format('YYYY-MM-DD')
      ];
      
      if (filters.estado) {
        query += ' AND estado = ?';
        params.push(filters.estado);
      }
      
      if (filters.cliente) {
        query += ' AND cliente LIKE ?';
        params.push(`%${filters.cliente}%`);
      }

      if (filters.vencidas) {
        query += ' AND fecha_vencimiento < ? AND estado != "Pagada"';
        params.push(dayjs().format('YYYY-MM-DD'));
      }

      query += ' ORDER BY fecha_emision DESC';

      const data = await window.electronAPI.dbQuery(query, params);
      setRecords(data);
    } catch (error) {
      console.error('Error loading records:', error);
      setError('Error al cargar las facturas');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      if (!window.electronAPI) {
        // Demo mode
        const newRecord = {
          id: Date.now(),
          ...formData,
          numero: `FAC-2024-${String(records.length + 1).padStart(3, '0')}`,
          fecha_emision: formData.fecha_emision.format('YYYY-MM-DD'),
          fecha_vencimiento: formData.fecha_vencimiento.format('YYYY-MM-DD'),
        };
        
        if (editingId) {
          setRecords(prev => prev.map(record => 
            record.id === editingId ? { ...newRecord, id: editingId } : record
          ));
        } else {
          setRecords(prev => [newRecord, ...prev]);
        }
        
        handleClose();
        return;
      }

      let result;
      if (editingId) {
        result = await window.electronAPI.dbRun(
          `UPDATE facturas SET 
           cliente=?, monto=?, fecha_emision=?, fecha_vencimiento=?, estado=?, observaciones=?
           WHERE id=?`,
          [
            formData.cliente,
            formData.monto,
            formData.fecha_emision.format('YYYY-MM-DD'),
            formData.fecha_vencimiento.format('YYYY-MM-DD'),
            formData.estado,
            formData.observaciones,
            editingId
          ]
        );
      } else {
        const numero = `FAC-${dayjs().format('YYYY')}-${String(records.length + 1).padStart(3, '0')}`;
        result = await window.electronAPI.dbRun(
          `INSERT INTO facturas 
           (numero, cliente, monto, fecha_emision, fecha_vencimiento, estado, observaciones) 
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [
            numero,
            formData.cliente,
            formData.monto,
            formData.fecha_emision.format('YYYY-MM-DD'),
            formData.fecha_vencimiento.format('YYYY-MM-DD'),
            formData.estado,
            formData.observaciones
          ]
        );
      }

      if (result.changes > 0) {
        await loadRecords();
        handleClose();
      }
    } catch (error) {
      console.error('Error saving record:', error);
      setError('Error al guardar la factura');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (record) => {
    setFormData({
      ...record,
      fecha_emision: dayjs(record.fecha_emision),
      fecha_vencimiento: dayjs(record.fecha_vencimiento),
    });
    setEditingId(record.id);
    setOpen(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('¿Está seguro que desea eliminar esta factura?')) return;

    try {
      if (!window.electronAPI) {
        setRecords(prev => prev.filter(record => record.id !== id));
        return;
      }

      const result = await window.electronAPI.dbRun('DELETE FROM facturas WHERE id = ?', [id]);
      if (result.changes > 0) {
        await loadRecords();
      }
    } catch (error) {
      console.error('Error deleting record:', error);
      setError('Error al eliminar la factura');
    }
  };

  const handleMarkAsPaid = async (id) => {
    try {
      if (!window.electronAPI) {
        setRecords(prev => prev.map(record => 
          record.id === id ? { ...record, estado: 'Pagada' } : record
        ));
        return;
      }

      const result = await window.electronAPI.dbRun(
        'UPDATE facturas SET estado = "Pagada" WHERE id = ?',
        [id]
      );
      
      if (result.changes > 0) {
        await loadRecords();
      }
    } catch (error) {
      console.error('Error updating record:', error);
      setError('Error al marcar como pagada');
    }
  };

  const handleGeneratePDF = async (record) => {
    try {
      const result = await generatePDF({
        type: 'factura',
        data: record,
        filename: `factura_${record.numero}.pdf`
      });

      if (result.success) {
        alert(`PDF generado: ${result.filename}`);
      } else {
        alert('Error al generar PDF: ' + result.error);
      }
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Error al generar PDF');
    }
  };

  const handleClose = () => {
    setOpen(false);
    setDetailOpen(false);
    setEditingId(null);
    setSelectedRecord(null);
    setFormData({
      numero: '',
      cliente: '',
      monto: '',
      fecha_emision: dayjs(),
      fecha_vencimiento: dayjs().add(30, 'days'),
      estado: 'Pendiente',
      observaciones: '',
    });
    setError('');
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const getStatusColor = (estado, fechaVencimiento) => {
    if (estado === 'Pendiente' && dayjs(fechaVencimiento).isBefore(dayjs(), 'day')) {
      return 'error';
    }
    const status = estados.find(s => s.value === estado);
    return status ? status.color : 'default';
  };

  const getStatusIcon = (estado, fechaVencimiento) => {
    if (estado === 'Pendiente' && dayjs(fechaVencimiento).isBefore(dayjs(), 'day')) {
      return <Warning />;
    }
    const status = estados.find(s => s.value === estado);
    return status ? status.icon : <Receipt />;
  };

  const getStatusLabel = (estado, fechaVencimiento) => {
    if (estado === 'Pendiente' && dayjs(fechaVencimiento).isBefore(dayjs(), 'day')) {
      return 'Vencida';
    }
    return estado;
  };

  // Calculate statistics
  const stats = {
    total: records.length,
    pendientes: records.filter(r => r.estado === 'Pendiente').length,
    pagadas: records.filter(r => r.estado === 'Pagada').length,
    vencidas: records.filter(r => 
      (r.estado === 'Vencida') || 
      (r.estado === 'Pendiente' && dayjs(r.fecha_vencimiento).isBefore(dayjs(), 'day'))
    ).length,
    montoTotal: records.filter(r => r.estado === 'Pagada').reduce((sum, r) => sum + parseFloat(r.monto), 0),
    montoPendiente: records.filter(r => r.estado === 'Pendiente').reduce((sum, r) => sum + parseFloat(r.monto), 0),
  };

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h4" sx={{ fontWeight: 600 }}>
          Gestión de Facturas
        </Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => setOpen(true)}
        >
          Nueva Factura
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {/* Overdue Alert */}
      {stats.vencidas > 0 && (
        <Alert severity="warning" sx={{ mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Warning sx={{ mr: 1 }} />
            Tienes {stats.vencidas} factura{stats.vencidas > 1 ? 's' : ''} vencida{stats.vencidas > 1 ? 's' : ''} que requiere{stats.vencidas > 1 ? 'n' : ''} atención.
          </Box>
        </Alert>
      )}

      {/* Filters */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={3}>
            <Grid item xs={12} md={3}>
              <DatePicker
                label="Fecha Desde"
                value={filters.dateFrom}
                onChange={(value) => setFilters(prev => ({ ...prev, dateFrom: value }))}
                renderInput={(params) => <TextField {...params} fullWidth />}
              />
            </Grid>
            <Grid item xs={12} md={2}>
              <DatePicker
                label="Fecha Hasta"
                value={filters.dateTo}
                onChange={(value) => setFilters(prev => ({ ...prev, dateTo: value }))}
                renderInput={(params) => <TextField {...params} fullWidth />}
              />
            </Grid>
            <Grid item xs={12} md={2}>
              <FormControl fullWidth>
                <InputLabel>Estado</InputLabel>
                <Select
                  value={filters.estado}
                  label="Estado"
                  onChange={(e) => setFilters(prev => ({ ...prev, estado: e.target.value }))}
                >
                  <MenuItem value="">Todos</MenuItem>
                  {estados.map(estado => (
                    <MenuItem key={estado.value} value={estado.value}>
                      {estado.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                label="Cliente"
                placeholder="Buscar por cliente..."
                value={filters.cliente}
                onChange={(e) => setFilters(prev => ({ ...prev, cliente: e.target.value }))}
                InputProps={{
                  startAdornment: <Search sx={{ mr: 1, color: 'text.secondary' }} />
                }}
              />
            </Grid>
            <Grid item xs={12} md={2}>
              <Button
                fullWidth
                variant={filters.vencidas ? 'contained' : 'outlined'}
                color="error"
                startIcon={<Warning />}
                onClick={() => setFilters(prev => ({ ...prev, vencidas: !prev.vencidas }))}
                sx={{ height: 56 }}
              >
                Solo Vencidas
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Statistics Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={2}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Receipt sx={{ mr: 2, color: 'primary.main' }} />
                <Typography variant="h6">Total</Typography>
              </Box>
              <Typography variant="h4">
                {stats.total}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Facturas
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={2}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Schedule sx={{ mr: 2, color: 'warning.main' }} />
                <Typography variant="h6">Pendientes</Typography>
              </Box>
              <Typography variant="h4">
                {stats.pendientes}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Por cobrar
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={2}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Badge badgeContent={stats.vencidas} color="error">
                  <Warning sx={{ mr: 2, color: 'error.main' }} />
                </Badge>
                <Typography variant="h6">Vencidas</Typography>
              </Box>
              <Typography variant="h4" color="error.main">
                {stats.vencidas}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Requieren atención
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={2}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <CheckCircle sx={{ mr: 2, color: 'success.main' }} />
                <Typography variant="h6">Pagadas</Typography>
              </Box>
              <Typography variant="h4">
                {stats.pagadas}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Completadas
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={2}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <CheckCircle sx={{ mr: 2, color: 'success.main' }} />
                <Typography variant="h6">Cobrado</Typography>
              </Box>
              <Typography variant="h4">
                {formatCurrency(stats.montoTotal)}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Total pagado
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={2}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Schedule sx={{ mr: 2, color: 'warning.main' }} />
                <Typography variant="h6">Por Cobrar</Typography>
              </Box>
              <Typography variant="h4">
                {formatCurrency(stats.montoPendiente)}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Pendiente
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Data Table */}
      <Card>
        <CardContent>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Número</TableCell>
                  <TableCell>Cliente</TableCell>
                  <TableCell>Monto</TableCell>
                  <TableCell>F. Emisión</TableCell>
                  <TableCell>F. Vencimiento</TableCell>
                  <TableCell>Estado</TableCell>
                  <TableCell>Días</TableCell>
                  <TableCell>Acciones</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {records.map((record) => {
                  const daysUntilDue = dayjs(record.fecha_vencimiento).diff(dayjs(), 'days');
                  const isOverdue = daysUntilDue < 0 && record.estado === 'Pendiente';
                  
                  return (
                    <TableRow 
                      key={record.id}
                      sx={{ 
                        backgroundColor: isOverdue ? 'error.light' : 'inherit',
                        '&:hover': { 
                          backgroundColor: isOverdue ? 'error.main' : 'action.hover' 
                        }
                      }}
                    >
                      <TableCell>{record.numero}</TableCell>
                      <TableCell>{record.cliente}</TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {formatCurrency(record.monto)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        {dayjs(record.fecha_emision).format('DD/MM/YYYY')}
                      </TableCell>
                      <TableCell>
                        <Typography 
                          variant="body2" 
                          color={isOverdue ? 'error' : 'text.primary'}
                          sx={{ fontWeight: isOverdue ? 600 : 400 }}
                        >
                          {dayjs(record.fecha_vencimiento).format('DD/MM/YYYY')}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          icon={getStatusIcon(record.estado, record.fecha_vencimiento)}
                          label={getStatusLabel(record.estado, record.fecha_vencimiento)}
                          color={getStatusColor(record.estado, record.fecha_vencimiento)}
                          variant="outlined"
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Typography 
                          variant="body2" 
                          color={
                            daysUntilDue < 0 ? 'error' : 
                            daysUntilDue <= 7 ? 'warning.main' : 'text.primary'
                          }
                          sx={{ fontWeight: daysUntilDue <= 7 ? 600 : 400 }}
                        >
                          {record.estado === 'Pagada' ? '-' : 
                           daysUntilDue < 0 ? `${Math.abs(daysUntilDue)} días vencida` :
                           daysUntilDue === 0 ? 'Vence hoy' :
                           `${daysUntilDue} días`}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <IconButton 
                          size="small" 
                          onClick={() => {
                            setSelectedRecord(record);
                            setDetailOpen(true);
                          }}
                        >
                          <Visibility />
                        </IconButton>
                        {record.estado === 'Pendiente' && (
                          <IconButton 
                            size="small" 
                            color="success"
                            onClick={() => handleMarkAsPaid(record.id)}
                            title="Marcar como pagada"
                          >
                            <CheckCircle />
                          </IconButton>
                        )}
                        <IconButton size="small" onClick={() => handleEdit(record)}>
                          <Edit />
                        </IconButton>
                        <IconButton size="small" onClick={() => handleGeneratePDF(record)}>
                          <GetApp />
                        </IconButton>
                        <IconButton size="small" onClick={() => handleDelete(record.id)}>
                          <Delete />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
        <form onSubmit={handleSubmit}>
          <DialogTitle>
            {editingId ? 'Editar Factura' : 'Nueva Factura'}
          </DialogTitle>
          <DialogContent>
            <Grid container spacing={3} sx={{ mt: 1 }}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Cliente"
                  value={formData.cliente}
                  onChange={(e) => setFormData(prev => ({ ...prev, cliente: e.target.value }))}
                  required
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Estado</InputLabel>
                  <Select
                    value={formData.estado}
                    label="Estado"
                    onChange={(e) => setFormData(prev => ({ ...prev, estado: e.target.value }))}
                  >
                    {estados.map(estado => (
                      <MenuItem key={estado.value} value={estado.value}>
                        {estado.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="Monto"
                  type="number"
                  value={formData.monto}
                  onChange={(e) => setFormData(prev => ({ ...prev, monto: e.target.value }))}
                  InputProps={{
                    startAdornment: '$'
                  }}
                  required
                />
              </Grid>
              
              <Grid item xs={12} md={4}>
                <DatePicker
                  label="Fecha Emisión"
                  value={formData.fecha_emision}
                  onChange={(value) => setFormData(prev => ({ ...prev, fecha_emision: value }))}
                  renderInput={(params) => <TextField {...params} fullWidth />}
                />
              </Grid>
              
              <Grid item xs={12} md={4}>
                <DatePicker
                  label="Fecha Vencimiento"
                  value={formData.fecha_vencimiento}
                  onChange={(value) => setFormData(prev => ({ ...prev, fecha_vencimiento: value }))}
                  renderInput={(params) => <TextField {...params} fullWidth />}
                />
              </Grid>
              
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  label="Observaciones"
                  value={formData.observaciones}
                  onChange={(e) => setFormData(prev => ({ ...prev, observaciones: e.target.value }))}
                  placeholder="Descripción del trabajo realizado..."
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleClose}>Cancelar</Button>
            <Button type="submit" variant="contained" disabled={isLoading}>
              {isLoading ? 'Guardando...' : 'Guardar'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Detail View Dialog */}
      <Dialog open={detailOpen} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle>
          Detalle de la Factura
          {selectedRecord && (
            <IconButton
              sx={{ float: 'right' }}
              onClick={() => handleGeneratePDF(selectedRecord)}
            >
              <GetApp />
            </IconButton>
          )}
        </DialogTitle>
        <DialogContent>
          {selectedRecord && (
            <Box>
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Número
                  </Typography>
                  <Typography variant="body1" sx={{ mb: 2 }}>
                    {selectedRecord.numero}
                  </Typography>
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Cliente
                  </Typography>
                  <Typography variant="body1" sx={{ mb: 2 }}>
                    {selectedRecord.cliente}
                  </Typography>
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Monto
                  </Typography>
                  <Typography variant="h6" sx={{ mb: 2, color: 'primary.main' }}>
                    {formatCurrency(selectedRecord.monto)}
                  </Typography>
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Estado
                  </Typography>
                  <Chip
                    icon={getStatusIcon(selectedRecord.estado, selectedRecord.fecha_vencimiento)}
                    label={getStatusLabel(selectedRecord.estado, selectedRecord.fecha_vencimiento)}
                    color={getStatusColor(selectedRecord.estado, selectedRecord.fecha_vencimiento)}
                    sx={{ mb: 2 }}
                  />
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Fecha Emisión
                  </Typography>
                  <Typography variant="body1" sx={{ mb: 2 }}>
                    {dayjs(selectedRecord.fecha_emision).format('DD/MM/YYYY')}
                  </Typography>
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Fecha Vencimiento
                  </Typography>
                  <Typography variant="body1" sx={{ mb: 2 }}>
                    {dayjs(selectedRecord.fecha_vencimiento).format('DD/MM/YYYY')}
                  </Typography>
                </Grid>
                
                {selectedRecord.observaciones && (
                  <Grid item xs={12}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Observaciones
                    </Typography>
                    <Typography variant="body1" sx={{ mb: 2 }}>
                      {selectedRecord.observaciones}
                    </Typography>
                  </Grid>
                )}
              </Grid>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Cerrar</Button>
          {selectedRecord && selectedRecord.estado === 'Pendiente' && (
            <Button 
              variant="contained" 
              color="success"
              startIcon={<CheckCircle />}
              onClick={() => {
                handleMarkAsPaid(selectedRecord.id);
                handleClose();
              }}
            >
              Marcar como Pagada
            </Button>
          )}
          {selectedRecord && (
            <Button 
              variant="contained" 
              onClick={() => handleEdit(selectedRecord)}
            >
              Editar
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Facturas;