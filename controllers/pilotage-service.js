const prisma = require("../config/db");
const crypto = require("crypto");
const QRCode = require("qrcode")
const {generateDocumentNumber } = require('../utils/documentNumberGenerator');
const company = require("./company");
const { type } = require("os");
module.exports = {

  // PILOTAGE SERVICE ACTION
  getAll: async (req, res, next) => {
    try {
      const pilotageService = await prisma.pilotageService.findMany({
        where : {status : {
        }},
        include: {
          pilot : {select : {name : true}},
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
  getRequestedServices:  async (req, res, next) => {
    try {
      const pilotageService = await prisma.pilotageService.findMany({
        where: { status: "REQUESTED" },
        include: {
          pilot : {select : {name : true}},
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
          pilot : {select : {name : true}},
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
              id:true,
              idJasa : true, 
              status : true,
              tugDetails: {
                select: {
                  assistTug: { select: { shipName: true } },
                  connectTime: true,
                  disconnectTime: true,
                  status : true , 
                  activity : true,
                },
              },
            },
          },
          company : {select : {name : true}}
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
                include: { assistTug: true }
              }
            }
          }
        }
      });

      // Jika tidak ada service
      if (!service) {
        return res.status(404).render("notfound", {
          message_en: "Service not found, please enter a valid pilotage service id",
          message_id: "Layanan tidak ditemukan, mohon masukkan 'ID Jasa Pandu' yang benar"
        });
      }

      // Format tanggal & waktu
      if (service.tugServices && service.tugServices.length > 0) {
    service.tugServices = service.tugServices.map(tugService => {
      tugService.tugDetails = tugService.tugDetails.map(tug => {
        
        // Format connect time
        tug.connectTimeFormatted = tug.connectTime
          ? new Date(tug.connectTime).toLocaleTimeString("id-ID", {
              hour: "2-digit",
              minute: "2-digit"
            })
          : "-";

        // Format disconnect time
        tug.disconnectTimeFormatted = tug.disconnectTime
          ? new Date(tug.disconnectTime).toLocaleTimeString("id-ID", {
              hour: "2-digit",
              minute: "2-digit"
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
            minute: "2-digit"
          })  || "-";

        service.endDateFormatted =
          service.endDate?.toLocaleDateString("id-ID") || "-";

        service.endTimeFormatted =
          service.endTime?.toLocaleTimeString("id-ID", {
            hour: "2-digit",
            minute: "2-digit"
          }) || "-";
      // ============================
      //   SIGNATURE CHECK + QR CODE
      // ============================
      let pilotQR,managerQR , tugMasterQR = null;
      const pilotSignature = service.signatures?.find(
  s => s.type === "PILOT"
);
      const managerSignature = service.signatures?.find(
  s => s.type === "MANAGER"
);
      const tugMasterSignature = service.signatures?.find(
  s => s.type === "TUG_MASTER"
);
const masterSignature = service.signatures?.find(
  s => s.type === "MASTER"
);

      if(managerSignature?.token){
        const msUrl = `http://192.168.0.119:3000/api/validate/signature/${managerSignature.token}`
        managerQR = await QRCode.toDataURL(msUrl)
      }
      if (pilotSignature?.token) {
        // URL validasi signature
        const psUrl = `http://192.168.0.119:3000/api/validate/signature/${pilotSignature.token}`;
        // generate QR
        pilotQR = await QRCode.toDataURL(psUrl);
      }
      if (tugMasterSignature?.token) {
        // URL validasi signature
        const psUrl = `http://192.168.0.119:3000/api/validate/signature/${tugMasterSignature.token}`;
        // generate QR
        tugMasterQR = await QRCode.toDataURL(psUrl);
      }
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
        tugMasterQR,
        masterSignature,
        logo,
        error: null

      });

    } catch (error) {
      console.error("Error loading form:", error);

      return res.status(500).render("error", {
        message_en: "Internal server error",
        message_id: "Terjadi kesalahan pada server",
        error: error.message
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

    const id = Number(idJasa);

    const [pilotageServiceExist, tugServiceExist] = await Promise.all([
      prisma.pilotageService.findFirst({ where: { idJasa: id } }),
      prisma.tugService.findFirst({ where: { idJasa: id } })
    ]);

    if (pilotageServiceExist || tugServiceExist) {
      return res.status(400).json({
        status: false,
        message: `Service with this ID already made in ${
          pilotageServiceExist ? "pilotage service" : "tug service"
        }`
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
                  status : "WAITING",
                  
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
  register: async (req ,res) =>{
    const {id} = req.params
    const user = req.user
     const token = crypto.randomBytes(16).toString("hex");
     
    try {
      
    
    const service = await prisma.pilotageService.findUnique({
      where : {id : Number(id)}
    })

    if(!service){
      return res.status(404).json({
        status : false, 
        message : "Service not found",
      })
    }
    if(service.docNumber !== null){
      return res.status(400).json({
        status : false,  message : "Document already registered"
      })
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
      let companyCode = ""

      switch (service.companyId){
        case 1: companyCode = "MDH";break;
        case 2: companyCode = "PEL-ID-BTM";break;
        case 3: companyCode = "BDP";break;
        case 4: companyCode = "GSS";break;
        case 5: companyCode = "SIS";break;
        case 6: companyCode = "SCP";break; 
      }
      const docNumber = await generateDocumentNumber(companyCode)
      const updatedService = await prisma.pilotageService.update({
        where: { id: Number(id) },
        data: {
        docNumber : docNumber,  
        },
      });
      const managerExist = await prisma.user.findFirst({
        where : 
        {
          companyId : Number(user.companyId) , 
          role : "MANAGER"
        }
      })

      if(!managerExist){
        return res.status(404).json({
          status : false , message : "manager account not found"
        })
      }
      const signManager  = await prisma.docSignature.create({
        data : {
          userId: managerExist.id,
          pilotageServiceId: Number(id),
          signedAt: new Date(),
          token: token,
          type : "MANAGER",
        }
      })
      return res.status(200).json({
        status : true , message: "Success register document", docNumber
      })
      } catch (error) { 
        console.error("Error registering service document:", error);
      return res.status(500).json({
        status: false,
        message: "Internal server error",
        error: error.message,})
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
      const { note, rate , signatureImage} = req.body;
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
          status: true,
          message: "Invalid Service Status",
        });
      }
      if(!signatureImage){
        return res.status(400).json({
          status :false, message : "Master signature cannot be empty"
        })
      }
      const updatedService = await prisma.pilotageService.update({
        where: { id: Number(id) },
        data: {
          pilotId: Number(user.id),
          status: "COMPLETED",
          endDate: new Date(),
          endTime: new Date(),
          note,
          rate,
        }, 
      });

      const pilotSignDocument = await  prisma.docSignature.create({
          data: {
          userId: user.id,
          pilotageServiceId: Number(id),
          signedAt: new Date(),
          token: token  ,
          type : "PILOT",
      }});
    const masterSignDocument = await prisma.docSignature.create({
      data : {
        pilotageServiceId : Number(id),
        signedAt: new Date(),
        type : "MASTER",
        signatureImage : signatureImage,

      }
    })
      return res.status(200).json({
        status: false,
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
