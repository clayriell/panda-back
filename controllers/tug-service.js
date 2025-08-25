const prisma = require("../config/db");

module.exports = {
  getAll: async (req, res) => {
    try {
      const tugServices = await prisma.tugService.findMany({
        include: {
          pilotageService: {
            select: {
              activity: true,
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
};
