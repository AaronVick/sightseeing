import matchCity from './matchCity';

export default async function handler(req, res) {
  const { city } = req.body;
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://sightseeing-seven.vercel.app';

  if (!city) {
    console.log('City input is missing.');
    return res.status(400).json({ error: 'City input is required' });
  }

  const matchedCities = await matchCity(city);

  if (!matchedCities || matchedCities.length === 0) {
    console.log('No matching cities found.');
    return res.status(200).json({ error: 'City not found. Please try again.' });
  }

  console.log('Matched cities:', matchedCities);

  // Return the response with the correct Farcaster meta tags and the buttons for each city
  res.status(200).json({
    fc_frame: {
      title: `Matching Cities for ${city}`,
      description: 'Select a city to explore its attractions',
      image: `${baseUrl}/api/generateImage?text=cities`,  // Dynamic image
      buttons: matchedCities.map((cityName, index) => ({
        text: `City ${index + 1}: ${cityName}`,
        method: 'POST',
        action: 'navigate',
        url: `${baseUrl}/api/seeAttractions?city=${cityName}`,
      })),
    },
  });
}
