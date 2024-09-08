import { ImageResponse } from '@vercel/og';

export const config = {
  runtime: 'edge',
};

export default async function handler(req) {
  const { searchParams } = new URL(req.url);
  const name = searchParams.get('name') || 'Unknown Attraction';
  const description = searchParams.get('description') || 'No description available';
  const category = searchParams.get('category') || 'No category';
  const imageUrl = searchParams.get('image') || null;

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
          backgroundColor: '#1E3A8A',
          color: 'white',
          padding: '40px',
        }}
      >
        {imageUrl && (
          <img
            src={imageUrl}
            alt={name}
            style={{
              width: '45%',
              height: '90%',
              objectFit: 'cover',
              borderRadius: '10px',
            }}
          />
        )}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            width: imageUrl ? '50%' : '100%',
            height: '90%',
            justifyContent: 'center',
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