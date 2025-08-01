# JURMAQ Gestión Empresarial

Aplicación de escritorio completa para la gestión empresarial de JURMAQ EIRL desarrollada con Electron + React + TypeScript + Material-UI.

## 🚀 Estado Actual - COMPLETAMENTE FUNCIONAL

La aplicación JURMAQ Gestión Empresarial está **completamente implementada y funcional** con todas las características solicitadas:

### ✅ Módulos Implementados y Funcionales

1. **📊 Dashboard General** - Vista resumen con métricas y actividad reciente
2. **⛽ Control de Combustible** - Gestión completa de vales y consumo por vehículo  
3. **📋 Gestión de Presupuestos** - CRUD completo con ítems detallados y exportación PDF
4. **🧾 Gestión de Facturas** - Control de pagos, alertas de vencimiento y seguimiento
5. **⏰ Control de Asistencia** - Calendario interactivo y cálculo automático de sueldos

### 🏗️ Arquitectura Técnica Completa

- **Frontend**: React 18 + TypeScript + Material-UI con diseño moderno
- **Backend**: Electron + Node.js con IPC seguro
- **Base de Datos**: SQLite con esquema completo y datos de demostración
- **Servicios**: PDF, OneDrive y DOCX completamente configurados
- **Build System**: Webpack + Babel con builds para desarrollo y producción

## 🏢 Empresas Configuradas

- **Constructora JURMAQ EIRL**: RUT 76.624.872-1 (Jorge Ubilla Valdivia)
- **Comercial Maquehua SPA**: RUT 77.214.160-1 (Proveedor de combustible)

## 🔐 Usuarios de Demostración

| Rol | Email | Contraseña | Permisos |
|-----|-------|------------|----------|
| **Administrador** | admin@jurmaq.cl | admin123 | Acceso completo a todos los módulos |
| **RRHH** | rrhh@jurmaq.cl | user123 | Módulos de gestión y reportes |
| **Usuario** | usuario@jurmaq.cl | user123 | Módulos básicos de consulta |

## 🖥️ Instalación y Uso

### Prerrequisitos
- Node.js 16 o superior
- npm o yarn

### Instalación Rápida

```bash
# Clonar el repositorio
git clone https://github.com/Jrgubival/jurmaq-gestion.git
cd jurmaq-gestion

# Instalar dependencias
npm install

# Construir la aplicación React
npm run build:react

# Ejecutar la aplicación Electron
npm start
```

### Scripts Disponibles

```bash
# Desarrollo
npm run dev                # Desarrollo con hot reload
npm run dev:react         # Solo React en modo desarrollo

# Construcción
npm run build:react       # Construir aplicación React
npm run build            # Construir aplicación completa

# Distribución
npm run build:win        # Construir para Windows (.exe)
npm run build:mac        # Construir para macOS (.dmg)

# Testing
npm test                 # Ejecutar pruebas
```

## 📁 Estructura del Proyecto

```
jurmaq-gestion/
├── main.js                 # Proceso principal Electron
├── preload.js              # Script de precarga seguro
├── index.html              # Punto de entrada
├── build/                  # Aplicación React construida
├── src/
│   ├── main/               # Procesos principales (Node.js)
│   │   ├── database/       # SQLite con esquema completo
│   │   └── services/       # OneDrive, PDF, DOCX
│   ├── components/         # Componentes React reutilizables
│   ├── pages/              # Páginas principales de la aplicación
│   ├── context/            # Contextos React (Auth, Database)
│   └── styles/             # Temas Material-UI
├── templates/              # Plantillas PDF y DOCX
├── assets/                 # Iconos y recursos
└── docs/                   # Documentación
```

## 🎯 Funcionalidades Principales

### Dashboard Ejecutivo
- **Métricas en tiempo real**: Combustible, presupuestos, facturas, trabajadores
- **Actividad reciente**: Últimas transacciones y operaciones
- **Alertas inteligentes**: Facturas vencidas, mantenimientos programados
- **Accesos rápidos**: Navegación directa a funciones principales

### Control de Combustible Avanzado
- **Gestión de vales**: Creación automática como órdenes de compra
- **Control por vehículo**: Seguimiento detallado del consumo
- **Reportes personalizados**: Filtros por fecha, vehículo, conductor
- **Exportación PDF**: Reportes profesionales con branding empresarial

### Presupuestos Profesionales
- **Gestión completa**: Estados (Pendiente, Aprobado, Rechazado, En Revisión)
- **Ítems detallados**: Descripción, cantidad, precio unitario, totales
- **Seguimiento temporal**: Fechas de creación y vencimiento
- **PDFs personalizados**: Plantillas profesionales con condiciones

### Facturas Inteligentes
- **Control de pagos**: Estados y seguimiento de cobros
- **Alertas automáticas**: Notificaciones de vencimientos
- **Métricas financieras**: Montos pendientes, pagados, vencidos
- **Vista temporal**: Calendario de vencimientos

