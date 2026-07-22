import { useEffect, FC } from 'react';
import { useMap } from 'react-leaflet';
import { LatLngTuple } from 'leaflet';
import { Xgeodata } from 'shared/interfaces';
import PanMap from '../PanMap';

interface IsetBounds { bounds?: (Xgeodata[] | Xgeodata | undefined)[]; }

const SetBounds: FC<IsetBounds> = ({ bounds = [] }) => {
  const map = useMap();
  useEffect(() => {
    const _bounds = bounds
      .flat()
      .filter((b): b is Xgeodata => b?.latitude != null && b?.longitude != null)
      .map(b => [b.latitude, b.longitude] as LatLngTuple);
    _bounds?.length > 0 && map.fitBounds(_bounds, { padding: [0, 20], maxZoom: 19 });
  }, []);
  return <PanMap y={33} />;
};

export default SetBounds;
