import Head from 'next/head';
import { useState } from 'react';
import axios from 'axios';

export default function Home() {
  const [cityInput, setCityInput] = useState('');
  const [matchingCities, setMatchingCities] = useState([]);
  const [selectedCity, setSelectedCity] = useState('');
  const [attractions, setAttractions] = useState([]);
  const [page, setPage] = useState(1); // Page state for pagination
  const [loading, setLoading] = useState(false);

  const handleCityInputChange = (e) => {
    setCityInput(e.target.value);
  };

  const handleExploreCityClick = async () => {
    if (!cityInput) {
      // Generate an OG image if no city is entered
      await axios.get('/api/generateImage');
    } else {
      // Fetch matching cities based on the input
      const response = await axios.post('/api/matchCity', { city: cityInput });
      setMatchingCities(response.data); // Set matching cities
    }
  };

  const handleCitySelect = async (city) => {
    setSelectedCity(city);
    fetchAttractions(city, 1); // Fetch the first page of attractions
  };

  const fetchAttractions = async (city, page) => {
    setLoading(true);
    try {
      const response = await axios.post('/api/seeAttractions', { city, page });
      setAttractions(response.data); // Set attractions data
      setPage(page); // Update the current page
    } catch (error) {
      console.error('Error fetching attractions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleNext = () => {
    fetchAttractions(selectedCity, page + 1); // Fetch next page
  };

  const handlePrevious = () => {
    if (page > 1) {
      fetchAttractions(selectedCity, page - 1); // Fetch previous page
    }
  };

  return (
    <>
      <Head>
        <title>City Explorer</title>
        <meta property="fc:frame" content="vNext" />
        <meta property="fc:frame:image" content="travel.png" /> 
      </Head>

      <main>
        <h1>Explore Cities</h1>
        <input 
          type="text" 
          value={cityInput} 
          onChange={handleCityInputChange} 
          placeholder="Enter city name" 
        />
        <button onClick={handleExploreCityClick}>Explore City</button>

        {matchingCities.length > 0 && (
          <div>
            {matchingCities.slice(0, 4).map((city) => (
              <button key={city} onClick={() => handleCitySelect(city)}>
                {city}
              </button>
            ))}
          </div>
        )}

        {selectedCity && (
          <>
            <h2>Attractions in {selectedCity}</h2>
            {loading ? <p>Loading...</p> : (
              <ul>
                {attractions.map((attraction) => (
                  <li key={attraction.id}>
                    <h3>{attraction.name}</h3>
                    <p>{attraction.description}</p>
                    <img src={attraction.image || '/travel.png'} alt={attraction.name} />
                  </li>
                ))}
              </ul>
            )}
            <button onClick={handlePrevious} disabled={page <= 1}>Previous</button>
            <button onClick={handleNext}>Next</button>
          </>
        )}
      </main>
    </>
  );
}
