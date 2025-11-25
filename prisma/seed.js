const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcrypt");

const prisma = new PrismaClient();

async function main() {
  const hash = await bcrypt.hash("pandaren", 10);

  const devUser = await prisma.user.upsert({
    where: { email: "dev@pilotify.id" },
    update: {},
    create: {
      username : "dev",
      name: "Developer",
      email: "dev@pilotify.id",
      password: hash,
      role: "SYS_ADMIN",
      isActive  : true, 
    },
  });

  console.log("Seed selesai:", devUser);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
