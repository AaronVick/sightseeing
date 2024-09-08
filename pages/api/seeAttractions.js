import axios from 'axios';

export default async function handler(req, res) {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://sightseeing-seven.vercel.app';
  
  console.log('seeAttractions.js - Received request method:', req.method);
  console.log('seeAttractions.js - Request query:', JSON.stringify(req.query));
  console.log('seeAttractions.js - Request body:', JSON.stringify(req.body));

  let cityIndex, lat, lon, attractionIndex;

  if (req.method === 'POST') {
    const data = req.body;
    cityIndex = parseInt(data.cityIndex || data.untrustedData?.cityIndex || '0');
    lat = data.lat || data.untrustedData?.lat || null;
    lon = data.lon || data.untrustedData?.lon || null;
    attractionIndex = parseInt(data.attractionIndex || data.untrustedData?.buttonIndex || '1') - 1;
  } else {
    console.log('seeAttractions.js - Unsupported method:', req.method);
    return res.status(405).json({ error: 'Method Not Allowed. POST required.' });
  }

  console.log('seeAttractions.js - Processed request:', { cityIndex, attractionIndex, lat, lon });

  if (!lat || !lon) {
    console.log('seeAttractions.js - Missing lat or lon:', { lat, lon });
    return sendErrorResponse(res, baseUrl, 'Missing location coordinates');
  }

  const cityList = JSON.parse(process.env.CITY_LIST || '[]');
  const city = cityList[cityIndex];

  if (!city) {
    console.log('seeAttractions.js - City not found in CITY_LIST:', cityList);
    return sendErrorResponse(res, baseUrl, 'City not found');
  }

  try {
    console.log(`seeAttractions.js - Fetching attractions data for lat: ${lat}, lon: ${lon}`);

    const response = await axios.get(
      `https://api.opentripmap.com/0.1/en/places/radius?radius=5000&lon=${lon}&lat=${lat}&limit=5&apikey=${process.env.OPENTRIPMAP_API_KEY}`
    );

    console.log('seeAttractions.js - OpenTripMap Attractions API response:', JSON.stringify(response.data, null, 2));

    const attractions = response.data.features.map((feature) => ({
      name: feature.properties.name || 'Unknown Name',
      kind: feature.properties.kinds.split(',')[0] || 'No category',
      xid: feature.properties.xid
    }));

    if (attractionIndex < 0 || attractionIndex >= attractions.length) {
      attractionIndex = 0;
    }

    const attraction = attractions[attractionIndex];
    const attractionDetails = await getAttractionDetails(attraction.xid);

    console.log('seeAttractions.js - Selected attraction:', attraction);

    const imageUrl = `${baseUrl}/api/attractionImage?` + new URLSearchParams({
      name: encodeURIComponent(attraction.name),
      description: encodeURIComponent(attractionDetails.description || 'No description available'),
      category: encodeURIComponent(attraction.kind),
      image: encodeURIComponent(attractionDetails.image || '')
    }).toString();

    const htmlResponse = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta property="fc:frame" content="vNext" />
          <meta property="fc:frame:image" content="${imageUrl}" />
          ${attractionIndex > 0 ? `<meta property="fc:frame:button:1" content="Previous" />` : ''}
          ${attractionIndex < attractions.length - 1 ? `<meta property="fc:frame:button:2" content="Next" />` : ''}
          <meta property="fc:frame:button:3" content="New Search" />
          <meta property="fc:frame:post_url" content="${baseUrl}/api/seeAttractions" />
        </head>
        <body>
          <h1>${attraction.name}</h1>
          <p>${attractionDetails.description || 'No description available'}</p>
        </body>
      </html>
    `;

    console.log('seeAttractions.js - Sending HTML response:', htmlResponse);

    return res
      .setHeader('Content-Type', 'text/html; charset=utf-8')
      .status(200)
      .send(htmlResponse);
  } catch (error) {
    console.error('seeAttractions.js - Error fetching attractions:', error);
    return sendErrorResponse(res, baseUrl, 'Failed to fetch attractions.');
  }
}

async function getAttractionDetails(xid) {
  try {
    const response = await axios.get(
      `https://api.opentripmap.com/0.1/en/places/xid/${xid}?apikey=${process.env.OPENTRIPMAP_API_KEY}`
    );
    return {
      description: response.data.wikipedia_extracts?.text || response.data.info?.descr || null,
      image: response.data.preview?.source || null
    };
  } catch (error) {
    console.error('Error fetching attraction details:', error);
    return { description: null, image: null };
  }
}

function sendErrorResponse(res, baseUrl, errorMessage) {
  console.log('seeAttractions.js - Sending error response:', errorMessage);
  const htmlErrorResponse = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta property="fc:frame" content="vNext" />
        <meta property="fc:frame:image" content="${baseUrl}/api/generateErrorImage?text=${encodeURIComponent(errorMessage)}" />
        <meta property="fc:frame:button:1" content="Try Again" />
        <meta property="fc:frame:post_url" content="${baseUrl}/api/matchCity" />
      </head>
      <body>
        <h1>${errorMessage}</h1>
      </body>
    </html>
  `;
  return res
    .setHeader('Content-Type', 'text/html; charset=utf-8')
    .status(200)
    .send(htmlErrorResponse);
}
