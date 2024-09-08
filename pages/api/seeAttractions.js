import axios from 'axios';

export default async function handler(req, res) {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://sightseeing-seven.vercel.app';

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed. POST required.' });
  }

  const { cityIndex, lat, lon, attractionIndex = 0 } = req.body;

  const cityList = JSON.parse(process.env.CITY_LIST || '[]');
  const city = cityList[cityIndex];

  if (!city) {
    return sendErrorResponse(res, baseUrl, 'City not found');
  }

  try {
    // Fetch attractions data for the city
    const response = await axios.get(
      `https://api.opentripmap.com/0.1/en/places/radius?radius=5000&lon=${lon}&lat=${lat}&limit=10&apikey=${process.env.OPENTRIPMAP_API_KEY}`
    );

    const attractions = response.data.features.map((feature) => ({
      name: feature.properties.name || 'Unknown Name',
      kind: feature.properties.kinds.split(',')[0] || 'No category',
      xid: feature.properties.xid
    }));

    // Store the attractions list in a global variable for navigation
    process.env.ATTRACTIONS_LIST = JSON.stringify(attractions);

    const attraction = attractions[attractionIndex];
    const attractionDetails = await getAttractionDetails(attraction.xid);

    const imageUrl = `${baseUrl}/api/attractionImage?` + new URLSearchParams({
      name: encodeURIComponent(attraction.name),
      description: encodeURIComponent(attractionDetails.description || 'No description available'),
      category: encodeURIComponent(attraction.kind),
      image: encodeURIComponent(attractionDetails.image || '')
    }).toString();

    // Dynamically generate HTML response for current attraction
    const htmlResponse = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta property="fc:frame" content="vNext" />
          <meta property="fc:frame:image" content="${imageUrl}" />
          ${attractionIndex > 0 ? `<meta property="fc:frame:button:1" content="Previous" /><meta property="fc:frame:post_data:1" content='{"cityIndex": ${cityIndex}, "attractionIndex": ${attractionIndex - 1}, "lat": ${lat}, "lon": ${lon}}' />` : ''}
          ${attractionIndex < attractions.length - 1 ? `<meta property="fc:frame:button:2" content="Next" /><meta property="fc:frame:post_data:2" content='{"cityIndex": ${cityIndex}, "attractionIndex": ${attractionIndex + 1}, "lat": ${lat}, "lon": ${lon}}' />` : ''}
          <meta property="fc:frame:button:3" content="New Search" />
          <meta property="fc:frame:post_url" content="${baseUrl}/api/seeAttractions" />
        </head>
        <body>
          <h1>${attraction.name}</h1>
          <p>${attractionDetails.description || 'No description available'}</p>
        </body>
      </html>
    `;

    return res.setHeader('Content-Type', 'text/html; charset=utf-8').status(200).send(htmlResponse);
  } catch (error) {
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
    return { description: null, image: null };
  }
}

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
  return res.setHeader('Content-Type', 'text/html; charset=utf-8').status(200).send(htmlErrorResponse);
}
