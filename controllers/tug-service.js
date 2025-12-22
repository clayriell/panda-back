const prisma = require("../config/db");
const crypto = require("crypto");

module.exports = {
  //assist tug service

  getAll: async (req, res, next) => {
    try {
      const user = req.user;
      const { status, page = 1, limit = 10 } = req.query;

      const where = {};
      const superAdmin = user.role === "SYS_ADMIN";

      // 🔐 scope company
      if (!superAdmin) {
        if (!superAdmin) {
          where.pilotageService = {
            companyId: user.companyId,
          };
        }
      }

      // 🔎 filter status
      if (status) {
        where.status = Array.isArray(status) ? { in: status } : status;
      }

      const pageNumber = Number(page);
      const pageSize = Number(limit);
      const skip = (pageNumber - 1) * pageSize;

      // 🔢 total count untuk pagination
      const total = await prisma.tugService.count({ where });

      const tugServices = await prisma.tugService.findMany({
        where,
        skip,
        take: pageSize,
        include: {
          pilotageService: {
            select: {
              activityDetails: {
                include: {
                  terminalStart: true,
                  terminalEnd: true,
                },
              },
              shipDetails: true,
              agency: { select: { name: true } },
            },
          },
          tugDetails: {
            select: {
              assistTug: { select: { shipName: true } },
              connectTime: true,
              disconnectTime: true,
            },
          },
        },
        orderBy: { id: "desc" },
      });

      return res.status(200).json({
        status: true,
        message: "Success get tug services",
        data: tugServices,
        meta: {
          page: pageNumber,
          limit: pageSize,
          total,
          totalPages: Math.ceil(total / pageSize),
        },
      });
    } catch (error) {
      console.error("Error fetching tug services:", error);
      next(error);
    }
  },

  getAllRequested: async (req, res) => {
    try {
      const user = req.user;

      const tugServices = await prisma.tugService.findMany({
        where: {
          status: "REQUESTED",
        },
        include: {
          pilotageService: {
            select: {
              activity: true,
              shipDetails: true,
              agency: { select: { name: true } },
              terminalStart: { select: { name: true } },
              terminalEnd: { select: { name: true } },
              lastPort: true,
              nextPort: true,
              startDate: true,
              startTime: true,
            },
          },
          tugDetails: {
            select: {
              assistTug: { select: { shipName: true } },
              connectTime: true,
              disconnectTime: true,
            },
          },
        },
      });

      return res.status(200).json({
        status: true,
        message: "Success get all tug service",
        data: tugServices,
      });
    } catch (error) {
      console.error("Error getService:", error);
      return res
        .status(500)
        .json({ status: false, message: "Internal server error" });
    }
  },
  getServiceByTugMaster: async (req, res) => {
    try {
      const user = req.user;

      const tugServices = await prisma.tugServiceDetail.findMany({
        where: {
          status: { notIn: ["COMPLETED"] },
          assistTug: {
            masterId: Number(user.id),
          },
          tugService: {
            status: {
              notIn: ["REQUESTED", "COMPLETED", "REJECTED", "CANCELED"],
            },
          },
        },
        select: {
          activity: true,
          tugService: {
            select: {
              id: true,
              idJasa: true,
              status: true,
              pilotageService: {
                select: {
                  idJasa: true,
                  lastPort: true,
                  nextPort: true,
                  startDate: true,
                  startTime: true,
                  shipDetails: {
                    select: {
                      name: true,
                      grt: true,
                      loa: true,
                      master: true,
                    },
                  },
                  terminalStart: { select: { name: true, code: true } },
                  terminalEnd: { select: { name: true, code: true } },
                  agency: { select: { name: true } },
                  pilot: { select: { name: true } },
                },
              },
            },
            // assistTug: true, // kalau mau sekalian ambil data assistTug
          },
        },
      });

      return res.status(200).json({
        status: true,
        message: "Success get all tug service",
        data: tugServices,
      });
    } catch (error) {
      console.error(error);
      return res.status(500).json({
        status: false,
        message: "Internal server error",
      });
    }
  },
  getDetail: async (req, res) => {
    try {
      const user = req.user;
      const { id } = req.params;

      const service = await prisma.tugService.findUnique({
        where: { id: Number(id) },
        include: {
          pilotageService: {
            include: {
              shipDetails: true,
              terminalStart: true,
              terminalEnd: true,
              agency: true,
              company: true,
              pilot: { select: { name: true } },
            },
          },
          tugDetails: {
            select: {
              assistTug: true,
              mobTime: true,
              connectTime: true,
              disconnectTime: true,
              demobTime: true,
              activity: true,
              status: true,
            },
          },
        },
      });

      if (!service) {
        return res.status(404).json({
          status: false,
          message: "Tug service not found.",
        });
      }
      if (
        user.companyId !== service.pilotageService.companyId &&
        user.role !== "SYS_ADMIN"
      ) {
        return res.status(403).json({
          status: false,
          message: "Forbidden user access, check your company",
        });
      }
      return res.status(200).json({
        status: true,
        message: "Success get tug service detail",
        data: service,
      });
    } catch (error) {
      return res
        .status(500)
        .json({ status: false, message: "Internal server error" });
    }
  },
  getByCompany: async (req, res) => {
    try {
      const user = req.user;

      const tugServices = await prisma.tugService.findMany({
        where: {
          pilotageService: {
            companyId: user.companyId,
          },
        },
        include: {
          pilotageService: true,
        },
      });

      return res.status(200).json({
        status: true,
        message: "Success get tug services",
        data: tugServices,
      });
    } catch (error) {
      console.error(error);
      return res
        .status(500)
        .json({ status: false, message: "Internal server error" });
    }
  },
  //get tug service by company id exclude ["REJECTED", "REQUESTED", "CANCELED"]
  getServiceApproved: async (req, res) => {
    try {
      const user = req.user;

      const tugServices = await prisma.tugService.findMany({
        where: {
          pilotageService: {
            companyId: Number(user.companyId),
          },
          status: { notIn: ["REJECTED", "REQUESTED", "CANCELED"] },
        },
        include: {
          pilotageService: {
            select: {
              activity: true,
              shipDetails: true,
              agency: { select: { name: true } },
              terminalStart: { select: { name: true } },
              terminalEnd: { select: { name: true } },
              lastPort: true,
              nextPort: true,
              startDate: true,
              startTime: true,
            },
          },
          tugDetails: {
            select: {
              assistTug: { select: { shipName: true } },
              connectTime: true,
              disconnectTime: true,
            },
          },
        },
      });

      return res.status(200).json({
        status: true,
        message: "Success get all tug service",
        data: tugServices,
      });
    } catch (error) {
      console.error("Error getService:", error);
      return res
        .status(500)
        .json({ status: false, message: "Internal server error" });
    }
  },
  //get tug service bt company id only status.requested
  getServiceRequested: async (req, res) => {
    try {
      const user = req.user;

      const tugServices = await prisma.tugService.findMany({
        where: {
          pilotageService: {
            companyId: Number(user.companyId),
          },
          status: "REQUESTED",
        },
        include: {
          pilotageService: {
            select: {
              activity: true,
              shipDetails: true,
              agency: { select: { name: true } },
              terminalStart: { select: { name: true } },
              terminalEnd: { select: { name: true } },
              lastPort: true,
              nextPort: true,
              startDate: true,
              startTime: true,
            },
          },
          tugDetails: {
            select: {
              assistTug: { select: { shipName: true } },
              connectTime: true,
              disconnectTime: true,
            },
          },
        },
      });

      return res.status(200).json({
        status: true,
        message: "Success get all tug service",
        data: tugServices,
      });
    } catch (error) {
      console.error("Error getService:", error);
      return res
        .status(500)
        .json({ status: false, message: "Internal server error" });
    }
  },
  //CREATE TUG SERVICE
  create: async (req, res) => {
    try {
      const { idJasa, pilotageServiceId, tugDetails } = req.body;

      // cek pilotage service
      const pilotageServiceExist = await prisma.pilotageService.findUnique({
        where: { id: Number(pilotageServiceId) },
        include: { shipDetails: true },
      });

      if (!pilotageServiceExist) {
        return res.status(400).json({
          status: false,
          message: "Pilotage service not found.",
        });
      }

      if (!tugDetails || tugDetails.length < 1) {
        return res.status(400).json({
          status: false,
          message: "Assist Tug required to create tug service.",
        });
      }

      const newTugService = await prisma.tugService.create({
        data: {
          pilotageServiceId: Number(pilotageServiceId),
          status: "REQUESTED",
          idJasa,
          tugDetails: {
            create: tugDetails.map((detail) => ({
              assistTugId: detail.assistTugId,
              status: "WAITING",
              activity: detail.activity,
            })),
          },
        },
        include: {
          pilotageService: {
            select: {
              agency: { select: { name: true } },
              shipDetails: true,
              terminalStart: { select: { name: true } },
              terminalEnd: { select: { name: true } },
            },
          },
        },
      });

      return res.status(201).json({
        status: true,
        message: "Success create tug service",
        data: newTugService,
      });
    } catch (error) {
      return res.status(400).json({
        status: false,
        message: error.message || "Failed to create TugService",
      });
    }
  },
  //APPROVE TUG SERVICE
  approve: async (req, res) => {
    const user = req.user;
    const { id } = req.params;

    try {
      const result = await prisma.$transaction(async (tx) => {
        // 1. Cek apakah service ada
        const serviceExist = await tx.tugService.findUnique({
          where: { id: Number(id) },
          include: { pilotageService: { select: { company: true } } },
        });

        if (!serviceExist) {
          throw { code: 400, message: "Tug service not found" };
        }

        // 2. Cek apakah user satu company
        if (user.companyId !== serviceExist.pilotageService.company.id) {
          throw {
            code: 403,
            message: "Forbidden access user, check your company",
          };
        }

        // 3. Cek duplikasi approve
        if (serviceExist.status === "APPROVED") {
          throw { code: 409, message: "Tug Service already approved." };
        }

        // 4. Validasi status
        if (serviceExist.status !== "REQUESTED") {
          throw { code: 400, message: "Invalid Tug Service status." };
        }

        // 5. Update status
        const updateService = await tx.tugService.update({
          where: { id: Number(id) },
          data: {
            status: "APPROVED",
            createdBy: Number(user.id),
          },
          include: {
            pilotageService: true,
            tugDetails: true,
          },
        });

        return updateService;
      });

      // Jika transaksi sukses
      return res.status(200).json({
        status: true,
        message: "Tug service approved successfully",
        data: result,
      });
    } catch (error) {
      console.error("Error approving service:", error);

      // Handle error custom dari throw { code, message }
      if (error.code) {
        return res.status(error.code).json({
          status: false,
          message: error.message,
        });
      }

      // Error Prisma / error lain
      return res.status(500).json({
        status: false,
        message: "Internal server error",
        error: error.message,
      });
    }
  },

  //REJECT TUG SERVICE
  //CANCEL TUG SERVICE
  //SUBMIT TUG SERVICE (NOT FIXED YET)
  submit: async (req, res) => {
    try {
      const user = req.user;
      const { id } = req.params;
      const tugServiceId = Number(id);

      const result = await prisma.$transaction(async (tx) => {
        // 1. Cek tug service
        const tugService = await tx.tugService.findUnique({
          where: { id: tugServiceId },
        });

        if (!tugService) {
          throw { code: 404, message: "Tug service not found" };
        }

        // 2. Pastikan sudah completed
        if (tugService.status !== "COMPLETED") {
          throw {
            code: 400,
            message: "Tug service must be COMPLETED before submitting.",
          };
        }

        // 3. Cek apakah ada tug yang belum selesai
        const tugOnWork = await tx.tugServiceDetail.findMany({
          where: {
            tugServiceId,
            status: { in: ["WAITING", "ON_MOB", "ON_WORK", "ON_DEMOB"] },
          },
        });

        if (tugOnWork.length > 0) {
          throw {
            code: 400,
            message: "Assist tug haven't finished the work.",
          };
        }

        // 4. Update status tug service
        const updatedTugService = await tx.tugService.update({
          where: { id: tugServiceId },
          data: {
            status: "SUBMITTED",
            submitTime: new Date(),
            submittedBy: Number(user.id),
          },
        });

        return updatedTugService;
      });

      // Success
      return res.status(200).json({
        status: true,
        message: "Tug service submitted successfully",
        data: result,
      });
    } catch (error) {
      console.error("Error submitting tug service:", error);

      if (error.code) {
        return res.status(error.code).json({
          status: false,
          message: error.message,
        });
      }

      return res.status(500).json({
        status: false,
        message: error.message || "Internal server error",
      });
    }
  },

  // ASSIST TUG DETAIL ACTION
  assistMob: async (req, res) => {
    try {
      function nowUtcPlus7() {
        const now = new Date();
        return new Date(now.getTime() + 7 * 60 * 60 * 1000);
      }

      const user = req.user;
      const id = Number(req.params.id); // tugServiceId

      const result = await prisma.$transaction(async (tx) => {
        // 1. Cari assistTug milik user
        const assistTug = await tx.assistTug.findUnique({
          where: { masterId: Number(user.id) },
        });

        if (!assistTug) {
          throw { code: 404, message: "AssistTug not found for this user" };
        }

        // 2. Cek apakah tug service detail-nya ada
        const assistServiceExist = await tx.tugServiceDetail.findUnique({
          where: {
            tugServiceId_assistTugId: {
              tugServiceId: id,
              assistTugId: assistTug.id,
            },
          },
        });

        if (!assistServiceExist) {
          throw { code: 404, message: "Tug Service not found" };
        }

        // 3. Validasi user
        if (assistTug.masterId !== Number(user.id)) {
          throw { code: 403, message: "Forbidden access user." };
        }

        // 4. Update status tug service → IN_PROCESS
        await tx.tugService.update({
          where: { id },
          data: { status: "IN_PROCESS" },
        });

        // 5. Update MOB time & status tug detail
        const updateServiceDetail = await tx.tugServiceDetail.update({
          where: {
            tugServiceId_assistTugId: {
              tugServiceId: id,
              assistTugId: assistTug.id,
            },
          },
          data: {
            mobTime: nowUtcPlus7(),
            status: "ON_MOB",
          },
          include: { tugService: true },
        });

        // 6. UPSERT CURRENT STATUS TUG (INI YANG PENTING)
        await tx.tugCurrentStatus.upsert({
          where: {
            assistTugId: assistTug.id, // harus UNIQUE
          },
          update: {
            status: "ON_MOB",
            pilotageServiceId: updateServiceDetail.tugService.pilotageServiceId,
            startTime: nowUtcPlus7(),
          },
          create: {
            assistTugId: assistTug.id,
            status: "ON_MOB",
            pilotageServiceId: updateServiceDetail.tugService.pilotageServiceId,
            startTime: nowUtcPlus7(),
          },
        });

        return updateServiceDetail;
      });

      // SUCCESS
      return res.status(200).json({
        status: true,
        message: "Assist tug mob success",
        data: result,
      });
    } catch (error) {
      console.error("Error assistMob:", error);

      if (error.code) {
        return res.status(error.code).json({
          status: false,
          message: error.message,
        });
      }

      return res.status(500).json({
        status: false,
        message: error.message || "Internal server error",
      });
    }
  },

  assistConnect: async (req, res) => {
    try {
      function nowUtcPlus7() {
        const now = new Date();
        return new Date(now.getTime() + 7 * 60 * 60 * 1000);
      }

      const user = req.user;
      const id = Number(req.params.id);

      const result = await prisma.$transaction(async (tx) => {
        const assistTug = await tx.assistTug.findUnique({
          where: { masterId: user.id },
        });

        if (!assistTug) {
          throw { code: 404, message: "AssistTug not found for this user" };
        }

        const assistServiceExist = await tx.tugServiceDetail.findUnique({
          where: {
            tugServiceId_assistTugId: {
              tugServiceId: id,
              assistTugId: assistTug.id,
            },
          },
        });

        if (!assistServiceExist) {
          throw { code: 404, message: "Tug Service not found" };
        }

        const updated = await tx.tugServiceDetail.update({
          where: {
            tugServiceId_assistTugId: {
              tugServiceId: id,
              assistTugId: assistTug.id,
            },
          },
          data: {
            connectTime: nowUtcPlus7(),
            status: "ON_WORK",
          },
          include: { tugService: true },
        });
        await tx.tugCurrentStatus.upsert({
          where: {
            assistTugId: assistTug.id,
          },
          update: {
            status: "WORKING",
            pilotageServiceId: updated.tugService.pilotageServiceId,
          },
          create: {
            assistTugId: assistTug.id,
            status: "WORKING",
            pilotageServiceId: updated.tugService.pilotageServiceId,
            startTime: updated.mobTime ?? nowUtcPlus7(),
          },
        });

        return updated;
      });

      return res.status(200).json({
        status: true,
        message: "Assist Tug connect success",
        data: result,
      });
    } catch (error) {
      console.error("Error connect assist:", error);

      return res.status(error.code || 500).json({
        status: false,
        message: error.message || "Internal server error",
      });
    }
  },

  assistDisconnect: async (req, res) => {
    try {
      function nowUtcPlus7() {
        const now = new Date();
        return new Date(now.getTime() + 7 * 60 * 60 * 1000);
      }

      const user = req.user;
      const id = Number(req.params.id);

      const result = await prisma.$transaction(async (tx) => {
        const assistTug = await tx.assistTug.findUnique({
          where: { masterId: user.id },
        });

        if (!assistTug) {
          throw { code: 404, message: "AssistTug not found for this user" };
        }

        const assistServiceExist = await tx.tugServiceDetail.findUnique({
          where: {
            tugServiceId_assistTugId: {
              tugServiceId: id,
              assistTugId: assistTug.id,
            },
          },
        });

        if (!assistServiceExist) {
          throw { code: 404, message: "Tug Service not found" };
        }

        const updated = await tx.tugServiceDetail.update({
          where: {
            tugServiceId_assistTugId: {
              tugServiceId: id,
              assistTugId: assistTug.id,
            },
          },
          data: {
            disconnectTime: nowUtcPlus7(),
            status: "ON_DEMOB",
          },
          include: { tugService: true },
        });
        await tx.tugCurrentStatus.upsert({
          where: {
            assistTugId: assistTug.id,
          },
          update: {
            status: "ON_DEMOB",
            pilotageServiceId: updated.tugService.pilotageServiceId,
            // startTime tetap (dipakai hitung jam kerja)
          },
          create: {
            assistTugId: assistTug.id,
            status: "ON_DEMOB",
            pilotageServiceId: updated.tugService.pilotageServiceId,
            startTime: updated.mobTime ?? nowUtcPlus7(),
          },
        });

        return updated;
      });

      return res.status(200).json({
        status: true,
        message: "Finish disconnect success",
        data: result,
      });
    } catch (error) {
      console.error("Error disconnect assist tug:", error);

      return res.status(error.code || 500).json({
        status: false,
        message: error.message || "Internal server error",
      });
    }
  },

  assistDemob: async (req, res) => {
    try {
      function nowUtcPlus7() {
        const now = new Date();
        return new Date(now.getTime() + 7 * 60 * 60 * 1000);
      }

      const user = req.user;
      const id = Number(req.params.id);
      const token = crypto.randomBytes(16).toString("hex");

      const result = await prisma.$transaction(async (tx) => {
        const assistTug = await tx.assistTug.findUnique({
          where: { masterId: Number(user.id) },
        });

        if (!assistTug) {
          throw { code: 404, message: "AssistTug not found for this user" };
        }

        const serviceExist = await tx.tugService.findUnique({
          where: { id },
          include: { pilotageService: { select: { id: true } } },
        });

        if (!serviceExist) {
          throw { code: 404, message: "Tug service not found" };
        }

        const assistServiceExist = await tx.tugServiceDetail.findUnique({
          where: {
            tugServiceId_assistTugId: {
              tugServiceId: id,
              assistTugId: assistTug.id,
            },
          },
        });

        if (!assistServiceExist) {
          throw { code: 404, message: "Tug Service not found" };
        }

        if (assistTug.masterId !== Number(user.id)) {
          throw { code: 403, message: "Forbidden access user." };
        }

        // 1. Update detail to COMPLETED
        const updatedDetail = await tx.tugServiceDetail.update({
          where: {
            tugServiceId_assistTugId: {
              tugServiceId: id,
              assistTugId: assistTug.id,
            },
          },
          data: {
            demobTime: nowUtcPlus7(),
            status: "COMPLETED",
          },
          include: { tugService: true },
        });

        const currentStatus = await tx.tugCurrentStatus.findUnique({
          where: { assistTugId: assistTug.id },
        });

        let workingHours = null;

        if (currentStatus?.startTime) {
          workingHours =
            (nowUtcPlus7().getTime() -
              new Date(currentStatus.startTime).getTime()) /
            (1000 * 60 * 60);
        }

        await tx.tugCurrentStatus.update({
          where: {
            assistTugId: assistTug.id,
          },
          data: {
            status: "STAND_BY",
            pilotageServiceId: null,
            startTime: null,
          },
        });
        // 2. Create sign document
        await tx.docSignature.create({
          data: {
            userId: user.id,
            pilotageServiceId: serviceExist.pilotageService.id,
            signedAt: new Date(),
            token,
            type: "TUG_MASTER",
          },
        });

        // 3. Check apakah semua tug sudah selesai
        const tugRemaining = await tx.tugServiceDetail.count({
          where: {
            tugServiceId: id,
            status: { in: ["WAITING", "ON_MOB", "ON_WORK", "ON_DEMOB"] },
          },
        });

        // 4. Bila semua tug selesai → update tug service
        if (tugRemaining === 0) {
          const finalService = await tx.tugService.update({
            where: { id },
            data: { status: "COMPLETED" },
            include: { tugDetails: true },
          });

          return { finalService, detail: updatedDetail, completed: true };
        }

        return { detail: updatedDetail, completed: false };
      });

      if (result.completed) {
        return res.status(200).json({
          status: true,
          message: "Success completing assist tug service.",
          data: result.finalService,
        });
      }

      return res.status(200).json({
        status: true,
        message: "Success completing assist tug detail.",
        data: result.detail,
      });
    } catch (error) {
      console.error("Error Assist demob:", error);

      return res.status(error.code || 500).json({
        status: false,
        message: error.message || "Internal server error",
      });
    }
  },
};
