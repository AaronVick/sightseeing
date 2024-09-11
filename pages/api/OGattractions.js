import { ImageResponse } from '@vercel/og';

export const config = {
  runtime: 'edge',
};

export default async function handler(req) {
  const { searchParams } = new URL(req.url);
  
  // Decode the parameters received from the URL
  const name = decodeURIComponent(searchParams.get('name') || 'Unknown Attraction');
  const description = decodeURIComponent(searchParams.get('description') || 'No description available');
  const category = decodeURIComponent(searchParams.get('category') || 'No category');

  return new ImageResponse(
    (
      <div
        style={{
          display: 'flex',
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          height: '100%',
          width: '100%',
          backgroundColor: '#1E40AF',
          color: 'white',
          padding: '40px',
        }}
      >
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            width: '100%',
            height: '90%',
            justifyContent: 'center',
            paddingRight: '20px',
          }}
        >
          <h1 style={{ fontSize: '48px', marginBottom: '20px' }}>{name}</h1>
          <p style={{ fontSize: '24px', marginBottom: '10px' }}>Category: {category}</p>
          <p style={{ fontSize: '20px', lineHeight: '1.4' }}>{description}</p>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  );
}
