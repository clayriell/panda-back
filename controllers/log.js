const prisma = require("../config/db");

module.exports = {
  getAll: async (req, res) => {
    const logs = await prisma.serviceLog.findMany();

    return res.status(200).json({
      status: true,
      message: "success get all logs",
      data: logs,
    });
  },
  getServiceLog: async (req, res) => {
    const { id } = req.params;
    const logs = await prisma.serviceLog.findMany({
      where: { serviceId: Number(id) },
    });
  },
};
