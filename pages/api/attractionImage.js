import { ImageResponse } from '@vercel/og';

export const config = {
  runtime: 'edge',
};

export default async function handler(req) {
  const { searchParams } = new URL(req.url);
  const text = searchParams.get('text') || 'No Attraction Data';

  return new ImageResponse(
    (
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100%',
          width: '100%',
          backgroundColor: '#87CEEB',
        }}
      >
        <h1>{text}</h1>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  );
}
