import axios from 'axios';

export default async function handler(req, res) {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://sightseeing-seven.vercel.app';

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed. POST required.' });
  }

  let city_text = '';
  if (req.body && typeof req.body === 'object') {
    city_text = req.body.city_text || req.body.untrustedData?.inputText || '';
  } else if (typeof req.body === 'string') {
    try {
      const parsedBody = JSON.parse(req.body);
      city_text = parsedBody.city_text || parsedBody.untrustedData?.inputText || '';
    } catch (error) {
      console.error('Error parsing request body:', error);
    }
  }

  console.log('Received city_text:', city_text);

  if (!city_text || city_text.trim() === '') {
    console.log('City input is missing.');
    return sendErrorResponse(res, baseUrl, 'Please Enter a City');
  }

  try {
    console.log('City text to search:', city_text);

    // First, try to get an exact match
    const exactMatchResponse = await axios.get(
      `https://api.opentripmap.com/0.1/en/places/geoname?name=${encodeURIComponent(city_text)}&apikey=${process.env.OPENTRIPMAP_API_KEY}`
    );

    console.log('OpenTripMap Exact Match API response:', JSON.stringify(exactMatchResponse.data, null, 2));

    let mainCity, country, lat, lon;

    if (exactMatchResponse.data && exactMatchResponse.data.name) {
      mainCity = exactMatchResponse.data.name;
      country = exactMatchResponse.data.country;
      lat = exactMatchResponse.data.lat;
      lon = exactMatchResponse.data.lon;
    } else {
      // If no exact match, search for the first part of the input (e.g., "Paris" from "Paris, France")
      const cityPart = city_text.split(',')[0].trim();
      const fallbackResponse = await axios.get(
        `https://api.opentripmap.com/0.1/en/places/geoname?name=${encodeURIComponent(cityPart)}&apikey=${process.env.OPENTRIPMAP_API_KEY}`
      );

      console.log('OpenTripMap Fallback API response:', JSON.stringify(fallbackResponse.data, null, 2));

      if (!fallbackResponse.data || !fallbackResponse.data.name) {
        console.log('No city found in the Geoname API response');
        return sendErrorResponse(res, baseUrl, 'City Not Found');
      }

      mainCity = fallbackResponse.data.name;
      country = fallbackResponse.data.country;
      lat = fallbackResponse.data.lat;
      lon = fallbackResponse.data.lon;
    }

    // Now, use autosuggest to find related cities worldwide
    const autosuggestResponse = await axios.get(
      `https://api.opentripmap.com/0.1/en/places/autosuggest?name=${encodeURIComponent(mainCity)}&radius=5000000&limit=10&apikey=${process.env.OPENTRIPMAP_API_KEY}`
    );

    console.log('OpenTripMap Autosuggest API response:', JSON.stringify(autosuggestResponse.data, null, 2));

    let cities = [
      `${mainCity}, ${country}`,
      ...autosuggestResponse.data.features
        .map(feature => `${feature.properties.name}, ${feature.properties.country}`)
        .filter(name => name !== `${mainCity}, ${country}`)
    ];

    // Remove duplicates and limit to 4 options
    cities = [...new Set(cities)].slice(0, 4);

    // Ensure we have 4 options by adding generic options if needed
    while (cities.length < 4) {
      cities.push(`${mainCity} Area, ${country}`);
    }

    console.log('Final Cities List:', cities);

    const cityList = cities.map((city, index) => `${index + 1}: ${city}`).join('\n');
    const cityButtons = cities.map((city, index) => `
      <meta property="fc:frame:button:${index + 1}" content="${index + 1}" />
      <meta property="fc:frame:post_url:${index + 1}" content="${baseUrl}/api/seeAttractions?city=${encodeURIComponent(city)}" />
    `).join('');

    return res.setHeader('Content-Type', 'text/html').status(200).send(`
      <!DOCTYPE html>
      <html>
        <head>
          <meta property="fc:frame" content="vNext" />
          <meta property="fc:frame:image" content="${baseUrl}/api/generateImage?text=${encodeURIComponent(cityList)}" />
          ${cityButtons}
        </head>
        <body>
          <h1>Matching Cities for "${city_text}"</h1>
        </body>
      </html>
    `);

  } catch (error) {
    console.error('Error fetching cities:', error);
    if (error.response) {
      console.error('Error response:', error.response.status, error.response.statusText);
      console.error('Error data:', JSON.stringify(error.response.data, null, 2));
    }
    return sendErrorResponse(res, baseUrl, 'Error Fetching Cities');
  }
}

function sendErrorResponse(res, baseUrl, errorMessage) {
  return res.setHeader('Content-Type', 'text/html').status(200).send(`
    <!DOCTYPE html>
    <html>
      <head>
        <meta property="fc:frame" content="vNext" />
        <meta property="fc:frame:image" content="${baseUrl}/api/generateErrorImage?text=${encodeURIComponent(errorMessage)}" />
        <meta property="fc:frame:button:1" content="Retry" />
        <meta property="fc:frame:post_url" content="${baseUrl}/api/matchCity" />
        <meta property="fc:frame:input:text" content="Enter a city" />
      </head>
      <body>
        <h1>${errorMessage}</h1>
      </body>
    </html>
  `);
}