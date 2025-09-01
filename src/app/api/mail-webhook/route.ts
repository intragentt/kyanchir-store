// Местоположение: /src/app/api/mail-webhook/route.ts
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  console.log('--- RAW MAIL WEBHOOK RECEIVED ---');
  try {
    const formData = await req.formData();
    const data: { [key: string]: any } = {};
    for (const [key, value] of formData.entries()) {
      data[key] = value;
    }

    console.log('--- HEADERS ---');
    console.log(JSON.stringify(Object.fromEntries(req.headers), null, 2));

    console.log('--- FORM DATA ---');
    console.log(JSON.stringify(data, null, 2));

    return NextResponse.json({ status: 'ok', received: data });
  } catch (error: any) {
    console.error('CRITICAL ERROR in mail webhook:', error.message);

    // Попробуем прочитать тело как текст
    try {
      const textBody = await req.text();
      console.log('--- RAW TEXT BODY (on error) ---');
      console.log(textBody);
    } catch {}

    return NextResponse.json(
      { error: 'Failed to parse body' },
      { status: 500 },
    );
  }
}
