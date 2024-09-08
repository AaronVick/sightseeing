import axios from 'axios';

export const config = {
  api: {
    bodyParser: true,
  },
};

export default async function handler(req, res) {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://sightseeing-seven.vercel.app';

  let cityIndex, page;

  if (req.method === 'POST') {
    const data = req.body;
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
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  // Retrieve the city list from the environment variable
  const cityList = JSON.parse(process.env.CITY_LIST || '[]');
  if (!cityList[cityIndex]) {
    return sendErrorResponse(res, baseUrl, 'City not found');
  }

  const city = cityList[cityIndex];

  try {
    const attractionsResponse = await axios.get(
      `https://api.opentripmap.com/0.1/en/places/radius?radius=5000&lon=${city.lon}&lat=${city.lat}&limit=5&offset=${(page - 1) * 5}&kinds=interesting_places&apikey=${process.env.OPENTRIPMAP_API_KEY}`
    );

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
          <meta property="fc:frame:image" content="${baseUrl}/api/attractionImage?text=${encodeURIComponent(`Attractions in ${city.name}\n\n${attractionsList}`)}" />
          ${page > 1 ? `<meta property="fc:frame:button:1" content="Previous" /><meta property="fc:frame:post_url:1" content="${baseUrl}/api/seeAttractions" />` : ''}
          ${hasNextPage ? `<meta property="fc:frame:button:2" content="Next" /><meta property="fc:frame:post_url:2" content="${baseUrl}/api/seeAttractions" />` : ''}
          <meta property="fc:frame:button:3" content="New Search" /><meta property="fc:frame:post_url:3" content="${baseUrl}/api/matchCity" />
          <meta property="fc:frame:post_url_target" content="post" />
          <meta property="og:title" content="Attractions in ${city.name}" />
          <meta property="og:description" content="Explore top attractions" />
        </head>
        <body>
          <h1>Attractions in ${city.name}</h1>
          <p>${attractionsList}</p>
        </body>
      </html>
    `;

    return res.setHeader('Content-Type', 'text/html').status(200).send(htmlResponse);
  } catch (error) {
    return sendErrorResponse(res, baseUrl, `Error: Failed to fetch attractions for ${city.name}`);
  }
}

function sendErrorResponse(res, baseUrl, errorMessage) {
  const htmlErrorResponse = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta property="fc:frame" content="vNext" />
        <meta property="fc:frame:image" content="${baseUrl}/api/generateErrorImage?text=${encodeURIComponent(errorMessage)}" />
        <meta property="fc:frame:button:1" content="Try Again" />
        <meta property="fc:frame:post_url:1" content="${baseUrl}/api/matchCity" />
        <meta property="fc:frame:post_url_target" content="post" />
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
