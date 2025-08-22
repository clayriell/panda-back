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
};
