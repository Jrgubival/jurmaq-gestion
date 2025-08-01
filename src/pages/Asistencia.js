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
  Menu,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import {
  Add,
  Edit,
  Delete,
  AccessTime,
  GetApp,
  Search,
  CalendarToday,
  Person,
  Schedule,
  CheckCircle,
  MoreVert,
  WorkOff,
  Work,
  LocalHospital,
  BeachAccess,
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { TimePicker } from '@mui/x-date-pickers/TimePicker';
import dayjs from 'dayjs';

import { useDatabase } from '../context/DatabaseContext';

const Asistencia = () => {
  const { generatePDF } = useDatabase();
  const [records, setRecords] = useState([]);
  const [workers, setWorkers] = useState([]);
  const [selectedWorker, setSelectedWorker] = useState('');
  const [selectedMonth, setSelectedMonth] = useState(dayjs());
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [calendarView, setCalendarView] = useState(true);
  const [contextMenu, setContextMenu] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);

  // Form data
  const [formData, setFormData] = useState({
    trabajador_id: '',
    fecha: dayjs(),
    hora_entrada: null,
    hora_salida: null,
    horas_trabajadas: '',
    observaciones: '',
  });

  const tiposAsistencia = [
    { value: 'completo', label: 'Día Completo', color: 'success', hours: 8 },
    { value: 'medio', label: 'Medio Día', color: 'warning', hours: 4 },
    { value: 'ausente', label: 'Ausente', color: 'error', hours: 0 },
    { value: 'licencia', label: 'Licencia Médica', color: 'info', hours: 0 },
    { value: 'vacaciones', label: 'Vacaciones', color: 'primary', hours: 0 },
  ];

  useEffect(() => {
    loadWorkers();
  }, []);

  useEffect(() => {
    if (selectedWorker) {
      loadRecords();
    }
  }, [selectedWorker, selectedMonth]);

  useEffect(() => {
    // Calculate worked hours when entry and exit times change
    if (formData.hora_entrada && formData.hora_salida) {
      const entrada = dayjs(formData.hora_entrada);
      const salida = dayjs(formData.hora_salida);
      const diff = salida.diff(entrada, 'hours', true);
      setFormData(prev => ({ ...prev, horas_trabajadas: diff.toFixed(1) }));
    }
  }, [formData.hora_entrada, formData.hora_salida]);

  const loadWorkers = async () => {
    try {
      if (!window.electronAPI) {
        // Demo data
        setWorkers([
          { id: 1, nombre: 'Juan Pérez', rut: '12.345.678-9', cargo: 'Maestro Constructor', sueldo_base: 800000 },
          { id: 2, nombre: 'María González', rut: '98.765.432-1', cargo: 'Operario', sueldo_base: 600000 },
          { id: 3, nombre: 'Carlos Silva', rut: '11.222.333-4', cargo: 'Ayudante', sueldo_base: 500000 },
          { id: 4, nombre: 'Ana López', rut: '55.666.777-8', cargo: 'Supervisora', sueldo_base: 900000 },
        ]);
        return;
      }

      const data = await window.electronAPI.dbQuery(
        'SELECT * FROM trabajadores WHERE activo = 1 ORDER BY nombre'
      );
      setWorkers(data);
    } catch (error) {
      console.error('Error loading workers:', error);
      setError('Error al cargar los trabajadores');
    }
  };

  const loadRecords = async () => {
    setIsLoading(true);
    try {
      if (!window.electronAPI) {
        // Demo data for the selected month
        const monthStart = selectedMonth.startOf('month');
        const monthEnd = selectedMonth.endOf('month');
        const demoRecords = [];
        
        // Generate demo attendance for the month
        for (let date = monthStart; date.isBefore(monthEnd); date = date.add(1, 'day')) {
          if (date.day() !== 0 && date.day() !== 6) { // Skip weekends
            const isPresent = Math.random() > 0.1; // 90% attendance rate
            if (isPresent) {
              demoRecords.push({
                id: `${selectedWorker}-${date.format('YYYY-MM-DD')}`,
                trabajador_id: selectedWorker,
                fecha: date.format('YYYY-MM-DD'),
                hora_entrada: '08:00',
                hora_salida: Math.random() > 0.8 ? '17:30' : '17:00', // Occasional overtime
                horas_trabajadas: Math.random() > 0.8 ? 9.5 : 8.0,
                observaciones: Math.random() > 0.9 ? 'Trabajo nocturno' : '',
              });
            }
          }
        }
        
        setRecords(demoRecords);
        setIsLoading(false);
        return;
      }

      const data = await window.electronAPI.dbQuery(
        `SELECT a.*, t.nombre as trabajador_nombre 
         FROM asistencia a 
         JOIN trabajadores t ON a.trabajador_id = t.id 
         WHERE a.trabajador_id = ? AND 
               a.fecha BETWEEN ? AND ? 
         ORDER BY a.fecha DESC`,
        [
          selectedWorker,
          selectedMonth.startOf('month').format('YYYY-MM-DD'),
          selectedMonth.endOf('month').format('YYYY-MM-DD')
        ]
      );
      setRecords(data);
    } catch (error) {
      console.error('Error loading records:', error);
      setError('Error al cargar los registros de asistencia');
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
          fecha: formData.fecha.format('YYYY-MM-DD'),
          hora_entrada: formData.hora_entrada ? formData.hora_entrada.format('HH:mm') : null,
          hora_salida: formData.hora_salida ? formData.hora_salida.format('HH:mm') : null,
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
          `UPDATE asistencia SET 
           hora_entrada=?, hora_salida=?, horas_trabajadas=?, observaciones=?
           WHERE id=?`,
          [
            formData.hora_entrada ? formData.hora_entrada.format('HH:mm') : null,
            formData.hora_salida ? formData.hora_salida.format('HH:mm') : null,
            formData.horas_trabajadas,
            formData.observaciones,
            editingId
          ]
        );
      } else {
        result = await window.electronAPI.dbRun(
          `INSERT INTO asistencia 
           (trabajador_id, fecha, hora_entrada, hora_salida, horas_trabajadas, observaciones) 
           VALUES (?, ?, ?, ?, ?, ?)`,
          [
            formData.trabajador_id,
            formData.fecha.format('YYYY-MM-DD'),
            formData.hora_entrada ? formData.hora_entrada.format('HH:mm') : null,
            formData.hora_salida ? formData.hora_salida.format('HH:mm') : null,
            formData.horas_trabajadas,
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
      setError('Error al guardar el registro');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (record) => {
    setFormData({
      ...record,
      fecha: dayjs(record.fecha),
      hora_entrada: record.hora_entrada ? dayjs(`2023-01-01 ${record.hora_entrada}`) : null,
      hora_salida: record.hora_salida ? dayjs(`2023-01-01 ${record.hora_salida}`) : null,
    });
    setEditingId(record.id);
    setOpen(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('¿Está seguro que desea eliminar este registro?')) return;

    try {
      if (!window.electronAPI) {
        setRecords(prev => prev.filter(record => record.id !== id));
        return;
      }

      const result = await window.electronAPI.dbRun('DELETE FROM asistencia WHERE id = ?', [id]);
      if (result.changes > 0) {
        await loadRecords();
      }
    } catch (error) {
      console.error('Error deleting record:', error);
      setError('Error al eliminar el registro');
    }
  };

  const handleContextMenu = (event, date) => {
    event.preventDefault();
    setSelectedDate(date);
    setContextMenu({
      mouseX: event.clientX - 2,
      mouseY: event.clientY - 4,
    });
  };

  const handleQuickAttendance = (type) => {
    const typeInfo = tiposAsistencia.find(t => t.value === type);
    const newRecord = {
      trabajador_id: selectedWorker,
      fecha: selectedDate,
      hora_entrada: type === 'ausente' ? null : dayjs().hour(8).minute(0),
      hora_salida: type === 'ausente' ? null : dayjs().hour(8 + typeInfo.hours).minute(0),
      horas_trabajadas: typeInfo.hours,
      observaciones: typeInfo.label,
    };

    // Add or update record
    if (!window.electronAPI) {
      const existingIndex = records.findIndex(r => 
        r.fecha === selectedDate.format('YYYY-MM-DD') && r.trabajador_id == selectedWorker
      );
      
      if (existingIndex >= 0) {
        setRecords(prev => prev.map((record, index) => 
          index === existingIndex ? { ...newRecord, id: record.id } : record
        ));
      } else {
        setRecords(prev => [...prev, { ...newRecord, id: Date.now() }]);
      }
    }

    setContextMenu(null);
  };

  const handleGenerateReport = async () => {
    if (!selectedWorker) {
      setError('Seleccione un trabajador primero');
      return;
    }

    try {
      const worker = workers.find(w => w.id == selectedWorker);
      const monthRecords = records.filter(r => 
        dayjs(r.fecha).isSame(selectedMonth, 'month')
      );

      const totalHours = monthRecords.reduce((sum, r) => sum + parseFloat(r.horas_trabajadas || 0), 0);
      const totalDays = monthRecords.length;

      const result = await generatePDF({
        type: 'asistencia',
        data: {
          trabajador: worker,
          records: monthRecords,
          periodo: selectedMonth.format('MMMM YYYY'),
          totalHoras: totalHours,
          totalDias: totalDays,
        },
        filename: `asistencia_${worker.nombre.replace(/\s+/g, '_')}_${selectedMonth.format('YYYY_MM')}.pdf`
      });

      if (result.success) {
        alert(`Reporte generado: ${result.filename}`);
      } else {
        alert('Error al generar reporte: ' + result.error);
      }
    } catch (error) {
      console.error('Error generating report:', error);
      alert('Error al generar reporte');
    }
  };

  const handleClose = () => {
    setOpen(false);
    setEditingId(null);
    setContextMenu(null);
    setFormData({
      trabajador_id: '',
      fecha: dayjs(),
      hora_entrada: null,
      hora_salida: null,
      horas_trabajadas: '',
      observaciones: '',
    });
    setError('');
  };

  const getAttendanceForDate = (date) => {
    return records.find(r => 
      r.trabajador_id == selectedWorker && 
      dayjs(r.fecha).isSame(date, 'day')
    );
  };

  const calculateSalary = () => {
    if (!selectedWorker) return 0;
    
    const worker = workers.find(w => w.id == selectedWorker);
    if (!worker) return 0;

    const monthRecords = records.filter(r => 
      dayjs(r.fecha).isSame(selectedMonth, 'month')
    );

    const totalHours = monthRecords.reduce((sum, r) => sum + parseFloat(r.horas_trabajadas || 0), 0);
    const regularHours = Math.min(totalHours, 22 * 8); // 22 working days max
    const overtimeHours = Math.max(0, totalHours - regularHours);
    
    const dailySalary = worker.sueldo_base / 30;
    const hourlySalary = dailySalary / 8;
    
    const regularPay = (regularHours / 8) * dailySalary;
    const overtimePay = overtimeHours * hourlySalary * 1.5; // 50% overtime
    
    return regularPay + overtimePay;
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const renderCalendarView = () => {
    const monthStart = selectedMonth.startOf('month');
    const monthEnd = selectedMonth.endOf('month');
    const startDate = monthStart.startOf('week');
    const endDate = monthEnd.endOf('week');

    const days = [];
    let date = startDate;

    while (date.isBefore(endDate)) {
      days.push(date);
      date = date.add(1, 'day');
    }

    return (
      <Card>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h6">
              Calendario - {selectedMonth.format('MMMM YYYY')}
            </Typography>
            <Box>
              <Button
                variant="outlined"
                onClick={() => setSelectedMonth(prev => prev.subtract(1, 'month'))}
                sx={{ mr: 1 }}
              >
                ← Anterior
              </Button>
              <Button
                variant="outlined"
                onClick={() => setSelectedMonth(dayjs())}
                sx={{ mr: 1 }}
              >
                Hoy
              </Button>
              <Button
                variant="outlined"
                onClick={() => setSelectedMonth(prev => prev.add(1, 'month'))}
              >
                Siguiente →
              </Button>
            </Box>
          </Box>

          <Grid container spacing={0} sx={{ border: 1, borderColor: 'divider' }}>
            {['Dom', 'Lun', 'Mar', 'Miér', 'Jue', 'Vie', 'Sáb'].map(day => (
              <Grid item xs key={day} sx={{ border: 1, borderColor: 'divider', p: 1, textAlign: 'center' }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                  {day}
                </Typography>
              </Grid>
            ))}
            
            {days.map((date, index) => {
              const attendance = getAttendanceForDate(date);
              const isCurrentMonth = date.isSame(selectedMonth, 'month');
              const isToday = date.isSame(dayjs(), 'day');
              const isWeekend = date.day() === 0 || date.day() === 6;

              return (
                <Grid 
                  item 
                  xs 
                  key={index}
                  sx={{ 
                    border: 1, 
                    borderColor: 'divider', 
                    minHeight: 80,
                    cursor: isCurrentMonth ? 'pointer' : 'default',
                    backgroundColor: 
                      isToday ? 'primary.light' : 
                      !isCurrentMonth ? 'grey.100' :
                      isWeekend ? 'grey.50' : 'white',
                    '&:hover': {
                      backgroundColor: isCurrentMonth ? 'grey.50' : undefined
                    }
                  }}
                  onContextMenu={(e) => isCurrentMonth && handleContextMenu(e, date)}
                  onClick={() => {
                    if (isCurrentMonth && selectedWorker) {
                      setFormData(prev => ({
                        ...prev,
                        trabajador_id: selectedWorker,
                        fecha: date
                      }));
                      setOpen(true);
                    }
                  }}
                >
                  <Box sx={{ p: 1 }}>
                    <Typography 
                      variant="body2" 
                      sx={{ 
                        fontWeight: isToday ? 600 : 400,
                        color: !isCurrentMonth ? 'text.disabled' : 'text.primary'
                      }}
                    >
                      {date.format('D')}
                    </Typography>
                    
                    {attendance && (
                      <Box sx={{ mt: 1 }}>
                        <Chip
                          size="small"
                          label={`${attendance.horas_trabajadas}h`}
                          color={
                            parseFloat(attendance.horas_trabajadas) >= 8 ? 'success' :
                            parseFloat(attendance.horas_trabajadas) >= 4 ? 'warning' : 'error'
                          }
                          sx={{ fontSize: '0.7rem', height: 20 }}
                        />
                        {attendance.observaciones && (
                          <Typography variant="caption" sx={{ display: 'block', mt: 0.5 }}>
                            {attendance.observaciones.substring(0, 10)}...
                          </Typography>
                        )}
                      </Box>
                    )}
                  </Box>
                </Grid>
              );
            })}
          </Grid>

          {/* Context Menu */}
          <Menu
            open={contextMenu !== null}
            onClose={() => setContextMenu(null)}
            anchorReference="anchorPosition"
            anchorPosition={
              contextMenu !== null
                ? { top: contextMenu.mouseY, left: contextMenu.mouseX }
                : undefined
            }
          >
            {tiposAsistencia.map(tipo => (
              <MenuItem key={tipo.value} onClick={() => handleQuickAttendance(tipo.value)}>
                <ListItemIcon>
                  {tipo.value === 'completo' && <Work />}
                  {tipo.value === 'medio' && <Schedule />}
                  {tipo.value === 'ausente' && <WorkOff />}
                  {tipo.value === 'licencia' && <LocalHospital />}
                  {tipo.value === 'vacaciones' && <BeachAccess />}
                </ListItemIcon>
                <ListItemText>{tipo.label}</ListItemText>
              </MenuItem>
            ))}
          </Menu>
        </CardContent>
      </Card>
    );
  };

  const monthStats = () => {
    const monthRecords = records.filter(r => 
      dayjs(r.fecha).isSame(selectedMonth, 'month')
    );

    const totalHours = monthRecords.reduce((sum, r) => sum + parseFloat(r.horas_trabajadas || 0), 0);
    const totalDays = monthRecords.length;
    const averageHours = totalDays > 0 ? totalHours / totalDays : 0;
    
    return {
      totalDays,
      totalHours,
      averageHours,
      salary: calculateSalary()
    };
  };

  const stats = monthStats();

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h4" sx={{ fontWeight: 600 }}>
          Control de Asistencia
        </Typography>
        <Box>
          <Button
            variant="outlined"
            startIcon={<CalendarToday />}
            onClick={() => setCalendarView(!calendarView)}
            sx={{ mr: 2 }}
          >
            {calendarView ? 'Vista Lista' : 'Vista Calendario'}
          </Button>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => {
              setFormData(prev => ({ ...prev, trabajador_id: selectedWorker }));
              setOpen(true);
            }}
            disabled={!selectedWorker}
          >
            Registrar Asistencia
          </Button>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {/* Worker Selection and Month Picker */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={3} alignItems="center">
            <Grid item xs={12} md={4}>
              <FormControl fullWidth>
                <InputLabel>Trabajador</InputLabel>
                <Select
                  value={selectedWorker}
                  label="Trabajador"
                  onChange={(e) => setSelectedWorker(e.target.value)}
                >
                  <MenuItem value="">Seleccionar trabajador...</MenuItem>
                  {workers.map(worker => (
                    <MenuItem key={worker.id} value={worker.id}>
                      {worker.nombre} - {worker.cargo}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} md={3}>
              <DatePicker
                label="Mes y Año"
                views={['year', 'month']}
                value={selectedMonth}
                onChange={(value) => setSelectedMonth(value)}
                renderInput={(params) => <TextField {...params} fullWidth />}
              />
            </Grid>

            {selectedWorker && (
              <Grid item xs={12} md={5}>
                <Button
                  variant="outlined"
                  startIcon={<GetApp />}
                  onClick={handleGenerateReport}
                  fullWidth
                >
                  Generar Reporte Mensual
                </Button>
              </Grid>
            )}
          </Grid>
        </CardContent>
      </Card>

      {selectedWorker && (
        <>
          {/* Statistics Cards */}
          <Grid container spacing={3} sx={{ mb: 3 }}>
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <AccessTime sx={{ mr: 2, color: 'primary.main' }} />
                    <Typography variant="h6">Días Trabajados</Typography>
                  </Box>
                  <Typography variant="h4">
                    {stats.totalDays}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Este mes
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Schedule sx={{ mr: 2, color: 'warning.main' }} />
                    <Typography variant="h6">Horas Totales</Typography>
                  </Box>
                  <Typography variant="h4">
                    {stats.totalHours.toFixed(1)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Horas trabajadas
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <CheckCircle sx={{ mr: 2, color: 'success.main' }} />
                    <Typography variant="h6">Promedio Diario</Typography>
                  </Box>
                  <Typography variant="h4">
                    {stats.averageHours.toFixed(1)}h
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Horas por día
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Person sx={{ mr: 2, color: 'info.main' }} />
                    <Typography variant="h6">Sueldo Estimado</Typography>
                  </Box>
                  <Typography variant="h4">
                    {formatCurrency(stats.salary)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Este mes
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* Calendar or List View */}
          {calendarView ? renderCalendarView() : (
            <Card>
              <CardContent>
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Fecha</TableCell>
                        <TableCell>Entrada</TableCell>
                        <TableCell>Salida</TableCell>
                        <TableCell>Horas</TableCell>
                        <TableCell>Observaciones</TableCell>
                        <TableCell>Acciones</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {records
                        .filter(r => dayjs(r.fecha).isSame(selectedMonth, 'month'))
                        .map((record) => (
                          <TableRow key={record.id}>
                            <TableCell>
                              {dayjs(record.fecha).format('DD/MM/YYYY - dddd')}
                            </TableCell>
                            <TableCell>{record.hora_entrada || '-'}</TableCell>
                            <TableCell>{record.hora_salida || '-'}</TableCell>
                            <TableCell>
                              <Chip
                                label={`${record.horas_trabajadas}h`}
                                color={
                                  parseFloat(record.horas_trabajadas) >= 8 ? 'success' :
                                  parseFloat(record.horas_trabajadas) >= 4 ? 'warning' : 'error'
                                }
                                size="small"
                              />
                            </TableCell>
                            <TableCell>{record.observaciones || '-'}</TableCell>
                            <TableCell>
                              <IconButton size="small" onClick={() => handleEdit(record)}>
                                <Edit />
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
          )}
        </>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
        <form onSubmit={handleSubmit}>
          <DialogTitle>
            {editingId ? 'Editar Asistencia' : 'Registrar Asistencia'}
          </DialogTitle>
          <DialogContent>
            <Grid container spacing={3} sx={{ mt: 1 }}>
              <Grid item xs={12}>
                <FormControl fullWidth>
                  <InputLabel>Trabajador</InputLabel>
                  <Select
                    value={formData.trabajador_id}
                    label="Trabajador"
                    onChange={(e) => setFormData(prev => ({ ...prev, trabajador_id: e.target.value }))}
                    required
                  >
                    {workers.map(worker => (
                      <MenuItem key={worker.id} value={worker.id}>
                        {worker.nombre}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={12}>
                <DatePicker
                  label="Fecha"
                  value={formData.fecha}
                  onChange={(value) => setFormData(prev => ({ ...prev, fecha: value }))}
                  renderInput={(params) => <TextField {...params} fullWidth required />}
                />
              </Grid>
              
              <Grid item xs={12} md={6}>
                <TimePicker
                  label="Hora Entrada"
                  value={formData.hora_entrada}
                  onChange={(value) => setFormData(prev => ({ ...prev, hora_entrada: value }))}
                  renderInput={(params) => <TextField {...params} fullWidth />}
                />
              </Grid>
              
              <Grid item xs={12} md={6}>
                <TimePicker
                  label="Hora Salida"
                  value={formData.hora_salida}
                  onChange={(value) => setFormData(prev => ({ ...prev, hora_salida: value }))}
                  renderInput={(params) => <TextField {...params} fullWidth />}
                />
              </Grid>
              
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Horas Trabajadas"
                  type="number"
                  step="0.5"
                  value={formData.horas_trabajadas}
                  onChange={(e) => setFormData(prev => ({ ...prev, horas_trabajadas: e.target.value }))}
                  InputProps={{
                    endAdornment: 'horas'
                  }}
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
                  placeholder="Trabajo nocturno, horas extra, etc..."
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
    </Box>
  );
};

export default Asistencia;