const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

class PDFGenerator {
    constructor() {
        this.templatePath = path.join(__dirname, '..', '..', '..', 'templates', 'pdf');
        this.outputPath = path.join(process.env.HOME || process.env.USERPROFILE, 'OneDrive', 'JURMAQ', 'APP', 'exports');
        
        // Ensure output directory exists
        if (!fs.existsSync(this.outputPath)) {
            fs.mkdirSync(this.outputPath, { recursive: true });
        }
    }

    async generate(options) {
        const { type, data, filename } = options;
        
        try {
            const browser = await puppeteer.launch({
                headless: 'new',
                args: ['--no-sandbox', '--disable-setuid-sandbox']
            });
            
            const page = await browser.newPage();
            
            // Set page format
            await page.setViewport({ width: 1200, height: 800 });
            
            // Generate HTML content based on type
            const htmlContent = await this.generateHTML(type, data);
            
            // Set content
            await page.setContent(htmlContent, { waitUntil: 'networkidle0' });
            
            // Generate PDF
            const outputFilename = filename || `${type}_${Date.now()}.pdf`;
            const outputFile = path.join(this.outputPath, outputFilename);
            
            await page.pdf({
                path: outputFile,
                format: 'A4',
                printBackground: true,
                margin: {
                    top: '20mm',
                    right: '15mm',
                    bottom: '20mm',
                    left: '15mm'
                }
            });
            
            await browser.close();
            
            return {
                success: true,
                filename: outputFilename,
                path: outputFile
            };
            
        } catch (error) {
            console.error('Error generating PDF:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    async generateHTML(type, data) {
        const baseStyles = `
            <style>
                * {
                    margin: 0;
                    padding: 0;
                    box-sizing: border-box;
                }
                
                body {
                    font-family: 'Arial', sans-serif;
                    font-size: 12px;
                    line-height: 1.4;
                    color: #333;
                }
                
                .header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 30px;
                    padding-bottom: 20px;
                    border-bottom: 2px solid #667eea;
                }
                
                .logo {
                    width: 80px;
                    height: 80px;
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    border-radius: 10px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: white;
                    font-size: 32px;
                    font-weight: bold;
                }
                
                .company-info {
                    text-align: right;
                }
                
                .company-name {
                    font-size: 18px;
                    font-weight: bold;
                    color: #667eea;
                    margin-bottom: 5px;
                }
                
                .company-details {
                    font-size: 10px;
                    color: #666;
                }
                
                .document-title {
                    text-align: center;
                    font-size: 16px;
                    font-weight: bold;
                    margin: 30px 0;
                    color: #333;
                    text-transform: uppercase;
                }
                
                .info-section {
                    margin-bottom: 25px;
                }
                
                .info-title {
                    font-weight: bold;
                    margin-bottom: 10px;
                    color: #667eea;
                    border-bottom: 1px solid #eee;
                    padding-bottom: 5px;
                }
                
                .info-grid {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 15px;
                    margin-bottom: 15px;
                }
                
                .info-item {
                    display: flex;
                }
                
                .info-label {
                    font-weight: bold;
                    min-width: 120px;
                    color: #555;
                }
                
                .info-value {
                    color: #333;
                }
                
                .table {
                    width: 100%;
                    border-collapse: collapse;
                    margin-bottom: 20px;
                }
                
                .table th,
                .table td {
                    padding: 8px;
                    text-align: left;
                    border-bottom: 1px solid #ddd;
                }
                
                .table th {
                    background-color: #f5f5f5;
                    font-weight: bold;
                    color: #333;
                }
                
                .table tbody tr:hover {
                    background-color: #f9f9f9;
                }
                
                .total-section {
                    margin-top: 20px;
                    text-align: right;
                }
                
                .total-label {
                    font-weight: bold;
                    font-size: 14px;
                    color: #667eea;
                }
                
                .total-amount {
                    font-weight: bold;
                    font-size: 16px;
                    color: #333;
                }
                
                .footer {
                    margin-top: 40px;
                    padding-top: 20px;
                    border-top: 1px solid #eee;
                    text-align: center;
                    font-size: 10px;
                    color: #666;
                }
                
                .signature-section {
                    margin-top: 50px;
                    display: flex;
                    justify-content: space-between;
                }
                
                .signature-box {
                    width: 200px;
                    text-align: center;
                }
                
                .signature-line {
                    border-top: 1px solid #333;
                    margin-bottom: 5px;
                    height: 60px;
                }
                
                @media print {
                    body { -webkit-print-color-adjust: exact; }
                }
            </style>
        `;

        switch (type) {
            case 'combustible':
                return this.generateCombustibleReport(baseStyles, data);
            case 'presupuesto':
                return this.generatePresupuesto(baseStyles, data);
            case 'factura':
                return this.generateFactura(baseStyles, data);
            case 'asistencia':
                return this.generateAsistenciaReport(baseStyles, data);
            case 'vale':
                return this.generateVale(baseStyles, data);
            case 'mantenimiento':
                return this.generateMantenimientoReport(baseStyles, data);
            default:
                throw new Error(`Tipo de documento no soportado: ${type}`);
        }
    }

    generateCombustibleReport(styles, data) {
        const { records, dateFrom, dateTo, totalAmount, totalLiters } = data;
        
        return `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <title>Reporte de Combustible</title>
                ${styles}
            </head>
            <body>
                <div class="header">
                    <div class="logo">J</div>
                    <div class="company-info">
                        <div class="company-name">JURMAQ EIRL</div>
                        <div class="company-details">
                            RUT: 76.624.872-1<br>
                            Gestión Empresarial
                        </div>
                    </div>
                </div>
                
                <div class="document-title">Reporte de Control de Combustible</div>
                
                <div class="info-section">
                    <div class="info-grid">
                        <div class="info-item">
                            <span class="info-label">Período:</span>
                            <span class="info-value">${dateFrom} - ${dateTo}</span>
                        </div>
                        <div class="info-item">
                            <span class="info-label">Fecha Reporte:</span>
                            <span class="info-value">${new Date().toLocaleDateString('es-CL')}</span>
                        </div>
                    </div>
                </div>
                
                <table class="table">
                    <thead>
                        <tr>
                            <th>Fecha</th>
                            <th>Vehículo</th>
                            <th>Conductor</th>
                            <th>Litros</th>
                            <th>Precio/L</th>
                            <th>Total</th>
                            <th>Km</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${records.map(record => `
                            <tr>
                                <td>${new Date(record.fecha).toLocaleDateString('es-CL')}</td>
                                <td>${record.vehiculo_patente}</td>
                                <td>${record.conductor_nombre}</td>
                                <td>${record.cantidad}</td>
                                <td>$${record.precio_litro}</td>
                                <td>$${record.total}</td>
                                <td>${record.kilometraje || '-'}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
                
                <div class="total-section">
                    <div><span class="total-label">Total Litros:</span> <span class="total-amount">${totalLiters} L</span></div>
                    <div><span class="total-label">Total Monto:</span> <span class="total-amount">$${totalAmount}</span></div>
                </div>
                
                <div class="footer">
                    Generado por JURMAQ Gestión Empresarial - ${new Date().toLocaleString('es-CL')}
                </div>
            </body>
            </html>
        `;
    }

    generatePresupuesto(styles, data) {
        const { numero, cliente, descripcion, monto, fecha, items = [] } = data;
        
        return `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <title>Presupuesto ${numero}</title>
                ${styles}
            </head>
            <body>
                <div class="header">
                    <div class="logo">J</div>
                    <div class="company-info">
                        <div class="company-name">JURMAQ EIRL</div>
                        <div class="company-details">
                            RUT: 76.624.872-1<br>
                            Constructora
                        </div>
                    </div>
                </div>
                
                <div class="document-title">Presupuesto N° ${numero}</div>
                
                <div class="info-section">
                    <div class="info-title">Información del Cliente</div>
                    <div class="info-grid">
                        <div class="info-item">
                            <span class="info-label">Cliente:</span>
                            <span class="info-value">${cliente}</span>
                        </div>
                        <div class="info-item">
                            <span class="info-label">Fecha:</span>
                            <span class="info-value">${new Date(fecha).toLocaleDateString('es-CL')}</span>
                        </div>
                    </div>
                </div>
                
                <div class="info-section">
                    <div class="info-title">Descripción del Trabajo</div>
                    <p>${descripcion}</p>
                </div>
                
                ${items.length > 0 ? `
                    <table class="table">
                        <thead>
                            <tr>
                                <th>Descripción</th>
                                <th>Cantidad</th>
                                <th>Precio Unit.</th>
                                <th>Total</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${items.map(item => `
                                <tr>
                                    <td>${item.descripcion}</td>
                                    <td>${item.cantidad}</td>
                                    <td>$${item.precio_unitario}</td>
                                    <td>$${item.total}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                ` : ''}
                
                <div class="total-section">
                    <div><span class="total-label">Monto Total:</span> <span class="total-amount">$${monto}</span></div>
                </div>
                
                <div class="signature-section">
                    <div class="signature-box">
                        <div class="signature-line"></div>
                        <div>Jorge Ubilla</div>
                        <div>JURMAQ EIRL</div>
                    </div>
                    <div class="signature-box">
                        <div class="signature-line"></div>
                        <div>Cliente</div>
                        <div>Firma y RUT</div>
                    </div>
                </div>
                
                <div class="footer">
                    Presupuesto válido por 30 días - Generado por JURMAQ Gestión Empresarial
                </div>
            </body>
            </html>
        `;
    }

    generateAsistenciaReport(styles, data) {
        const { trabajador, records, periodo, totalHoras } = data;
        
        return `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <title>Reporte de Asistencia</title>
                ${styles}
            </head>
            <body>
                <div class="header">
                    <div class="logo">J</div>
                    <div class="company-info">
                        <div class="company-name">JURMAQ EIRL</div>
                        <div class="company-details">
                            RUT: 76.624.872-1<br>
                            Recursos Humanos
                        </div>
                    </div>
                </div>
                
                <div class="document-title">Reporte de Asistencia</div>
                
                <div class="info-section">
                    <div class="info-grid">
                        <div class="info-item">
                            <span class="info-label">Trabajador:</span>
                            <span class="info-value">${trabajador.nombre}</span>
                        </div>
                        <div class="info-item">
                            <span class="info-label">RUT:</span>
                            <span class="info-value">${trabajador.rut}</span>
                        </div>
                        <div class="info-item">
                            <span class="info-label">Período:</span>
                            <span class="info-value">${periodo}</span>
                        </div>
                        <div class="info-item">
                            <span class="info-label">Total Horas:</span>
                            <span class="info-value">${totalHoras}</span>
                        </div>
                    </div>
                </div>
                
                <table class="table">
                    <thead>
                        <tr>
                            <th>Fecha</th>
                            <th>Entrada</th>
                            <th>Salida</th>
                            <th>Horas</th>
                            <th>Observaciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${records.map(record => `
                            <tr>
                                <td>${new Date(record.fecha).toLocaleDateString('es-CL')}</td>
                                <td>${record.hora_entrada || '-'}</td>
                                <td>${record.hora_salida || '-'}</td>
                                <td>${record.horas_trabajadas || '-'}</td>
                                <td>${record.observaciones || '-'}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
                
                <div class="footer">
                    Generado por JURMAQ Gestión Empresarial - ${new Date().toLocaleString('es-CL')}
                </div>
            </body>
            </html>
        `;
    }

    // Additional methods for other document types...
    generateFactura(styles, data) {
        // Similar structure for invoices
        return `<!-- Factura HTML structure -->`;
    }

    generateVale(styles, data) {
        // Similar structure for vouchers
        return `<!-- Vale HTML structure -->`;
    }

    generateMantenimientoReport(styles, data) {
        // Similar structure for maintenance reports
        return `<!-- Maintenance report HTML structure -->`;
    }
}

module.exports = PDFGenerator;