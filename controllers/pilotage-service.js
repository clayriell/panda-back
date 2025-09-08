const prisma = require("../config/db");

module.exports = {

  // PILOTAGE SERVICE ACTION
  getAll: async (req, res, next) => {
    try {
      const pilotageService = await prisma.pilotageService.findMany({
        where : {status : {
        }},
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
  getService: async (req, res) => {
    try {
      const user = req.user;
      const service = await prisma.pilotageService.findMany({
        where: {
          companyId: Number(user.companyId),
          status: { notIn: ["REQUESTED", "CANCELED", "REJECTED"] },
        },
        include: {
          agency: true,
          terminalStart: true,
          terminalEnd: true,
          shipDetails: true,
          tugServices: {
            include: { tugDetails: { include: { assistTug: true } } },
          },
        },
      });

      return res.status(200).json({
        status: true,
        message: "Success get all",
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
  getRequestedServicebByCompany: async (req, res) => {
    try {
      const user = req.user;

      const service = await prisma.pilotageService.findMany({
        where: {
          companyId: user.companyId,
          status: "REQUESTED",
        },
        include: {
          agency: true,
          shipDetails: true,
          terminalStart: true,
          terminalEnd: true,
        },
      });
      return res.status(200).json({
        status: true,
        message: "Success get all",
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
  getDetail: async (req, res) => {
    try {
      const user = req.user;
      const { id } = req.params;

      const service = await prisma.pilotageService.findUnique({
        where: { id: Number(id) },
        include: {
          pilot : {
            select : {name : true}
          },
          shipDetails : true, 
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
  create: async (req, res, next) => {
  try {
    const {
      idJasa,
      agencyId,
      activity,
      terminalStartId,
      terminalEndId,
      lastPort,
      nextPort,
      startDate,
      startTime,
      companyId,
      shipDetails,
      tugServices,  // array, tapi seharusnya max 1 TugService di requirement
      useAssist,
    } = req.body;

    const dateTime = new Date(`${startDate}T${startTime}:00Z`);

    // 🔹 Validasi shipDetails wajib ada
    if (!Array.isArray(shipDetails) || shipDetails.length === 0) {
      return res.status(400).json({
        status: false,
        message: "At least one ship detail is required",
      });
    }

    // 🔹 Transaction
    const result = await prisma.$transaction(async (tx) => {
      // 1️⃣ Buat PilotageService
      const newService = await tx.pilotageService.create({
        data: {
          idJasa: idJasa ? Number(idJasa) : null,
          agencyId: Number(agencyId),
          activity,
          terminalStartId: Number(terminalStartId),
          terminalEndId: Number(terminalEndId),
          lastPort,
          nextPort,
          startDate: dateTime,
          startTime: dateTime,
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

      // 2️⃣ Kalau pakai assist → wajib buat TugService + TugServiceDetail
      if (useAssist) {
        if (!Array.isArray(tugServices) || tugServices.length === 0) {
          throw new Error("TugService wajib ada jika Assist Tug dipilih!");
        }

        // requirement: hanya 1 tugService per pilotageService
        const tug = tugServices[0];

        if (!Array.isArray(tug.tugDetails) || tug.tugDetails.length === 0) {
          throw new Error("TugServiceDetail wajib ada jika Assist Tug dipilih!");
        }

        await tx.tugService.create({
          data: {
            pilotageServiceId: newService.id,
            idJasa: tug.idJasa ? Number(tug.idJasa) : null,
            amount: 0,
            status: "REQUESTED",
            tugDetails: {
              create: tug.tugDetails.map((det) => {
                if (!det.assistTugId) {
                  throw new Error("assistTugId wajib ada di TugServiceDetail!");
                }
                return {
                  assistTugId: Number(det.assistTugId),
                  activity: det.activity || "ASSIST_BERTHING",
                  connectTime: det.connectTime || null,
                  disconnectTime: det.disconnectTime || null,
                  mobTime: det.mobTime || null,
                  demobTime: det.demobTime || null,
                };
              }),
            },
          },
        });
      }

      return tx.pilotageService.findUnique({
        where: { id: newService.id },
        include: {
          agency : true,
          terminalStart : true,
          terminalEnd : true,
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
    // console.error("Error creating PilotageService:", error);
    return res.status(400).json({
      status: false,
      message: error.message || "Failed to create PilotageService",
    });
  }
  },
  approve: async (req, res) => {
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

      if (serviceExsist.status === "APPROVED") {
        return res.status(409).json({
          status: false,
          message: "Pilotage Service already approved.",
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
            status: "APPROVED",
            createdBy: user.id,
          }, // kita butuh id tugService kalau ada
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
      if(service.status !== "COMPLETED"){
        return res.status(400).json({
          status : false , message : "Invalid service status"
        })
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
  // CREATE ASSIST TUG REQUEST (NEED TO SEARCH PILOTAGE SERVICE FIRST)


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
          status: true,
          message: "Invalid Service Status",
        });
      }

      const updatedService = await prisma.pilotageService.update({
        where: { id: Number(id) },
        data: {
          pilotId: Number(user.id),
          status: "IN_PROCESS",
          startDate: new Date(),
          startTime: new Date(),
        },
      });
      return res.status(200).json({
        status: true,
        message: "Success update onBoard",
        data: updatedService,
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
      const { note, rate } = req.body;
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
          status: true,
          message: "Invalid Service Status",
        });
      }

      const updatedService = await prisma.pilotageService.update({
        where: { id: Number(id) },
        data: {
          pilotId: Number(user.id),
          status: "COMPLETED",
          endDate: new Date(),
          endTime: new Date(),
          note: note,
          rate: rate,
        },
      });
      return res.status(200).json({
        status: true,
        message: "Success completing pilotage service",
        data: updatedService,
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
