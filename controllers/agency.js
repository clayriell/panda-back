const prisma = require("../config/db");

module.exports = {
  getAll: async (req, res) => {
    try {
      const agencies = await prisma.agency.findMany();

      return res.status(200).json({
        message: "Success get all agencies",
        data: agencies,
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Server error" });
    }
  },
  getList: async (req, res) => {
    try {
      const agencies = await prisma.agency.findMany({
        select: {
          id: true,
          name: true,
        },
      });
      return res.status(200).json({
        status: true,
        message: "Success get agency list",
        data: agencies,
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Server error" });
    }
  },
  detail: async (req, res) => {
    try {
      const { id } = req.params;
      const agencyId = Number(id);

      const agency = await prisma.agency.findUnique({
        where: { id: agencyId },
      });

      if (!agency) {
        return res
          .status(404)
          .json({ status: false, message: "Agency not found" });
      }

      return res.status(200).json({
        status: true,
        message: "Success get agency detail",
        data: agency,
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Server error" });
    }
  },

  create: async (req, res) => {
    try {
      const { name, address, email, picName, picNumber } = req.body;

      const agencyExist = await prisma.agency.findFirst({
        where: {
          OR: [{ name }, { email }],
        },
      });

      if (agencyExist) {
        return res.status(400).json({
          status: false,
          message: "Name already taken or email already registered",
        });
      }
      const createAgency = await prisma.agency.create({
        data: {
          name,
          address,
          picName,
          picNumber,
          email,
        },
      });
      return res.status(201).json({
        status: true,
        message: "Success created new agency",
        data: createAgency,
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Server error" });
    }
  },
  update: async (req, res) => {
    try {
      const { id } = req.params;
      const { name, address, picName, picNumber, email } = req.body;
      const agencyId = Number(id);
      const agency = await prisma.agency.findUnique({
        where: {
          id: agencyId,
        },
      });

      if (!agency) {
        return res
          .status(404)
          .json({ status: false, message: "Agency not found" });
      }
      const agencyExist = await prisma.agency.findFirst({
        where: {
          OR: [{ name }, { email }],
        },
      });

      if (agencyExist) {
        return res.status(400).json({
          status: false,
          message: "Name already taken or email already registered",
        });
      }
      const updatedAgency = await prisma.agency.update({
        where: { id: agencyId },
        data: {
          name,
          address,
          picName,
          picNumber,
          email,
        },
      });
      return res.status(200).json({
        status: true,
        message: "Success update agency",
        data: updatedAgency,
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Server error" });
    }
  },
};
