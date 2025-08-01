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
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
} from '@mui/material';
import {
  Add,
  Edit,
  Delete,
  Assignment,
  GetApp,
  Search,
  Visibility,
  CheckCircle,
  Cancel,
  Schedule,
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import dayjs from 'dayjs';

import { useDatabase } from '../context/DatabaseContext';

const Presupuestos = () => {
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
    dateFrom: dayjs().startOf('year'),
    dateTo: dayjs().endOf('year'),
    estado: '',
    cliente: '',
  });

  // Form data
  const [formData, setFormData] = useState({
    numero: '',
    cliente: '',
    descripcion: '',
    monto: '',
    estado: 'Pendiente',
    fecha_creacion: dayjs(),
    fecha_vencimiento: dayjs().add(30, 'days'),
    observaciones: '',
    items: []
  });

  // Item form for detailed budgets
  const [itemForm, setItemForm] = useState({
    descripcion: '',
    cantidad: '',
    precio_unitario: '',
    total: ''
  });

  const estados = [
    { value: 'Pendiente', label: 'Pendiente', color: 'warning' },
    { value: 'Aprobado', label: 'Aprobado', color: 'success' },
    { value: 'Rechazado', label: 'Rechazado', color: 'error' },
    { value: 'En Revisión', label: 'En Revisión', color: 'info' },
  ];

  useEffect(() => {
    loadRecords();
  }, [filters]);

  useEffect(() => {
    // Calculate item total when quantity or price changes
    if (itemForm.cantidad && itemForm.precio_unitario) {
      const total = parseFloat(itemForm.cantidad) * parseFloat(itemForm.precio_unitario);
      setItemForm(prev => ({ ...prev, total: total.toFixed(0) }));
    }
  }, [itemForm.cantidad, itemForm.precio_unitario]);

  useEffect(() => {
    // Calculate total budget amount from items
    if (formData.items.length > 0) {
      const total = formData.items.reduce((sum, item) => sum + parseFloat(item.total || 0), 0);
      setFormData(prev => ({ ...prev, monto: total.toFixed(0) }));
    }
  }, [formData.items]);

  const loadRecords = async () => {
    setIsLoading(true);
    try {
      if (!window.electronAPI) {
        // Demo data
        setRecords([
          {
            id: 1,
            numero: 'PRES-2024-001',
            cliente: 'Constructora ABC S.A.',
            descripcion: 'Construcción de casa 150m²',
            monto: 85000000,
            estado: 'Pendiente',
            fecha_creacion: '2024-01-15',
            fecha_vencimiento: '2024-02-15',
            observaciones: 'Incluye materiales y mano de obra',
            items: [
              { descripcion: 'Excavación y fundaciones', cantidad: 1, precio_unitario: 15000000, total: 15000000 },
              { descripcion: 'Estructura y obra gruesa', cantidad: 1, precio_unitario: 45000000, total: 45000000 },
              { descripcion: 'Terminaciones', cantidad: 1, precio_unitario: 25000000, total: 25000000 }
            ]
          },
          {
            id: 2,
            numero: 'PRES-2024-002',
            cliente: 'Municipalidad de Santiago',
            descripcion: 'Reparación de pavimento Calle Principal',
            monto: 25000000,
            estado: 'Aprobado',
            fecha_creacion: '2024-01-20',
            fecha_vencimiento: '2024-02-20',
            observaciones: 'Trabajo nocturno requerido',
            items: []
          },
          {
            id: 3,
            numero: 'PRES-2024-003',
            cliente: 'Empresa XYZ Ltda.',
            descripcion: 'Ampliación de oficinas',
            monto: 12000000,
            estado: 'En Revisión',
            fecha_creacion: '2024-01-25',
            fecha_vencimiento: '2024-02-25',
            observaciones: 'Pendiente aprobación municipal',
            items: []
          }
        ]);
        setIsLoading(false);
        return;
      }

      const query = `
        SELECT * FROM presupuestos 
        WHERE fecha_creacion BETWEEN ? AND ? 
        ${filters.estado ? 'AND estado = ?' : ''}
        ${filters.cliente ? 'AND cliente LIKE ?' : ''}
        ORDER BY fecha_creacion DESC
      `;
      
      const params = [
        filters.dateFrom.format('YYYY-MM-DD'),
        filters.dateTo.format('YYYY-MM-DD')
      ];
      
      if (filters.estado) params.push(filters.estado);
      if (filters.cliente) params.push(`%${filters.cliente}%`);

      const data = await window.electronAPI.dbQuery(query, params);
      setRecords(data);
    } catch (error) {
      console.error('Error loading records:', error);
      setError('Error al cargar los presupuestos');
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
          numero: `PRES-2024-${String(records.length + 1).padStart(3, '0')}`,
          fecha_creacion: formData.fecha_creacion.format('YYYY-MM-DD'),
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
          `UPDATE presupuestos SET 
           cliente=?, descripcion=?, monto=?, estado=?, 
           fecha_vencimiento=?, observaciones=?
           WHERE id=?`,
          [
            formData.cliente,
            formData.descripcion,
            formData.monto,
            formData.estado,
            formData.fecha_vencimiento.format('YYYY-MM-DD'),
            formData.observaciones,
            editingId
          ]
        );
      } else {
        const numero = `PRES-${dayjs().format('YYYY')}-${String(records.length + 1).padStart(3, '0')}`;
        result = await window.electronAPI.dbRun(
          `INSERT INTO presupuestos 
           (numero, cliente, descripcion, monto, estado, fecha_creacion, fecha_vencimiento, observaciones) 
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            numero,
            formData.cliente,
            formData.descripcion,
            formData.monto,
            formData.estado,
            formData.fecha_creacion.format('YYYY-MM-DD'),
            formData.fecha_vencimiento.format('YYYY-MM-DD'),
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
      setError('Error al guardar el presupuesto');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (record) => {
    setFormData({
      ...record,
      fecha_creacion: dayjs(record.fecha_creacion),
      fecha_vencimiento: dayjs(record.fecha_vencimiento),
      items: record.items || []
    });
    setEditingId(record.id);
    setOpen(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('¿Está seguro que desea eliminar este presupuesto?')) return;

    try {
      if (!window.electronAPI) {
        setRecords(prev => prev.filter(record => record.id !== id));
        return;
      }

      const result = await window.electronAPI.dbRun('DELETE FROM presupuestos WHERE id = ?', [id]);
      if (result.changes > 0) {
        await loadRecords();
      }
    } catch (error) {
      console.error('Error deleting record:', error);
      setError('Error al eliminar el presupuesto');
    }
  };

  const handleGeneratePDF = async (record) => {
    try {
      const result = await generatePDF({
        type: 'presupuesto',
        data: record,
        filename: `presupuesto_${record.numero}.pdf`
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
      descripcion: '',
      monto: '',
      estado: 'Pendiente',
      fecha_creacion: dayjs(),
      fecha_vencimiento: dayjs().add(30, 'days'),
      observaciones: '',
      items: []
    });
    setError('');
  };

  const addItem = () => {
    if (!itemForm.descripcion || !itemForm.cantidad || !itemForm.precio_unitario) {
      setError('Todos los campos del ítem son requeridos');
      return;
    }

    const newItem = {
      descripcion: itemForm.descripcion,
      cantidad: parseFloat(itemForm.cantidad),
      precio_unitario: parseFloat(itemForm.precio_unitario),
      total: parseFloat(itemForm.total)
    };

    setFormData(prev => ({
      ...prev,
      items: [...prev.items, newItem]
    }));

    setItemForm({
      descripcion: '',
      cantidad: '',
      precio_unitario: '',
      total: ''
    });
  };

  const removeItem = (index) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }));
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const getStatusColor = (estado) => {
    const status = estados.find(s => s.value === estado);
    return status ? status.color : 'default';
  };

  const getStatusIcon = (estado) => {
    switch (estado) {
      case 'Aprobado':
        return <CheckCircle />;
      case 'Rechazado':
        return <Cancel />;
      case 'En Revisión':
        return <Schedule />;
      default:
        return <Assignment />;
    }
  };

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h4" sx={{ fontWeight: 600 }}>
          Gestión de Presupuestos
        </Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => setOpen(true)}
        >
          Nuevo Presupuesto
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
          {error}
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
            <Grid item xs={12} md={3}>
              <DatePicker
                label="Fecha Hasta"
                value={filters.dateTo}
                onChange={(value) => setFilters(prev => ({ ...prev, dateTo: value }))}
                renderInput={(params) => <TextField {...params} fullWidth />}
              />
            </Grid>
            <Grid item xs={12} md={3}>
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
          </Grid>
        </CardContent>
      </Card>

      {/* Statistics Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Assignment sx={{ mr: 2, color: 'primary.main' }} />
                <Typography variant="h6">Total</Typography>
              </Box>
              <Typography variant="h4">
                {records.length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Presupuestos
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Schedule sx={{ mr: 2, color: 'warning.main' }} />
                <Typography variant="h6">Pendientes</Typography>
              </Box>
              <Typography variant="h4">
                {records.filter(r => r.estado === 'Pendiente').length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Por revisar
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <CheckCircle sx={{ mr: 2, color: 'success.main' }} />
                <Typography variant="h6">Aprobados</Typography>
              </Box>
              <Typography variant="h4">
                {records.filter(r => r.estado === 'Aprobado').length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Este año
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Assignment sx={{ mr: 2, color: 'info.main' }} />
                <Typography variant="h6">Monto Total</Typography>
              </Box>
              <Typography variant="h4">
                {formatCurrency(records.filter(r => r.estado === 'Aprobado').reduce((sum, r) => sum + r.monto, 0))}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Aprobados
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
                  <TableCell>Descripción</TableCell>
                  <TableCell>Monto</TableCell>
                  <TableCell>Estado</TableCell>
                  <TableCell>Fecha Creación</TableCell>
                  <TableCell>Vencimiento</TableCell>
                  <TableCell>Acciones</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {records.map((record) => (
                  <TableRow key={record.id}>
                    <TableCell>{record.numero}</TableCell>
                    <TableCell>{record.cliente}</TableCell>
                    <TableCell>
                      <Typography 
                        variant="body2" 
                        sx={{ 
                          maxWidth: 200, 
                          overflow: 'hidden', 
                          textOverflow: 'ellipsis' 
                        }}
                      >
                        {record.descripcion}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {formatCurrency(record.monto)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        icon={getStatusIcon(record.estado)}
                        label={record.estado}
                        color={getStatusColor(record.estado)}
                        variant="outlined"
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      {dayjs(record.fecha_creacion).format('DD/MM/YYYY')}
                    </TableCell>
                    <TableCell>
                      <Typography 
                        variant="body2" 
                        color={dayjs(record.fecha_vencimiento).isBefore(dayjs()) ? 'error' : 'text.primary'}
                      >
                        {dayjs(record.fecha_vencimiento).format('DD/MM/YYYY')}
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
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
        <form onSubmit={handleSubmit}>
          <DialogTitle>
            {editingId ? 'Editar Presupuesto' : 'Nuevo Presupuesto'}
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
              
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  label="Descripción del Trabajo"
                  value={formData.descripcion}
                  onChange={(e) => setFormData(prev => ({ ...prev, descripcion: e.target.value }))}
                  required
                />
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
                  label="Fecha Creación"
                  value={formData.fecha_creacion}
                  onChange={(value) => setFormData(prev => ({ ...prev, fecha_creacion: value }))}
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
                  rows={2}
                  label="Observaciones"
                  value={formData.observaciones}
                  onChange={(e) => setFormData(prev => ({ ...prev, observaciones: e.target.value }))}
                />
              </Grid>

              {/* Items Section */}
              <Grid item xs={12}>
                <Typography variant="h6" sx={{ mb: 2 }}>
                  Ítems del Presupuesto (Opcional)
                </Typography>
                <Divider sx={{ mb: 2 }} />
                
                {/* Add Item Form */}
                <Grid container spacing={2} sx={{ mb: 2 }}>
                  <Grid item xs={12} md={4}>
                    <TextField
                      fullWidth
                      label="Descripción"
                      value={itemForm.descripcion}
                      onChange={(e) => setItemForm(prev => ({ ...prev, descripcion: e.target.value }))}
                    />
                  </Grid>
                  <Grid item xs={12} md={2}>
                    <TextField
                      fullWidth
                      label="Cantidad"
                      type="number"
                      value={itemForm.cantidad}
                      onChange={(e) => setItemForm(prev => ({ ...prev, cantidad: e.target.value }))}
                    />
                  </Grid>
                  <Grid item xs={12} md={3}>
                    <TextField
                      fullWidth
                      label="Precio Unitario"
                      type="number"
                      value={itemForm.precio_unitario}
                      onChange={(e) => setItemForm(prev => ({ ...prev, precio_unitario: e.target.value }))}
                      InputProps={{
                        startAdornment: '$'
                      }}
                    />
                  </Grid>
                  <Grid item xs={12} md={2}>
                    <TextField
                      fullWidth
                      label="Total"
                      value={itemForm.total}
                      InputProps={{
                        readOnly: true,
                        startAdornment: '$'
                      }}
                    />
                  </Grid>
                  <Grid item xs={12} md={1}>
                    <Button
                      fullWidth
                      variant="outlined"
                      onClick={addItem}
                      sx={{ height: '56px' }}
                    >
                      <Add />
                    </Button>
                  </Grid>
                </Grid>

                {/* Items List */}
                {formData.items.length > 0 && (
                  <List>
                    {formData.items.map((item, index) => (
                      <ListItem key={index}>
                        <ListItemText
                          primary={item.descripcion}
                          secondary={`Cantidad: ${item.cantidad} × ${formatCurrency(item.precio_unitario)} = ${formatCurrency(item.total)}`}
                        />
                        <ListItemSecondaryAction>
                          <IconButton onClick={() => removeItem(index)}>
                            <Delete />
                          </IconButton>
                        </ListItemSecondaryAction>
                      </ListItem>
                    ))}
                  </List>
                )}
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
      <Dialog open={detailOpen} onClose={handleClose} maxWidth="md" fullWidth>
        <DialogTitle>
          Detalle del Presupuesto
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
                
                <Grid item xs={12}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Descripción
                  </Typography>
                  <Typography variant="body1" sx={{ mb: 2 }}>
                    {selectedRecord.descripcion}
                  </Typography>
                </Grid>
                
                <Grid item xs={12} md={4}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Monto
                  </Typography>
                  <Typography variant="h6" sx={{ mb: 2, color: 'primary.main' }}>
                    {formatCurrency(selectedRecord.monto)}
                  </Typography>
                </Grid>
                
                <Grid item xs={12} md={4}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Estado
                  </Typography>
                  <Chip
                    icon={getStatusIcon(selectedRecord.estado)}
                    label={selectedRecord.estado}
                    color={getStatusColor(selectedRecord.estado)}
                    sx={{ mb: 2 }}
                  />
                </Grid>
                
                <Grid item xs={12} md={4}>
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

                {selectedRecord.items && selectedRecord.items.length > 0 && (
                  <Grid item xs={12}>
                    <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 2 }}>
                      Ítems del Presupuesto
                    </Typography>
                    <TableContainer component={Paper} variant="outlined">
                      <Table size="small">
                        <TableHead>
                          <TableRow>
                            <TableCell>Descripción</TableCell>
                            <TableCell align="right">Cantidad</TableCell>
                            <TableCell align="right">Precio Unit.</TableCell>
                            <TableCell align="right">Total</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {selectedRecord.items.map((item, index) => (
                            <TableRow key={index}>
                              <TableCell>{item.descripcion}</TableCell>
                              <TableCell align="right">{item.cantidad}</TableCell>
                              <TableCell align="right">{formatCurrency(item.precio_unitario)}</TableCell>
                              <TableCell align="right">{formatCurrency(item.total)}</TableCell>
                            </TableRow>
                          ))}
                          <TableRow>
                            <TableCell colSpan={3} sx={{ fontWeight: 'bold' }}>
                              Total
                            </TableCell>
                            <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                              {formatCurrency(selectedRecord.items.reduce((sum, item) => sum + item.total, 0))}
                            </TableCell>
                          </TableRow>
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </Grid>
                )}
              </Grid>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Cerrar</Button>
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

export default Presupuestos;