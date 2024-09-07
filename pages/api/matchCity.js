import axios from 'axios';

export default async function handler(req, res) {
  const { city } = req.body;

  if (!city) {
    return res.status(400).json({ error: 'City input is required' });
  }

  try {
    const response = await axios.get(
      `https://api.opentripmap.com/0.1/en/places/geoname?name=${city}&apikey=${process.env.OPENTRIPMAP_API_KEY}`
    );

    const cities = response.data.features.map((feature) => feature.properties.name).slice(0, 4);

    res.status(200).json(cities);
  } catch (error) {
    console.error('Error matching cities:', error);
    res.status(500).json({ error: 'Failed to match cities' });
  }
}
