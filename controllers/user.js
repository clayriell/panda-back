const prisma = require("../config/db");
const bcrypt = require("bcrypt");

module.exports = {
  register: async (req, res) => {
    try {
      const {
        username,
        name,
        email,
        password,
        role,
        picture,
        companyId,
        isActive,
      } = req.body;

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
          role,
          picture: picture || "",
          companyId,
          isActive: isActive ?? false,
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
};
