import axios from 'axios';

export default async function handler(req, res) {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://sightseeing-seven.vercel.app';

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed. POST required.' });
  }

  let city_text = '';
  if (req.body && typeof req.body === 'object') {
    city_text = req.body.city_text || req.body.untrustedData?.inputText || '';
  } else if (typeof req.body === 'string') {
    try {
      const parsedBody = JSON.parse(req.body);
      city_text = parsedBody.city_text || parsedBody.untrustedData?.inputText || '';
    } catch (error) {
      console.error('Error parsing request body:', error);
    }
  }

  console.log('Received city_text:', city_text);

  if (!city_text || city_text.trim() === '') {
    console.log('City input is missing.');
    return sendErrorResponse(res, baseUrl, 'Please Enter a City');
  }

  try {
    console.log('City text to search:', city_text);

    // First, get the main city
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
    const lat = geonameResponse.data.lat;
    const lon = geonameResponse.data.lon;

    // Now, use radius search to find nearby places
    const radiusResponse = await axios.get(
      `https://api.opentripmap.com/0.1/en/places/radius?radius=100000&lon=${lon}&lat=${lat}&limit=3&apikey=${process.env.OPENTRIPMAP_API_KEY}`
    );

    console.log('OpenTripMap Radius Search API response:', JSON.stringify(radiusResponse.data, null, 2));

    let cities = [
      `${mainCity}, ${country}`,
      ...radiusResponse.data.features
        .map(feature => feature.properties.name)
        .filter(name => name !== mainCity && name.trim() !== '')
        .map(name => `${name}, ${country}`)
    ];

    // Ensure we have 4 options by adding generic options if needed
    while (cities.length < 4) {
      cities.push(`${mainCity} Area, ${country}`);
    }

    cities = cities.slice(0, 4); // Limit to 4 options

    console.log('Final Cities List:', cities);

    const cityList = cities.map((city, index) => `${index + 1}: ${city}`).join('\n');
    const cityButtons = cities.map((city, index) => `
      <meta property="fc:frame:button:${index + 1}" content="${index + 1}" />
      <meta property="fc:frame:post_url:${index + 1}" content="${baseUrl}/api/seeAttractions?city=${encodeURIComponent(city)}" />
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