import React from 'react';
import dynamic from 'next/dynamic';
const ResponsiveTreeMap = dynamic(() => import('@nivo/treemap').then(mod => mod.ResponsiveTreeMap), { ssr: false });

// Function to calculate Water Scarcity * Population for each basin
const calculateWaterScarcity = (data) => {
  const hierarchy = {
    name: 'Water Scarcity * Population',
    children: [],
  };

  // Process each basin
  data.forEach(item => {
    const waterScarcity = item.properties.average; // Use average water scarcity
    const population = item.properties.population;

    // Skip if data is missing
    if (waterScarcity === undefined || population === undefined) {
      return;
    }

    const value = waterScarcity * population; // Water scarcity * population

    hierarchy.children.push({
      id: item.properties.RIVERBASIN,
      value,
      population,
      waterScarcity,
      continent: item.properties.CONTINENT, // Store the continent for color mapping
    });
  });

  // Sort the basins by water scarcity * population in descending order
  hierarchy.children.sort((a, b) => b.value - a.value);

  return hierarchy;
};

// Define color scheme based on continents
const continentColorMapping = {
    Africa: '#FF8C00',      // Vibrant Orange for Africa
    Asia: '#FF1493',        // Deep Pink for Asia
    Europe: '#32CD32',      // Lime Green for Europe
    NorthAmerica: '#1E90FF', // Dodger Blue for North America
    SouthAmerica: '#FFD700', // Gold for South America
    Australia: '#FF4500',   // Orange Red for Australia
    Antarctica: '#00CED1',  // Dark Turquoise for Antarctica
  };

const TreeMap = ({ geojsonData, setSelectedBasin }) => {
  if (!geojsonData) {
    return <div>No data available</div>;
  }

  const treeMapData = calculateWaterScarcity(geojsonData.features);

  const handleTreeMapHover = (node) => {
    setSelectedBasin(node.id); // Set the selected basin from TreeMap hover
  };

  return (
    <div style={{ height: '380px', backgroundColor: '#f5f5dc',border:'none' }}> {/* Beige background for the container */}
      <ResponsiveTreeMap
        data={treeMapData}
        id="id"
        value="value"
        valueFormat=".02s"
        innerPadding={0}  // Remove inner padding
        outerPadding={0}  // Remove outer padding
        leavesOnly={false}
        enableLabels={true}
        label={(node) => {
          // Ensure node.id is defined and limit to 10 characters
          return node.id && node.id.length > 10 ? `${node.id.substring(0, 10)}...` : node.id;
        }} // Limit label to 10 chars
        labelSkipSize={12}
        tooltip={(node) => {
          if (!node.data) return null;

          const waterScarcity = node.data.waterScarcity || 0; // Ensure waterScarcity is a number
          const population = node.data.population || 0; // Ensure population is a number

          return (
            <div style={{ backgroundColor: 'transparent', border:'none'}}>
              <strong>{node.id}</strong>
              <br />
              Water Scarcity: {waterScarcity} mm
              <br />
              Population: {population}
              <br />
              <strong>Value: {node.value}</strong>
            </div>
          );
        }}
        colors={(node) => continentColorMapping[node.data.continent] || '#808080'} // Color based on continent
        onMouseEnter={handleTreeMapHover}
        padding={0} // Remove general padding
      />
    </div>
  );
};

export default TreeMap;
