import { ImageResponse } from '@vercel/og';

export const config = {
  runtime: 'edge',
};

export default async function handler(req) {
  const { searchParams } = new URL(req.url);
  const text = searchParams.get('text') || 'Please Enter a City';  // Default to "Please Enter a City" if no text is provided

  const imageResponse = new ImageResponse(
    (
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100%',
          width: '100%',
          backgroundColor: '#FF6347',  // Red background for error
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
