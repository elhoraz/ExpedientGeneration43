import { revalidatePath } from 'next/cache';
import { NextResponse } from 'next/server';

export async function GET() {
  revalidatePath('/admin/cms');
  revalidatePath('/beranda');
  revalidatePath('/', 'layout');
  return NextResponse.json({ revalidated: true, now: Date.now() });
}
