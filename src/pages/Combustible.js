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
} from '@mui/material';
import {
  Add,
  Edit,
  Delete,
  LocalGasStation,
  GetApp,
  Search,
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import dayjs from 'dayjs';

import { useDatabase } from '../context/DatabaseContext';

const Combustible = () => {
  const { combustible, vehiculos, trabajadores, generatePDF } = useDatabase();
  const [records, setRecords] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [workers, setWorkers] = useState([]);
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Filters
  const [filters, setFilters] = useState({
    dateFrom: dayjs().startOf('month'),
    dateTo: dayjs().endOf('month'),
    vehiculo_id: '',
  });

  // Form data
  const [formData, setFormData] = useState({
    vehiculo_id: '',
    conductor_id: '',
    fecha: dayjs(),
    cantidad: '',
    precio_litro: '',
    total: '',
    kilometraje: '',
    observaciones: '',
  });

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    loadRecords();
  }, [filters]);

  useEffect(() => {
    // Calculate total when quantity or price changes
    if (formData.cantidad && formData.precio_litro) {
      const total = parseFloat(formData.cantidad) * parseFloat(formData.precio_litro);
      setFormData(prev => ({ ...prev, total: total.toFixed(0) }));
    }
  }, [formData.cantidad, formData.precio_litro]);

  const loadData = async () => {
    try {
      if (!window.electronAPI) {
        // Demo data
        setVehicles([
          { id: 1, patente: 'AB-1234', marca: 'Toyota', modelo: 'Hilux' },
          { id: 2, patente: 'CD-5678', marca: 'Ford', modelo: 'Ranger' },
        ]);
        setWorkers([
          { id: 1, nombre: 'Juan Pérez', rut: '12.345.678-9' },
          { id: 2, nombre: 'María González', rut: '98.765.432-1' },
        ]);
        return;
      }

      const [vehicleData, workerData] = await Promise.all([
        vehiculos.getAll(),
        trabajadores.getAll(),
      ]);
      
      setVehicles(vehicleData);
      setWorkers(workerData);
    } catch (error) {
      console.error('Error loading data:', error);
      setError('Error al cargar los datos');
    }
  };

  const loadRecords = async () => {
    setIsLoading(true);
    try {
      if (!window.electronAPI) {
        // Demo data
        setRecords([
          {
            id: 1,
            fecha: '2024-01-15',
            vehiculo_patente: 'AB-1234',
            conductor_nombre: 'Juan Pérez',
            cantidad: 45,
            precio_litro: 850,
            total: 38250,
            kilometraje: 150000,
            observaciones: 'Tanque lleno',
          },
          {
            id: 2,
            fecha: '2024-01-14',
            vehiculo_patente: 'CD-5678',
            conductor_nombre: 'María González',
            cantidad: 38,
            precio_litro: 850,
            total: 32300,
            kilometraje: 89500,
            observaciones: '',
          },
        ]);
        return;
      }

      const filterData = {
        dateFrom: filters.dateFrom.format('YYYY-MM-DD'),
        dateTo: filters.dateTo.format('YYYY-MM-DD'),
        vehiculo_id: filters.vehiculo_id || undefined,
      };

      const data = await combustible.getAll(filterData);
      setRecords(data);
    } catch (error) {
      console.error('Error loading records:', error);
      setError('Error al cargar los registros');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpen = (record = null) => {
    if (record) {
      setEditingId(record.id);
      setFormData({
        vehiculo_id: record.vehiculo_id || '',
        conductor_id: record.conductor_id || '',
        fecha: dayjs(record.fecha),
        cantidad: record.cantidad || '',
        precio_litro: record.precio_litro || '',
        total: record.total || '',
        kilometraje: record.kilometraje || '',
        observaciones: record.observaciones || '',
      });
    } else {
      setEditingId(null);
      setFormData({
        vehiculo_id: '',
        conductor_id: '',
        fecha: dayjs(),
        cantidad: '',
        precio_litro: '850', // Default fuel price
        total: '',
        kilometraje: '',
        observaciones: '',
      });
    }
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setEditingId(null);
    setError('');
  };

  const handleSave = async () => {
    try {
      const data = {
        vehiculo_id: parseInt(formData.vehiculo_id),
        conductor_id: parseInt(formData.conductor_id),
        fecha: formData.fecha.format('YYYY-MM-DD'),
        cantidad: parseFloat(formData.cantidad),
        precio_litro: parseFloat(formData.precio_litro),
        total: parseFloat(formData.total),
        kilometraje: formData.kilometraje ? parseInt(formData.kilometraje) : null,
        observaciones: formData.observaciones,
      };

      if (!window.electronAPI) {
        // Demo mode - just add to local state
        const newRecord = {
          id: editingId || Date.now(),
          ...data,
          vehiculo_patente: vehicles.find(v => v.id === data.vehiculo_id)?.patente || '',
          conductor_nombre: workers.find(w => w.id === data.conductor_id)?.nombre || '',
        };
        
        if (editingId) {
          setRecords(prev => prev.map(r => r.id === editingId ? newRecord : r));
        } else {
          setRecords(prev => [newRecord, ...prev]);
        }
        
        handleClose();
        return;
      }

      if (editingId) {
        await combustible.update(editingId, data);
      } else {
        await combustible.create(data);
      }

      await loadRecords();
      handleClose();
    } catch (error) {
      console.error('Error saving record:', error);
      setError('Error al guardar el registro');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('¿Está seguro de eliminar este registro?')) {
      return;
    }

    try {
      if (!window.electronAPI) {
        setRecords(prev => prev.filter(r => r.id !== id));
        return;
      }

      await combustible.delete(id);
      await loadRecords();
    } catch (error) {
      console.error('Error deleting record:', error);
      setError('Error al eliminar el registro');
    }
  };

  const handleExportPDF = async () => {
    try {
      const totalAmount = records.reduce((sum, record) => sum + record.total, 0);
      const totalLiters = records.reduce((sum, record) => sum + record.cantidad, 0);

      const data = {
        records,
        dateFrom: filters.dateFrom.format('DD/MM/YYYY'),
        dateTo: filters.dateTo.format('DD/MM/YYYY'),
        totalAmount: totalAmount.toLocaleString('es-CL'),
        totalLiters: totalLiters.toFixed(1),
      };

      if (!window.electronAPI) {
        alert('Funcionalidad de PDF disponible solo en la aplicación completa');
        return;
      }

      const result = await generatePDF('combustible', data, 
        `combustible_${filters.dateFrom.format('YYYY-MM')}_${filters.dateTo.format('YYYY-MM')}.pdf`
      );

      if (result.success) {
        alert(`PDF generado: ${result.filename}`);
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('Error generating PDF:', error);
      setError('Error al generar el PDF');
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const totalAmount = records.reduce((sum, record) => sum + record.total, 0);
  const totalLiters = records.reduce((sum, record) => sum + record.cantidad, 0);

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 600, mb: 1 }}>
            Control de Combustible
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Gestión de vales de combustible y consumo por vehículo
          </Typography>
        </Box>
        
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => handleOpen()}
        >
          Nuevo Vale
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Filters */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={3} alignItems="center">
            <Grid item xs={12} sm={6} md={3}>
              <DatePicker
                label="Fecha Desde"
                value={filters.dateFrom}
                onChange={(newValue) => setFilters(prev => ({ ...prev, dateFrom: newValue }))}
                renderInput={(params) => <TextField {...params} fullWidth />}
              />
            </Grid>
            
            <Grid item xs={12} sm={6} md={3}>
              <DatePicker
                label="Fecha Hasta"
                value={filters.dateTo}
                onChange={(newValue) => setFilters(prev => ({ ...prev, dateTo: newValue }))}
                renderInput={(params) => <TextField {...params} fullWidth />}
              />
            </Grid>
            
            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth>
                <InputLabel>Vehículo</InputLabel>
                <Select
                  value={filters.vehiculo_id}
                  onChange={(e) => setFilters(prev => ({ ...prev, vehiculo_id: e.target.value }))}
                  label="Vehículo"
                >
                  <MenuItem value="">Todos</MenuItem>
                  {vehicles.map((vehicle) => (
                    <MenuItem key={vehicle.id} value={vehicle.id}>
                      {vehicle.patente} - {vehicle.marca} {vehicle.modelo}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} sm={6} md={3}>
              <Button
                variant="outlined"
                startIcon={<GetApp />}
                onClick={handleExportPDF}
                fullWidth
              >
                Exportar PDF
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Summary */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h6" color="primary">
                Total Registros
              </Typography>
              <Typography variant="h4">
                {records.length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h6" color="primary">
                Total Litros
              </Typography>
              <Typography variant="h4">
                {totalLiters.toFixed(1)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h6" color="primary">
                Total Monto
              </Typography>
              <Typography variant="h4">
                {formatCurrency(totalAmount)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h6" color="primary">
                Promedio por Litro
              </Typography>
              <Typography variant="h4">
                {totalLiters > 0 ? formatCurrency(totalAmount / totalLiters) : '$0'}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Records Table */}
      <Card>
        <CardContent>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Fecha</TableCell>
                  <TableCell>Vehículo</TableCell>
                  <TableCell>Conductor</TableCell>
                  <TableCell align="right">Litros</TableCell>
                  <TableCell align="right">Precio/L</TableCell>
                  <TableCell align="right">Total</TableCell>
                  <TableCell>Km</TableCell>
                  <TableCell>Observaciones</TableCell>
                  <TableCell align="center">Acciones</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {records.map((record) => (
                  <TableRow key={record.id}>
                    <TableCell>
                      {dayjs(record.fecha).format('DD/MM/YYYY')}
                    </TableCell>
                    <TableCell>{record.vehiculo_patente}</TableCell>
                    <TableCell>{record.conductor_nombre}</TableCell>
                    <TableCell align="right">{record.cantidad}</TableCell>
                    <TableCell align="right">{formatCurrency(record.precio_litro)}</TableCell>
                    <TableCell align="right">
                      <strong>{formatCurrency(record.total)}</strong>
                    </TableCell>
                    <TableCell>{record.kilometraje || '-'}</TableCell>
                    <TableCell>{record.observaciones || '-'}</TableCell>
                    <TableCell align="center">
                      <IconButton onClick={() => handleOpen(record)} size="small">
                        <Edit />
                      </IconButton>
                      <IconButton onClick={() => handleDelete(record.id)} size="small" color="error">
                        <Delete />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
                {records.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={9} align="center">
                      No hay registros para mostrar
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* Form Dialog */}
      <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingId ? 'Editar Vale de Combustible' : 'Nuevo Vale de Combustible'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={3} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth required>
                <InputLabel>Vehículo</InputLabel>
                <Select
                  value={formData.vehiculo_id}
                  onChange={(e) => setFormData(prev => ({ ...prev, vehiculo_id: e.target.value }))}
                  label="Vehículo"
                >
                  {vehicles.map((vehicle) => (
                    <MenuItem key={vehicle.id} value={vehicle.id}>
                      {vehicle.patente} - {vehicle.marca} {vehicle.modelo}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth required>
                <InputLabel>Conductor</InputLabel>
                <Select
                  value={formData.conductor_id}
                  onChange={(e) => setFormData(prev => ({ ...prev, conductor_id: e.target.value }))}
                  label="Conductor"
                >
                  {workers.map((worker) => (
                    <MenuItem key={worker.id} value={worker.id}>
                      {worker.nombre}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <DatePicker
                label="Fecha"
                value={formData.fecha}
                onChange={(newValue) => setFormData(prev => ({ ...prev, fecha: newValue }))}
                renderInput={(params) => <TextField {...params} fullWidth required />}
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Cantidad (Litros)"
                type="number"
                value={formData.cantidad}
                onChange={(e) => setFormData(prev => ({ ...prev, cantidad: e.target.value }))}
                required
                inputProps={{ step: '0.1', min: '0' }}
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Precio por Litro"
                type="number"
                value={formData.precio_litro}
                onChange={(e) => setFormData(prev => ({ ...prev, precio_litro: e.target.value }))}
                required
                inputProps={{ step: '1', min: '0' }}
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Total"
                type="number"
                value={formData.total}
                onChange={(e) => setFormData(prev => ({ ...prev, total: e.target.value }))}
                required
                inputProps={{ step: '1', min: '0' }}
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Kilometraje"
                type="number"
                value={formData.kilometraje}
                onChange={(e) => setFormData(prev => ({ ...prev, kilometraje: e.target.value }))}
                inputProps={{ step: '1', min: '0' }}
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Observaciones"
                multiline
                rows={2}
                value={formData.observaciones}
                onChange={(e) => setFormData(prev => ({ ...prev, observaciones: e.target.value }))}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Cancelar</Button>
          <Button onClick={handleSave} variant="contained">
            {editingId ? 'Actualizar' : 'Guardar'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Combustible;