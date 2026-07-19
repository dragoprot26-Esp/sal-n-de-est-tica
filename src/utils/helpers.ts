/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import QRCode from 'qrcode';
import { jsPDF } from 'jspdf';

/**
 * Generates a beautiful PDF containing the Salon name and its public QR code.
 * @param url The public website URL of the salon.
 * @param salonName The name of the aesthetics salon.
 */
export async function downloadSalonQrPdf(url: string, salonName: string) {
  try {
    // Generate QR Code as DataURL (base64 image)
    const qrDataUrl = await QRCode.toDataURL(url, {
      width: 400,
      margin: 2,
      color: {
        dark: '#1e1b18', // Deep elegant tone
        light: '#ffffff'
      }
    });

    // Create jsPDF instance (A4 size: 210mm x 297mm)
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    // --- Elegant Minimalist Design Layout ---

    // Top Decorative Border Line
    doc.setDrawColor(212, 175, 55); // Golden champagne color
    doc.setLineWidth(1.5);
    doc.line(15, 15, 195, 15);

    // Salon Name (Header)
    doc.setTextColor(30, 27, 24); // Deep charcoal
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(26);
    doc.text(salonName.toUpperCase(), 105, 45, { align: 'center' });

    // Subtitle
    doc.setTextColor(115, 100, 90); // Muted bronze grey
    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(13);
    doc.text('RESERVAS ONLINE & BIENESTAR', 105, 54, { align: 'center' });

    // Center divider
    doc.setDrawColor(230, 224, 217); // soft warm cream line
    doc.setLineWidth(0.5);
    doc.line(40, 62, 170, 62);

    // Decorative Floral / Elegant Border around QR code
    doc.setDrawColor(212, 175, 55); // Golden
    doc.rect(50, 80, 110, 110); // Frame

    // Add QR Code Image
    doc.addImage(qrDataUrl, 'PNG', 55, 85, 100, 100);

    // Instruction Text
    doc.setTextColor(50, 45, 40);
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(12);
    doc.text('ESCANEA EL CÓDIGO QR', 105, 210, { align: 'center' });

    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(115, 100, 90);
    doc.text('Para ver el catálogo de servicios, productos exclusivos', 105, 218, { align: 'center' });
    doc.text('y agendar tu cita en tiempo real.', 105, 224, { align: 'center' });

    // Website Link text
    doc.setFont('Helvetica', 'italic');
    doc.setFontSize(9);
    doc.setTextColor(212, 175, 55);
    doc.text(url, 105, 235, { align: 'center' });

    // Bottom Footer
    doc.setDrawColor(230, 224, 217);
    doc.setLineWidth(0.5);
    doc.line(15, 275, 195, 275);

    doc.setTextColor(150, 140, 130);
    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(8);
    doc.text('Desarrollado de forma segura • BellaVita Aesthetics PWA 2026', 105, 282, { align: 'center' });

    // Save the PDF file
    doc.save(`QR_${salonName.replace(/\s+/g, '_')}.pdf`);
  } catch (error) {
    console.error('Error generating QR PDF:', error);
  }
}
