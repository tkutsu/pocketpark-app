import { FC, useEffect, useMemo, useState } from 'react';
import { LatLngExpression } from 'leaflet';
import { Polyline, useMapEvents, useMap } from 'react-leaflet';
import { Xgeodata, EnumType } from 'shared/interfaces';
import { useMapContext } from 'shared/utilities/contextMap';
import c from 'shared/utilities/classname';
import s from './index.module.scss';

type IProps = {
  geo?: Xgeodata[];
  label?: string;
  uid?: string;
  type?: EnumType;
  className?: string;
  isFeatured?: boolean;
  hex?: string;
};
const Path: FC<IProps> = ({ geo = [], type, isFeatured, uid, className, hex }) => {
  const { mapData, setMapData } = useMapContext();
  const map = useMap();
  const [zoom, setZoom] = useState(18);

  const _geo = geo.map(g => ({ lat: g.latitude, lng: g?.longitude }))
    .filter(g => g?.lat != null || g?.lng != null) as LatLngExpression[];

  const getPathWeight = (zoom = 17) => {
    if (zoom >= 22) { return 50; }
    if (zoom >= 21) { return 30; }
    if (zoom >= 20) { return 15; }
    if (zoom >= 19) { return 8; }
    if (zoom >= 18) { return 5; }
    if (zoom >= 17) { return 3; }
    if (zoom >= 16) { return 1.5; }
    return 1.5;
  };

  const pathOptions = useMemo(() => ({
    weight: getPathWeight(zoom) * (isFeatured ? 1 : 1.5),
    stroke: true,
    color: hex || (isFeatured ? '#aa9' : '#30c'),
    opacity: isFeatured ? 1 : 0.5,
    dashArray: undefined,
    dashOffset: undefined
  }), [zoom, hex, isFeatured]);

  const eventHandlers = {
    click: () => {
      setMapData({ clicked: { uid: mapData?.clicked?.uid === uid ? undefined : uid, type } });
    },
  };

  useEffect(() => { zoom == null && setZoom(map.getZoom()); }, [zoom == null && map.getZoom()]);

  useMapEvents({ zoomend: ({ target }) => { setZoom(target._zoom); } });

  return _geo?.length > 0
    ? <Polyline positions={_geo} pathOptions={pathOptions}
      eventHandlers={eventHandlers} smoothFactor={1} className={c(className, s.unselectable)}>
    </Polyline>
    : null;
};

export default Path;
