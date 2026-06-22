const ExcelJS = require("exceljs");
const path = require("path");

async function generateReport(results, outputPath) {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "UrbanAssist Test Runner";
  workbook.lastModifiedBy = "UrbanAssist Test Runner";
  workbook.created = new Date();
  workbook.modified = new Date();

  const summarySheet = workbook.addWorksheet("Summary");
  const detailsSheet = workbook.addWorksheet("Test Details");
  const categorySheet = workbook.addWorksheet("Category Breakdown");

  // Show grid lines
  summarySheet.views = [{ showGridLines: true }];
  detailsSheet.views = [{ showGridLines: true }];
  categorySheet.views = [{ showGridLines: true }];

  const total = results.length;
  const passed = results.filter(r => r.status === "PASSED").length;
  const failed = total - passed;
  const passRate = total > 0 ? Math.round((passed / total) * 100) : 0;
  const totalDuration = results.reduce((acc, r) => acc + r.duration, 0);

  // Fonts
  const titleFont  = { name: "Segoe UI", size: 16, bold: true, color: { argb: "FFFFFFFF" } };
  const headerFont = { name: "Segoe UI", size: 11, bold: true, color: { argb: "FFFFFFFF" } };
  const normalFont = { name: "Segoe UI", size: 10 };
  const boldFont   = { name: "Segoe UI", size: 10, bold: true };
  const catFont    = { name: "Segoe UI", size: 10, bold: true, color: { argb: "FF1E293B" } };

  // Fills
  const primaryFill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF1E293B" } };
  const accentFill  = { type: "pattern", pattern: "solid", fgColor: { argb: "FF3B82F6" } };
  const passFill    = { type: "pattern", pattern: "solid", fgColor: { argb: "FFDCFCE7" } };
  const failFill    = { type: "pattern", pattern: "solid", fgColor: { argb: "FFFEE2E2" } };
  const cat1Fill    = { type: "pattern", pattern: "solid", fgColor: { argb: "FFE0F2FE" } };
  const cat2Fill    = { type: "pattern", pattern: "solid", fgColor: { argb: "FFEDE9FE" } };
  const cat3Fill    = { type: "pattern", pattern: "solid", fgColor: { argb: "FFFEF9C3" } };
  const cat4Fill    = { type: "pattern", pattern: "solid", fgColor: { argb: "FFFFE4E6" } };

  const passFontColor = { color: { argb: "FF15803D" } };
  const failFontColor = { color: { argb: "FFB91C1C" } };

  // ──────────── SUMMARY SHEET ────────────
  summarySheet.mergeCells("B2:F3");
  const titleCell = summarySheet.getCell("B2");
  titleCell.value = "URBANASSIST E2E MOBILE TEST EXECUTION SUMMARY";
  titleCell.font = titleFont;
  titleCell.fill = primaryFill;
  titleCell.alignment = { vertical: "middle", horizontal: "center" };

  summarySheet.getCell("B5").value = "Report Date:";
  summarySheet.getCell("B5").font = boldFont;
  summarySheet.getCell("C5").value = new Date().toLocaleString();
  summarySheet.getCell("C5").font = normalFont;

  summarySheet.getCell("B6").value = "Total Duration:";
  summarySheet.getCell("B6").font = boldFont;
  summarySheet.getCell("C6").value = `${(totalDuration / 1000).toFixed(2)} seconds`;
  summarySheet.getCell("C6").font = normalFont;

  summarySheet.getRow(8).values = ["", "Metric", "Value"];
  ["B8","C8"].forEach(ref => {
    summarySheet.getCell(ref).fill = accentFill;
    summarySheet.getCell(ref).font = headerFont;
  });

  const stats = [
    ["Total Test Cases", total],
    ["Passed Cases", passed],
    ["Failed Cases", failed],
    ["Success Rate", `${passRate}%`]
  ];

  stats.forEach((stat, idx) => {
    const rowNum = 9 + idx;
    const labelCell = summarySheet.getCell(`B${rowNum}`);
    labelCell.value = stat[0];
    labelCell.font = normalFont;
    labelCell.border = { bottom: { style: "thin", color: { argb: "FFE2E8F0" } } };

    const valCell = summarySheet.getCell(`C${rowNum}`);
    valCell.value = stat[1];
    valCell.font = boldFont;
    valCell.border = { bottom: { style: "thin", color: { argb: "FFE2E8F0" } } };

    if (stat[0] === "Success Rate") {
      valCell.fill = passRate === 100 ? passFill : (passRate > 50 ? { type: "pattern", pattern: "solid", fgColor: { argb: "FFFEF9C3" } } : failFill);
      valCell.font = { name: "Segoe UI", size: 10, bold: true, color: { argb: passRate === 100 ? "FF15803D" : "FF92400E" } };
    } else if (stat[0] === "Failed Cases" && failed > 0) {
      valCell.fill = failFill;
      valCell.font = { name: "Segoe UI", size: 10, bold: true, ...failFontColor };
    } else if (stat[0] === "Passed Cases" && passed > 0) {
      valCell.fill = passFill;
      valCell.font = { name: "Segoe UI", size: 10, bold: true, ...passFontColor };
    }
  });

  summarySheet.getColumn("B").width = 25;
  summarySheet.getColumn("C").width = 20;

  // ──────────── TEST DETAILS SHEET ────────────
  detailsSheet.columns = [
    { header: "ID",              key: "id",          width: 10 },
    { header: "Category",        key: "category",    width: 16 },
    { header: "Test Case Name",  key: "name",        width: 40 },
    { header: "Description",     key: "description", width: 60 },
    { header: "Status",          key: "status",      width: 12 },
    { header: "Duration (ms)",   key: "duration",    width: 15 },
    { header: "Error / Remarks", key: "error",       width: 30 },
  ];

  detailsSheet.getRow(1).eachCell(cell => {
    cell.fill = primaryFill;
    cell.font = headerFont;
    cell.alignment = { vertical: "middle", horizontal: "left" };
  });
  detailsSheet.getRow(1).height = 25;

  // Category fill map
  const catFillMap = {
    "Functional": cat1Fill,
    "UI/UX":      cat2Fill,
    "Validation": cat3Fill,
    "Unit Test":  cat4Fill,
  };

  results.forEach(tc => {
    const row = detailsSheet.addRow({
      id:          tc.id,
      category:    tc.category,
      name:        tc.name,
      description: tc.description,
      status:      tc.status,
      duration:    tc.duration,
      error:       tc.error || "N/A"
    });
    row.font = normalFont;
    row.height = 20;
    row.eachCell(cell => {
      cell.border = {
        bottom: { style: "thin", color: { argb: "FFE2E8F0" } },
        right:  { style: "thin", color: { argb: "FFE2E8F0" } }
      };
    });

    // Colour the category cell
    const catCell = row.getCell("category");
    catCell.fill = catFillMap[tc.category] || accentFill;
    catCell.font = catFont;

    // Colour the status cell
    const statusCell = row.getCell("status");
    if (tc.status === "PASSED") {
      statusCell.fill = passFill;
      statusCell.font = { name: "Segoe UI", size: 10, bold: true, ...passFontColor };
    } else {
      statusCell.fill = failFill;
      statusCell.font = { name: "Segoe UI", size: 10, bold: true, ...failFontColor };
    }
  });

  // ──────────── CATEGORY BREAKDOWN SHEET ────────────
  categorySheet.mergeCells("B2:E3");
  const catTitle = categorySheet.getCell("B2");
  catTitle.value = "URBANASSIST - MOBILE TEST CATEGORY BREAKDOWN";
  catTitle.font = titleFont;
  catTitle.fill = primaryFill;
  catTitle.alignment = { vertical: "middle", horizontal: "center" };

  categorySheet.getRow(5).values = ["", "Category", "Total", "Passed", "Failed", "Pass Rate"];
  ["B5","C5","D5","E5","F5","G5"].forEach(ref => {
    categorySheet.getCell(ref).fill = accentFill;
    categorySheet.getCell(ref).font = headerFont;
  });

  const categories = ["Functional", "UI/UX", "Validation", "Unit Test"];
  categories.forEach((cat, idx) => {
    const catTests = results.filter(t => t.category === cat);
    const catPassed = catTests.filter(t => t.status === "PASSED").length;
    const catFailed = catTests.length - catPassed;
    const catRate = catTests.length > 0 ? Math.round((catPassed / catTests.length) * 100) : 0;
    const rowNum = 6 + idx;

    categorySheet.getCell(`B${rowNum}`).value = "";
    const nameCell = categorySheet.getCell(`C${rowNum}`);
    nameCell.value = cat;
    nameCell.font = catFont;
    nameCell.fill = catFillMap[cat] || accentFill;

    categorySheet.getCell(`D${rowNum}`).value = catTests.length;
    categorySheet.getCell(`D${rowNum}`).font = normalFont;
    categorySheet.getCell(`E${rowNum}`).value = catPassed;
    categorySheet.getCell(`E${rowNum}`).font = { name: "Segoe UI", size: 10, bold: true, ...passFontColor };
    categorySheet.getCell(`E${rowNum}`).fill = passFill;
    categorySheet.getCell(`F${rowNum}`).value = catFailed;
    categorySheet.getCell(`F${rowNum}`).font = normalFont;
    categorySheet.getCell(`G${rowNum}`).value = `${catRate}%`;
    categorySheet.getCell(`G${rowNum}`).font = boldFont;
    categorySheet.getCell(`G${rowNum}`).fill = catRate === 100 ? passFill : failFill;

    [`C${rowNum}`,`D${rowNum}`,`E${rowNum}`,`F${rowNum}`,`G${rowNum}`].forEach(ref => {
      categorySheet.getCell(ref).border = { bottom: { style: "thin", color: { argb: "FFE2E8F0" } }, right: { style: "thin", color: { argb: "FFE2E8F0" } } };
    });
  });

  categorySheet.getColumn("C").width = 18;
  categorySheet.getColumn("D").width = 10;
  categorySheet.getColumn("E").width = 10;
  categorySheet.getColumn("F").width = 10;
  categorySheet.getColumn("G").width = 12;

  await workbook.xlsx.writeFile(outputPath);
  console.log(`Excel report successfully saved to: ${outputPath}`);
}

module.exports = { generateReport };
