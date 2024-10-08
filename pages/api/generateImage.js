import { ImageResponse } from '@vercel/og';

export const config = {
  runtime: 'edge',
};

export default async function handler(req) {
  const { searchParams } = new URL(req.url);
  const text = searchParams.get('text') || 'No cities found';

  const lines = text.split('\n');

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
          backgroundColor: '#1E40AF',
          color: 'white',
          fontSize: '32px',
          fontWeight: 'bold',
          textAlign: 'left',
          padding: '40px',
        }}
      >
        <h1 style={{ marginBottom: '20px', fontSize: '48px' }}>Matching Cities:</h1>
        {lines.map((line, index) => (
          <div key={index} style={{ marginBottom: '15px' }}>
            {line}
          </div>
        ))}
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  );

  return imageResponse;
}