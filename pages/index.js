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
      const res = await fetch(`${baseUrl}/api/matchCity`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ city_text: city }),
      });

      console.log('Response status:', res.status);

      if (!res.ok) {
        throw new Error(`Error fetching data: ${res.statusText}`);
      }

      const result = await res.text();
      document.body.innerHTML = result;

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
        <meta property="fc:frame:post_url" content={`${baseUrl}/api/matchCity`} />
        <meta property="fc:frame:input:text" content="Enter a city" />
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