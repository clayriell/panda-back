const prisma = require("../config/db");

module.exports = {
  getAll: async (req, res) => {
    try {
      const companies = await prisma.company.findMany();

      return res.status(200).json({
        message: "Success get all company data",
        data: companies,
      });
    } catch (error) {
      console.log(error);
      return res.status(500).json({ message: "Server Error" });
    }
  },
  getList: async (req, res) => {
    try {
      const companies = await prisma.company.findMany();

      return res.status(200).json({
        message: "Success get all company data",
        data: companies,
      });
    } catch (error) {
      console.log(error);
      return res.status(500).json({ message: "Server Error" });
    }
  },

};
