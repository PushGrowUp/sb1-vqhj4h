import React, { useState } from 'react';
import { createWorker } from 'tesseract.js';
import { Workbook } from 'exceljs';
import { useDropzone } from 'react-dropzone';
import { Button, Typography, Container, makeStyles, TextField, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper } from '@material-ui/core';

const useStyles = makeStyles((theme) => ({
  root: {
    marginTop: theme.spacing(4),
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  dropzone: {
    border: '2px dashed #ccc',
    borderRadius: '4px',
    padding: '20px',
    textAlign: 'center',
    cursor: 'pointer',
    marginBottom: theme.spacing(2),
  },
  table: {
    marginTop: theme.spacing(2),
    marginBottom: theme.spacing(2),
  },
}));

interface Product {
  name: string;
  category: string;
  price: string;
}

const App: React.FC = () => {
  const classes = useStyles();
  const [file, setFile] = useState<File | null>(null);
  const [extractedText, setExtractedText] = useState<string>('');
  const [products, setProducts] = useState<Product[]>([]);

  const onDrop = (acceptedFiles: File[]) => {
    setFile(acceptedFiles[0]);
  };

  const { getRootProps, getInputProps } = useDropzone({ onDrop });

  const processImage = async () => {
    if (!file) return;

    const worker = await createWorker('fra');
    const { data: { text } } = await worker.recognize(file);
    setExtractedText(text);
    await worker.terminate();

    const extractedProducts = extractProductsFromText(text);
    setProducts(extractedProducts);
  };

  const extractProductsFromText = (text: string): Product[] => {
    const lines = text.split('\n');
    const products: Product[] = [];
    let currentCategory = '';

    for (const line of lines) {
      if (line.trim() === '') continue;

      const priceMatch = line.match(/(\d+[.,]\d{2})€?$/);
      if (priceMatch) {
        const price = priceMatch[1];
        const name = line.slice(0, line.lastIndexOf(price)).trim();
        products.push({ name, category: currentCategory, price });
      } else {
        currentCategory = line.trim();
      }
    }

    return products;
  };

  const handleProductChange = (index: number, field: keyof Product, value: string) => {
    const updatedProducts = [...products];
    updatedProducts[index][field] = value;
    setProducts(updatedProducts);
  };

  const generateExcel = async () => {
    const workbook = new Workbook();
    const worksheet = workbook.addWorksheet('Products');

    worksheet.addRow(['Catégorie', 'Nom du produit', 'Prix HT']);
    products.forEach((product) => {
      worksheet.addRow([product.category, product.name, product.price]);
    });

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const link = document.createElement('a');
    link.href = window.URL.createObjectURL(blob);
    link.download = 'products.xlsx';
    link.click();
  };

  return (
    <Container className={classes.root}>
      <Typography variant="h4" gutterBottom>
        Menu Image to Excel Converter
      </Typography>
      <div {...getRootProps()} className={classes.dropzone}>
        <input {...getInputProps()} />
        <Typography>
          Drag and drop an image here, or click to select an image
        </Typography>
      </div>
      {file && (
        <Button variant="contained" color="primary" onClick={processImage}>
          Process Image
        </Button>
      )}
      {products.length > 0 && (
        <>
          <TableContainer component={Paper} className={classes.table}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Catégorie</TableCell>
                  <TableCell>Nom du produit</TableCell>
                  <TableCell>Prix HT</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {products.map((product, index) => (
                  <TableRow key={index}>
                    <TableCell>
                      <TextField
                        value={product.category}
                        onChange={(e) => handleProductChange(index, 'category', e.target.value)}
                      />
                    </TableCell>
                    <TableCell>
                      <TextField
                        value={product.name}
                        onChange={(e) => handleProductChange(index, 'name', e.target.value)}
                      />
                    </TableCell>
                    <TableCell>
                      <TextField
                        value={product.price}
                        onChange={(e) => handleProductChange(index, 'price', e.target.value)}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
          <Button variant="contained" color="secondary" onClick={generateExcel}>
            Generate Excel
          </Button>
        </>
      )}
    </Container>
  );
};

export default App;