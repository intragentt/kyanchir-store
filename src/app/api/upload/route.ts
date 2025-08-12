// Местоположение: src/app/api/upload/route.ts
import { writeFile, mkdir } from 'fs/promises'; // <-- Добавляем mkdir
import { NextRequest, NextResponse } from 'next/server';
import path from 'path';

export async function POST(request: NextRequest) {
  const data = await request.formData();
  const file: File | null = data.get('file') as unknown as File;

  if (!file) {
    return NextResponse.json({ success: false, error: 'No file found' });
  }

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  const filename = `${Date.now()}-${file.name.replace(/\s/g, '_')}`;

  const uploadDir = path.join(process.cwd(), 'public/uploads');
  const filePath = path.join(uploadDir, filename);

  try {
    // VVV--- ИЗМЕНЕНИЕ: Проверяем, существует ли папка, и создаем ее, если нет ---VVV
    try {
      await mkdir(uploadDir, { recursive: true });
    } catch (mkdirError) {
      console.error('Error creating directory:', mkdirError);
      return NextResponse.json({
        success: false,
        error: 'Could not create upload directory',
      });
    }

    await writeFile(filePath, buffer);
    console.log(`File uploaded to ${filePath}`);

    const publicUrl = `/uploads/${filename}`;
    return NextResponse.json({ success: true, url: publicUrl });
  } catch (error) {
    console.error('Error saving file:', error);
    return NextResponse.json({ success: false, error: 'Error saving file' });
  }
}
