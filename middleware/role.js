function mustRole(...roles) {
  return (req, res, next) => {
    if (!req.user)
      return res.status(401).json({ status: false, message: "Unauthorized" });

    // cek persis sesuai role di token/database
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ status: false, message: "Access denied" });
    }

    next();
  };
}

module.exports = { mustRole };
