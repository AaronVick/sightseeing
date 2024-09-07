import axios from 'axios';

export default async function handler(req, res) {
  // Check if the request is a POST request
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  // Log the incoming request to check if the city is correctly passed
  console.log('Request body:', req.body);

  const { city } = req.body; // Try to extract city from request body

  if (!city) {
    console.log('City input is missing in the request.');
    return res.status(400).json({ error: 'City input is required' });
  }

  try {
    // Make the request to the OpenTripMap API
    const response = await axios.get(
      `https://api.opentripmap.com/0.1/en/places/geoname?name=${city}&apikey=${process.env.OPENTRIPMAP_API_KEY}`
    );

    const cities = response.data.features.map((feature) => feature.properties.name).slice(0, 4);

    // Log the matched cities
    console.log('Matched cities:', cities);

    // Send the response back with the matched cities
    res.status(200).json(cities);
  } catch (error) {
    console.error('Error fetching cities:', error.response ? error.response.data : error.message);
    res.status(500).json({ error: 'Failed to match cities' });
  }
}
