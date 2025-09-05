const prisma = require("../config/db");
const pilotageService = require("./pilotage-service");
const { getService } = require("./pilotage-service");

module.exports = {
  getAll: async (req, res) => {
    try {
      const tugServices = await prisma.tugService.findMany({
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
      return res
        .status(500)
        .json({ status: false, message: "Internal server error" });
    }
  },
  getService: async (req, res) => {
    try {
      const user  = req.user
      const tugServices = await prisma.tugService.findMany({
        where : {
          companyId  : Number(user.companyId),
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
      return res
        .status(500)
        .json({ status: false, message: "Internal server error" });
    }
  },

  //Get tugServiceDetails by tug_tugmaster
  getServiceByTug: async (req, res) => {
  try {
    const user = req.user;

    const tugServices = await prisma.tugServiceDetail.findMany({
      where: {
        assistTug: {
          masterId: Number(user.id), // karena relasi one-to-one, cukup begini
        }
      },
      select: { activity  :true,
        tugService: {
          select: {
            id: true, idJasa : true, status: true,
            pilotageService: { 
              select : { 
                idJasa : true , 
                lastPort : true, 
                nextPort : true, 
                startDate : true, 
                startTime : true,
                shipDetails : {select : {
                  shipName : true,
                  grt : true , 
                  loa : true,
                }},
                terminalStart : {select : {name : true , code : true}}, 
                terminalEnd :{select : {name : true, code : true}},
                agency: {select : {name : true}},
              }
            },
          },
        },
        assistTug: true, // kalau mau sekalian ambil data assistTug
      }
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

  detail: async (req, res) => {
    try {
      const user = req.user;
      const { id } = req.params;

      const service = await prisma.tugService.findUnique({
        where: { id: Number(id) },
        include: {
          pilotageService: { 
            include : { 
              shipDetails : true  , 
              terminalStart: true,
              terminalEnd : true, 
              agency:  true,
            }

          },
          tugDetails: true,
        },
      });

      if (!service) {
        return res.status(404).json({
          status: false,
          message: "Tug service not found.",
        });
      }
      if (user.companyId !== service.pilotageService.companyId) {
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
  getService: async (req, res) => {
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
  
  assistMob: async (req, res) => {
    try {
    const jakartaTime = new Date().toLocaleString("sv-SE", { timeZone: "Asia/Jakarta" })
    const user = req.user
    const id = Number(req.params.id) // tugServiceId

    // cari assistTug milik user (role: TUG_MASTER)
    const assistTug = await prisma.assistTug.findUnique({
      where: { masterId: user.id },
    })

    if (!assistTug) {
      return res.status(404).json({
        status: false,
        message: "AssistTug not found for this user",
      })
    }

    // cek service detail
    const assistServiceExist = await prisma.tugServiceDetail.findUnique({
      where: {
        tugServiceId_assistTugId: {
          tugServiceId: id,
          assistTugId: assistTug.id, // ✅ sudah ada
        },
      },
    })

    if (!assistServiceExist) {
      return res.status(404).json({
        status: false,
        message: "Tug Service not found",
      })
    }

    // update status tug service
    await prisma.tugService.update({
      where: { id },
      data: { status: "IN_PROCESS" },
    })

    // update mob time tug service detail
    const updateServiceDetail = await prisma.tugServiceDetail.update({
      where: {
        tugServiceId_assistTugId: {
          tugServiceId: id,
          assistTugId: assistTug.id,
        },
      },
      data: { mobTime: new Date() },
      include: { tugService: true },
    })

    return res.status(200).json({
      status: true,
      message: "Assist tug mob success",
      data: updateServiceDetail,
    })
  } catch (error) {
    console.error("Error assistMob:", error)
    return res.status(500).json({
      status: false,
      message: "Internal server error",
    })
  }
}



};
