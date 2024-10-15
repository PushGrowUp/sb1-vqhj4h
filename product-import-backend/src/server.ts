import express from 'express';
import cors from 'cors';
import multer from 'multer';
import { createWorker } from 'tesseract.js';
import * as ExcelJS from 'exceljs';

const app = express();
const port = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

const upload = multer({ dest: 'uploads/' });

app.post('/api/upload', upload.single('file'), async (req, res) => {
  if (!req.file) {
    return res.status(400).send('No file uploaded.');
  }

  try {
    const worker = await createWorker('eng');
    const { data: { text } } = await worker.recognize(req.file.path);
    await worker.terminate();

    // TODO: Process the extracted text and convert it to a structured format

    res.json({ message: 'File processed successfully', text });
  } catch (error) {
    console.error(error);
    res.status(500).send('Error processing file');
  }
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});