const prisma = require("../config/db")

module.exports = {
    validateSignature: async (req, res) => {
  const { token } = req.params;

  const signature = await prisma.docSignature.findFirst ({
    where: { token },
    include: {
      user: true,
      service: {
        include: { shipDetails: true }
      }
    }
  });

  if (!signature) {
    return res.render("sign-invalid", {
      message: "Signature Not Found or Invalid"
    });
  }
  res.render("sign-valid", {
    shipName: signature.service.shipDetails[0].shipName,
    docNumber : signature.service.docNumber,
    userName: signature.user.name,
    userRole: signature.user.role,
    signedAt: signature.signedAt,
  });
}

}