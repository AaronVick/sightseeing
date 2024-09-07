import axios from 'axios';

export default async function handler(req, res) {
  const { city, page } = req.body;

  if (!city) {
    return res.status(400).json({ error: 'City name is required' });
  }

  try {
    const geoResponse = await axios.get(
      `https://api.opentripmap.com/0.1/en/places/geoname?name=${city}&apikey=${process.env.OPENTRIPMAP_API_KEY}`
    );
    const { lat, lon } = geoResponse.data;

    const attractionsResponse = await axios.get(
      `https://api.opentripmap.com/0.1/en/places/radius?radius=5000&lon=${lon}&lat=${lat}&limit=10&offset=${(page - 1) * 10}&apikey=${process.env.OPENTRIPMAP_API_KEY}`
    );

    const attractions = attractionsResponse.data.features.map((feature) => ({
      id: feature.id,
      name: feature.properties.name || 'Unknown Name',
      description: feature.properties.description || 'No description available',
      image: feature.properties.image
    }));

    res.status(200).json(attractions);
  } catch (error) {
    console.error('Error fetching attractions:', error);
    res.status(500).json({ error: 'Failed to fetch attractions' });
  }
}
