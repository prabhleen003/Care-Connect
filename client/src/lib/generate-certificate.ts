import { jsPDF } from "jspdf";

interface CertificateData {
  volunteerName: string;
  causeTitle: string;
  ngoName: string;
  startDate: string;
  endDate: string;
  hours: number;
  approved: boolean;
}

export function generateCertificate(data: CertificateData) {
  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
  const w = doc.internal.pageSize.getWidth();
  const h = doc.internal.pageSize.getHeight();

  // Background
  doc.setFillColor(250, 250, 255);
  doc.rect(0, 0, w, h, "F");

  // Decorative border
  doc.setDrawColor(79, 70, 229); // indigo-600
  doc.setLineWidth(2);
  doc.rect(10, 10, w - 20, h - 20);
  doc.setLineWidth(0.5);
  doc.rect(14, 14, w - 28, h - 28);

  // Corner accents
  const accentSize = 20;
  doc.setFillColor(79, 70, 229);
  // Top-left
  doc.rect(10, 10, accentSize, 2, "F");
  doc.rect(10, 10, 2, accentSize, "F");
  // Top-right
  doc.rect(w - 10 - accentSize, 10, accentSize, 2, "F");
  doc.rect(w - 12, 10, 2, accentSize, "F");
  // Bottom-left
  doc.rect(10, h - 12, accentSize, 2, "F");
  doc.rect(10, h - 10 - accentSize, 2, accentSize, "F");
  // Bottom-right
  doc.rect(w - 10 - accentSize, h - 12, accentSize, 2, "F");
  doc.rect(w - 12, h - 10 - accentSize, 2, accentSize, "F");

  // Header
  doc.setFont("helvetica", "normal");
  doc.setFontSize(14);
  doc.setTextColor(107, 114, 128);
  doc.text("CARE CONNECT", w / 2, 32, { align: "center" });

  // Title
  doc.setFont("helvetica", "bold");
  doc.setFontSize(36);
  doc.setTextColor(30, 27, 75);
  doc.text("Certificate of Volunteering", w / 2, 50, { align: "center" });

  // Decorative line under title
  doc.setDrawColor(79, 70, 229);
  doc.setLineWidth(1);
  doc.line(w / 2 - 50, 55, w / 2 + 50, 55);

  // "This certifies that"
  doc.setFont("helvetica", "normal");
  doc.setFontSize(13);
  doc.setTextColor(107, 114, 128);
  doc.text("This is to certify that", w / 2, 70, { align: "center" });

  // Volunteer name
  doc.setFont("helvetica", "bold");
  doc.setFontSize(28);
  doc.setTextColor(79, 70, 229);
  doc.text(data.volunteerName, w / 2, 85, { align: "center" });

  // Description
  doc.setFont("helvetica", "normal");
  doc.setFontSize(13);
  doc.setTextColor(75, 85, 99);
  doc.text("has successfully volunteered for the cause", w / 2, 97, { align: "center" });

  // Cause title
  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.setTextColor(30, 27, 75);
  doc.text(`"${data.causeTitle}"`, w / 2, 110, { align: "center" });

  // NGO and duration
  doc.setFont("helvetica", "normal");
  doc.setFontSize(12);
  doc.setTextColor(75, 85, 99);
  doc.text(`organized by ${data.ngoName}`, w / 2, 121, { align: "center" });
  doc.text(`from ${data.startDate} to ${data.endDate}`, w / 2, 130, { align: "center" });

  // Hours box
  doc.setFillColor(238, 242, 255);
  doc.roundedRect(w / 2 - 35, 137, 70, 18, 4, 4, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.setTextColor(79, 70, 229);
  doc.text(`${data.hours} Volunteer Hours`, w / 2, 149, { align: "center" });

  // Footer
  doc.setFont("helvetica", "italic");
  doc.setFontSize(10);
  doc.setTextColor(156, 163, 175);
  const today = new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
  doc.text(`Issued on ${today}`, w / 2, 172, { align: "center" });

  if (data.approved) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(22, 163, 74);
    doc.text("VERIFIED BY NGO", w / 2, 179, { align: "center" });
  }

  // Save
  const filename = `Certificate_${data.causeTitle.replace(/[^a-zA-Z0-9]/g, "_")}.pdf`;
  doc.save(filename);
}

export function calculateHours(startDate: string | Date, endDate: string | Date): number {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
  return Math.max(days, 1) * 4; // 4 hours per day
}
