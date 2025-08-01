# JURMAQ Gestión Empresarial

Aplicación de escritorio completa para la gestión empresarial de JURMAQ EIRL desarrollada con Electron + React + TypeScript.

## Características Principales

- **10 Módulos Empresariales**: Dashboard, Combustible, Presupuestos, Facturas, Asistencia, Vales, Documentación, Mantenimiento, Usuarios y Firmas
- **Interfaz Moderna**: React + Material-UI con diseño responsive
- **Base de Datos**: SQLite con sincronización OneDrive automática
- **Generación de Documentos**: PDFs con Puppeteer y plantillas .docx
- **Multiplataforma**: Builds para Windows (.exe) y macOS (.dmg)
- **Seguridad**: Sistema de autenticación y roles de usuario
- **Idioma**: Completamente en español

## Empresas Soportadas

- **Constructora JURMAQ EIRL**: RUT 76.624.872-1
- **Comercial Maquehua SPA**: RUT 77.214.160-1

## Tecnologías

- **Frontend**: React 18 + TypeScript + Material-UI
- **Backend**: Electron + Node.js
- **Base de Datos**: SQLite con sincronización OneDrive
- **Documentos**: Puppeteer (PDF) + Docxtemplater (.docx)
- **Build**: Electron-builder

## Instalación y Desarrollo

### Prerrequisitos

- Node.js 16 o superior
- npm o yarn

### Instalación

```bash
# Clonar el repositorio
git clone https://github.com/Jrgubival/jurmaq-gestion.git
cd jurmaq-gestion

# Instalar dependencias
npm install

# Desarrollo - Modo React
npm run dev:react

# Desarrollo - Modo Electron
npm run dev

# Construir aplicación React
npm run build:react

# Construir aplicación completa
npm run build

# Construir para Windows
npm run build:win

# Construir para macOS
npm run build:mac
```

## Estructura del Proyecto

```
jurmaq-gestion/
├── main.js                    # Proceso principal de Electron
├── preload.js                 # Script de precarga para seguridad
├── index.html                 # Punto de entrada HTML
├── src/
│   ├── main/                  # Procesos principales (Node.js)
│   │   ├── database/          # Conexión y modelos de BD
│   │   └── services/          # Servicios (OneDrive, PDF, etc.)
│   ├── renderer/              # Interfaz de usuario (React)
│   │   ├── components/        # Componentes React
│   │   ├── pages/             # Páginas de la aplicación
│   │   ├── context/           # Contextos React
│   │   └── styles/            # Estilos y temas
│   └── shared/                # Código compartido
├── templates/                 # Plantillas PDF y DOCX
├── assets/                    # Recursos (iconos, imágenes)
└── docs/                      # Documentación
```

## Módulos Principales

### 1. Dashboard General
- Vista resumen con métricas clave
- Notificaciones y alertas
- Accesos rápidos a módulos

### 2. Control de Combustible
- Registro de vales de combustible
- Control por vehículo y conductor
- Reportes y exportación PDF

### 3. Gestión de Presupuestos
- Creación y seguimiento de propuestas
- Estados: Pendiente, Aprobado, Rechazado
- Integración con plantillas .docx

### 4. Gestión de Facturas
- Control de pagos y vencimientos
- Alertas automáticas
- Reportes financieros

### 5. Control de Asistencia
- Calendario de asistencia
- Cálculo automático de sueldos
- Reportes mensuales por trabajador

### 6. Vales y Anexos
- Documentación de contratos
- Plantillas .docx personalizables
- Archivo digital organizado

### 7. Documentación
- Gestión de archivos por trabajador
- Categorización automática
- Búsqueda avanzada

### 8. Mantenimiento
- Control de vehículos y maquinaria
- Programación de mantenciones
- Historial de reparaciones

### 9. Usuarios y Permisos
- Sistema de roles: Admin, RRHH, Usuario
- Autenticación segura
- Control de accesos por módulo

### 10. Firmas Digitales
- Timbres empresariales
- Validación OTP
- Certificados digitales

## Usuarios de Demostración

| Rol | Email | Contraseña | Permisos |
|-----|-------|------------|----------|
| Admin | admin@jurmaq.cl | admin123 | Acceso completo |
| RRHH | rrhh@jurmaq.cl | user123 | Módulos de gestión |
| Usuario | usuario@jurmaq.cl | user123 | Módulos básicos |

## Sincronización OneDrive

La aplicación sincroniza automáticamente con OneDrive en la ruta:
`/Users/jorgeubilla/OneDrive/JURMAQ/APP/`

- **Base de datos**: Backup automático cada 24 horas
- **Documentos**: Sincronización en tiempo real
- **Plantillas**: Actualizaciones automáticas

## Generación de Documentos

### PDFs
- Reportes de combustible
- Presupuestos formateados
- Informes de asistencia
- Certificados de trabajo

### Documentos Word (.docx)
- Contratos de trabajo
- Finiquitos
- Anexos de contrato
- Certificados personalizados

## Seguridad

- Encriptación de datos sensibles
- Sistema de autenticación robusto
- Logs de auditoría
- Control de accesos por rol

## Soporte

Para soporte técnico o consultas:
- **Email**: jorge@jurmaq.cl
- **Empresa**: JURMAQ EIRL
- **RUT**: 76.624.872-1

## Licencia

MIT License - Ver archivo LICENSE para más detalles.

## Versión

**v1.0.0** - Versión inicial con funcionalidades básicas
- Dashboard operativo
- Módulo de combustible completo
- Sistema de autenticación
- Sincronización OneDrive
- Generación de PDFs

---

**JURMAQ EIRL** - Gestión Empresarial Completa