import axios from 'axios';

export default async function handler(req, res) {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://sightseeing-seven.vercel.app';
  
  console.log('matchCity.js - Received request method:', req.method);
  console.log('matchCity.js - Request query:', JSON.stringify(req.query));
  console.log('matchCity.js - Request body:', JSON.stringify(req.body));

  let city_text = '';
  if (req.method === 'GET') {
    city_text = req.query.city_text || '';
  } else if (req.method === 'POST') {
    city_text = req.body.city_text || req.body.untrustedData?.inputText || '';
  } else {
    console.log('matchCity.js - Unsupported method:', req.method);
    return res.status(405).json({ error: 'Method Not Allowed. GET or POST required.' });
  }

  console.log('matchCity.js - Processed city_text:', city_text);

  if (!city_text || city_text.trim() === '') {
    console.log('matchCity.js - City input is missing.');
    return sendErrorResponse(res, baseUrl, 'Please Enter a City');
  }

  try {
    console.log('matchCity.js - Fetching city data for:', city_text);
    
    const geonameResponse = await axios.get(
      `https://api.opentripmap.com/0.1/en/places/geoname?name=${encodeURIComponent(city_text)}&apikey=${process.env.OPENTRIPMAP_API_KEY}`
    );

    console.log('matchCity.js - OpenTripMap Geoname API response:', JSON.stringify(geonameResponse.data, null, 2));

    if (!geonameResponse.data || !geonameResponse.data.name) {
      console.log('matchCity.js - No city found in the Geoname API response');
      return sendErrorResponse(res, baseUrl, 'City Not Found');
    }

    const mainCity = geonameResponse.data.name;
    const country = geonameResponse.data.country;
    const lat = geonameResponse.data.lat;
    const lon = geonameResponse.data.lon;

    // Create a structured JSON object to store city details
    const cityData = {
      name: mainCity,
      country: country,
      lat: lat,
      lon: lon
    };

    console.log('matchCity.js - Final city data to store in CITY_TEXT:', cityData);

    // Store the city data JSON in the environment variable
    process.env.CITY_TEXT = JSON.stringify(cityData);

    // Log the button data to check if lat/lon is being passed correctly
    console.log('matchCity.js - Creating button for city:', cityData);

    const htmlResponse = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta property="fc:frame" content="vNext" />
          <meta property="fc:frame:image" content="${baseUrl}/api/generateImage?text=${encodeURIComponent(mainCity)}" />
          <meta property="fc:frame:button:1" content="View Attractions" />
          <meta property="fc:frame:post_url" content="${baseUrl}/api/seeAttractions" />
          <meta property="fc:frame:post_url_target" content="post" />
        </head>
        <body>
          <h1>Matching City for "${city_text}"</h1>
        </body>
      </html>
    `;

    console.log('matchCity.js - Sending HTML response:', htmlResponse);

    return res.setHeader('Content-Type', 'text/html').status(200).send(htmlResponse);

  } catch (error) {
    console.error('matchCity.js - Error fetching cities:', error);
    if (error.response) {
      console.error('matchCity.js - Error response:', error.response.status, error.response.statusText);
      console.error('matchCity.js - Error data:', JSON.stringify(error.response.data, null, 2));
    }
    return sendErrorResponse(res, baseUrl, 'Error Fetching Cities');
  }
}
