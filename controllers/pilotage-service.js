const { pilotageservice_status } = require("@prisma/client");
const prisma = require("../config/db");

module.exports = {
  getAll: async (req, res, next) => {
    try {
      const pilotageService = await prisma.pilotageService.findMany({
        include: {
          agency: true,
          terminalStart: true,
          terminalEnd: true,
          shipDetails: true,
          tugServices: {
            include: { tugDetails: { include: { assistTug: true } } },
          },
        },
        orderBy: { id: "desc" },
      });

      return res.status(200).json({
        status: true,
        message: "Success get all pilotage data",
        data: pilotageService,
      });
    } catch (error) {
      console.error("Error fetching pilotageService:", error);
      next(error); // diteruskan ke middleware error global
    }
  },
  getRequestedServices: async (req, res, next) => {
    try {
      const pilotageService = await prisma.pilotageService.findMany({
        where: { status: "REQUESTED" },
        include: {
          agency: true,
          terminalStart: true,
          terminalEnd: true,
          shipDetails: true,
          tugServices: {
            include: { tugDetails: { include: { assistTug: true } } },
          },
        },
        orderBy: { id: "desc" },
      });

      return res.status(200).json({
        status: true,
        message: "Success get requested pilotage data",
        data: pilotageService,
      });
    } catch (error) {
      console.error("Error fetching pilotageService:", error);
      next(error); // diteruskan ke middleware error global
    }
  },
  request: async (req, res, next) => {
    try {
      const {
        idJasa,
        agencyId,
        activity,
        terminalStartId,
        terminalEndId,
        lastPort,
        nextPort,
        startTime,
        companyId,
        shipDetails,
        tugServices,
      } = req.body;

      if (!startTime) {
        return res.status(400).json({
          status: false,
          message: "startTime is required",
        });
      }

      if (!Array.isArray(shipDetails) || shipDetails.length === 0) {
        return res.status(400).json({
          status: false,
          message: "At least one ship detail is required",
        });
      }

      if (Array.isArray(tugServices)) {
        for (const tug of tugServices) {
          if (!Array.isArray(tug.tugDetails) || tug.tugDetails.length === 0) {
            return res.status(400).json({
              status: false,
              message:
                "Each tugService must have at least one tugServiceDetail",
            });
          }
        }
      }

      const result = await prisma.$transaction(async (tx) => {
        const newService = await tx.pilotageService.create({
          data: {
            idJasa: Number(idJasa),
            agencyId: Number(agencyId),
            activity,
            terminalStartId: Number(terminalStartId),
            terminalEndId: Number(terminalEndId),
            lastPort,
            nextPort,
            startDate: startTime,
            startTime: startTime,
            companyId: Number(companyId),
            amount: 0,
            status: "REQUESTED",
            shipDetails: {
              create: shipDetails.map((detail) => ({
                shipName: detail.shipName,
                master: detail.master,
                grt: detail.grt,
                loa: detail.loa,
                flag: detail.flag,
              })),
            },
          },
          include: { shipDetails: true },
        });

        if (Array.isArray(tugServices) && tugServices.length > 0) {
          for (const tug of tugServices) {
            await tx.tugService.create({
              data: {
                pilotageServiceId: newService.id,
                idJasa: tug.idJasa,
                amount: 0,
                status: "REQUESTED",
                tugDetails: {
                  create: tug.tugDetails.map((det) => ({
                    assistTugId: det.assistTugId,
                    connectTime: null,
                    disconnectTime: null,
                  })),
                },
              },
            });
          }
        }

        return tx.pilotageService.findUnique({
          where: { id: newService.id },
          include: {
            shipDetails: true,
            tugServices: { include: { tugDetails: true } },
          },
        });
      });

      return res.status(201).json({
        status: true,
        message: "New Service created successfully",
        data: result,
      });
    } catch (error) {
      console.error("Error creating PilotageService:", error);

      if (error.code === "P2003") {
        return res.status(400).json({
          status: false,
          message:
            "Invalid reference (agencyId, terminalId, or companyId not found)",
        });
      }

      if (error.code === "P2002") {
        return res.status(400).json({
          status: false,
          message: "Duplicate entry",
        });
      }

      // custom error fallback
      if (error.message?.includes("tugService")) {
        return res.status(400).json({
          status: false,
          message: error.message,
        });
      }

      return res.status(500).json({
        status: false,
        message: "Internal server error",
      });
    }
  },

  detail: async (req, res) => {
    try {
      const user = req.user;
      const { id } = req.params;

      const service = await prisma.pilotageService.findUnique({
        where: { id: Number(id) },
        include: {
          agency: {
            select: {
              name: true,
            },
          },
          terminalStart: {
            select: {
              name: true,
            },
          },
          terminalEnd: { select: { name: true } },
          tugServices: {
            select: {
              tugDetails: {
                select: {
                  assistTug: { select: { shipName: true } },
                  connectTime: true,
                  disconnectTime: true,
                },
              },
            },
          },
        },
      });

      if (!service) {
        return res.status(404).json({
          status: false,
          mesasge: "pilotage service not found",
        });
      }

      if (user.companyId !== service.companyId) {
        return res.status(403).json({
          status: false,
          message: "Forbidden access user, please check your company",
        });
      }

      return res.status(200).json({
        status: true,
        message: "success get pilotage service detail",
        data: service,
      });
    } catch (error) {
      return res.status(500).json({
        status: false,
        message: "Internal server error",
        error: error.message,
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
        include: { tugServices: true },
      });

      if (!serviceExist) {
        return res
          .status(404)
          .json({ status: false, message: "Pilotage Service not found." });
      }

      if (user.companyId !== serviceExist.companyId) {
        // 403 lebih tepat untuk forbidden
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
          },
          include: { tugServices: true }, // kita butuh id tugService kalau ada
        });

        // Step 2: kalau ada tugService, approve juga (1:1 by bisnis rule)
        if (approved.tugServices.length > 0) {
          await tx.tugService.update({
            where: { id: approved.tugServices[0].id }, // update tunggal
            data: { status: "APPROVED" },
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
      const serviceExist = await prisma.pilotageService.findUnique({
        where: { id: Number(id) },
        include: { tugServices: true },
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

      if (serviceExist.status === "REJECTED") {
        return res.status(409).json({
          status: false,
          message: "Pilotage Service already rejected.",
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
};
