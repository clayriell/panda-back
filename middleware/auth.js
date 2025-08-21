const jwt = require("jsonwebtoken");

const JWT_SECRET = process.env.JWT_SECRET;

function authenticate(req, res, next) {
  const authHeader = req.headers["authorization"];
  if (!authHeader)
    return res
      .status(401)
      .json({ status: false, message: "No token provided" });

  const token = authHeader.split(" ")[1];
  if (!token)
    return res
      .status(401)
      .json({ status: false, message: "Invalid token format" });

  try {
    const decoded = jwt.verify(token, JWT_SECRET);

    if (decoded.isActive === false) {
      return res
        .status(403)
        .json({ status: false, message: "User is inactive" });
    }

    req.user = decoded;
    next();
  } catch (err) {
    return res
      .status(401)
      .json({ status: false, message: "Token invalid or expired" });
  }
}

module.exports = { authenticate };
