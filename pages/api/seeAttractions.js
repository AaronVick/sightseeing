import axios from 'axios';

export default async function handler(req, res) {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://sightseeing-seven.vercel.app';

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed. POST required.' });
  }

  // Fetch city data from the environment variable and parse it
  let cityDataAndAttractions = {};
  
  try {
    cityDataAndAttractions = JSON.parse(process.env.CITY_TEXT || '{}');
  } catch (error) {
    console.error('Error parsing CITY_TEXT:', error);
    return sendErrorResponse(res, baseUrl, 'City data is corrupted or cannot be parsed.');
  }

  const { cityData, attractions } = cityDataAndAttractions;

  // Check if cityData is valid
  if (!cityData || !cityData.lat || !cityData.lon) {
    console.error('City data is missing or incomplete:', cityData);
    return sendErrorResponse(res, baseUrl, 'City data is missing or incomplete');
  }

  // Fetch attractions if they are not already available
  if (!attractions || attractions.length === 0) {
    console.log('Fetching attractions for city:', cityData.name);

    const response = await axios.get(
      `https://api.opentripmap.com/0.1/en/places/radius?radius=5000&lon=${cityData.lon}&lat=${cityData.lat}&limit=5&apikey=${process.env.OPENTRIPMAP_API_KEY}`
    );

    cityDataAndAttractions.attractions = response.data.features.map((feature) => ({
      name: feature.properties.name || 'Unknown Name',
      kind: feature.properties.kinds.split(',')[0] || 'No category',
      xid: feature.properties.xid
    }));

    // Store the updated city and attractions data in CITY_TEXT
    process.env.CITY_TEXT = JSON.stringify(cityDataAndAttractions);
  }

  // Continue with the rest of the logic...
  const buttonIndex = parseInt(req.body.buttonIndex || '0');
  const attractionIndex = Math.max(0, Math.min(buttonIndex, cityDataAndAttractions.attractions.length - 1));

  const attraction = cityDataAndAttractions.attractions[attractionIndex];
  
  if (!attraction || !attraction.name) {
    console.error('Attraction data is missing or undefined:', attraction);
    return sendErrorResponse(res, baseUrl, 'Attraction data is missing or incomplete');
  }

  const attractionDetails = await getAttractionDetails(attraction.xid);

  const imageUrl = `${baseUrl}/api/OGattractions?` + new URLSearchParams({
    name: encodeURIComponent(attraction.name),
    description: encodeURIComponent(attractionDetails.description || 'No description available'),
    category: encodeURIComponent(attraction.kind),
  }).toString();

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
}

// Function to fetch attraction details
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
