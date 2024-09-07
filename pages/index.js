import Head from 'next/head';
import { useState } from 'react';

export default function Home() {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://sightseeing-seven.vercel.app';
  const [city, setCity] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLookup = async () => {
    if (!city) {
      console.log('No city entered.');
      alert('Please enter a city!');
      return;
    }

    setLoading(true);
    console.log(`Looking up city: ${city}`);

    try {
      // Sending the POST request to the server with the city_text variable
      const res = await fetch(`${baseUrl}/api/matchCity`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ city_text: city }),  // Send city value as city_text
      });

      // Log the response status
      console.log('Response status:', res.status);

      if (!res.ok) {
        throw new Error(`Error fetching data: ${res.statusText}`);
      }

      const result = await res.text();  // Using `.text()` for HTML response
      document.body.innerHTML = result;  // Replace the body content with the returned HTML

    } catch (error) {
      console.error('Error during fetch:', error);
      alert('An error occurred. Check the console for details.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Head>
        <title>Travel App - Explore Cities</title>
        <meta property="fc:frame" content="vNext" />
        <meta property="fc:frame:image" content={`${baseUrl}/travel.png`} />
        <meta property="fc:frame:button:1" content="Lookup City" />
        <meta property="fc:frame:button:1:action" content="post" />
        <meta property="fc:frame:post_url:1" content={`${baseUrl}/api/matchCity`} />

        {/* Input for city */}
        <meta property="fc:frame:input:text" content="Enter a city" />
        <meta property="fc:frame:input:text:value" content={city} />
        <meta property="fc:frame:post_url" content={`${baseUrl}/api/matchCity`} />
      </Head>

      <main style={{ textAlign: 'center', marginTop: '50px' }}>
        <div>
          <label htmlFor="city-input">Enter a City:</label>
          <input
            id="city-input"
            type="text"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            placeholder="Enter a city"
            style={{ padding: '10px', margin: '20px', fontSize: '16px' }}
          />
        </div>
        <div>
          <button onClick={handleLookup} style={{ padding: '10px 20px', marginRight: '10px' }} disabled={loading}>
            {loading ? 'Looking up...' : 'Lookup City'}
          </button>
        </div>
      </main>
    </>
  );
}
