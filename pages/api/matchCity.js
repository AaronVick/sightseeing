import matchCity from './matchCity';

export default async function handler(req, res) {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://sightseeing-seven.vercel.app';
  const { city } = req.body;

  if (!city) {
    console.log('City input is missing.');
    return res.setHeader('Content-Type', 'text/html').status(400).send(`
      <!DOCTYPE html>
      <html>
        <head>
          <meta property="fc:frame" content="vNext" />
          <meta property="fc:frame:image" content="${baseUrl}/api/generateImage?text=City Input Missing" />
          <meta property="fc:frame:button:1" content="Go Back" />
          <meta property="fc:frame:post_url:1" content="${baseUrl}/api/matchCity" />
        </head>
        <body>
          <h1>City input is required.</h1>
        </body>
      </html>
    `);
  }

  const matchedCities = await matchCity(city);

  if (!matchedCities || matchedCities.length === 0) {
    console.log('No matching cities found.');
    return res.setHeader('Content-Type', 'text/html').status(200).send(`
      <!DOCTYPE html>
      <html>
        <head>
          <meta property="fc:frame" content="vNext" />
          <meta property="fc:frame:image" content="${baseUrl}/api/generateImage?text=No Matching Cities" />
          <meta property="fc:frame:button:1" content="Go Back" />
          <meta property="fc:frame:post_url:1" content="${baseUrl}/api/matchCity" />
        </head>
        <body>
          <h1>No matching cities found. Please try again.</h1>
        </body>
      </html>
    `);
  }

  const cityButtons = matchedCities.map((cityName, index) => `
    <meta property="fc:frame:button:${index + 1}" content="City ${index + 1}: ${cityName}" />
    <meta property="fc:frame:post_url:${index + 1}" content="${baseUrl}/api/seeAttractions?city=${cityName}" />
  `).join('');

  return res.setHeader('Content-Type', 'text/html').status(200).send(`
    <!DOCTYPE html>
    <html>
      <head>
        <meta property="fc:frame" content="vNext" />
        <meta property="fc:frame:image" content="${baseUrl}/api/generateImage?text=cities" />
        ${cityButtons}
      </head>
      <body>
        <h1>Matching Cities for ${city}</h1>
      </body>
    </html>
  `);
}
