import axios from 'axios';

export default async function handler(req, res) {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://sightseeing-seven.vercel.app';

  // Handle only POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed. POST required.' });
  }

  // Extract city_text from the request body
  const { city_text } = req.body;

  if (!city_text || city_text.trim() === '') {
    console.log('City input is missing.');

    // Return an HTML response with Farcaster meta tags for missing city input
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
    // Make the request to the OpenTripMap API to find matching cities using the POSTed city_text
    const response = await axios.get(
      `https://api.opentripmap.com/0.1/en/places/geoname?name=${city_text}&apikey=${process.env.OPENTRIPMAP_API_KEY}`
    );

    const cities = response.data.features.map((feature) => feature.properties.name).slice(0, 4);

    const cityButtons = cities.map((cityName, index) => `
      <meta property="fc:frame:button:${index + 1}" content="City ${index + 1}: ${cityName}" />
      <meta property="fc:frame:post_url:${index + 1}" content="${baseUrl}/api/seeAttractions?city=${cityName}" />
    `).join('');

    // Return HTML response with city matching results and buttons
    return res.setHeader('Content-Type', 'text/html').status(200).send(`
      <!DOCTYPE html>
      <html>
        <head>
          <meta property="fc:frame" content="vNext" />
          <meta property="fc:frame:image" content="${baseUrl}/api/generateImage?text=cities" />
          ${cityButtons}
        </head>
        <body>
          <h1>Matching Cities for ${city_text}</h1>
        </body>
      </html>
    `);
  } catch (error) {
    console.error('Error fetching cities:', error.response ? error.response.data : error.message);

    // Return an HTML response with an error message
    return res.setHeader('Content-Type', 'text/html').status(500).send(`
      <!DOCTYPE html>
      <html>
        <head>
          <meta property="fc:frame" content="vNext" />
          <meta property="fc:frame:image" content="${baseUrl}/api/generateImage?text=Error Fetching Cities" />
          <meta property="fc:frame:button:1" content="Retry" />
          <meta property="fc:frame:post_url:1" content="${baseUrl}/api/matchCity" />
        </head>
        <body>
          <h1>Error: Failed to match cities. Please try again.</h1>
        </body>
      </html>
    `);
  }
}
