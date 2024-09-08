import axios from 'axios';

export default async function handler(req, res) {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://sightseeing-seven.vercel.app';
  
  console.log('seeAttractions.js - Received request method:', req.method);
  console.log('seeAttractions.js - Request query:', JSON.stringify(req.query));
  console.log('seeAttractions.js - Request body:', JSON.stringify(req.body));

  let cityIndex, page;

  if (req.method === 'GET') {
    ({ cityIndex, page } = req.query);
  } else if (req.method === 'POST') {
    ({ cityIndex, page } = req.body);
  } else {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  cityIndex = parseInt(cityIndex) || 0;
  page = parseInt(page) || 1;

  console.log('seeAttractions.js - Processed request:', { cityIndex, page });

  const cityList = JSON.parse(process.env.CITY_LIST || '[]');
  const city = cityList[cityIndex];

  if (!city) {
    return sendErrorResponse(res, baseUrl, 'City not found');
  }

  try {
    const response = await axios.get(
      `https://api.opentripmap.com/0.1/en/places/radius?radius=5000&lon=${city.lon}&lat=${city.lat}&limit=5&offset=${(page - 1) * 5}&apikey=${process.env.OPENTRIPMAP_API_KEY}`
    );

    const attractions = response.data.features.map((feature) => ({
      name: feature.properties.name || 'Unknown Name',
      kind: feature.properties.kinds || 'No categories',
    }));

    const attractionList = attractions.map((attr, i) => `${i + 1}. ${attr.name} (${attr.kind.split(',')[0]})`).join('\n');
    const hasNextPage = attractions.length === 5;

    const htmlResponse = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta property="fc:frame" content="vNext" />
          <meta property="fc:frame:image" content="${baseUrl}/api/generateImage?text=Attractions%20in%20${encodeURIComponent(city.name)}%0A${encodeURIComponent(attractionList)}" />
          ${page > 1 ? `<meta property="fc:frame:button:1" content="Previous" />` : ''}
          ${hasNextPage ? `<meta property="fc:frame:button:2" content="Next" />` : ''}
          <meta property="fc:frame:button:3" content="New Search" />
          <meta property="fc:frame:post_url" content="${baseUrl}/api/seeAttractions" />
          <meta property="fc:frame:post_url_target" content="post" />
          ${page > 1 ? `<meta property="fc:frame:post_data:1" content='{"cityIndex": ${cityIndex}, "page": ${page - 1}}' />` : ''}
          ${hasNextPage ? `<meta property="fc:frame:post_data:2" content='{"cityIndex": ${cityIndex}, "page": ${page + 1}}' />` : ''}
          <meta property="fc:frame:post_data:3" content='' />
          <meta property="og:title" content="Attractions in ${city.name}" />
          <meta property="og:description" content="Explore top attractions" />
        </head>
        <body>
          <h1>Attractions in ${city.name}</h1>
          <p>${attractionList}</p>
        </body>
      </html>
    `;

    console.log('seeAttractions.js - Sending HTML response:', htmlResponse);

    return res.setHeader('Content-Type', 'text/html').status(200).send(htmlResponse);
  } catch (error) {
    console.error('seeAttractions.js - Error fetching attractions:', error);
    return sendErrorResponse(res, baseUrl, 'Failed to fetch attractions.');
  }
}

function sendErrorResponse(res, baseUrl, errorMessage) {
  console.log('seeAttractions.js - Sending error response:', errorMessage);
  const htmlErrorResponse = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta property="fc:frame" content="vNext" />
        <meta property="fc:frame:image" content="${baseUrl}/api/generateErrorImage?text=${encodeURIComponent(errorMessage)}" />
        <meta property="fc:frame:button:1" content="Try Again" />
        <meta property="fc:frame:post_url" content="${baseUrl}/api/matchCity" />
        <meta property="fc:frame:post_url_target" content="post" />
        <meta property="fc:frame:input:text" content="Enter a city" />
        <meta property="og:title" content="Error" />
        <meta property="og:description" content="${errorMessage}" />
      </head>
      <body>
        <h1>${errorMessage}</h1>
      </body>
    </html>
  `;
  return res.setHeader('Content-Type', 'text/html').status(200).send(htmlErrorResponse);
}