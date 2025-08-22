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
          if (
            !Array.isArray(tug.tugDetails) ||
            tug.tugDetails.length === 0
          ) {
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
};
