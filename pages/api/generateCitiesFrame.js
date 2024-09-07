import matchCity from './matchCity';
import generateImage from './generateImage';

export default async function handler(req, res) {
  const { city } = req.body;

  if (!city) {
    return res.status(400).json({ error: 'City input is required' });
  }

  const matchedCities = await matchCity(city);

  if (!matchedCities || matchedCities.length === 0) {
    return res.status(200).json({ error: 'City not found. Please try again.' });
  }

  res.status(200).json({
    fc_frame: {
      cities: matchedCities,
      buttons: matchedCities.map((cityName, index) => ({
        text: `City ${index + 1}`,
        method: 'POST',
        action: 'navigate',
        url: `/api/seeAttractions?city=${cityName}`,
      })),
      image: '/api/generateImage?text=cities',
      title: `Matching Cities for ${city}`,
      description: 'Select a city to explore its attractions',
    },
  });
}
