# Plantillas DOCX

Este directorio contiene las plantillas base para la generación de documentos Word.

## Plantillas Disponibles

### Contrato de Trabajo
- `contrato_trabajo.docx`
- Variables: {trabajador_nombre}, {cargo}, {sueldo}, etc.

### Finiquito
- `finiquito.docx`
- Variables: {trabajador_nombre}, {total_finiquito}, etc.

### Anexo de Contrato
- `anexo_contrato.docx`
- Variables: {numero_anexo}, {descripcion_cambios}, etc.

### Certificado de Trabajo
- `certificado_trabajo.docx`
- Variables: {trabajador_nombre}, {cargo}, {fecha_ingreso}, etc.

## Uso

Las plantillas usan la sintaxis de Docxtemplater:
- `{variable}` para texto simple
- `{#array}{/array}` para listas
- `{?condicion}{/condicion}` para condicionales

## Personalización

1. Edite las plantillas .docx con Microsoft Word
2. Use las variables entre llaves `{variable}`
3. Mantenga el formato y estilos deseados
4. Guarde y reinicie la aplicación