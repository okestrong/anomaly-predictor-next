/**
 * PDF Generation API Route
 * Uses Puppeteer service to generate PDF from report page
 */

import { NextRequest, NextResponse } from 'next/server';

const PUPPETEER_SERVICE_URL = process.env.PUPPETEER_SERVICE_URL || 'http://localhost:3001';
const NEXT_PUBLIC_URL = process.env.NEXT_PUBLIC_URL || 'http://localhost:3000';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
   try {
      const { id: reportId } = await params;

      // Report page URL
      const reportUrl = `${NEXT_PUBLIC_URL}/reports/view/${reportId}`;

      console.log(`Generating PDF for report: ${reportId}`);
      console.log(`Report URL: ${reportUrl}`);
      console.log(`Puppeteer Service URL: ${PUPPETEER_SERVICE_URL}`);

      // Call Puppeteer service
      const response = await fetch(`${PUPPETEER_SERVICE_URL}/generate-pdf`, {
         method: 'POST',
         headers: {
            'Content-Type': 'application/json',
         },
         body: JSON.stringify({
            url: reportUrl,
            options: {
               format: 'A4',
               displayHeaderFooter: true,
               headerTemplate: `
                  <div style="font-size: 10px; text-align: center; width: 100%; padding: 5px 10mm;">
                     <div style="border-bottom: 1px solid #ccc; padding-bottom: 5px;">
                        <span style="font-weight: bold;">Ceph Cluster Report</span>
                     </div>
                  </div>
               `,
               footerTemplate: `
                  <div style="font-size: 9px; text-align: center; width: 100%; padding: 5px 10mm;">
                     <div style="border-top: 1px solid #ccc; padding-top: 5px;">
                        <span>Page <span class="pageNumber"></span> of <span class="totalPages"></span></span>
                        <span style="margin-left: 20px;">Generated: ${new Date().toLocaleDateString()}</span>
                     </div>
                  </div>
               `,
               margin: {
                  top: '15mm',
                  bottom: '15mm',
                  left: '10mm',
                  right: '10mm',
               },
            },
         }),
      });

      if (!response.ok) {
         const errorText = await response.text();
         console.error('Puppeteer service error:', errorText);
         throw new Error(`PDF generation failed: ${response.statusText}`);
      }

      // Get PDF data
      const pdfBuffer = await response.arrayBuffer();

      console.log(`PDF generated successfully: ${pdfBuffer.byteLength} bytes`);

      // Return PDF response
      return new NextResponse(pdfBuffer, {
         status: 200,
         headers: {
            'Content-Type': 'application/pdf',
            'Content-Disposition': `attachment; filename="report-${reportId}.pdf"`,
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Content-Length': pdfBuffer.byteLength.toString(),
         },
      });
   } catch (error) {
      console.error('PDF generation error:', error);
      return NextResponse.json(
         {
            error: 'Failed to generate PDF',
            message: error instanceof Error ? error.message : 'Unknown error',
         },
         { status: 500 }
      );
   }
}
