import ejs from "ejs";
import path from "path";
import { fileURLToPath } from "url";
import puppeteer from "puppeteer";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function generatePdfFromEjs(ejsFile, data) {
  try {
    // 1. Render EJS menjadi HTML
    const html = await ejs.renderFile(
      path.join(__dirname, "..", "views", ejsFile),
      data
    );

    // 2. Launch Puppeteer
    const browser = await puppeteer.launch({
      headless: "new", // aman untuk server
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });

    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "networkidle0" });

    // 3. Generate PDF A4
    const pdfBuffer = await page.pdf({
      format: "A4",
      printBackground: true, // agar background & warna tampil
      margin: { top: "10mm", bottom: "10mm" }
    });

    await browser.close();
    return pdfBuffer;

  } catch (err) {
    console.error("PDF generation error:", err);
    throw err;
  }
}
