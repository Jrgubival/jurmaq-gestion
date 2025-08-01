const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

class Database {
    constructor() {
        this.db = null;
        this.dbPath = path.join(process.env.HOME || process.env.USERPROFILE, 'OneDrive', 'JURMAQ', 'APP', 'database.sqlite');
        
        // Ensure directory exists
        const dbDir = path.dirname(this.dbPath);
        if (!fs.existsSync(dbDir)) {
            fs.mkdirSync(dbDir, { recursive: true });
        }
    }

    static getInstance() {
        if (!Database.instance) {
            Database.instance = new Database();
        }
        return Database.instance;
    }

    static initialize() {
        const instance = Database.getInstance();
        return instance.connect();
    }

    async connect() {
        return new Promise((resolve, reject) => {
            this.db = new sqlite3.Database(this.dbPath, sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE, (err) => {
                if (err) {
                    console.error('Error opening database:', err);
                    reject(err);
                } else {
                    console.log('Connected to SQLite database');
                    this.initializeTables().then(resolve).catch(reject);
                }
            });
        });
    }

    async initializeTables() {
        const tables = [
            // Usuarios y Permisos
            `CREATE TABLE IF NOT EXISTS usuarios (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                nombre TEXT NOT NULL,
                email TEXT UNIQUE NOT NULL,
                password_hash TEXT NOT NULL,
                rol TEXT NOT NULL DEFAULT 'Usuario',
                activo BOOLEAN DEFAULT 1,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )`,

            // Empresas
            `CREATE TABLE IF NOT EXISTS empresas (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                nombre TEXT NOT NULL,
                rut TEXT UNIQUE NOT NULL,
                direccion TEXT,
                telefono TEXT,
                email TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )`,

            // Trabajadores
            `CREATE TABLE IF NOT EXISTS trabajadores (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                nombre TEXT NOT NULL,
                rut TEXT UNIQUE NOT NULL,
                email TEXT,
                telefono TEXT,
                direccion TEXT,
                cargo TEXT,
                fecha_ingreso DATE,
                sueldo_base DECIMAL(10,2),
                activo BOOLEAN DEFAULT 1,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )`,

            // Vehículos
            `CREATE TABLE IF NOT EXISTS vehiculos (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                patente TEXT UNIQUE NOT NULL,
                marca TEXT,
                modelo TEXT,
                año INTEGER,
                tipo TEXT,
                activo BOOLEAN DEFAULT 1,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )`,

            // Control de Combustible
            `CREATE TABLE IF NOT EXISTS combustible (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                vehiculo_id INTEGER,
                conductor_id INTEGER,
                fecha DATE NOT NULL,
                cantidad DECIMAL(8,2) NOT NULL,
                precio_litro DECIMAL(6,2) NOT NULL,
                total DECIMAL(10,2) NOT NULL,
                kilometraje INTEGER,
                observaciones TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (vehiculo_id) REFERENCES vehiculos (id),
                FOREIGN KEY (conductor_id) REFERENCES trabajadores (id)
            )`,

            // Presupuestos
            `CREATE TABLE IF NOT EXISTS presupuestos (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                numero TEXT UNIQUE NOT NULL,
                cliente TEXT NOT NULL,
                descripcion TEXT NOT NULL,
                monto DECIMAL(12,2) NOT NULL,
                estado TEXT DEFAULT 'Pendiente',
                fecha_creacion DATE NOT NULL,
                fecha_vencimiento DATE,
                observaciones TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )`,

            // Facturas
            `CREATE TABLE IF NOT EXISTS facturas (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                numero TEXT UNIQUE NOT NULL,
                cliente TEXT NOT NULL,
                monto DECIMAL(12,2) NOT NULL,
                fecha_emision DATE NOT NULL,
                fecha_vencimiento DATE NOT NULL,
                estado TEXT DEFAULT 'Pendiente',
                observaciones TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )`,

            // Asistencia
            `CREATE TABLE IF NOT EXISTS asistencia (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                trabajador_id INTEGER NOT NULL,
                fecha DATE NOT NULL,
                hora_entrada TIME,
                hora_salida TIME,
                horas_trabajadas DECIMAL(4,2),
                observaciones TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (trabajador_id) REFERENCES trabajadores (id),
                UNIQUE(trabajador_id, fecha)
            )`,

            // Vales y Anexos
            `CREATE TABLE IF NOT EXISTS vales (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                tipo TEXT NOT NULL,
                numero TEXT UNIQUE NOT NULL,
                trabajador_id INTEGER,
                monto DECIMAL(10,2),
                descripcion TEXT,
                fecha_emision DATE NOT NULL,
                estado TEXT DEFAULT 'Activo',
                archivo_path TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (trabajador_id) REFERENCES trabajadores (id)
            )`,

            // Documentación
            `CREATE TABLE IF NOT EXISTS documentos (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                trabajador_id INTEGER,
                nombre TEXT NOT NULL,
                tipo TEXT NOT NULL,
                categoria TEXT,
                archivo_path TEXT NOT NULL,
                fecha_subida DATE NOT NULL,
                observaciones TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (trabajador_id) REFERENCES trabajadores (id)
            )`,

            // Mantenimiento
            `CREATE TABLE IF NOT EXISTS mantenimientos (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                vehiculo_id INTEGER NOT NULL,
                tipo TEXT NOT NULL,
                descripcion TEXT,
                fecha_programada DATE,
                fecha_realizada DATE,
                costo DECIMAL(10,2),
                proveedor TEXT,
                kilometraje INTEGER,
                estado TEXT DEFAULT 'Programado',
                observaciones TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (vehiculo_id) REFERENCES vehiculos (id)
            )`,

            // Firmas Digitales
            `CREATE TABLE IF NOT EXISTS firmas (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                nombre TEXT NOT NULL,
                tipo TEXT NOT NULL,
                archivo_path TEXT NOT NULL,
                activo BOOLEAN DEFAULT 1,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )`,

            // Configuración del Sistema
            `CREATE TABLE IF NOT EXISTS configuracion (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                clave TEXT UNIQUE NOT NULL,
                valor TEXT NOT NULL,
                descripcion TEXT,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )`
        ];

        for (const table of tables) {
            await this.run(table);
        }

        // Insert default data
        await this.insertDefaultData();
    }

