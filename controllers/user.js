const prisma = require("../config/db");
const bcrypt = require("bcrypt");

module.exports = {
  register: async (req, res) => {
    try {
      const { username, name, email, password, companyId } = req.body;

      // cek email atau username sudah ada
      const existingUser = await prisma.user.findFirst({
        where: {
          OR: [{ email }, { username }],
        },
      });

      if (existingUser) {
        return res
          .status(400)
          .json({ message: "Username atau email sudah digunakan" });
      }

      // hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      // simpan user
      const user = await prisma.user.create({
        data: {
          username,
          name,
          email,
          password: hashedPassword,
          role: "ADMIN",
          picture: "",
          companyId,
          isActive: false,
        },
      });

      res.status(201).json({
        message: "Register berhasil",
        user: {
          id: user.id,
          username: user.username,
          name: user.name,
          email: user.email,
          role: user.role,
          companyId: user.companyId,
          isActive: user.isActive,
        },
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Server error" });
    }
  },

  getAll: async (req, res) => {
    try {
      const user = await prisma.user.findMany({ orderBy: { id: "desc" } });

      return res.status(200).json({
        message: "Success get all user data",
        data: user,
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Server error" });
    }
  },
  activate: async (req, res) => {
    try {
      const { id } = req.params;

      const user = await prisma.user.findUnique({ where: { id: Number(id) } });

      if (!user) {
        return res.status(404).json({
          message: "User tidak ditemukan",
        });
      }

      if (user.isActive) {
        return res.status(400).json({ message: "User sudah diaktivasi" });
      }

      const updatedUser = await prisma.user.update({
        where: { id: Number(id) },
        data: { isActive: true },
      });

      res.json({
        message: "User berhasil diaktifkan",
        user: {
          id: updatedUser.id,
          username: updatedUser.username,
          isActive: updatedUser.isActive,
        },
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Server error" });
    }
  },
  deactivate: async (req, res) => {
    try {
      const { id } = req.params;

      const user = await prisma.user.findUnique({ where: { id: Number(id) } });

      if (!user) {
        return res.status(404).json({
          message: "User tidak ditemukan",
        });
      }

      if (!user.isActive) {
        return res.status(400).json({ message: "User sudah tidak aktif" });
      }

      const updatedUser = await prisma.user.update({
        where: { id: Number(id) },
        data: { isActive: false },
      });

      res.json({
        message: "User berhasil dinonaktifkan",
        user: {
          id: updatedUser.id,
          username: updatedUser.username,
          isActive: updatedUser.isActive,
        },
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Server error" });
    }
  },
  profile: async (req, res) => {
    const user = req.user;
    try {
      const userExist = await prisma.user.findUnique({
        where: { username: user.username },
      });

      if (!userExist) {
        return res.status(401).json({
          status: false,
          message: "User not found",
        });
      }
      return res.status(200).json({
        status: true,
        message: "Success get user data",
        data: userExist,
      });
    } catch (error) {
      return res.status(500).json({ status: false, message: error });
    }
  },
};
