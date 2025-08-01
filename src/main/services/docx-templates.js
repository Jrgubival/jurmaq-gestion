const Docxtemplater = require('docxtemplater');
const PizZip = require('pizzip');
const fs = require('fs');
const path = require('path');

class DocxTemplateService {
    constructor() {
        this.templatePath = path.join(__dirname, '..', '..', '..', 'templates', 'docx');
        this.outputPath = path.join(process.env.HOME || process.env.USERPROFILE, 'OneDrive', 'JURMAQ', 'APP', 'exports');
        
        // Ensure directories exist
        if (!fs.existsSync(this.templatePath)) {
            fs.mkdirSync(this.templatePath, { recursive: true });
            this.createDefaultTemplates();
        }
        
        if (!fs.existsSync(this.outputPath)) {
            fs.mkdirSync(this.outputPath, { recursive: true });
        }
    }

    async generateDocument(templateName, data, outputFilename) {
        try {
            const templatePath = path.join(this.templatePath, `${templateName}.docx`);
            
            if (!fs.existsSync(templatePath)) {
                throw new Error(`Template not found: ${templateName}.docx`);
            }

            // Load the template
            const content = fs.readFileSync(templatePath, 'binary');
            const zip = new PizZip(content);
            
            // Create docxtemplater instance
            const doc = new Docxtemplater(zip, {
                paragraphLoop: true,
                linebreaks: true,
            });

            // Process the template with data
            doc.setData(data);
            
            try {
                doc.render();
            } catch (error) {
                console.error('Template rendering error:', error);
                throw error;
            }

            // Generate the document
            const buf = doc.getZip().generate({
                type: 'nodebuffer',
                compression: 'DEFLATE',
            });

            // Save the document
            const outputFile = path.join(this.outputPath, outputFilename || `${templateName}_${Date.now()}.docx`);
            fs.writeFileSync(outputFile, buf);

            return {
                success: true,
                filename: path.basename(outputFile),
                path: outputFile
            };

        } catch (error) {
            console.error('Error generating document:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    async generateContrato(data) {
        const contractData = {
            empresa_nombre: 'JURMAQ EIRL',
            empresa_rut: '76.624.872-1',
            empresa_direccion: '',
            trabajador_nombre: data.trabajador_nombre,
            trabajador_rut: data.trabajador_rut,
            trabajador_direccion: data.trabajador_direccion,
            cargo: data.cargo,
            fecha_inicio: data.fecha_inicio,
            sueldo: data.sueldo,
            fecha_documento: new Date().toLocaleDateString('es-CL'),
            representante: 'Jorge Ubilla',
            representante_rut: '12.345.678-9'
        };

        return await this.generateDocument('contrato_trabajo', contractData, `contrato_${data.trabajador_rut}_${Date.now()}.docx`);
    }

    async generateFiniquito(data) {
        const finiquitoData = {
            empresa_nombre: 'JURMAQ EIRL',
            empresa_rut: '76.624.872-1',
            trabajador_nombre: data.trabajador_nombre,
            trabajador_rut: data.trabajador_rut,
            fecha_ingreso: data.fecha_ingreso,
            fecha_termino: data.fecha_termino,
            ultimo_sueldo: data.ultimo_sueldo,
            vacaciones_pendientes: data.vacaciones_pendientes,
            indemnizacion: data.indemnizacion || 0,
            total_finiquito: data.total_finiquito,
            fecha_documento: new Date().toLocaleDateString('es-CL'),
            representante: 'Jorge Ubilla'
        };

        return await this.generateDocument('finiquito', finiquitoData, `finiquito_${data.trabajador_rut}_${Date.now()}.docx`);
    }

    async generateAnexoContrato(data) {
        const anexoData = {
            empresa_nombre: 'JURMAQ EIRL',
            empresa_rut: '76.624.872-1',
            trabajador_nombre: data.trabajador_nombre,
            trabajador_rut: data.trabajador_rut,
            numero_anexo: data.numero_anexo,
            descripcion_cambios: data.descripcion_cambios,
            fecha_vigencia: data.fecha_vigencia,
            fecha_documento: new Date().toLocaleDateString('es-CL'),
            representante: 'Jorge Ubilla'
        };

        return await this.generateDocument('anexo_contrato', anexoData, `anexo_${data.numero_anexo}_${Date.now()}.docx`);
    }

    async generateCertificadoTrabajo(data) {
        const certificadoData = {
            empresa_nombre: 'JURMAQ EIRL',
            empresa_rut: '76.624.872-1',
            trabajador_nombre: data.trabajador_nombre,
            trabajador_rut: data.trabajador_rut,
            cargo: data.cargo,
            fecha_ingreso: data.fecha_ingreso,
            fecha_termino: data.fecha_termino || 'a la fecha',
            proposito: data.proposito || 'fines que estime conveniente',
            fecha_documento: new Date().toLocaleDateString('es-CL'),
            representante: 'Jorge Ubilla'
        };

        return await this.generateDocument('certificado_trabajo', certificadoData, `certificado_${data.trabajador_rut}_${Date.now()}.docx`);
    }

    createDefaultTemplates() {
        // Create basic templates if they don't exist
        const templates = {
            'contrato_trabajo': this.getContratoTemplate(),
            'finiquito': this.getFiniquitoTemplate(),
            'anexo_contrato': this.getAnexoTemplate(),
            'certificado_trabajo': this.getCertificadoTemplate()
        };

        Object.entries(templates).forEach(([name, content]) => {
            const templateFile = path.join(this.templatePath, `${name}.docx`);
            if (!fs.existsSync(templateFile)) {
                // For now, create placeholder files
                // In a real implementation, you would create proper .docx templates
                fs.writeFileSync(templateFile.replace('.docx', '.txt'), content);
                console.log(`Template placeholder created: ${name}.txt`);
            }
        });
    }

    getContratoTemplate() {
        return `
CONTRATO DE TRABAJO

Entre {empresa_nombre}, RUT {empresa_rut}, representada por don {representante}, RUT {representante_rut}, 
y don(ña) {trabajador_nombre}, RUT {trabajador_rut}, domiciliado en {trabajador_direccion}, 
se ha convenido el siguiente contrato de trabajo:

PRIMERO: El trabajador se obliga a prestar servicios como {cargo}, bajo la dirección y dependencia del empleador.

SEGUNDO: La remuneración convenida es de ${sueldo} mensuales.

TERCERO: El contrato comenzará a regir a partir del {fecha_inicio}.

En comprobante, firman en duplicado en fecha {fecha_documento}.

_______________________          _______________________
{representante}                  {trabajador_nombre}
{empresa_nombre}                 Trabajador
        `;
    }

    getFiniquitoTemplate() {
        return `
FINIQUITO

Entre {empresa_nombre}, RUT {empresa_rut}, y don(ña) {trabajador_nombre}, RUT {trabajador_rut}, 
se conviene el siguiente finiquito:

El trabajador prestó servicios desde el {fecha_ingreso} hasta el {fecha_termino}.

DETALLE DE PAGOS:
- Último sueldo: ${ultimo_sueldo}
- Vacaciones pendientes: ${vacaciones_pendientes}
- Indemnización: ${indemnizacion}

TOTAL FINIQUITO: ${total_finiquito}

Firmado en {fecha_documento}.

_______________________          _______________________
{representante}                  {trabajador_nombre}
{empresa_nombre}                 Trabajador
        `;
    }

    getAnexoTemplate() {
        return `
ANEXO DE CONTRATO N° {numero_anexo}

Entre {empresa_nombre}, RUT {empresa_rut}, y don(ña) {trabajador_nombre}, RUT {trabajador_rut}, 
se conviene el siguiente anexo al contrato de trabajo:

MODIFICACIONES:
{descripcion_cambios}

Este anexo entra en vigencia el {fecha_vigencia}.

Firmado en {fecha_documento}.

_______________________          _______________________
{representante}                  {trabajador_nombre}
{empresa_nombre}                 Trabajador
        `;
    }

    getCertificadoTemplate() {
        return `
CERTIFICADO DE TRABAJO

{empresa_nombre}, RUT {empresa_rut}, certifica que don(ña) {trabajador_nombre}, RUT {trabajador_rut}, 
se desempeñó como {cargo} en esta empresa desde el {fecha_ingreso} hasta {fecha_termino}.

Durante su permanencia en la empresa, el trabajador cumplió satisfactoriamente con sus obligaciones laborales.

Se extiende el presente certificado para {proposito}.

Fecha: {fecha_documento}

_______________________
{representante}
{empresa_nombre}
        `;
    }

    async listTemplates() {
        try {
            const files = fs.readdirSync(this.templatePath);
            return files
                .filter(file => file.endsWith('.docx'))
                .map(file => ({
                    name: file.replace('.docx', ''),
                    filename: file,
                    path: path.join(this.templatePath, file)
                }));
        } catch (error) {
            console.error('Error listing templates:', error);
            return [];
        }
    }

    async uploadTemplate(templateName, filePath) {
        try {
            const targetPath = path.join(this.templatePath, `${templateName}.docx`);
            fs.copyFileSync(filePath, targetPath);
            
            return {
                success: true,
                message: `Template ${templateName} uploaded successfully`
            };
        } catch (error) {
            console.error('Error uploading template:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }
}

module.exports = DocxTemplateService;