    async insertDefaultData() {
        // Insert default companies
        await this.run(`INSERT OR IGNORE INTO empresas (nombre, rut, direccion, email) VALUES 
            ('Constructora JURMAQ EIRL', '76.624.872-1', '', ''),
            ('Comercial Maquehua SPA', '77.214.160-1', '', '')`);

        // Insert default admin user
        const bcrypt = require('bcryptjs');
        const adminPassword = await bcrypt.hash('admin123', 10);
        await this.run(`INSERT OR IGNORE INTO usuarios (nombre, email, password_hash, rol) VALUES 
            ('Administrador', 'admin@jurmaq.cl', ?, 'Admin')`, [adminPassword]);

        // Insert default configuration
        await this.run(`INSERT OR IGNORE INTO configuracion (clave, valor, descripcion) VALUES 
            ('app_version', '1.0.0', 'Versión de la aplicación'),
            ('company_name', 'JURMAQ EIRL', 'Nombre de la empresa'),
            ('onedrive_sync', 'true', 'Sincronización OneDrive habilitada'),
            ('backup_interval', '24', 'Intervalo de backup en horas')`);
    }

    async run(sql, params = []) {
        return new Promise((resolve, reject) => {
            this.db.run(sql, params, function(err) {
                if (err) {
                    reject(err);
                } else {
                    resolve({ id: this.lastID, changes: this.changes });
                }
            });
        });
    }

    async get(sql, params = []) {
        return new Promise((resolve, reject) => {
            this.db.get(sql, params, (err, row) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(row);
                }
            });
        });
    }

    async all(sql, params = []) {
        return new Promise((resolve, reject) => {
            this.db.all(sql, params, (err, rows) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(rows);
                }
            });
        });
    }

    close() {
        if (this.db) {
            this.db.close();
        }
    }
}

module.exports = Database;