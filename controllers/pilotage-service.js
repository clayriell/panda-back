const prisma = require("../config/db");
const crypto = require("crypto");
const QRCode = require("qrcode");
const { generateDocumentNumber } = require("../utils/documentNumberGenerator");
const puppeteer = require("puppeteer");
const { nowUtcPlus7 } = require("../utils/date");

require("dotenv").config();
const baseUrl = process.env.APP_URL;
module.exports = {
  // PILOTAGE SERVICE ACTION

  getAll: async (req, res, next) => {
    try {
      const user = req.user;
      const { status, page = 1, limit = 10 } = req.query;

      const where = {};
      const superAdmin = user.role === "SYS_ADMIN";

      // 🔐 scope company
      if (!superAdmin) {
        where.companyId = user.companyId;
      }

      // 🔎 filter status
      if (status) {
        where.status = Array.isArray(status) ? { in: status } : status;
      }

      const pageNumber = Number(page);
      const pageSize = Number(limit);
      const skip = (pageNumber - 1) * pageSize;

      // 🔢 total count (untuk pagination FE)
      const total = await prisma.pilotageService.count({ where });

      const services = await prisma.pilotageService.findMany({
        where,
        skip,
        take: pageSize,
        include: {
          shipDetails: true,
          company: true,
          agency: true,
          activityDetails: {
            include: { terminalStart: true, terminalEnd: true },
          },
          tugServices: true,
        },
        orderBy: { id: "desc" },
      });

      return res.status(200).json({
        status: true,
        message: "Success get pilotage services",
        data: services,
        meta: {
          page: pageNumber,
          limit: pageSize,
          total,
          totalPages: Math.ceil(total / pageSize),
        },
      });
    } catch (error) {
      console.error("Error fetching pilotage services:", error);
      next(error);
    }
  },
  getDetail: async (req, res, next) => {
    try {
      const user = req.user;
      const id = Number(req.params.id);

      if (isNaN(id)) {
        return res.status(400).json({
          status: false,
          message: "Invalid service id",
        });
      }

      const where = { id };

      if (user.role !== "SYS_ADMIN") {
        where.companyId = user.companyId;
      }

      const service = await prisma.pilotageService.findFirst({
        where,
        include: {
          company: true,
          agency: true,
          shipDetails: true,
          activityDetails: {
            include: { terminalStart: true, terminalEnd: true },
          },
          tugServices: {
            include: {
              tugDetails: {
                include: {
                  assistTug: true,
                },
              },
            },
          },
        },
      });

      if (!service) {
        return res.status(404).json({
          status: false,
          message: "Pilotage service not found",
        });
      }

      if (service.companyId !== user.companyId) {
        return res.status(403).json({
          status: false,
          message: "Forbidden Access user. Please check your company",
        });
      }

      return res.status(200).json({
        status: true,
        message: "Success get pilotage service detail",
        data: service,
      });
    } catch (error) {
      console.error("Error fetching pilotage service detail:", error);
      next(error);
    }
  },

  create: async (req, res) => {
    try {
      const {
        idJasa,
        agencyId,
        description,
        companyId,
        shipDetails,
        activityDetails,
        tugService,
        useAssist,
      } = req.body;
      function wibToDate(value) {
        // WIB = UTC+7
        const date = new Date(value);
        date.setHours(date.getHours() + 7);
        return date;
      }
      console.log("=== RAW req.body ===");
      console.log(req.body);
      console.log("=== JSON STRING ===");
      console.log(JSON.stringify(req.body, null, 2));

      if (!agencyId || !companyId) {
        return res.status(400).json({
          status: false,
          message: "agencyId dan companyId wajib diisi",
        });
      }

      if (!Array.isArray(shipDetails) || shipDetails.length === 0) {
        return res.status(400).json({
          status: false,
          message: "shipDetails wajib minimal 1 data",
        });
      }

      if (!Array.isArray(activityDetails) || activityDetails.length === 0) {
        return res.status(400).json({
          status: false,
          message: "activityDetails wajib minimal 1 data",
        });
      }

      if (useAssist && !tugService) {
        return res.status(400).json({
          status: false,
          message: "tugService wajib jika useAssist = true",
        });
      }

      if (idJasa) {
        const exist = await prisma.pilotageService.findFirst({
          where: { idJasa: Number(idJasa) },
        });

        if (exist) {
          return res.status(400).json({
            status: false,
            message: "Service dengan idJasa ini sudah ada",
          });
        }
      }

      const result = await prisma.$transaction(async (tx) => {
        const service = await tx.pilotageService.create({
          data: {
            idJasa: idJasa ? Number(idJasa) : null,
            agencyId: Number(agencyId),
            companyId: Number(companyId),
            description,
            status: "REQUESTED",

            shipDetails: {
              create: shipDetails.map((s) => ({
                name: s.name,
                master: s.master,
                grt: s.grt,
                loa: s.loa,
                flag: s.flag,
                lastPort: s.lastPort,
                lastPortCountry: s.lastPortCountry,
                nextPort: s.nextPort,
                nextPortCountry: s.nextPortCountry,
                callSign: s.callSign,
              })),
            },

            activityDetails: {
              create: activityDetails.map((a, index) => ({
                terminalStartId: Number(a.terminalStartId),
                terminalEndId: Number(a.terminalEndId),
                activity: a.activity,
                startTime: a.startTime ? wibToDate(a.startTime) : null,
                sequence: index + 1,
              })),
            },
          },
        });

        if (useAssist) {
          if (
            !Array.isArray(tugService.tugDetails) ||
            tugService.tugDetails.length === 0
          ) {
            throw new Error("tugDetails wajib diisi jika useAssist = true");
          }

          await tx.tugService.create({
            data: {
              pilotageServiceId: service.id,
              idJasa: tugService.idJasa ? Number(tugService.idJasa) : null,
              status: "REQUESTED",
              description: tugService.description,

              tugDetails: {
                create: tugService.tugDetails.map((t, index) => ({
                  assistTugId: Number(t.assistTugId),
                  activity: t.activity,
                  sequence: t.sequence,
                  status: "WAITING",
                })),
              },
            },
          });
        }

        return tx.pilotageService.findUnique({
          where: { id: service.id },
          include: {
            agency: true,
            company: true,
            shipDetails: true,
            activityDetails: true,
            tugServices: {
              include: { tugDetails: true },
            },
          },
        });
      });

      return res.status(201).json({
        status: true,
        message: "Pilotage Service berhasil dibuat",
        data: result,
      });
    } catch (error) {
      return res.status(400).json({
        status: false,
        message: error.message || "Gagal membuat Pilotage Service",
      });
    }
  },

  approve: async (req, res) => {
    try {
      const { id } = req.params;
      const user = req.user;

      // Ambil service + relasi tugServices untuk validasi awal
      const serviceExist = await prisma.pilotageService.findUnique({
        where: { id: Number(id) },
        // include: { tugServices: true },
      });

      if (!serviceExist) {
        return res
          .status(404)
          .json({ status: false, message: "Pilotage Service not found." });
      }

      if (user.companyId !== serviceExist.companyId) {
        return res.status(403).json({
          status: false,
          message: "Forbidden access user, please check your company",
        });
      }

      if (serviceExist.status === "APPROVED") {
        return res.status(409).json({
          status: false,
          message: "Pilotage Service already approved.",
        });
      }

      if (serviceExist.status !== "REQUESTED") {
        return res
          .status(400)
          .json({ status: false, message: "Invalid Pilotage Service status." });
      }

      // Transaction callback → bisa conditionally run query Prisma
      const result = await prisma.$transaction(async (tx) => {
        // Step 1: approve pilotageService
        const approved = await tx.pilotageService.update({
          where: { id: serviceExist.id },
          data: {
            status: "APPROVED",
            createdBy: user.id,
          }, // kita butuh id tugService kalau ada
        });

        const logs = await tx.serviceLog.create({
          data: {
            serviceId: serviceExist.id,
            serviceType: "PILOTAGE",
            userId: user.id,
            action: `${user.username} approved service.`,
            createdAt: nowUtcPlus7(),
          },
        });

        // Optional: re-fetch biar relasi yang dikembalikan sudah up-to-date
        const approvedService = await tx.pilotageService.findUnique({
          where: { id: approved.id },
        });

        return approvedService;
      });

      return res.status(200).json({
        status: true,
        message: "Pilotage Service Approved!",
        data: result,
      });
    } catch (error) {
      console.error("Error approving service:", error);
      return res.status(500).json({
        status: false,
        message: "Internal server error",
        error: error.message,
      });
    }
  },
  reject: async (req, res) => {
    try {
      const { id } = req.params;
      const user = req.user;

      // Ambil service + relasi tugServices untuk validasi awal
      const serviceExsist = await prisma.pilotageService.findUnique({
        where: { id: Number(id) },
        include: { tugServices: true },
      });

      if (!serviceExsist) {
        return res
          .status(404)
          .json({ status: false, message: "Pilotage Service not found." });
      }

      if (user.companyId !== serviceExsist.companyId) {
        return res.status(403).json({
          status: false,
          message: "Forbidden access user, please check your company",
        });
      }

      if (serviceExsist.status === "REJECTED") {
        return res.status(409).json({
          status: false,
          message: "Pilotage Service already rejected.",
        });
      }

      if (serviceExsist.status !== "REQUESTED") {
        return res
          .status(400)
          .json({ status: false, message: "Invalid Pilotage Service status." });
      }

      // Transaction callback → bisa conditionally run query Prisma
      const result = await prisma.$transaction(async (tx) => {
        // Step 1: approve pilotageService
        const approved = await tx.pilotageService.update({
          where: { id: serviceExsist.id },
          data: {
            status: "REJECTED",
            createdBy: user.id,
          },
          include: { tugServices: true }, // kita butuh id tugService kalau ada
        });

        // Step 2: kalau ada tugService, approve juga (1:1 by bisnis rule)
        if (approved.tugServices.length > 0) {
          await tx.tugService.update({
            where: { id: approved.tugServices[0].id }, // update tunggal
            data: { status: "REJECTED" },
          });
        }

        // Optional: re-fetch biar relasi yang dikembalikan sudah up-to-date
        const withRelations = await tx.pilotageService.findUnique({
          where: { id: approved.id },
          include: { tugServices: true },
        });

        return withRelations;
      });

      return res.status(200).json({
        status: true,
        message: "Pilotage Service Rejected!",
        data: result,
      });
    } catch (error) {
      console.error("Error approving service:", error);
      return res.status(500).json({
        status: false,
        message: "Internal server error",
        error: error.message,
      });
    }
  },
  register: async (req, res) => {
    const { id } = req.params;
    const user = req.user;
    const token = crypto.randomBytes(16).toString("hex");

    try {
      const result = await prisma.$transaction(async (tx) => {
        const service = await tx.pilotageService.findUnique({
          where: { id: Number(id) },
        });

        if (!service) {
          throw new Error("SERVICE_NOT_FOUND");
        }

        if (user.companyId !== service.companyId) {
          throw new Error("FORBIDDEN");
        }

        if (service.status !== "COMPLETED") {
          throw new Error("INVALID_STATUS");
        }

        if (service.docNumber) {
          throw new Error("DOCUMENT_ALREADY_REGISTERED");
        }

        // 🔹 company code mapping (lebih rapi)
        const companyCodeMap = {
          1: "MDH",
          2: "PEL-ID-BTM",
          3: "BDP",
          4: "GSS",
          5: "SIS",
          6: "SCP",
        };

        const companyCode = companyCodeMap[service.companyId];
        if (!companyCode) {
          throw new Error("INVALID_COMPANY_CODE");
        }

        // 🔹 generate document number
        const docNumber = await generateDocumentNumber(companyCode);

        const updatedService = await tx.pilotageService.update({
          where: { id: service.id },
          data: {
            docNumber,
          },
        });

        // 🔹 find manager
        const manager = await tx.user.findFirst({
          where: {
            companyId: service.companyId,
            role: "MANAGER",
          },
        });

        if (!manager) {
          throw new Error("MANAGER_NOT_FOUND");
        }

        // 🔹 create manager signature
        await tx.docSignature.create({
          data: {
            userId: manager.id,
            pilotageServiceId: service.id,
            signedAt: nowUtcPlus7(),
            token,
            type: "MANAGER",
          },
        });

        // 🔹 service log
        await tx.serviceLog.create({
          data: {
            serviceId: service.id,
            serviceType: "PILOTAGE",
            userId: user.id,
            action: `${user.username} registered service document`,
            createdAt: nowUtcPlus7(),
          },
        });

        return {
          docNumber,
          serviceId: service.id,
        };
      });

      return res.status(200).json({
        status: true,
        message: "Success register document",
        data: result,
      });
    } catch (error) {
      console.error("Error registering service document:", error);

      const errorMap = {
        SERVICE_NOT_FOUND: [404, "Service not found"],
        FORBIDDEN: [403, "Forbidden access user, please check your company"],
        INVALID_STATUS: [400, "Invalid service status"],
        DOCUMENT_ALREADY_REGISTERED: [400, "Document already registered"],
        MANAGER_NOT_FOUND: [404, "Manager account not found"],
        INVALID_COMPANY_CODE: [400, "Invalid company configuration"],
      };

      const [status, message] = errorMap[error.message] || [
        500,
        "Internal server error",
      ];

      return res.status(status).json({
        status: false,
        message,
      });
    }
  },
  getForm: async (req, res) => {
    try {
      const id = Number(req.params.id);

      const service = await prisma.pilotageService.findFirst({
        where: { idJasa: id },
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

      // Jika tidak ada service
      if (!service) {
        return res.status(404).render("notfound", {
          message_en:
            "Service not found, please enter a valid pilotage service id",
          message_id:
            "Layanan tidak ditemukan, mohon masukkan 'ID Jasa Pandu' yang benar",
        });
      }

      // Format tanggal & waktu
      if (service.tugServices && service.tugServices.length > 0) {
        service.tugServices = service.tugServices.map((tugService) => {
          tugService.tugDetails = tugService.tugDetails.map((tug) => {
            // Format connect time
            tug.connectTimeFormatted = tug.connectTime
              ? new Date(tug.connectTime).toLocaleTimeString("id-ID", {
                  hour: "2-digit",
                  minute: "2-digit",
                })
              : "-";

            // Format disconnect time
            tug.disconnectTimeFormatted = tug.disconnectTime
              ? new Date(tug.disconnectTime).toLocaleTimeString("id-ID", {
                  hour: "2-digit",
                  minute: "2-digit",
                })
              : "-";

            return tug;
          });

          return tugService;
        });
      }
      service.startDateFormatted =
        service.startDate?.toLocaleDateString("id-ID") || "-";

      service.startTimeFormatted =
        service.startTime?.toLocaleTimeString("id-ID", {
          hour: "2-digit",
          minute: "2-digit",
        }) || "-";

      service.endDateFormatted =
        service.endDate?.toLocaleDateString("id-ID") || "-";

      service.endTimeFormatted =
        service.endTime?.toLocaleTimeString("id-ID", {
          hour: "2-digit",
          minute: "2-digit",
        }) || "-";
      // ============================
      //   SIGNATURE CHECK + QR CODE
      // ============================
      let pilotQR,
        managerQR = null;
      let tugMasterQRs = [];

      const pilotSignature = service.signatures?.find(
        (s) => s.type === "PILOT"
      );
      const managerSignature = service.signatures?.find(
        (s) => s.type === "MANAGER"
      );
      const tugMasterSignatures =
        service.signatures?.filter((s) => s.type === "TUG_MASTER") || [];
      const masterSignature = service.signatures?.find(
        (s) => s.type === "MASTER"
      );
      if (managerSignature?.token) {
        const msUrl = `${baseUrl}/api/validate/signature/${managerSignature.token}`;
        managerQR = await QRCode.toDataURL(msUrl);
      }
      if (pilotSignature?.token) {
        // URL validasi signature
        const psUrl = `${baseUrl}/api/validate/signature/${pilotSignature.token}`;
        // generate QR
        pilotQR = await QRCode.toDataURL(psUrl);
      }

      tugMasterQRs = await Promise.all(
        tugMasterSignatures
          .filter((sig) => sig.token) // hanya ambil yang valid
          .map(async (sig) => {
            const tmUrl = `${baseUrl}/api/validate/signature/${sig.token}`;
            return await QRCode.toDataURL(tmUrl);
          })
      );

      let logo = "/img/default-logo.jpg";

      if (service.companyId === 1) {
        logo = "/img/logo-company1.png";
      } else if (service.companyId === 2) {
        logo = "/img/logo-company2.png";
      }

      return res.render("form-jasa", {
        service,
        pilotQR,
        managerQR,
        tugMasterQRs,
        masterSignature,
        logo,
        error: null,
      });
    } catch (error) {
      console.error("Error loading form:", error);

      return res.status(500).render("error", {
        message_en: "Internal server error",
        message_id: "Terjadi kesalahan pada server",
        error: error.message,
      });
    }
  },
  submit: async (req, res) => {
    try {
      const user = req.user;
      const { id } = req.params;
      const { docNumber } = req.body;

      const service = await prisma.pilotageService.findUnique({
        where: { id: Number(id) },
      });

      if (!service) {
        return res.status(404).json({
          status: false,
          message: "Service not found",
        });
      }
      if (user.companyId !== service.companyId) {
        return res.status(401).json({
          status: false,
          message: "Forbidden access user, please check your company",
        });
      }
      if (service.status !== "COMPLETED") {
        return res.status(400).json({
          status: false,
          message: "Invalid service status",
        });
      }

      const updatedService = await prisma.pilotageService.update({
        where: { id: Number(id) },
        data: {
          status: "SUBMITTED",
          submittedBy: Number(user.id),
          submitTime: new Date(),
        },
      });

      return res.status(200).json({
        status: true,
        message: "Success submit pilotage service",
        data: updatedService,
      });
    } catch (error) {
      console.error("Error submiting pilotage service:", error);
      return res.status(500).json({
        status: false,
        message: "Internal server error",
        error: error.message,
      });
    }
  },

  //PILOT ACTION
  onBoard: async (req, res) => {
    try {
      const user = req.user;
      const { id } = req.params;

      const service = await prisma.pilotageService.findUnique({
        where: { id: Number(id) },
      });

      if (!service) {
        return res.status(404).json({
          status: false,
          message: "Service not found",
        });
      }

      if (user.companyId !== service.companyId) {
        return res.status(403).json({
          status: false,
          message: "Forbidden user access. check your company",
        });
      }

      if (service.status !== "APPROVED") {
        return res.status(400).json({
          status: false,
          message: "Invalid Service Status",
        });
      }

      const result = await prisma.$transaction(async (tx) => {
        // 1️⃣ Update service (record resmi)
        const updatedService = await tx.pilotageService.update({
          where: { id: Number(id) },
          data: {
            pilotId: Number(user.id),
            status: "IN_PROCESS",
            startDate: nowUtcPlus7(),
            startTime: nowUtcPlus7(),
          },
        });

        // 2️⃣ UPSERT pilot current status (LIVE STATE)
        await tx.pilotCurrentStatus.upsert({
          where: {
            userId: Number(user.id),
          },
          update: {
            status: "WORKING",
            pilotageServiceId: updatedService.id,
            startTime: nowUtcPlus7(),
          },
          create: {
            userId: Number(user.id),
            status: "WORKING",
            pilotageServiceId: updatedService.id,
            startTime: nowUtcPlus7(),
          },
        });

        return updatedService;
      });

      return res.status(200).json({
        status: true,
        message: "Success update onBoard",
        data: result,
      });
    } catch (error) {
      console.error("Error starting pilotage service:", error);
      return res.status(500).json({
        status: false,
        message: "Internal server error",
        error: error.message,
      });
    }
  },

  offBoard: async (req, res) => {
    try {
      const user = req.user;
      const { id } = req.params;
      const { note, rate, signatureImage } = req.body;
      const token = crypto.randomBytes(16).toString("hex");

      const service = await prisma.pilotageService.findUnique({
        where: { id: Number(id) },
      });

      if (!service) {
        return res.status(404).json({
          status: false,
          message: "Service not found",
        });
      }

      if (user.id !== service.pilotId) {
        return res.status(401).json({
          status: false,
          message: "Invalid Pilot data, please check pilot on board",
        });
      }

      if (user.companyId !== service.companyId) {
        return res.status(403).json({
          status: false,
          message: "Forbidden user access. check your company",
        });
      }

      if (service.status !== "IN_PROCESS") {
        return res.status(400).json({
          status: false,
          message: "Invalid Service Status",
        });
      }

      if (!signatureImage) {
        return res.status(400).json({
          status: false,
          message: "Master signature cannot be empty",
        });
      }

      const result = await prisma.$transaction(async (tx) => {
        const updatedService = await tx.pilotageService.update({
          where: { id: Number(id) },
          data: {
            status: "COMPLETED",
            endDate: nowUtcPlus7(),
            endTime: nowUtcPlus7(),
            note,
            rate,
          },
        });

        await tx.pilotCurrentStatus.upsert({
          where: {
            userId: Number(user.id),
          },
          update: {
            status: "STAND_BY",
            pilotageServiceId: null,
            startTime: null,
          },
          create: {
            userId: Number(user.id),
            status: "STAND_BY",
            pilotageServiceId: null,
            startTime: null,
          },
        });

        // 3️⃣ Signature documents
        await tx.docSignature.create({
          data: {
            userId: user.id,
            pilotageServiceId: Number(id),
            signedAt: new Date(),
            token,
            type: "PILOT",
          },
        });

        await tx.docSignature.create({
          data: {
            pilotageServiceId: Number(id),
            signedAt: new Date(),
            type: "MASTER",
            signatureImage,
          },
        });

        return updatedService;
      });

      return res.status(200).json({
        status: true,
        message: "Success completing pilotage service",
        data: result,
      });
    } catch (error) {
      console.error("Error completing pilotage service:", error);
      return res.status(500).json({
        status: false,
        message: "Internal server error",
        error: error.message,
      });
    }
  },
};
