export const dynamic = 'force-static';

export async function GET() {
  return new Response('google-site-verification: googlec79c55f44fd979bb.html', {
    status: 200,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    },
  });
}
