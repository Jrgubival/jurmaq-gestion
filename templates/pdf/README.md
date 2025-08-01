# Plantillas PDF

Este directorio contiene las plantillas base para la generación de documentos PDF.

## Plantillas Disponibles

### Reportes de Combustible
- Formato: A4
- Orientación: Vertical
- Incluye: Logo, datos de empresa, tabla de consumos, totales

### Presupuestos
- Formato: A4  
- Orientación: Vertical
- Incluye: Datos del cliente, detalle de items, términos y condiciones

### Facturas
- Formato: A4
- Orientación: Vertical
- Incluye: Datos de facturación, detalle, impuestos, vencimientos

### Reportes de Asistencia
- Formato: A4
- Orientación: Horizontal
- Incluye: Calendario mensual, totales de horas, observaciones

## Personalización

Las plantillas se generan dinámicamente usando Puppeteer con HTML/CSS.
Para personalizar, edite los archivos en `src/main/services/pdf-generator.js`.