import axios from 'axios';

export const config = {
  api: {
    bodyParser: true,
  },
};

export default async function handler(req, res) {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://sightseeing-seven.vercel.app';

  console.log('seeAttractions.js - Received request method:', req.method);
  console.log('seeAttractions.js - Request headers:', JSON.stringify(req.headers, null, 2));
  console.log('seeAttractions.js - Request query:', JSON.stringify(req.query));
  console.log('seeAttractions.js - Request body:', JSON.stringify(req.body));

  let cityIndex, page;

  if (req.method === 'GET' || req.method === 'POST') {
    const data = req.method === 'GET' ? req.query : req.body;
    cityIndex = parseInt(data.untrustedData?.buttonIndex || data.cityIndex || '1') - 1;
    page = parseInt(data.page) || 1;

    if (data.untrustedData) {
      const buttonIndex = parseInt(data.untrustedData.buttonIndex);
      if (buttonIndex === 1 && page > 1) {
        page--;
      } else if (buttonIndex === 2) {
        page++;
      } else if (buttonIndex >= 1 && buttonIndex <= 4) {
        cityIndex = buttonIndex - 1;
        page = 1;
      }
    }
  } else {
    console.log('seeAttractions.js - Unsupported method:', req.method);
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  console.log('seeAttractions.js - Processed request:', { cityIndex, page });

  // Retrieve the city list from the environment variable
  const cityList = JSON.parse(process.env.CITY_LIST || '[]');
  console.log('seeAttractions.js - Retrieved city list:', cityList);

  if (!cityList[cityIndex]) {
    console.log('seeAttractions.js - City not found in the list');
    return sendErrorResponse(res, baseUrl, 'City not found');
  }

  const city = cityList[cityIndex];

  try {
    console.log('seeAttractions.js - Fetching attractions for:', city);
    const attractionsResponse = await axios.get(
      `https://api.opentripmap.com/0.1/en/places/radius?radius=5000&lon=${city.lon}&lat=${city.lat}&limit=5&offset=${(page - 1) * 5}&kinds=interesting_places&apikey=${process.env.OPENTRIPMAP_API_KEY}`
    );
    console.log('seeAttractions.js - Attractions API response:', JSON.stringify(attractionsResponse.data, null, 2));

    const attractions = attractionsResponse.data.features.map((feature) => ({
      name: feature.properties.name || 'Unknown Name',
      kinds: feature.properties.kinds || 'No categories available',
    }));

    const attractionsList = attractions.map((attraction, index) => 
      `${index + 1}. ${attraction.name} (${attraction.kinds.split(',')[0]})`
    ).join('\n');

    const hasNextPage = attractions.length === 5;

    const htmlResponse = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta property="fc:frame" content="vNext" />
          <meta property="fc:frame:image" content="${baseUrl}/api/generateImage?text=${encodeURIComponent(`Attractions in ${city.name}\n\n${attractionsList}`)}" />
          ${page > 1 ? `<meta property="fc:frame:button:1" content="Previous" />` : ''}
          ${hasNextPage ? `<meta property="fc:frame:button:2" content="Next" />` : ''}
          <meta property="fc:frame:button:3" content="New Search" />
          <meta property="fc:frame:post_url" content="${baseUrl}/api/seeAttractions" />
          <meta property="fc:frame:post_url_target" content="post" />
        </head>
        <body>
          <h1>Attractions in ${city.name}</h1>
        </body>
      </html>
    `;

    console.log('seeAttractions.js - Sending HTML response:', htmlResponse);

    return res.setHeader('Content-Type', 'text/html').status(200).send(htmlResponse);
  } catch (error) {
    console.error('seeAttractions.js - Error fetching attractions:', error);
    if (error.response) {
      console.error('seeAttractions.js - Error response:', error.response.status, error.response.statusText);
      console.error('seeAttractions.js - Error data:', JSON.stringify(error.response.data, null, 2));
    }
    return sendErrorResponse(res, baseUrl, `Error: Failed to fetch attractions for ${city.name}`);
  }
}

function sendErrorResponse(res, baseUrl, errorMessage) {
  console.log('seeAttractions.js - Sending error response:', errorMessage);
  return res.setHeader('Content-Type', 'text/html').status(200).send(`
    <!DOCTYPE html>
    <html>
      <head>
        <meta property="fc:frame" content="vNext" />
        <meta property="fc:frame:image" content="${baseUrl}/api/generateErrorImage?text=${encodeURIComponent(errorMessage)}" />
        <meta property="fc:frame:button:1" content="Try Again" />
        <meta property="fc:frame:post_url" content="${baseUrl}/api/matchCity" />
        <meta property="fc:frame:post_url_target" content="post" />
      </head>
      <body>
        <h1>${errorMessage}</h1>
      </body>
    </html>
  `);
}