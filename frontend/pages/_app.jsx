import React from 'react';
import '../styles/globals.css';

// eslint-disable-next-line react/jsx-props-no-spreading
export default function App({ Component, pageProps }) {
  return <Component {...pageProps} />;
}

