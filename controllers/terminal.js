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
      console.error(error);
      res.status(500).json({ message: "Server error" });
    }
  },
  detail: async (req, res) => {
    try {
      const { id } = req.params;
      const terminal = await prisma.terminal.findUnique({
        where: { id: Number(id) },
      });
      if (!terminal) {
        return res.status(404).json({
          status: false,
          message: "terminal not found",
        });
      }

      return res.status(200).json({
        status: true,
        message: "Success get terminal detail",
        data: terminal,
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Server error" });
    }
  },
  update: async (req, res) => {
    try {
      const { id } = req.params;
      const { code, name, area } = req.body;

      const terminalId = Number(id);

      const terminalExsist = await prisma.terminal.findUnique({
        where: { id: terminalId },
      });

      if (!terminalExsist) {
        return res.status(404).json({
          status: false,
          message: "Terminal not found.",
        });
      }

      const updatedTerminal = await prisma.terminal.update({
        where: { id: terminalId },
        data: {
          code,
          name,
          area,
        },
      });

      return res.status(200).json({
        status: true,
        message: "Success update terminal data",
        data: updatedTerminal,
      });
    } catch (error) {
      console.error("Error updating terminal:", error);
      return res
        .status(500)
        .json({ status: false, message: "Internal server error" });
    }
  },

  create: async (req, res) => {
    try {
      const { code, name, area } = req.body;

      const terminalExsist = await prisma.terminal.findUnique({
        where: { code: code },
      });

      if (terminalExsist) {
        return res.status(400).json({
          status: false,
          message: "Code already used",
        });
      }
      const createTerminal = await prisma.terminal.create({
        data: {
          code: code,
          name: name,
          area: area,
        },
      });

      return res.status(201).json({
        status: true,
        message: "Success create new terminal",
        data: createTerminal,
      });
    } catch (error) {
      return res
        .status(500)
        .json({ status: false, message: "Internal server error" });
    }
  },
};
