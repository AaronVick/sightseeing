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

    res.status(200).json({
      fc_frame: {
        cities,
        buttons: cities.map((cityName, index) => ({
          text: `City ${index + 1}`,
          method: 'POST',
          action: 'navigate',
          url: `/api/seeAttractions?city=${cityName}`,
        })),
        image: '/city-matching.png', 
        title: `Matching Cities for ${city}`,
        description: 'Select a city to explore its attractions',
      }
    });
  } catch (error) {
    console.error('Error matching cities:', error);
    res.status(500).json({ error: 'Failed to match cities' });
  }
}
