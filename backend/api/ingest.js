import express from "express"
import multer from "multer"
import fs from "fs"
import path from "path"
import { parse } from "csv-parse/sync"
import { embedTextChunks } from "../utils/embed_file.js"

const router = express.Router()
const upload = multer({ dest: "uploads/" })

router.post("/", upload.single("file"), async (req, res) => {
  try {
    const file = req.file
    if (!file) return res.status(400).json({ error: "No file uploaded" })

    const ext = path.extname(file.originalname).toLowerCase()
    const raw = fs.readFileSync(file.path, "utf8")
    let content = ""

    if (ext === ".pdf") {
      const dataBuffer = fs.readFileSync(file.path)
      const pdfData = await pdfParse(dataBuffer)
      content = pdfData.text
    } else if (ext === ".csv") {
      const csvData = parse(raw, { columns: false, skip_empty_lines: true })
      content = csvData.map(row => row.join(", ")).join("\n")
    } else if (ext === ".md" || ext === ".txt") {
      content = raw
    } else {
      return res.status(400).json({ error: "Unsupported file type" })
    }

    if (!content || content.trim().length < 10) {
      return res.status(400).json({ error: "Extracted content too short" })
    }

    await embedTextChunks(content, file.originalname)
    fs.unlinkSync(file.path)
    res.json({ message: "File ingested successfully" })
  } catch (err) {
    console.error("Ingestion error:", err)
    res.status(500).json({ error: "Server error during ingestion" })
  }
})

export default router
