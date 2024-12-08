import React, { memo } from 'react';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';

// Register Chart.js components
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const BarChart = ({ data, selectedBasin }) => {
  if (!selectedBasin) {
    return (
      <div style={{ height: '400px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <div>Select a basin on the map to see the chart</div>
      </div>
    );
  }

  const basinData = data.find((item) => item.properties.RIVERBASIN === selectedBasin) || data.find((item) => item.properties.RIVERBASIN === 'AMUR');

  if (!basinData) {
    return (
      <div style={{ height: '400px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <div>No data available for this basin</div>
      </div>
    );
  }

  // Extract monthly data for the selected basin and handle missing data
  const monthlyData = [
    basinData.properties.jan || 0,
    basinData.properties.feb || 0,
    basinData.properties.mar || 0,
    basinData.properties.apr || 0,
    basinData.properties.may || 0,
    basinData.properties.jun || 0,
    basinData.properties.jul || 0,
    basinData.properties.aug || 0,
    basinData.properties.sep || 0,
    basinData.properties.oct || 0,
    basinData.properties.nov || 0,
    basinData.properties.dec || 0,
  ];

  const chartData = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
    datasets: [
      {
        label: `Monthly Water Shortage for ${selectedBasin}`,
        data: monthlyData,
        backgroundColor: 'rgba(255, 99, 132, 0.6)', // Soft red-pink color for bars with transparency
        borderColor: 'rgba(255, 99, 132, 1)', // Darker border for bars
        borderWidth: 1, // Thin border around bars
      },
    ],
  };

  const options = {
    responsive: true,
    plugins: {
      title: {
        display: true,
        text: `Water Scarcity Trends for ${selectedBasin}`,
        font: {
          size: 18,
        },
      },
      tooltip: {
        callbacks: {
          label: (context) => `${context.raw} mm of water shortage`, // More informative tooltip
        },
      },
    },
    scales: {
      x: {
        grid: {
          color: 'rgba(0, 0, 0, 0.1)', // Light gridline color for better contrast
        },
        ticks: {
          color: 'rgba(0, 0, 0, 0.7)', // Darker tick labels for readability
        },
      },
      y: {
        grid: {
          color: 'rgba(0, 0, 0, 0.1)', // Light gridline color for better contrast
        },
        ticks: {
          color: 'rgba(0, 0, 0, 0.7)', // Darker tick labels for readability
        },
      },
    },
    layout: {
      padding: {
        left: 20,
        right: 20,
        top: 20,
        bottom: 20,
      },
    },
  };

  return (
    <div style={{ padding: '0px', background: 'transparent', borderRadius: '3px', height: '400px',
        minHeight: '400px', // This ensures the container doesn't collapse
        height: '100%', // Ensure it occupies full available space
     }}>
      <Bar data={chartData} options={options} />
    </div>
  );
};

export default memo(BarChart);
