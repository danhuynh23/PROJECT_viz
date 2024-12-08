import '../styles/globals.css';  // Import global styles here
import React from 'react';

function MyApp({ Component, pageProps }) {
  return <Component {...pageProps} />;
}

export default MyApp;