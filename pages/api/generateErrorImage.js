import { ImageResponse } from '@vercel/og';

export const config = {
  runtime: 'edge',
};

export default async function handler(req) {
  const { searchParams } = new URL(req.url);
  const text = searchParams.get('text') || 'An error occurred';

  const imageResponse = new ImageResponse(
    (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100%',
          width: '100%',
          backgroundColor: '#DC2626',
          color: 'white',
          fontSize: '32px',
          fontWeight: 'bold',
          textAlign: 'center',
          padding: '20px',
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

  return imageResponse;
}