'use client';

import { APIProvider, Map } from '@vis.gl/react-google-maps';

export default function GoogleMap() {
  const API_KEY = '';
  return (
    <div>
      <APIProvider apiKey={API_KEY}>
        <Map
          defaultCenter={{ lat: 22.54992, lng: 0 }}
          defaultZoom={3}
          gestureHandling="greedy"
          disableDefaultUI
        />
      </APIProvider>
    </div>
  );
}
