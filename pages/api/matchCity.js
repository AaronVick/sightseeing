import axios from 'axios';

export default async function handler(req, res) {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://sightseeing-seven.vercel.app';

  let city_text = '';
  if (req.method === 'GET') {
    city_text = req.query.city_text || '';
  } else if (req.method === 'POST') {
    city_text = req.body.city_text || req.body.untrustedData?.inputText || '';
  } else {
    return res.status(405).json({ error: 'Method Not Allowed. GET or POST required.' });
  }

  if (!city_text || city_text.trim() === '') {
    return sendErrorResponse(res, baseUrl, 'Please Enter a City');
  }

  try {
    const geonameResponse = await axios.get(
      `https://api.opentripmap.com/0.1/en/places/geoname?name=${encodeURIComponent(city_text)}&apikey=${process.env.OPENTRIPMAP_API_KEY}`
    );

    const { name: mainCity, country, lat, lon } = geonameResponse.data;

    let cities = [{
      name: `${mainCity}, ${country}`,
      lat: lat,
      lon: lon
    }];

    process.env.CITY_LIST = JSON.stringify(cities);

    const cityList = cities.map((city, index) => `${index + 1}: ${city.name}`).join('\n');

    const cityButtons = cities.map((city, index) => `
      <meta property="fc:frame:button:${index + 1}" content="${index + 1}" />
      <meta property="fc:frame:post_data:${index + 1}" content='{"cityIndex": ${index}, "lat": ${city.lat}, "lon": ${city.lon}}' />
    `).join('');

    const htmlResponse = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta property="fc:frame" content="vNext" />
          <meta property="fc:frame:image" content="${baseUrl}/api/generateImage?text=${encodeURIComponent(cityList)}" />
          ${cityButtons}
          <meta property="fc:frame:post_url" content="${baseUrl}/api/seeAttractions" />
          <meta property="fc:frame:post_url_target" content="post" />
        </head>
        <body>
          <h1>Matching Cities for "${city_text}"</h1>
        </body>
      </html>
    `;

    return res.setHeader('Content-Type', 'text/html').status(200).send(htmlResponse);

  } catch (error) {
    return sendErrorResponse(res, baseUrl, 'Error Fetching Cities');
  }
}
