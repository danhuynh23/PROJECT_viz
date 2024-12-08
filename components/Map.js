import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, GeoJSON, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import * as d3 from 'd3';
import styles from '../styles/Map.module.css';  // Import your CSS module



const formatNumberWithCommas = (num) => new Intl.NumberFormat().format(num);

const MONTHS = [
  'jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec',
];

// Calculate global min/max for all monthly data
const calculateMonthlyGlobalMinMax = (data) => {
  const allValues = data.features.flatMap((f) =>
    MONTHS.map((month) => f.properties[month]).filter((v) => v !== null && v !== undefined)
  );

  const min = Math.min(...allValues);
  const max = Math.max(...allValues);

  return { min, max };
};

// Create a quantile scale for non-continuous data
const createQuantileColorScale = (data, property) => {
  const values = data.features
    .map((f) => f.properties[property])
    .filter((v) => v !== null && v !== undefined);

  return d3
    .scaleQuantile()
    .domain(values)
    .range(['#FFEDA0', '#FED976', '#FEB24C', '#FD8D3C', '#FC4E2A', '#E31A1C', '#BD0026', '#800026']);
};

// Create a fixed continuous scale for monthly data
const createFixedContinuousColorScale = (min, max) => {
  return d3.scaleLinear().domain([min, max]).range(['#eff3ff', '#08519c']);
};

// Style GeoJSON features (polygons)
const geoJSONStyle = (colorScale, property, feature, selectedMapArea) => {
  const value = feature.properties[property] || 0;
  const isSelected = feature.properties.RIVERBASIN === selectedMapArea; // Check if the basin is selected
  return {
    fillColor: colorScale(value),
    weight: isSelected ? 5 : 2, // Increase border width for selected basin
    opacity: 1,
    color: isSelected ?'blue':'white',
    dashArray: '3',
    fillOpacity: 0.7,
  };
};

// Rivers style
const riversStyle = {
  color: 'blue',
  weight: 2,
  opacity: 1,
  fillOpacity: 0,
};

// Legend Component
const Legend = ({ colorScale, property, isContinuous }) => {
  const map = useMap();

  useEffect(() => {
    if (!colorScale) return;

    const legend = L.control({ position: 'bottomright' });

    legend.onAdd = () => {
      const div = L.DomUtil.create('div', 'info legend');
      let labels = '';

      if (isContinuous) {
        const [min, max] = colorScale.domain();
        labels = `
          <div>
            <div style="background: linear-gradient(to right, ${colorScale(min)}, ${colorScale(max)}); width: 100%; height: 10px;"></div>
          </div>
          <div>
            <span>${formatNumberWithCommas(min)}</span> – <span>${formatNumberWithCommas(max)}</span>
          </div>
        `;
      } else {
        const grades = colorScale.quantiles();
        labels = grades
          .map((grade, i) => {
            const nextGrade = grades[i + 1];
            const color = colorScale(grade);
            return `<i style="background:${color}; width:15px; height:15px; display:inline-block; margin-right:5px; border-radius:3px;"></i> ${
              nextGrade
                ? `${formatNumberWithCommas(grade)} – ${formatNumberWithCommas(nextGrade)}`
                : `${formatNumberWithCommas(grade)}+`
            }`;
          })
          .join('<br>');
      }

      div.innerHTML = `<h4>${property.toUpperCase()}</h4>${labels}`;
      return div;
    };

    legend.addTo(map);

    return () => {
      legend.remove();
    };
  }, [colorScale, map, property, isContinuous]);

  return null;
};

