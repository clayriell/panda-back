const prisma = require("../config/db");

module.exports = {
  getAll: async (req, res) => {
    try {
      const tugs = await prisma.assistTug.findMany();

      return res.status(200).json({
        message: "Success get all assist tug",
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
};
