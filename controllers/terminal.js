const prisma = require("../config/db");

module.exports = {
  getAll: async (req, res) => {
    try {
      const terminals = await prisma.terminal.findMany();

      return res
        .status(200)
        .json({ message: "success get all terminal", data: terminals });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Server error" });
    }
  },
  getList: async (req, res) => {
    try {
      const terminals = await prisma.terminal.findMany({
        select: {
          id: true,
          code: true,
          name: true,
        },
      });

      return res.status(200).json({
        status: true,
        message: "Success get terminal list",
        data: terminals,
      });
    } catch (error) {
      
    }
  },
};
