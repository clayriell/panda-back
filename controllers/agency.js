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
};
