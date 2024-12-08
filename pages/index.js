import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import path from 'path';
import fs from 'fs';
import TreeMap from '../components/TreeMap';  // Import the TreeMap component
import BarChart from '../components/BarChart';

// Dynamically import the Map component to prevent SSR issues with Leaflet
const Map = dynamic(() => import('../components/Map'), { ssr: false });

export default function Home({ geojsonData }) {
  const [selectedBasin, setSelectedBasin] = useState(null); // Store selected basin
  const [loading, setLoading] = useState(true); // Loading state

  // When the data is available, stop loading
  useEffect(() => {
    if (geojsonData) {
      setLoading(false);
    }
  }, [geojsonData]);

  const onMapAreaSelect = (areaId) => {
    setSelectedBasin(areaId);  // Update selected basin on map click
  };

  if (loading) {
    // Render loading screen while data is being fetched
    return (
      <div className="spinner">
        <div>
          <h2>Loading...</h2>
          <p>Fetching data and preparing the map...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px' }}>
      <div className="element">
        <h1 style={{ textAlign: 'center', marginBottom: '20px' }}>Water Scarcity Through Time</h1>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '2fr 1fr',
          gridTemplateRows: 'auto auto',
          gap: '20px',
        }}
      >
        {/* Map Section */}
        <div
          style={{
            gridColumn: '1 / 2',
            gridRow: '1 / 3',
            border: '1px solid #ccc',
            borderRadius: '8px',
            overflow: 'hidden',
          }}
        >
          <Map geojsonData={geojsonData} onMapAreaSelect={onMapAreaSelect} selectedMapArea={selectedBasin} />
        </div>

        {/* Bar Chart Section */}
        <div
          style={{
            gridColumn: '2 / 3',
            gridRow: '1 / 2',
            border: '1px solid #ccc',
            borderRadius: '8px',
            padding: '0px',
            minHeight: '260px', // This ensures the container doesn't collapse
          }}
        >
          <BarChart data={geojsonData.features} selectedBasin={selectedBasin} />
        </div>

        {/* TreeMap Section */}
        <div
          style={{
            gridColumn: '2 / 3',
            gridRow: '2 / 3',
            border: 'none',
            padding: '0px'
          }}
        >
          <TreeMap geojsonData={geojsonData} setSelectedBasin={setSelectedBasin} />
        </div>
      </div>
    </div>
  );
}



export async function getServerSideProps() {
  try {
    // Resolve the file path for local or Vercel deployment
    const filePath = path.join(process.cwd(), 'public', 'updated_mrb_basins.json');
    
    // Read the file directly
    const fileContent = fs.readFileSync(filePath, 'utf8');
    
    const geojsonData = JSON.parse(fileContent);

    return {
      props: {
        geojsonData,
      },
    };
  } catch (error) {
    console.error('Error loading GeoJSON data:', error);
    return {
      props: {
        geojsonData: null,
      },
    };
  }
}


