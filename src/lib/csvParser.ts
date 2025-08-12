import { promises as fs } from 'fs';
import path from 'path';
import csv from 'csv-parser';
import { Readable } from 'stream';

export interface Product {
  id: string;
  name: string;
  price: number;
  oldPrice?: number;
  imageUrls: string[];
  isNew: boolean;
  discountPercentage: number;
  sku: string;
  color: string;
  composition: string;
  description: string;
  isBestseller: boolean;
  inventory: Record<string, number>;
}

export async function getProductsFromCsv(): Promise<Product[]> {
  const results: Product[] = [];
  const csvFilePath = path.join(process.cwd(), 'data', 'products.csv');
  const fileContent = await fs.readFile(csvFilePath, 'utf8');

  const readableStream = new Readable();
  readableStream._read = () => {};
  readableStream.push(fileContent);
  readableStream.push(null);

  await new Promise<void>((resolve, reject) => {
    readableStream
      .pipe(csv())
      .on('data', (data: any) => {
        const inventoryObject: Record<string, number> = {};
        if (data.inventory) {
          data.inventory.split(';').forEach((item: string) => {
            const [size, quantity] = item.split(':');
            if (size && quantity) {
              inventoryObject[size] = parseInt(quantity, 10);
            }
          });
        }

        const product: Product = {
          id: data.id,
          name: data.name,
          price: parseInt(data.price, 10),
          oldPrice: data.oldPrice ? parseInt(data.oldPrice, 10) : undefined,
          imageUrls: [data.imageUrl1, data.imageUrl2].filter(Boolean),
          isNew: data.isNew === 'true',
          discountPercentage: parseInt(data.discountPercentage || '0', 10),
          sku: data.sku || '',
          color: data.color || '',
          composition: data.composition || '',
          description: data.description || '',
          isBestseller: data.isBestseller === 'true',
          inventory: inventoryObject,
        };

        results.push(product);
      })
      .on('end', resolve)
      .on('error', reject);
  });

  return results;
}
