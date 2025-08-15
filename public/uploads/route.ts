// Местоположение: src/app/api/upload/route.ts

import { writeFile } from 'fs/promises';
import { NextRequest, NextResponse } from 'next/server';
import path from 'path';

export async function POST(request: NextRequest) {
  // 1. Получаем данные из формы
  const data = await request.formData();
  const file: File | null = data.get('file') as unknown as File;

  if (!file) {
    return NextResponse.json({ success: false, error: 'No file found' });
  }

  // 2. Превращаем файл в байты, которые можно сохранить
  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  // 3. Создаем уникальное имя файла и путь для сохранения
  // (process.cwd() - это корневая папка нашего проекта)
  const filename = Date.now() + '-' + file.name.replaceAll(' ', '_');
  const pathname = path.join(process.cwd(), 'public/uploads', filename);

  try {
    // 4. Сохраняем файл на сервере
    await writeFile(pathname, buffer);
    console.log(`File saved to ${pathname}`);

    // 5. Возвращаем публичную ссылку на сохраненный файл
    return NextResponse.json({ success: true, url: `/uploads/${filename}` });
  } catch (error) {
    console.error('Error saving file:', error);
    return NextResponse.json({ success: false, error: 'Error saving file' });
  }
}
