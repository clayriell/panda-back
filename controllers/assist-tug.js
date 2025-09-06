const prisma = require("../config/db");
const { getByCompany } = require("./tug-service");

module.exports = {
  getAll: async (req, res) => {
    try {
      const tugs = await prisma.assistTug.findMany({
        include: { tugDetails: true },
      });

      return res.status(200).json({
        message: "Success get all assist tug",
        data: tugs,
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Server error" });
    }
  },
  getAssistTug: async (req, res) => {
    try {
      const user = req.user;
      const tugs = await prisma.assistTug.findMany({
        where: { companyId: Number(user.companyId) },
        include: { tugDetails: true },
      });

      return res.status(200).json({
        message: "Success get all company assist tug",
        data: tugs,
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Server error" });
    }
  },

  getList: async (req, res) => {
    try {
      const assistTugs = await prisma.assistTug.findMany({
        select: {
          id: true,
          shipName: true,
          horsePower: true,
          company: {
            select: { name: true },
          },
        },
      });

      return res.status(200).json({
        status: true,
        message: "Success get assist tug list",
        data: assistTugs,
      });
    } catch (error) {
      return res
        .status(501)
        .json({ status: false, message: "Internal server error" });
    }
  },
  getByTugMaster : async (req , res)=>{
    try {
      const user = req.user

      const assistTug = await prisma.assistTug.findFirst({
        where: { masterId: user.id },
      })
      
      if(!assistTug){
        return res.status(404).json({
          status : false , message  : "assist tug not found"
        })
      }
      return res.status(200).json({
        status : true , message : "success get assist tug detail" , data : assistTug
      })
    } catch (error) {
      return res
        .status(501)
        .json({ status: false, message: "Internal server error" });
    }
    },
    getDetail : async (req , res)=>{
    try {
      const user = req.params
      const id = req.params

      const assistTug = await prisma.assistTug.findUnique({
        where: {id : Number(id)},
      })
      if(!assistTug){
        return res.status(404).json({
          status : false , message  : "assist tug not found"
        })
      }
      if(assistTug.companyId !== user.companyId){
        return res.status(403).json({
          status : false , message : "Forbidden access, please check your company"
        })
      }
      return res.status(200).json({
        status : true , message : "success get assist tug detail" , data : assistTug
      })
    } catch (error) {
      return res
        .status(501)
        .json({ status: false, message: "Internal server error" });
    }
    }
  }

