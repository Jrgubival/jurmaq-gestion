import React, { createContext, useContext, useState, useEffect } from 'react';

const DatabaseContext = createContext();

export const useDatabase = () => {
  const context = useContext(DatabaseContext);
  if (!context) {
    throw new Error('useDatabase must be used within a DatabaseProvider');
  }
  return context;
};

export const DatabaseProvider = ({ children }) => {
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    initializeDatabase();
  }, []);

  const initializeDatabase = async () => {
    try {
      if (!window.electronAPI) {
        throw new Error('Electron API not available');
      }

      // Test database connection
      await window.electronAPI.dbQuery('SELECT 1');
      setIsConnected(true);
      setError(null);
    } catch (err) {
      console.error('Database initialization error:', err);
      setError(err.message);
      setIsConnected(false);
    } finally {
      setIsLoading(false);
    }
  };

  // Generic database operations
  const query = async (sql, params = []) => {
    try {
      if (!window.electronAPI) {
        throw new Error('Electron API not available');
      }
      return await window.electronAPI.dbQuery(sql, params);
    } catch (error) {
      console.error('Database query error:', error);
      throw error;
    }
  };

  const run = async (sql, params = []) => {
    try {
      if (!window.electronAPI) {
        throw new Error('Electron API not available');
      }
      return await window.electronAPI.dbRun(sql, params);
    } catch (error) {
      console.error('Database run error:', error);
      throw error;
    }
  };

  // CRUD operations for common entities
  const users = {
    getAll: () => query('SELECT id, nombre, email, rol, activo, created_at FROM usuarios ORDER BY nombre'),
    getById: (id) => query('SELECT * FROM usuarios WHERE id = ?', [id]),
    create: (userData) => run(
      'INSERT INTO usuarios (nombre, email, password_hash, rol, activo) VALUES (?, ?, ?, ?, ?)',
      [userData.nombre, userData.email, userData.password_hash, userData.rol, userData.activo || 1]
    ),
    update: (id, userData) => run(
      'UPDATE usuarios SET nombre = ?, email = ?, rol = ?, activo = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [userData.nombre, userData.email, userData.rol, userData.activo, id]
    ),
    delete: (id) => run('UPDATE usuarios SET activo = 0 WHERE id = ?', [id]),
  };

  const trabajadores = {
    getAll: () => query('SELECT * FROM trabajadores WHERE activo = 1 ORDER BY nombre'),
    getById: (id) => query('SELECT * FROM trabajadores WHERE id = ?', [id]),
    create: (data) => run(
      'INSERT INTO trabajadores (nombre, rut, email, telefono, direccion, cargo, fecha_ingreso, sueldo_base, activo) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [data.nombre, data.rut, data.email, data.telefono, data.direccion, data.cargo, data.fecha_ingreso, data.sueldo_base, 1]
    ),
    update: (id, data) => run(
      'UPDATE trabajadores SET nombre = ?, rut = ?, email = ?, telefono = ?, direccion = ?, cargo = ?, fecha_ingreso = ?, sueldo_base = ?, activo = ? WHERE id = ?',
      [data.nombre, data.rut, data.email, data.telefono, data.direccion, data.cargo, data.fecha_ingreso, data.sueldo_base, data.activo, id]
    ),
    delete: (id) => run('UPDATE trabajadores SET activo = 0 WHERE id = ?', [id]),
  };

  const vehiculos = {
    getAll: () => query('SELECT * FROM vehiculos WHERE activo = 1 ORDER BY patente'),
    getById: (id) => query('SELECT * FROM vehiculos WHERE id = ?', [id]),
    create: (data) => run(
      'INSERT INTO vehiculos (patente, marca, modelo, año, tipo, activo) VALUES (?, ?, ?, ?, ?, ?)',
      [data.patente, data.marca, data.modelo, data.año, data.tipo, 1]
    ),
    update: (id, data) => run(
      'UPDATE vehiculos SET patente = ?, marca = ?, modelo = ?, año = ?, tipo = ?, activo = ? WHERE id = ?',
      [data.patente, data.marca, data.modelo, data.año, data.tipo, data.activo, id]
    ),
    delete: (id) => run('UPDATE vehiculos SET activo = 0 WHERE id = ?', [id]),
  };

  const combustible = {
    getAll: (filters = {}) => {
      let sql = `
        SELECT c.*, v.patente as vehiculo_patente, t.nombre as conductor_nombre 
        FROM combustible c 
        LEFT JOIN vehiculos v ON c.vehiculo_id = v.id 
        LEFT JOIN trabajadores t ON c.conductor_id = t.id 
        WHERE 1=1
      `;
      const params = [];
      
      if (filters.dateFrom) {
        sql += ' AND c.fecha >= ?';
        params.push(filters.dateFrom);
      }
      if (filters.dateTo) {
        sql += ' AND c.fecha <= ?';
        params.push(filters.dateTo);
      }
      if (filters.vehiculo_id) {
        sql += ' AND c.vehiculo_id = ?';
        params.push(filters.vehiculo_id);
      }
      
      sql += ' ORDER BY c.fecha DESC, c.created_at DESC';
      
      return query(sql, params);
    },
    create: (data) => run(
      'INSERT INTO combustible (vehiculo_id, conductor_id, fecha, cantidad, precio_litro, total, kilometraje, observaciones) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [data.vehiculo_id, data.conductor_id, data.fecha, data.cantidad, data.precio_litro, data.total, data.kilometraje, data.observaciones]
    ),
    update: (id, data) => run(
      'UPDATE combustible SET vehiculo_id = ?, conductor_id = ?, fecha = ?, cantidad = ?, precio_litro = ?, total = ?, kilometraje = ?, observaciones = ? WHERE id = ?',
      [data.vehiculo_id, data.conductor_id, data.fecha, data.cantidad, data.precio_litro, data.total, data.kilometraje, data.observaciones, id]
    ),
    delete: (id) => run('DELETE FROM combustible WHERE id = ?', [id]),
  };

  const presupuestos = {
    getAll: () => query('SELECT * FROM presupuestos ORDER BY fecha_creacion DESC'),
    getById: (id) => query('SELECT * FROM presupuestos WHERE id = ?', [id]),
    create: (data) => run(
      'INSERT INTO presupuestos (numero, cliente, descripcion, monto, estado, fecha_creacion, fecha_vencimiento, observaciones) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [data.numero, data.cliente, data.descripcion, data.monto, data.estado || 'Pendiente', data.fecha_creacion, data.fecha_vencimiento, data.observaciones]
    ),
    update: (id, data) => run(
      'UPDATE presupuestos SET numero = ?, cliente = ?, descripcion = ?, monto = ?, estado = ?, fecha_creacion = ?, fecha_vencimiento = ?, observaciones = ? WHERE id = ?',
      [data.numero, data.cliente, data.descripcion, data.monto, data.estado, data.fecha_creacion, data.fecha_vencimiento, data.observaciones, id]
    ),
    delete: (id) => run('DELETE FROM presupuestos WHERE id = ?', [id]),
  };

  const facturas = {
    getAll: () => query('SELECT * FROM facturas ORDER BY fecha_emision DESC'),
    getById: (id) => query('SELECT * FROM facturas WHERE id = ?', [id]),
    create: (data) => run(
      'INSERT INTO facturas (numero, cliente, monto, fecha_emision, fecha_vencimiento, estado, observaciones) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [data.numero, data.cliente, data.monto, data.fecha_emision, data.fecha_vencimiento, data.estado || 'Pendiente', data.observaciones]
    ),
    update: (id, data) => run(
      'UPDATE facturas SET numero = ?, cliente = ?, monto = ?, fecha_emision = ?, fecha_vencimiento = ?, estado = ?, observaciones = ? WHERE id = ?',
      [data.numero, data.cliente, data.monto, data.fecha_emision, data.fecha_vencimiento, data.estado, data.observaciones, id]
    ),
    delete: (id) => run('DELETE FROM facturas WHERE id = ?', [id]),
  };

  const asistencia = {
    getByTrabajador: (trabajadorId, dateFrom, dateTo) => {
      return query(
        'SELECT * FROM asistencia WHERE trabajador_id = ? AND fecha BETWEEN ? AND ? ORDER BY fecha DESC',
        [trabajadorId, dateFrom, dateTo]
      );
    },
    create: (data) => run(
      'INSERT OR REPLACE INTO asistencia (trabajador_id, fecha, hora_entrada, hora_salida, horas_trabajadas, observaciones) VALUES (?, ?, ?, ?, ?, ?)',
      [data.trabajador_id, data.fecha, data.hora_entrada, data.hora_salida, data.horas_trabajadas, data.observaciones]
    ),
    getByMonth: (year, month) => query(
      `SELECT a.*, t.nombre as trabajador_nombre, t.sueldo_base 
       FROM asistencia a 
       JOIN trabajadores t ON a.trabajador_id = t.id 
       WHERE strftime('%Y', a.fecha) = ? AND strftime('%m', a.fecha) = ? 
       ORDER BY a.fecha DESC`,
      [year.toString(), month.toString().padStart(2, '0')]
    ),
  };

  // OneDrive sync
  const syncOneDrive = async () => {
    try {
      if (!window.electronAPI) {
        throw new Error('Electron API not available');
      }
      return await window.electronAPI.syncOneDrive();
    } catch (error) {
      console.error('OneDrive sync error:', error);
      throw error;
    }
  };

  // PDF generation
  const generatePDF = async (type, data, filename) => {
    try {
      if (!window.electronAPI) {
        throw new Error('Electron API not available');
      }
      return await window.electronAPI.generatePDF({ type, data, filename });
    } catch (error) {
      console.error('PDF generation error:', error);
      throw error;
    }
  };

  const value = {
    isConnected,
    isLoading,
    error,
    query,
    run,
    users,
    trabajadores,
    vehiculos,
    combustible,
    presupuestos,
    facturas,
    asistencia,
    syncOneDrive,
    generatePDF,
    reconnect: initializeDatabase,
  };

  return (
    <DatabaseContext.Provider value={value}>
      {children}
    </DatabaseContext.Provider>
  );
};