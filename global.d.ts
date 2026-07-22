/**
 * Type definitions for react-leaflet-markercluster:^3.0.0-rc1
 * Requires '@types/leaflet.markercluster'
 */
declare module 'react-leaflet-markercluster' {
  import { Component } from 'react';
  import { MarkerClusterGroupOptions } from 'leaflet';

  export default abstract class MarkerClusterGroup extends Component<MarkerClusterGroupOptions> { }
}