// Main Map Component
const Map = ({ geojsonData, riversData, onMapAreaSelect, selectedMapArea}) => {
  const [selectedProperty, setSelectedProperty] = useState('population');
  const [selectedMonth, setSelectedMonth] = useState('jan');
  const [colorScale, setColorScale] = useState(null);
  const [isContinuous, setIsContinuous] = useState(false);
  const [monthlyGlobalMinMax, setMonthlyGlobalMinMax] = useState(null);
  const [mapKey, setMapKey] = useState(0); // key to force re-mount of the MapContainer

  useEffect(() => {
    if (geojsonData) {
      const { min, max } = calculateMonthlyGlobalMinMax(geojsonData);
      setMonthlyGlobalMinMax({ min, max });
    }
  }, [geojsonData]);

  useEffect(() => {
    let propertyToView = selectedProperty === 'monthly' ? selectedMonth : selectedProperty;
    if (geojsonData && propertyToView) {
      let scale;
      if (selectedProperty === 'monthly' && monthlyGlobalMinMax) {
        scale = createFixedContinuousColorScale(monthlyGlobalMinMax.min, monthlyGlobalMinMax.max);
        setIsContinuous(true);
      } else {
        scale = createQuantileColorScale(geojsonData, propertyToView);
        setIsContinuous(false);
      }
      setColorScale(() => scale);
    }
  }, [geojsonData, selectedProperty, selectedMonth, monthlyGlobalMinMax]);

  // Force full map reload when property changes
  useEffect(() => {
    setMapKey((prevKey) => prevKey + 1);
  }, [selectedProperty]);

  const onEachFeature = (feature, layer) => {
    const updateStyle = () => {
      const propertyToDisplay = selectedProperty === 'monthly' ? selectedMonth : selectedProperty;
      const style = geoJSONStyle(colorScale, propertyToDisplay, feature);
      layer.setStyle(style);
    };

    const propertyToDisplay = selectedProperty === 'monthly' ? selectedMonth : selectedProperty;
    const propertyValue = feature.properties[propertyToDisplay] || 'No Data';
    const formattedValue =
      propertyValue !== 'No Data' ? formatNumberWithCommas(propertyValue) : propertyValue;
    const basinName = feature.properties.RIVERBASIN || 'Unknown Basin';

    layer.on({
      mouseover: (e) => {
        onMapAreaSelect(feature.properties.RIVERBASIN);  // Notify parent of selected area
        const layer = e.target;
        layer.setStyle({
          weight: 5,
          color: '#666',
          dashArray: '',
          fillOpacity: 0.9,
        });
        layer.bringToFront();
        layer.bindPopup(
          `<strong>Basin:</strong> ${basinName}<br/><strong>${propertyToDisplay}:</strong> ${formattedValue}`
        );
        layer.openPopup();
      },
      mouseout: () => {
        updateStyle();
        layer.closePopup();

      // Clear selected area
      onMapAreaSelect(null);

      },
    });

    updateStyle(); // Ensure correct initial style
  };

  return (
    <div className={styles.mapContainer}>
      {/* UI Controls */}
      <div  className={styles.uiControlsContainer}>
      <div className={styles.uiControls}>
        <label htmlFor="property-select"></label>
        <select
          id="property-select"
          value={selectedProperty}
          onChange={(e) => setSelectedProperty(e.target.value)}
        >
          <option value="population">Population</option>
          <option value="average">Average Scarcity</option>
          <option value="monthly">Monthly Data</option>
        </select>
      </div>

      {selectedProperty === 'monthly' && (
        <div className={styles.uicontrolsbars}>
          <div className="rangeControl">
          <label htmlFor="month-select"></label>
          <input
            id="month-select"
            type="range"
            min="0"
            max="11"
            step="1"
            value={MONTHS.indexOf(selectedMonth)}
            onChange={(e) => setSelectedMonth(MONTHS[e.target.value])}
          />
          <span>{selectedMonth.toUpperCase()}</span>
          </div>
        </div>
      
      )}
      </div>

      {/* Single MapContainer that is reloaded on property changes */}
      <MapContainer key={mapKey} center={[40, 40]} zoom={2} style={{ height: '100vh', width: '100%' }}>
      <TileLayer
          url="https://cartocdn_{s}.global.ssl.fastly.net/base-antique/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />


        {/* Rivers Layer */}
        {riversData && (
          <GeoJSON
            data={riversData}
            style={riversStyle}
          />
        )}

        {/* Polygon Layer */}
        {colorScale && (
          <GeoJSON
            data={geojsonData}
            style={(feature) =>
              geoJSONStyle(
                colorScale,
                selectedProperty === 'monthly' ? selectedMonth : selectedProperty,
                feature,
                selectedMapArea
              )
            }
            onEachFeature={onEachFeature}
          />
        )}

        {/* Legend */}
        {colorScale && (
          <Legend
            colorScale={colorScale}
            property={selectedProperty === 'monthly' ? selectedMonth : selectedProperty}
            isContinuous={isContinuous}
          />
        )}
      </MapContainer>
    </div>
  );
};

export default Map;
