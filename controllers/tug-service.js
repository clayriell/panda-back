const prisma = require("../config/db");
const pilotageService = require("./pilotage-service");

module.exports = {
  //assist tug service

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
        status: {notIn : ["COMPLETED"] },
        assistTug: {
          masterId: Number(user.id),
        },
        tugService : {status : {notIn : ["REQUESTED" , "COMPLETED", "REJECTED" , "CANCELED"]}},
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
  getDetail: async (req, res) => {
    try {
      const user = req.user;
      const { id } = req.params;

      const service = await prisma.tugService.findUnique({
        where: { id: Number(id) },
        include: {
          pilotageService: { 
            include : { 
              shipDetails : true, 
              terminalStart: true,
              terminalEnd : true, 
              agency:  true,
              company: true,
              pilot: {select : {name : true}}
            }

          },
          tugDetails: {select : {assistTug : true , mobTime : true, connectTime : true, disconnectTime: true , demobTime:true, activity: true, status:true}},
        },
      });

      if (!service) {
        return res.status(404).json({
          status: false,
          message: "Tug service not found.",
        });
      }
      if (user.companyId !== service.pilotageService.companyId  ) {
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
    const { idJasa, pilotageServiceId, tugDetails } = req.body

    // cek pilotage service
    const pilotageServiceExist = await prisma.pilotageService.findUnique({
      where: { id: Number(pilotageServiceId) },
      include: { shipDetails: true },
    })

    if (!pilotageServiceExist) {
      return res.status(400).json({
        status: false,
        message: "Pilotage service not found.",
      })
    }

    if (!tugDetails || tugDetails.length < 1) {
      return res.status(400).json({
        status: false,
        message: "Assist Tug required to create tug service.",
      })
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
    })

    return res.status(201).json({
      status: true,
      message: "Success create tug service",
      data: newTugService,
    })
  } catch (error) {
    return res.status(400).json({
      status: false,
      message: error.message || "Failed to create TugService",
    })
  }
},
  //APPROVE TUG SERVICE
   approve : async  (req , res ) => {
    const user = req.user 
    const {id} = req.params

    try {
      const serviceExist  = await prisma.tugService.findUnique({
        where : {id : Number(id)}       
      })

      if (!serviceExist){
        return res.statu(400).json({
          status : false, message :"Tug service not found"
        })
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

      const updateService = await prisma.tugService.update({
        where : {id : Number(id)},
        data: {
          status : "APPROVED",
          createdBy  :Number(user.id)
        },
         include : {
          pilotageService: true, 
           tugDetails : true
        }
      })

      return res.status(200).json({
        status : true , message : "Tug service approved successfully" , data : updateService
      })
    } catch (error) {
      console.error("Error approving service:", error);
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
    const user = req.user
    const { id } = req.params
    const tugServiceId = Number(id)

    const tugService = await prisma.tugService.findUnique({
      where: { id: tugServiceId },
    })

    if (!tugService) {
      return res.status(404).json({
        status: false,
        message: "Tug service not found",
      })
    }

    if (tugService.status !== "COMPLETED") {
      return res.status(400).json({
        status: false,
        message: "Tug service must be COMPLETED before submitting."
,
      })
    }

    const tugOnWork = await prisma.tugServiceDetail.findMany({
      where: {
        tugServiceId,
        status: { in: ["WAITING", "ON_MOB", "ON_WORK", "ON_DEMOB"] },
      },
    })

    if (tugOnWork.length > 0) {
      return res.status(400).json({
        status: false,
        message: "Assist tug haven't finished the work.",
      })
    }

    // update status tug service
    const updatedTugService = await prisma.tugService.update({
      where: { id: tugServiceId },
      data: {
        status: "SUBMITTED",
        submitTime: new Date(),
        submittedBy: Number(user.id),
      },
    })

    return res.status(200).json({
      status: true,
      message: "Tug service submitted successfully",
      data: updatedTugService,
    })
  } catch (error) {
    console.error("Error submitting tug service:", error)
    return res.status(500).json({
  status: false,
  message: error.message || "Internal server error",
})

  }
},
  

  // ASSIST TUG DETAIL ACTION
assistMob: async (req, res) => {
    try {
    // const jakartaTime = new Date().toLocaleString("sv-SE", { timeZone: "Asia/Jakarta" })
    const user = req.user
    const id = Number(req.params.id) // tugServiceId

    // cari assistTug milik user (role: TUG_MASTER)
    const assistTug = await prisma.assistTug.findUnique({
      where: { masterId: Number(user.id) },
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
          assistTugId: assistTug.id, 
        },
      },
    })

    if (!assistServiceExist) {
      return res.status(404).json({
        status: false,
        message: "Tug Service not found",
      })
    }
    if(assistTug.masterId !== Number(user.id)){
      return res.status(403).json({
        status :false, message : "Forbidden access user."
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
      data: { mobTime: new Date()  , status  : "ON_MOB"},
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
},
assistConnect: async (req, res) => {
    try {
    const user = req.user
    const id = Number(req.params.id) 

    const assistTug = await prisma.assistTug.findUnique({
      where: { masterId: user.id },
    })

    if (!assistTug) {
      return res.status(404).json({
        status: false,
        message: "AssistTug not found for this user",
      })
    }

    const assistServiceExist = await prisma.tugServiceDetail.findUnique({
      where: {
        tugServiceId_assistTugId: {
          tugServiceId: id,
          assistTugId: assistTug.id,
        },
      },
    })

    if (!assistServiceExist) {
      return res.status(404).json({
        status: false,
        message: "Tug Service not found",
      })
    }

    // update mob time tug service detail
    const updateServiceDetail = await prisma.tugServiceDetail.update({
      where: {
        tugServiceId_assistTugId: {
          tugServiceId: id,
          assistTugId: assistTug.id,
        },
      },
      data: { connectTime: new Date() , status : "ON_WORK"},
      include: { tugService: true },
    })

    return res.status(200).json({
      status: true,
      message: "Assist Tug connect success",
      data: updateServiceDetail,
    })
  } catch (error) {
    console.error("Error connect assist:", error)
    return res.status(500).json({
      status: false,
      message: "Internal server error",
    })
  }
},
assistDisconnect: async (req, res) => {
    try {
    const user = req.user
    const id = Number(req.params.id) 

    const assistTug = await prisma.assistTug.findUnique({
      where: { masterId: user.id },
    })

    if (!assistTug) {
      return res.status(404).json({
        status: false,
        message: "AssistTug not found for this user",
      })
    }

    const assistServiceExist = await prisma.tugServiceDetail.findUnique({
      where: {
        tugServiceId_assistTugId: {
          tugServiceId: id,
          assistTugId: assistTug.id,
        },
      },
    })

    if (!assistServiceExist) {
      return res.status(404).json({
        status: false,
        message: "Tug Service not found",
      })
    }
    const updateServiceDetail = await prisma.tugServiceDetail.update({
      where: {
        tugServiceId_assistTugId: {
          tugServiceId: id,
          assistTugId: assistTug.id,
        },
      },
      data: { disconnectTime: new Date(), status : "ON_DEMOB" },
      include: { tugService: true },
    })

    return res.status(200).json({
      status: true,
      message: "Finish disconnect success",
      data: updateServiceDetail,
    })
  } catch (error) {
    console.error("Error disconnect assist tug:", error)
    return res.status(500).json({
      status: false,
      message: "Internal server error",
    })
  }
},
assistDemob: async (req, res) => {
    try {
    const user = req.user
    const id = Number(req.params.id)

    const assistTug = await prisma.assistTug.findUnique({
      where: { masterId: Number(user.id) },
    })

    const serviceExist = await prisma.tugService.findUnique({
      where : { id : id}
    })

    if(!serviceExist){
      return res.status(404).json({
        status : false , message : "Tug service not found" 
      })
    }
    if (!assistTug) {
      return res.status(404).json({
        status: false,
        message: "AssistTug not found for this user",
      })
    }

    const assistServiceExist = await prisma.tugServiceDetail.findUnique({
      where: {
        tugServiceId_assistTugId: {
          tugServiceId: id,
          assistTugId: assistTug.id, 
        },
      },
    })

    if (!assistServiceExist) {
      return res.status(404).json({
        status: false,
        message: "Tug Service not found",
      })
    }
    if(assistTug.masterId !== Number(user.id)){
      return res.status(403).json({
        status :false, message : "Forbidden access user."
      })
    }

    const updateTugServiceDetail = await prisma.tugServiceDetail.update({
      where: {
        tugServiceId_assistTugId: {
          tugServiceId: id,
          assistTugId: assistTug.id, 
        },
      },
        data : {
          demobTime : new Date(),
          status : "COMPLETED"
        }, 
        include : {tugService : true}
    })
    
    const tugOnWork = await prisma.tugServiceDetail.findMany({
      where : {tugServiceId: id, status : {in : ["WAITING" , "ON_MOB" ,"ON_WORK", "ON_DEMOB"]}},
    })

    
    if (tugOnWork.length === 0) {
  const updateTugService  = await prisma.tugService.update({
    where : {id : id},
    data : { status : "COMPLETED" },
    include : {tugDetails : true}
  })
  return res.status(200).json({
    status : true , 
    message : "Success completing assist tug service." , 
    data : updateTugService
  })
}

return res.status(200).json({
  status : true , 
  message : "Success completing assist tug detail." , 
  data : updateTugServiceDetail
})
  } catch (error) {
    console.error("Error Assist demob:", error)
    return res.status(500).json({
      status: false,
      message: "Internal server error",
    })
  }
},
};
