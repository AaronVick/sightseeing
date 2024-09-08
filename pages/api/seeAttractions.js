import axios from 'axios';

export default async function handler(req, res) {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://sightseeing-seven.vercel.app';

  // Handle both GET and POST requests
  const { city, page: pageStr } = req.method === 'GET' ? req.query : req.body;
  const page = parseInt(pageStr) || 1;

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
          <meta property="fc:frame:post_url:1" content="${baseUrl}/api/seeAttractions?city=${encodeURIComponent(city)}&page=${page - 1}" />` : ''}
          ${hasNextPage ? `<meta property="fc:frame:button:2" content="Next" />
          <meta property="fc:frame:post_url:2" content="${baseUrl}/api/seeAttractions?city=${encodeURIComponent(city)}&page=${page + 1}" />` : ''}
          <meta property="fc:frame:button:3" content="New Search" />
          <meta property="fc:frame:post_url:3" content="${baseUrl}/api/matchCity" />
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
      </head>
      <body>
        <h1>${errorMessage}</h1>
      </body>
    </html>
  `);
}