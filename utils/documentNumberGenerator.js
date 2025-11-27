const prisma = require('../config/db')

const romanMonths = [
  "", "I", "II", "III", "IV", "V", "VI",
  "VII", "VIII", "IX", "X", "XI", "XII"
];

async function generateDocumentNumber(companyCode) {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;

  return await prisma.$transaction(async (tx) => {
    let docCounter = await tx.documentCounter.findUnique({
      where: {
        companyCode_year_month: {
          companyCode,
          year,
          month
        }
      }
    });

    if (!docCounter) {
      docCounter = await tx.documentCounter.create({
        data: {
          companyCode,
          year,
          month,
          counter: 0
        }
      });
    }

    const updated = await tx.documentCounter.update({
      where: { id: docCounter.id },
      data: { counter: { increment: 1 } }
    });

    const number = updated.counter.toString().padStart(3, "0");
    const romanMonth = romanMonths[month];

    return `${number}/PLFY-${companyCode}/${romanMonth}/${year}`;
  });
}

module.exports = {
  generateDocumentNumber
};
