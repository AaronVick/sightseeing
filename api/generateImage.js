import { ImageResponse } from '@vercel/og';

export const config = {
  runtime: 'edge',
};

export default async function handler(req) {
  const imageResponse = new ImageResponse(
    (
      <div
        style={{
          display: 'flex',
          textAlign: 'center',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100%',
          width: '100%',
          backgroundColor: '#87CEEB',
        }}
      >
        <h1>Explore Your Next Destination!</h1>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  );

  return imageResponse;
}
