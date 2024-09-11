import axios from 'axios';

export default async function handler(req, res) {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://sightseeing-seven.vercel.app';

  // Ensure the request is POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed. POST required.' });
  }

  // Fetch city and attractions data from CITY_TEXT environment variable
  let cityDataAndAttractions = JSON.parse(process.env.CITY_TEXT || '{}');
  const { cityData, attractions } = cityDataAndAttractions;

  // Check if cityData is undefined or incomplete
  if (!cityData || typeof cityData.name === 'undefined') {
    console.error('Missing city data:', cityData);
    return sendErrorResponse(res, baseUrl, 'City data is missing or incomplete');
  }

  // If attractions are not already in CITY_TEXT, fetch them from OpenTripMap API
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

    // Store city and attractions data back in CITY_TEXT
    process.env.CITY_TEXT = JSON.stringify(cityDataAndAttractions);
  }

  // Extract the index from the button click (Previous/Next)
  const buttonIndex = parseInt(req.body.buttonIndex || '0');
  const attractionIndex = Math.max(0, Math.min(buttonIndex, cityDataAndAttractions.attractions.length - 1));

  // Fetch the selected attraction details
  const attraction = cityDataAndAttractions.attractions[attractionIndex];
  
  // Add a check to prevent 'undefined' errors when accessing attraction data
  if (!attraction || typeof attraction.name === 'undefined') {
    console.error('Attraction data is missing or undefined:', attraction);
    return sendErrorResponse(res, baseUrl, 'Attraction data is missing or incomplete');
  }

  const attractionDetails = await getAttractionDetails(attraction.xid);

  // Log attractions for debugging purposes
  console.log('Attractions:', cityDataAndAttractions.attractions);
  console.log('Current Attraction:', attraction);

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
