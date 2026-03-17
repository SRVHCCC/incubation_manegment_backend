const ExcelJS = require("exceljs");
const { z } = require("zod");
const fs = require("fs");
const xlsx = require("xlsx");
const { StartupModel } = require("../../models/user_models/Startup");

const IndustrySchema = z.object({
  name: z.string().min(2).max(120),
  type: z.string().min(1).max(120),
  sector: z.string().min(2).max(120),
  founder: z.string().min(2).max(120),
  o_email: z.string().email().min(2).max(120),
  // .refine((val) => {
  //   if (!val) return true;
  //   const domain = (val.split("@")[1] || "").toLowerCase();
  //   return /\.(com|in|org|co|io|ai|tech|net|biz)$/.test(domain);
  // }),
  location: z.string().min(2).max(120),
  description: z.string().max(1500).optional().or(z.literal("")),
});

exports.DownloadExcelFile = async (req, res) => {
  try {
    const workBook = new ExcelJS.Workbook();
    const worksheet = workBook.addWorksheet("Industries");

    worksheet.columns = [
      { header: "Industry name", key: "name" },
      { header: "Industry type", key: "type" },
      { header: "Industry sector", key: "sector" },
      { header: "Founder", key: "founder" },
      { header: "Official Email", key: "o_email" },
      { header: "Location", key: "location" },
      { header: "Description", key: "description" },
    ];

    const buffer = await workBook.xlsx.writeBuffer();
    const base64 = buffer.toString("base64");

    return res.status(201).json({
      message: "Industry file excel",
      success: true,
      file_blob: base64,
      file_name: "Industry_template.xlsx",
    });
  } catch (error) {
    return res.status(500).json({
      message: "Internal sever error",
      success: false,
    });
  }
};

exports.ReadExcelFile = async (req, res) => {
  try {
    const { user_id } = req.body;
    const filepath = req.file?.path;

    if (!user_id) {
      return res.status(400).json({
        message: "User id is required",
        success: false,
      });
    }

    if (!filepath) {
      return res.status(400).json({
        message: "File is required",
        success: false,
      });
    }

    const workbook = xlsx.readFile(filepath);
    const sheetName = workbook.SheetNames[0];

    const sheetData = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName], {
      defval: "",
    });

    const requiredFields = [
      "Industry name",
      "Industry type",
      "Industry sector",
      "Founder",
      "Official Email",
      "Location",
    ];

    const validData = [];
    const excelData = [];
    const validationErrors = [];
    const duplicateErrors = [];

    const allEmail = sheetData
      .map((row) =>
        String(row["Official Email"] || "")
          .toLowerCase()
          .trim(),
      )
      .filter((email) => email);

    const existingStartup = await StartupModel.find({
      o_email: { $in: allEmail },
    }).select("o_email");

    const existingEmailSet = new Set(existingStartup.map((s) => s.o_email));

    sheetData.forEach((row, index) => {
      const rowNumber = index + 2;

      const missingFields = requiredFields.filter(
        (field) => !String(row[field] || "").trim(),
      );

      const email = String(row["Official Email"] || "")
        .toLowerCase()
        .trim();

      const parsed = IndustrySchema.safeParse({
        name: row["Industry name"],
        type: row["Industry type"],
        sector: row["Industry sector"],
        founder: row["Founder"],
        o_email: email,
        location: row["Location"],
        description: row["Description"],
      });

      if (!parsed.success) {
        console.log("Zod error:", parsed.error);

        if (Array.isArray(parsed.error?.errors)) {
          parsed.error.errors.forEach((e) => {
            if (e?.path?.[0]) {
              missingFields.push(e.path[0]);
            }
          });
        }
      }

      if (existingEmailSet.has(email)) {
        duplicateErrors.push(`Row ${rowNumber}: Official Email already exists`);
        return;
      }

      if (missingFields.length > 0) {
        validationErrors.push(`Row ${rowNumber}: ${missingFields.join(", ")}`);
      } else {
        const cleanData = {
          name: row["Industry name"],
          type: row["Industry type"],
          sector: row["Industry sector"],
          founder: row["Founder"],
          o_email: email,
          location: row["Location"],
          description: row["Description"] || "",
          user_id,
        };

        validData.push(cleanData);
        excelData.push(cleanData);
      }
    });

    if (validationErrors.length > 0) {
      return res.status(400).json({
        message: "Validation errors found in file",
        success: false,
        errors: validationErrors,
      });
    }

    if (duplicateErrors.length > 0) {
      if (req.file?.path && fs.existsSync(req.file.path)) {
        console.log("deleting file ", req.file.path);
        fs.unlinkSync(req.file.path);
      }
      return res.status(409).json({
        message: "Duplicate data found",
        success: false,
        errors: duplicateErrors,
      });
    }

    const chunkArray = (array, size) => {
      const result = [];
      for (let i = 0; i < array.length; i += size) {
        result.push(array.slice(i, i + size));
      }
      return result;
    };

    const batchSize = 100;
    const chunks = chunkArray(validData, batchSize);
    const savedIndustries = [];

    for (const chunk of chunks) {
      const result = await StartupModel.insertMany(chunk);
      savedIndustries.push(...result);
    }

    const workSheet = xlsx.utils.json_to_sheet(excelData);
    const workBook = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(workBook, workSheet, "industries");

    const buffer = xlsx.write(workBook, {
      bookType: "xlsx",
      type: "buffer",
    });

    const fileBase64 = buffer.toString("base64");

    if (fs.existsSync(filepath)) {
      fs.unlinkSync(filepath);
    }

    return res.status(201).json({
      message: "File uploaded successfully",
      success: true,
      data: savedIndustries,
      base64File: fileBase64,
    });
  } catch (error) {
    console.log("$$$ error", error);
    if (req.file?.path && fs.existsSync(req.file.path)) {
      console.log("deleting file ", req.file.path);
      fs.unlinkSync(req.file.path);
    }
    return res.status(500).json({
      message: "Internal server error",
      success: false,
      error: error.message,
    });
  }
};
