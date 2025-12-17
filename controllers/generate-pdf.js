import prisma from "../config/db.js";
import QRCode from "qrcode";
import { generatePDF } from "../utils/pdfGenerator.js";
import crypto from "crypto";

export const getPDF = async (req, res) => {
  try {
    const id = Number(req.params.id);

    // ---------------------------------------
    // AMBIL DATA SERVICE DENGAN SEMUA RELASI
    // ---------------------------------------
    const service = await prisma.pilotageService.findUnique({
      where: { id },
      include: {
        pilot: true,
        company: true,
        agency: true,
        terminalStart: true,
        terminalEnd: true,
        shipDetails: true,
        signatures: true,
        tugServices: {
          include: {
            tugDetails: {
              include: { assistTug: true },
            },
          },
        },
      },
    });

    if (!service) {
      return res.status(404).json({
        status: false,
        message: "Service not found",
      });
    }

    // ---------------------------------------
    // FORMAT TANGGAL & JAM
    // ---------------------------------------
    const fmtDate = (d) => (d ? new Date(d).toLocaleDateString("id-ID") : "-");
    const fmtTime = (t) =>
      t
        ? new Date(t).toLocaleTimeString("id-ID", {
            hour: "2-digit",
            minute: "2-digit",
          })
        : "-";

    service.startDateFormatted = fmtDate(service.startDate);
    service.startTimeFormatted = fmtTime(service.startTime);
    service.endDateFormatted = fmtDate(service.endDate);
    service.endTimeFormatted = fmtTime(service.endTime);

    if (service.tugServices?.length > 0) {
      service.tugServices = service.tugServices.map((ts) => {
        ts.tugDetails = ts.tugDetails.map((t) => ({
          ...t,
          connectTimeFormatted: fmtTime(t.connectTime),
          disconnectTimeFormatted: fmtTime(t.disconnectTime),
        }));
        return ts;
      });
    }

    // ---------------------------------------
    // QR CODE SIGNATURES
    // ---------------------------------------
    const baseUrl = process.env.APP_URL;

    const getQR = async (token) =>
      token
        ? await QRCode.toDataURL(`${baseUrl}/api/validate/signature/${token}`)
        : null;

    const pilotSignature = service.signatures?.find((s) => s.type === "PILOT");
    const managerSignature = service.signatures?.find(
      (s) => s.type === "MANAGER"
    );
    const tugMasterSignatures =
      service.signatures?.filter((s) => s.type === "TUG_MASTER") || [];
    const masterSignature = service.signatures?.find(
      (s) => s.type === "MASTER"
    );

    const pilotQR = await getQR(pilotSignature?.token);
    const managerQR = await getQR(managerSignature?.token);

    const tugMasterQRs = await Promise.all(
      tugMasterSignatures.map((sig) => getQR(sig.token))
    );

    // ---------------------------------------
    // LOGO COMPANY
    // ---------------------------------------
    let logo = "/img/default-logo.png";

    switch (service.companyId) {
      case 1:
        logo = "/img/logo-company1.png";
        break;
      case 2:
        logo = "/img/logo-company2.png";
        break;
    }

    // ---------------------------------------
    // GENERATE PDF (pakai utils/pdfGenerator.js)
    // ---------------------------------------
    const pdfBuffer = await generatePDF("form-jasa.ejs", {
      service,
      logo,
      pilotQR,
      managerQR,
      tugMasterQRs,
      masterSignature,
    });

    // ---------------------------------------
    // KIRIM PDF KE BROWSER (INLINE)
    // ---------------------------------------
    res.writeHead(200, {
      "Content-Type": "application/pdf",
      "Content-Disposition": "inline; filename=form-jasa.pdf",
      "Content-Length": pdfBuffer.length,
    });

    return res.end(pdfBuffer);
  } catch (error) {
    console.error("PDF Generate Error:", error);
    return res.status(500).json({
      status: false,
      message: "Error generating PDF",
      error: error.message,
    });
  }
};
