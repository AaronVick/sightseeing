import axios from 'axios';

export default async function handler(req, res) {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://sightseeing-seven.vercel.app';

  // Ensure the request is POST
  if (req.method !== 'POST') {
    console.log('seeAttractions.js - Unsupported method:', req.method);
    return res.status(405).json({ error: 'Method Not Allowed. POST required.' });
  }

  // Fetch city data from the environment variable
  const cityData = JSON.parse(process.env.CITY_TEXT || '{}');
  const buttonIndex = parseInt(req.body.buttonIndex || '0');

  // Check if lat/lon exists in city data
  if (!cityData || !cityData.lat || !cityData.lon) {
    console.log('seeAttractions.js - Missing lat or lon in city data:', cityData);
    return sendErrorResponse(res, baseUrl, 'Missing location coordinates');
  }

  try {
    // Fetch attractions using the OpenTripMap API
    const response = await axios.get(
      `https://api.opentripmap.com/0.1/en/places/radius?radius=5000&lon=${cityData.lon}&lat=${cityData.lat}&limit=5&apikey=${process.env.OPENTRIPMAP_API_KEY}`
    );

    const attractions = response.data.features.map((feature) => ({
      name: feature.properties.name || 'Unknown Name',
      kind: feature.properties.kinds.split(',')[0] || 'No category',
      xid: feature.properties.xid
    }));

    if (attractions.length === 0) {
      return sendErrorResponse(res, baseUrl, 'No attractions found');
    }

    // Ensure valid button index for cycling
    const attractionIndex = Math.max(0, Math.min(buttonIndex, attractions.length - 1));

    const attraction = attractions[attractionIndex];
    const attractionDetails = await getAttractionDetails(attraction.xid);

    // Generate the Open Graph image using the OGattractions.js endpoint
    const imageUrl = `${baseUrl}/api/OGattractions?` + new URLSearchParams({
      name: encodeURIComponent(attraction.name),
      description: encodeURIComponent(attractionDetails.description || 'No description available'),
      category: encodeURIComponent(attraction.kind),
    }).toString();

    // Generate meta tags for the Farcaster frame
    const htmlResponse = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta property="fc:frame" content="vNext" />
          <meta property="fc:frame:image" content="${imageUrl}" />
          <meta property="fc:frame:button:1" content="Previous" />
          <meta property="fc:frame:button:2" content="Next" />
          <meta property="fc:frame:post_data:1" content='{"buttonIndex": ${attractionIndex - 1}}' />
          <meta property="fc:frame:post_data:2" content='{"buttonIndex": ${attractionIndex + 1}}' />
          <meta property="fc:frame:post_url" content="${baseUrl}/api/seeAttractions" />
        </head>
        <body>
          <h1>${attraction.name}</h1>
          <p>${attractionDetails.description || 'No description available'}</p>
        </body>
      </html>
    `;

    return res
      .setHeader('Content-Type', 'text/html; charset=utf-8')
      .status(200)
      .send(htmlResponse);
  } catch (error) {
    console.error('seeAttractions.js - Error fetching attractions:', error);
    return sendErrorResponse(res, baseUrl, 'Failed to fetch attractions.');
  }
}

// Fetch attraction details from the OpenTripMap API
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

// Error response function to handle errors and generate meta tags
function sendErrorResponse(res, baseUrl, errorMessage) {
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
