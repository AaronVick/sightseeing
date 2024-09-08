import axios from 'axios';

export const config = {
  api: {
    bodyParser: true,
  },
};

export default async function handler(req, res) {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://sightseeing-seven.vercel.app';

  console.log('Received request method:', req.method);
  console.log('Request query:', req.query);
  console.log('Request body:', req.body);

  let city, page;

  if (req.method === 'GET') {
    ({ city, page } = req.query);
  } else if (req.method === 'POST') {
    ({ city, page } = req.body);
    if (!city && req.body.untrustedData) {
      city = req.body.untrustedData.buttonIndex ? 
        req.body.untrustedData[`cityOption${req.body.untrustedData.buttonIndex}`] : 
        req.body.untrustedData.inputText;
    }
  } else {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  page = parseInt(page) || 1;

  console.log('Processed request:', { city, page });

  if (!city) {
    return sendErrorResponse(res, baseUrl, 'City name is required');
  }

  try {
    const geoResponse = await axios.get(
      `https://api.opentripmap.com/0.1/en/places/geoname?name=${encodeURIComponent(city)}&apikey=${process.env.OPENTRIPMAP_API_KEY}`
    );
    const { lat, lon } = geoResponse.data;

    const attractionsResponse = await axios.get(
      `https://api.opentripmap.com/0.1/en/places/radius?radius=5000&lon=${lon}&lat=${lat}&limit=5&offset=${(page - 1) * 5}&apikey=${process.env.OPENTRIPMAP_API_KEY}`
    );

    const attractions = attractionsResponse.data.features.map((feature) => ({
      name: feature.properties.name || 'Unknown Name',
      kinds: feature.properties.kinds || 'No categories available',
    }));

    const attractionsList = attractions.map((attraction, index) => 
      `${index + 1}. ${attraction.name} (${attraction.kinds.split(',')[0]})`
    ).join('\n');

    const hasNextPage = attractions.length === 5;

    return res.setHeader('Content-Type', 'text/html').status(200).send(`
      <!DOCTYPE html>
      <html>
        <head>
          <meta property="fc:frame" content="vNext" />
          <meta property="fc:frame:image" content="${baseUrl}/api/generateImage?text=${encodeURIComponent(`Attractions in ${city}\n\n${attractionsList}`)}" />
          ${page > 1 ? `<meta property="fc:frame:button:1" content="Previous" />
          <meta property="fc:frame:post_url:1" content="${baseUrl}/api/seeAttractions" />
          <meta property="fc:frame:post_url_target:1" content="post" />` : ''}
          ${hasNextPage ? `<meta property="fc:frame:button:2" content="Next" />
          <meta property="fc:frame:post_url:2" content="${baseUrl}/api/seeAttractions" />
          <meta property="fc:frame:post_url_target:2" content="post" />` : ''}
          <meta property="fc:frame:button:3" content="New Search" />
          <meta property="fc:frame:post_url:3" content="${baseUrl}/api/matchCity" />
          <meta property="fc:frame:post_url_target:3" content="post" />
        </head>
        <body>
          <h1>Attractions in ${city}</h1>
        </body>
      </html>
    `);
  } catch (error) {
    console.error('Error fetching attractions:', error);
    return sendErrorResponse(res, baseUrl, `Error: Failed to fetch attractions for ${city}`);
  }
}

function sendErrorResponse(res, baseUrl, errorMessage) {
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