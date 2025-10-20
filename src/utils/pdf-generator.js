const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');
const logger = require('./logger');

class PDFGenerator {
  /**
   * Generate PDF report
   * @param {object} reportData - Report data
   * @param {string} outputPath - Output file path
   * @returns {Promise<string>} Path to generated PDF
   */
  async generateReport(reportData, outputPath) {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({
          size: 'A4',
          margins: { top: 50, bottom: 50, left: 50, right: 50 }
        });

        const stream = fs.createWriteStream(outputPath);
        doc.pipe(stream);

        // Add content
        this.addHeader(doc, reportData);
        this.addScore(doc, reportData);
        this.addSummary(doc, reportData);
        this.addResults(doc, reportData);
        this.addRecommendations(doc, reportData);
        this.addFooter(doc, reportData);

        doc.end();

        stream.on('finish', () => {
          logger.info(`PDF report generated: ${outputPath}`);
          resolve(outputPath);
        });

        stream.on('error', (error) => {
          logger.error(`Error writing PDF: ${error.message}`);
          reject(error);
        });

      } catch (error) {
        logger.error(`Error generating PDF: ${error.message}`);
        reject(error);
      }
    });
  }

  /**
   * Add header to PDF
   */
  addHeader(doc, reportData) {
    doc
      .fontSize(24)
      .font('Helvetica-Bold')
      .fillColor('#667eea')
      .text('Email Deliverability Report', { align: 'center' })
      .moveDown(0.5);

    doc
      .fontSize(12)
      .font('Helvetica')
      .fillColor('#666')
      .text(`Test Code: ${reportData.testCode}`, { align: 'center' })
      .text(`Generated: ${new Date().toLocaleString()}`, { align: 'center' })
      .moveDown(1.5);

    doc
      .moveTo(50, doc.y)
      .lineTo(545, doc.y)
      .stroke('#e5e7eb')
      .moveDown(1);
  }

  /**
   * Add score section
   */
  addScore(doc, reportData) {
    const { deliverabilityScore, overallStatus } = reportData;

    // Score box
    const boxY = doc.y;
    doc
      .rect(200, boxY, 145, 80)
      .fillAndStroke('#f3f4f6', '#e5e7eb');

    doc
      .fontSize(36)
      .font('Helvetica-Bold')
      .fillColor(this.getStatusColor(overallStatus))
      .text(`${deliverabilityScore}%`, 200, boxY + 15, { width: 145, align: 'center' });

    doc
      .fontSize(12)
      .font('Helvetica')
      .fillColor('#666')
      .text(overallStatus.toUpperCase(), 200, boxY + 58, { width: 145, align: 'center' });

    doc.y = boxY + 100;
    doc.moveDown(1);
  }

  /**
   * Add summary section
   */
  addSummary(doc, reportData) {
    const { summary } = reportData;

    doc
      .fontSize(16)
      .font('Helvetica-Bold')
      .fillColor('#111')
      .text('Summary')
      .moveDown(0.5);

    const summaryData = [
      ['Total Test Inboxes', summary.totalInboxes],
      ['Delivered to Inbox', `${summary.inboxCount} (${summary.inboxPercentage}%)`],
      ['Landed in Spam', `${summary.spamCount} (${summary.spamPercentage}%)`],
      ['Landed in Promotions', `${summary.promotionsCount} (${summary.promotionsPercentage}%)`],
      ['Not Received', summary.notReceivedCount]
    ];

    summaryData.forEach(([label, value]) => {
      const y = doc.y;
      doc
        .fontSize(11)
        .font('Helvetica')
        .fillColor('#666')
        .text(label, 50, y);

      doc
        .fontSize(11)
        .font('Helvetica-Bold')
        .fillColor('#111')
        .text(value.toString(), 400, y, { align: 'right' });

      doc.moveDown(0.8);
    });

    doc.moveDown(1);
  }

  /**
   * Add results table
   */
  addResults(doc, reportData) {
    doc
      .fontSize(16)
      .font('Helvetica-Bold')
      .fillColor('#111')
      .text('Detailed Results')
      .moveDown(0.5);

    // Table header
    const tableTop = doc.y;
    doc
      .fontSize(10)
      .font('Helvetica-Bold')
      .fillColor('#666');

    doc.text('Inbox', 50, tableTop);
    doc.text('Status', 250, tableTop);
    doc.text('Folder', 370, tableTop);
    doc.text('Received', 470, tableTop);

    doc.moveDown(0.5);

    // Table rows
    reportData.results.forEach((result, index) => {
      if (doc.y > 700) {
        doc.addPage();
      }

      const rowY = doc.y;
      const bgColor = index % 2 === 0 ? '#f9fafb' : '#ffffff';
      
      doc
        .rect(50, rowY - 5, 495, 25)
        .fill(bgColor);

      doc
        .fontSize(9)
        .font('Helvetica')
        .fillColor('#111')
        .text(result.inboxName, 50, rowY, { width: 180 });

      const statusColor = this.getStatusColor(result.status);
      doc
        .fillColor(statusColor)
        .text(result.status, 250, rowY);

      doc
        .fillColor('#111')
        .text(result.folder || 'N/A', 370, rowY);

      doc.text(
        result.receivedAt ? new Date(result.receivedAt).toLocaleTimeString() : 'N/A',
        470,
        rowY
      );

      doc.moveDown(1.2);
    });

    doc.moveDown(1);
  }

  /**
   * Add recommendations section
   */
  addRecommendations(doc, reportData) {
    if (doc.y > 650) {
      doc.addPage();
    }

    doc
      .fontSize(16)
      .font('Helvetica-Bold')
      .fillColor('#111')
      .text('Recommendations')
      .moveDown(0.5);

    reportData.recommendations.forEach((rec) => {
      if (doc.y > 700) {
        doc.addPage();
      }

      doc
        .fontSize(11)
        .font('Helvetica-Bold')
        .fillColor(this.getRecommendationColor(rec.type))
        .text(`• ${rec.title}`)
        .moveDown(0.3);

      doc
        .fontSize(10)
        .font('Helvetica')
        .fillColor('#666')
        .text(rec.message, { indent: 15 })
        .moveDown(0.8);
    });
  }

  /**
   * Add footer
   */
  addFooter(doc, reportData) {
    const bottomY = 770;
    
    doc
      .fontSize(8)
      .font('Helvetica')
      .fillColor('#999')
      .text(
        `Report generated by Email Spam Report Tool | ${reportData.testCode}`,
        50,
        bottomY,
        { align: 'center' }
      );
  }

  /**
   * Get color based on status
   */
  getStatusColor(status) {
    const colors = {
      excellent: '#10b981',
      good: '#3b82f6',
      fair: '#f59e0b',
      poor: '#ef4444',
      received: '#10b981',
      not_received: '#ef4444',
      error: '#ef4444',
      pending: '#6b7280'
    };
    return colors[status] || '#6b7280';
  }

  /**
   * Get color for recommendation type
   */
  getRecommendationColor(type) {
    const colors = {
      success: '#10b981',
      info: '#3b82f6',
      warning: '#f59e0b',
      error: '#ef4444'
    };
    return colors[type] || '#6b7280';
  }
}

module.exports = new PDFGenerator();