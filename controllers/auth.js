const jwt = require("jsonwebtoken");
const prisma = require("../config/db");
const bcrypt = require("bcrypt");

const JWT_SECRET = process.env.JWT_SECRET;

module.exports = {
  login: async (req, res) => {
    try {
      const { identifier, password } = req.body;

      // cari user berdasarkan email ATAU username
      const user = await prisma.user.findFirst({
        where: {
          OR: [{ email: identifier }, { username: identifier }],
        },
      });

      if (!user) {
        return res.status(400).json({ message: "User tidak ditemukan" });
      }

      // cek password
      const validPassword = await bcrypt.compare(password, user.password);
      if (!validPassword) {
        return res.status(400).json({ message: "Password salah" });
      }

      // generate JWT
      const token = jwt.sign(
        {
          id: user.id,
          role: user.role,
          companyId: user.companyId,
          isActive: user.isActive,
          username: user.username,
        },
        JWT_SECRET,
        { expiresIn: "1d" }
      );

      res.json({
        message: "Login berhasil",
        token,
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
