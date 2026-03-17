const ExcelJS = require("exceljs");
const { z } = require("zod");
const fs = require("fs");
const xlsx = require("xlsx");
const { WorkForce } = require("../../models/user_models/HRModel");

const UserSchema = z.object({
  name: z.string(),
  education: z.string(),
  collage: z.string(),
  interested: z.string(),
  email: z.string().email(),
  location: z.string(),
  description: z.string().max(1500).optional().or(z.literal("")),
  experience: z.string().max(1500).optional().or(z.literal("")),
});

exports.DownloadUserExcelFile = async (req, res) => {
  try {
    const workBook = new ExcelJS.Workbook();
    const worksheet = workBook.addWorksheet("Industries");

    worksheet.columns = [
      { header: "Name", key: "name" },
      { header: "Education", key: "education" },
      { header: "Interested sector", key: "interested_sector" },
      { header: "Email", key: "email" },
      { header: "Collage", key: "collage" },
      { header: "Location", key: "location" },
      { header: "Description", key: "description" },
      { header: "Experience (optional)", key: "experience" },
    ];

    const buffer = await workBook.xlsx.writeBuffer();
    const base64 = buffer.toString("base64");

    res.status(200).json({
      message: "Industry file excel",
      success: true,
      file_blob: base64,
      file_name: "User_template.xlsx",
    });
  } catch (error) {
    return res.status(500).json({
      message: "Internal server error",
      success: false,
    });
  }
};

exports.ReadUserExcelFile = async (req, res) => {
  try {
    console.log("$$$ req.body", req.body);
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
      "Name",
      "Education",
      "Interested sector",
      "Email",
      "Collage",
    ];

    const validData = [];
    const excelData = [];
    const validationErrors = [];
    const duplicateErrors = [];

    const allEmails = sheetData
      .map((row) =>
        String(row["Email"] || "")
          .toLowerCase()
          .trim(),
      )
      .filter((email) => email);

    const existingRecords = await WorkForce.find({
      email: { $in: allEmails },
    }).select("email");

    const existingEmailSet = new Set(
      existingRecords.map((r) => r.email.toLowerCase()),
    );

    sheetData.forEach((row, index) => {
      const rowNumber = index + 2;

      const missingFields = requiredFields.filter(
        (field) => !String(row[field] || "").trim(),
      );

      const email = String(row["Email"] || "")
        .toLowerCase()
        .trim();

      const parsed = UserSchema.safeParse({
        name: row["Name"],
        education: row["Education"],
        collage: row["Collage"],
        interested: row["Interested sector"],
        experience: row["Experience"],
        email: email,
        location: row["Location"] || "",
        description: row["Description"] || "",
      });

      // console.log("$$$ parsed", parsed);

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

      if (email && existingEmailSet.has(email)) {
        duplicateErrors.push(`Row ${rowNumber}: Email already exists`);
        return;
      }

      if (missingFields.length > 0) {
        validationErrors.push(
          `Row ${rowNumber}: Missing or invalid - ${missingFields.join(", ")}`,
        );
      } else if (parsed.success) {
        const cleanData = {
          name: parsed.data.name.trim(),
          education: parsed.data.education.trim(),
          collage: parsed.data.collage.trim(),
          interested: parsed.data.interested.trim(),
          email: parsed.data.email,
          location: parsed.data.location.trim(),
          description: parsed.data.description.trim(),
          experience: parsed.data.experience.trim(),
          user_id,
        };

        validData.push(cleanData);
        excelData.push(cleanData);
      }
    });

    if (validationErrors.length > 0) {
      if (fs.existsSync(filepath)) fs.unlinkSync(filepath);
      return res.status(400).json({
        message: "Validation errors found in file",
        success: false,
        errors: validationErrors,
      });
    }

    if (duplicateErrors.length > 0) {
      if (fs.existsSync(filepath)) fs.unlinkSync(filepath);
      return res.status(409).json({
        message: "Duplicate entries found",
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

    const batchSize = 500;
    const chunks = chunkArray(validData, batchSize);
    const savedRecords = [];

    for (const chunk of chunks) {
      const result = await WorkForce.insertMany(chunk);
      savedRecords.push(...result);
    }

    const workSheet = xlsx.utils.json_to_sheet(excelData);
    const workBook = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(workBook, workSheet, "industries");

    const buffer = xlsx.write(workBook, { bookType: "xlsx", type: "buffer" });
    const fileBase64 = buffer.toString("base64");

    if (fs.existsSync(filepath)) fs.unlinkSync(filepath);

    return res.status(201).json({
      message: "File uploaded and processed successfully",
      success: true,
      data: savedRecords,
      base64File: fileBase64,
    });
  } catch (error) {
    console.log("error", error);
    if (req.file?.path && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    return res.status(500).json({
      message: "Internal server error",
      success: false,
      error: error.message,
    });
  }
};
