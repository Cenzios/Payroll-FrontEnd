import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';

// ─── DEBUG MODE ────────────────────────────────────────────────────────────────
// Set to true to draw red dots at each text position for coordinate calibration.
// Set to false for the final clean output.
const DEBUG = false;

// ─── Types ─────────────────────────────────────────────────────────────────────
export interface EPFEmployee {
    employeeName: string;
    nationalId: string;
    memberNo: string;
    basicPay: number;
    employerEpf: number;
    employeeEpf: number;
    totalEarnings: number;
}

export interface EPFTotals {
    basicPay: number;
    employerEpf: number;
    employeeEpf: number;
    totalEarnings: number;
}

// ─── Helpers ───────────────────────────────────────────────────────────────────
const MONTH_NAMES = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
];

const fmt = (val: number): string =>
    val.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

// ─── Main Function ─────────────────────────────────────────────────────────────
export async function fillEPFFormC(params: {
    employees: EPFEmployee[];
    totals: EPFTotals;
    month: number;          // 1–12
    year: number;
    companyName?: string;
    epfRegistrationNo?: string;
}): Promise<void> {
    const { employees, totals, month, year, epfRegistrationNo } = params;

    // 1. Load the blank template from Vite's public directory
    //    The PDF is served as a static file at /forms/form_c.pdf
    const res = await fetch('/forms/form_c.pdf');
    if (!res.ok) throw new Error(`Could not load EPF Form C template (HTTP ${res.status}).`);
    const existingPdfBytes = await res.arrayBuffer();

    // Basic sanity check – PDF files must start with %PDF
    const header = new Uint8Array(existingPdfBytes.slice(0, 4));
    const isPDF = header[0] === 0x25 && header[1] === 0x50 && header[2] === 0x44 && header[3] === 0x46;
    if (!isPDF) {
        throw new Error('The fetched file is not a valid PDF. Check that /forms/form_c.pdf is served correctly.');
    }

    // 2. Load PDF document
    const pdfDoc = await PDFDocument.load(existingPdfBytes);
    const pages = pdfDoc.getPages();
    const page = pages[0]; // Only fill page 1

    const { height } = page.getSize();
    // page.getSize() returns {width, height} in PDF points (origin at bottom-left)

    // 3. Embed font
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const fontSize = 7;
    const textColor = rgb(0, 0, 0);
    const debugColor = rgb(1, 0, 0);

    // Helper function: draw text (and optional debug dot)
    const drawText = (text: string, x: number, yFromTop: number) => {
        // PDF origin is bottom-left; convert from top offset
        const y = height - yFromTop;
        if (DEBUG) {
            page.drawCircle({ x, y, size: 2, color: debugColor });
        }
        page.drawText(text, { x, y, size: fontSize, font, color: textColor });
    };

    // ─── 4. Fill header fields ──────────────────────────────────────────────────

    // EPF Registration No  (right-side header block)
    if (epfRegistrationNo) {
        drawText(epfRegistrationNo, 415, 80);      // y=80 from top
    }

    // Month and Year of contribution
    const monthYearText = `${MONTH_NAMES[month - 1]} ${year}`;
    drawText(monthYearText, 415, 94);              // y=94 from top

    // ─── 5. Fill employee table rows ────────────────────────────────────────────
    // Table starts at y ≈ 254 from top (i.e. y_from_bottom ≈ 588 on A4)
    // Each row height ≈ 15pt

    const TABLE_START_Y = 262;   // 842 - 580 = 262 from top
    const ROW_HEIGHT = 18;       // as requested

    // Column x positions (from user prompt)
    const COL = {
        name: 30,
        nic: 155,
        memberNo: 268,
        total: 322,
        employer: 378,
        employee: 435,
        earnings: 500,
    };

    employees.forEach((emp, i) => {
        const yFromTop = TABLE_START_Y + i * ROW_HEIGHT + 4; // +4 to center within row

        // Truncate name so it fits the column
        const nameTrunc = emp.employeeName.length > 22
            ? emp.employeeName.substring(0, 21) + '…'
            : emp.employeeName;

        const totalContrib = emp.employerEpf + emp.employeeEpf;

        drawText(nameTrunc, COL.name, yFromTop);
        drawText(emp.nationalId || '-', COL.nic, yFromTop);
        drawText(emp.memberNo || '-', COL.memberNo, yFromTop);
        drawText(fmt(totalContrib), COL.total, yFromTop);
        drawText(fmt(emp.employerEpf), COL.employer, yFromTop);
        drawText(fmt(emp.employeeEpf), COL.employee, yFromTop);
        drawText(fmt(emp.basicPay), COL.earnings, yFromTop); // use basicPay here
    });

    // ─── 6. Fill totals row ─────────────────────────────────────────────────────
    // The totals row is printed below the last employee; the form has a fixed
    // "Total" label line near the bottom of the table at approx y=144 from bottom
    const TOTALS_Y = 698; // 842 - 144 = 698
    const totalContribTotal = totals.employerEpf + totals.employeeEpf;

    drawText(fmt(totalContribTotal), COL.total, TOTALS_Y);
    drawText(fmt(totals.employerEpf), COL.employer, TOTALS_Y);
    drawText(fmt(totals.employeeEpf), COL.employee, TOTALS_Y);
    drawText(fmt(totals.basicPay), COL.earnings, TOTALS_Y);

    // ─── 7. Save & download ─────────────────────────────────────────────────────
    const pdfBytes = await pdfDoc.save();
    const blob = new Blob([pdfBytes as unknown as BlobPart], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `EPF_C_Form_${MONTH_NAMES[month - 1]}_${year}.pdf`;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 10000);
}
