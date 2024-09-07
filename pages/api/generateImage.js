import { ImageResponse } from '@vercel/og';

export const config = {
  runtime: 'edge',
};

export default async function handler(req) {
  const { searchParams } = new URL(req.url);
  const text = searchParams.get('text');

  if (!text) {
    return new Response(
      new ImageResponse(
        (
          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              height: '100%',
              width: '100%',
              backgroundColor: '#FF6347', // Use a red background for error
            }}
          >
            <h1>Please Enter a City</h1>
          </div>
        ),
        {
          width: 1200,
          height: 630,
        }
      )
    );
  }

  const imageResponse = new ImageResponse(
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

  return imageResponse;
}
