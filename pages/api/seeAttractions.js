import axios from 'axios';

export default async function handler(req, res) {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://sightseeing-seven.vercel.app';
  const { cityIndex, page = 1 } = req.body;

  if (cityIndex === undefined) {
    return res.status(400).json({ error: 'City index is missing.' });
  }

  const cityList = JSON.parse(process.env.CITY_LIST || '[]');
  const city = cityList[cityIndex] || {};

  if (!city.name) {
    return res.status(400).json({ error: 'City not found.' });
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
          ${page > 1 ? `<meta property="fc:frame:button:1" content="Previous" /><meta property="fc:frame:post_url:1" content="${baseUrl}/api/seeAttractions" />` : ''}
          ${hasNextPage ? `<meta property="fc:frame:button:2" content="Next" /><meta property="fc:frame:post_url:2" content="${baseUrl}/api/seeAttractions" />` : ''}
          <meta property="fc:frame:button:3" content="New Search" /><meta property="fc:frame:post_url:3" content="${baseUrl}/api/matchCity" />
          <meta property="fc:frame:post_url_target" content="post" />
          <meta property="og:title" content="Attractions in ${city.name}" />
          <meta property="og:description" content="Explore top attractions" />
        </head>
        <body>
          <h1>Attractions in ${city.name}</h1>
          <p>${attractionList}</p>
        </body>
      </html>
    `;

    return res.setHeader('Content-Type', 'text/html').status(200).send(htmlResponse);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to fetch attractions.' });
  }
}