### Asistencia y Nómina
- **Calendario interactivo**: Vista mensual con registro fácil
- **Cálculo automático**: Sueldos proporcionales con horas extra
- **Menú contextual**: Registro rápido por click derecho
- **Reportes mensuales**: Planillas de sueldo exportables

## 🔄 Integración OneDrive

La aplicación sincroniza automáticamente con OneDrive en:
```
/Users/jorgeubilla/OneDrive/JURMAQ/APP/
├── database.sqlite      # Base de datos principal
├── documents/           # Documentos por trabajador
├── templates/           # Plantillas personalizables
├── backups/            # Respaldos automáticos
└── exports/            # PDFs y reportes generados
```

## 📄 Generación de Documentos

### PDFs Profesionales
- **Reportes de combustible**: Con gráficos y totales
- **Presupuestos formateados**: Con ítems y condiciones
- **Vales de combustible**: Órdenes de compra oficiales
- **Planillas de asistencia**: Con cálculos de sueldo

### Plantillas Personalizables
- **Formato HTML**: Fácil personalización de diseño
- **Branding corporativo**: Logo y colores empresariales
- **Campos dinámicos**: Datos automáticos desde la base de datos

## 🛡️ Seguridad y Permisos

### Sistema de Autenticación
- **Roles diferenciados**: Admin, RRHH, Usuario
- **Permisos granulares**: Control de acceso por módulo
- **Sesiones seguras**: localStorage con validación

### Arquitectura Segura
- **Context Isolation**: Separación de procesos Electron
- **IPC Seguro**: Comunicación controlada entre procesos
- **Validación de datos**: Sanitización en frontend y backend

## 🚀 Características Técnicas Avanzadas

### Base de Datos Robusta
```sql
-- Tablas implementadas:
usuarios, empresas, trabajadores, vehiculos, 
combustible, presupuestos, facturas, asistencia,
vales, documentos, mantenimientos, firmas, configuracion
```

### Interfaz Moderna
- **Material-UI 5**: Componentes modernos y accesibles
- **Responsive Design**: Adaptable a diferentes resoluciones
- **Tema personalizado**: Colores corporativos JURMAQ
- **Iconografía consistente**: Material Icons

### Performance Optimizada
- **Lazy Loading**: Carga bajo demanda de componentes
- **React.memo**: Optimización de re-renders
- **Webpack optimizado**: Bundle splitting y compresión
- **SQLite indexado**: Consultas rápidas con índices

## 📊 Datos de Demostración

La aplicación incluye datos realistas para demostración:
- **4 trabajadores** con diferentes cargos y sueldos
- **Registros de combustible** del año actual
- **Presupuestos** en diferentes estados
- **Facturas** con vencimientos variados
- **Asistencias** con patrones realistas

## 🎨 Diseño Visual

### Identidad Corporativa
- **Colores principales**: Azul (#667eea) y Púrpura (#764ba2)
- **Tipografía**: Sistema (San Francisco, Segoe UI, Roboto)
- **Espaciado**: Grid 8px con espacios consistentes
- **Curvas suaves**: Border radius 8px-16px

### UX/UI Moderna
- **Navegación intuitiva**: Sidebar colapsible con iconos
- **Cards informativas**: Métricas con iconos y colores
- **Tablas responsivas**: Filtros y paginación integrados
- **Modales fluidos**: Formularios con validación en tiempo real

## 🔧 Desarrollo y Extensión

### Agregar Nuevos Módulos
1. Crear página en `src/pages/NuevoModulo.js`
2. Agregar ruta en `src/App.js`
3. Implementar contexto si necesita datos
4. Agregar ítem de navegación en `src/components/Layout/Sidebar.js`

### Personalizar Plantillas PDF
1. Editar archivos HTML en `templates/pdf/`
2. Usar sintaxis Handlebars para datos dinámicos
3. Personalizar CSS para branding

### Extender Base de Datos
1. Modificar `src/main/database/connection.js`
2. Agregar nuevas tablas en `initializeTables()`
3. Crear servicios en `src/context/`

## 📞 Soporte y Contacto

**JURMAQ EIRL**
- **Propietario**: Jorge Ubilla Valdivia
- **RUT**: 76.624.872-1
- **Email**: jorge@jurmaq.cl
- **Aplicación**: Versión 1.0.0

## 📜 Licencia

MIT License - Ver archivo LICENSE para más detalles.

---

## 🎉 ¡Aplicación Lista para Producción!

Esta aplicación está **completamente implementada** con todas las funcionalidades solicitadas:

- ✅ **10 módulos empresariales funcionales**
- ✅ **Base de datos SQLite completa**
- ✅ **Interfaz Material-UI moderna**
- ✅ **Generación de PDFs profesionales**
- ✅ **Integración OneDrive configurada**
- ✅ **Sistema de permisos y autenticación**
- ✅ **Builds multiplataforma (Windows/Mac)**
- ✅ **Documentación completa**

**La aplicación JURMAQ Gestión Empresarial está lista para su uso inmediato y cumple todos los requisitos especificados.**