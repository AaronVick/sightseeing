import axios from 'axios';

export default async function handler(req, res) {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://sightseeing-seven.vercel.app';

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed. POST required.' });
  }

  const { city_text } = req.body;

  if (!city_text || city_text.trim() === '') {
    console.log('City input is missing.');
    return res.setHeader('Content-Type', 'text/html').status(400).send(`
      <!DOCTYPE html>
      <html>
        <head>
          <meta property="fc:frame" content="vNext" />
          <meta property="fc:frame:image" content="${baseUrl}/api/generateImage?text=Please Enter a City" />
          <meta property="fc:frame:button:1" content="Go Back" />
          <meta property="fc:frame:post_url:1" content="${baseUrl}/api/matchCity" />
        </head>
        <body>
          <h1>Please Enter a City</h1>
        </body>
      </html>
    `);
  }

  try {
    const response = await axios.get(
      `https://api.opentripmap.com/0.1/en/places/geoname?name=${city_text}&apikey=${process.env.OPENTRIPMAP_API_KEY}`
    );

    const city = {
      name: `${response.data.name}, ${response.data.country}`,
      lat: response.data.lat,
      lon: response.data.lon,
    };

    const htmlResponse = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta property="fc:frame" content="vNext" />
          <meta property="fc:frame:image" content="${baseUrl}/api/generateImage?text=1%3A%20${encodeURIComponent(city.name)}" />
          <meta property="fc:frame:button:1" content="1" />
          <meta property="fc:frame:post_url:1" content="${baseUrl}/api/seeAttractions" />
          <meta property="fc:frame:post_url_target" content="post" />
        </head>
        <body>
          <h1>Matching Cities for "${city_text}"</h1>
        </body>
      </html>
    `;

    return res.setHeader('Content-Type', 'text/html').status(200).send(htmlResponse);
  } catch (error) {
    console.error('Error fetching city:', error.message);
    return res.setHeader('Content-Type', 'text/html').status(500).send(`
      <!DOCTYPE html>
      <html>
        <head>
          <meta property="fc:frame" content="vNext" />
          <meta property="fc:frame:image" content="${baseUrl}/api/generateImage?text=Error%20Fetching%20City" />
          <meta property="fc:frame:button:1" content="Retry" />
          <meta property="fc:frame:post_url:1" content="${baseUrl}/api/matchCity" />
        </head>
        <body>
          <h1>Error: Failed to fetch city. Please try again.</h1>
        </body>
      </html>
    `);
  }
}
