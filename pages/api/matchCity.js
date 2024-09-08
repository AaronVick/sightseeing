import axios from 'axios';

export default async function handler(req, res) {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://sightseeing-seven.vercel.app';

  console.log('Received request method:', req.method);
  console.log('Request query:', req.query);
  console.log('Request body:', req.body);

  let city_text = '';
  if (req.method === 'GET') {
    city_text = req.query.city_text || '';
  } else if (req.method === 'POST') {
    city_text = req.body.city_text || req.body.untrustedData?.inputText || '';
  } else {
    return res.status(405).json({ error: 'Method Not Allowed. GET or POST required.' });
  }

  console.log('Received city_text:', city_text);

  if (!city_text || city_text.trim() === '') {
    console.log('City input is missing.');
    return sendErrorResponse(res, baseUrl, 'Please Enter a City');
  }

  try {
    console.log('City text to search:', city_text);

    // Get the main city
    const geonameResponse = await axios.get(
      `https://api.opentripmap.com/0.1/en/places/geoname?name=${encodeURIComponent(city_text)}&apikey=${process.env.OPENTRIPMAP_API_KEY}`
    );

    console.log('OpenTripMap Geoname API response:', JSON.stringify(geonameResponse.data, null, 2));

    if (!geonameResponse.data || !geonameResponse.data.name) {
      console.log('No city found in the Geoname API response');
      return sendErrorResponse(res, baseUrl, 'City Not Found');
    }

    const mainCity = geonameResponse.data.name;
    const country = geonameResponse.data.country;

    // Create a list with just the main city
    let cities = [`${mainCity}, ${country}`];

    // If the result is a partial match, add the original search term as well
    if (geonameResponse.data.partial_match) {
      cities.unshift(city_text);
    }

    console.log('Final Cities List:', cities);

    const cityList = cities.map((city, index) => `${index + 1}: ${city}`).join('\n');
    const cityButtons = cities.map((city, index) => `
      <meta property="fc:frame:button:${index + 1}" content="${index + 1}" />
      <meta property="fc:frame:post_url:${index + 1}" content="${baseUrl}/api/seeAttractions" />
      <meta property="fc:frame:post_url_target:${index + 1}" content="post" />
    `).join('');

    return res.setHeader('Content-Type', 'text/html').status(200).send(`
      <!DOCTYPE html>
      <html>
        <head>
          <meta property="fc:frame" content="vNext" />
          <meta property="fc:frame:image" content="${baseUrl}/api/generateImage?text=${encodeURIComponent(cityList)}" />
          ${cityButtons}
        </head>
        <body>
          <h1>Matching Cities for "${city_text}"</h1>
        </body>
      </html>
    `);

  } catch (error) {
    console.error('Error fetching cities:', error);
    if (error.response) {
      console.error('Error response:', error.response.status, error.response.statusText);
      console.error('Error data:', JSON.stringify(error.response.data, null, 2));
    }
    return sendErrorResponse(res, baseUrl, 'Error Fetching Cities');
  }
}

function sendErrorResponse(res, baseUrl, errorMessage) {
  return res.setHeader('Content-Type', 'text/html').status(200).send(`
    <!DOCTYPE html>
    <html>
      <head>
        <meta property="fc:frame" content="vNext" />
        <meta property="fc:frame:image" content="${baseUrl}/api/generateErrorImage?text=${encodeURIComponent(errorMessage)}" />
        <meta property="fc:frame:button:1" content="Retry" />
        <meta property="fc:frame:post_url" content="${baseUrl}/api/matchCity" />
        <meta property="fc:frame:input:text" content="Enter a city" />
      </head>
      <body>
        <h1>${errorMessage}</h1>
      </body>
    </html>
  `);
}