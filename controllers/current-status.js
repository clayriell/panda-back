const prisma = require("../config/db");

module.exports = {
  getAll: async (req, res) => {
    try {
      const [pilots, tugs] = await Promise.all([
        prisma.pilotCurrentStatus.findMany({
          include: {
            user: {
              select: {
                id: true,
                name: true,
                company: { select: { name: true } },
              },
            },
            pilotageService: {
              select: {
                id: true,
                shipDetails: {
                  select: {
                    shipName: true,
                  },
                },
                terminalStart: { select: { name: true } },
                terminalEnd: { select: { name: true } },
                activity: true,
              },
            },
          },
        }),
        prisma.tugCurrentStatus.findMany({
          include: {
            assistTug: {
              select: {
                id: true,
                shipName: true,
                company: { select: { name: true } },
              },
            },
            pilotageService: {
              select: {
                id: true,
                shipDetails: {
                  select: {
                    shipName: true,
                  },
                },
                activity: true,
              },
            },
          },
        }),
      ]);

      return res.status(200).json({
        status: true,
        message: "Success get live monitoring data",
        data: {
          pilots,
          tugs,
        },
      });
    } catch (error) {
      console.error("Monitoring getAll error:", error);
      return res.status(500).json({
        status: false,
        message: "Failed to fetch monitoring data",
      });
    }
  },
};
