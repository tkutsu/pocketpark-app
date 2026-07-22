import Card from 'components/Card';
import { LatLngExpression, FillRule } from 'leaflet';
import { FC, useEffect, useMemo, useState } from 'react';
import { Polygon, Popup, Tooltip, useMap, useMapEvents } from 'react-leaflet';
import { Xgeodata, EnumType, Xfile } from 'shared/interfaces';
import { useMapContext } from 'shared/utilities/contextMap';
import c from 'shared/utilities/classname';
import s from './index.module.scss';

type IProps = {
  geo?: Xgeodata[];
  label?: string;
  uid?: string;
  type?: EnumType;
  className?: string;
  hex?: string;
  withPopup?: boolean;
  img?: Xfile['data'];
};
const Area: FC<IProps> = ({ geo = [], label, hex, uid, type, className, img, withPopup }) => {
  const showlabelMinZoom = 17;
  const { mapData, setMapData } = useMapContext();
  const map = useMap();
  const [zoom, setZoom] = useState(showlabelMinZoom);

  const _geo = geo.map(g => ({ lat: g.latitude, lng: g?.longitude }))
    .filter(g => g?.lat != null || g?.lng != null) as LatLngExpression[];

  const pathOptions = useMemo(() => ({
    stroke: false,
    fill: true,
    fillColor: hex || '#000',
    fillOpacity: 0.15,
    fillRule: 'nonzero' as FillRule
  }), [hex]);

  const url = `/park/${uid}`;

  const eventHandlers = {
    click: () => {
      setMapData({ clicked: { uid: mapData?.clicked?.uid === uid ? undefined : uid, type } });
    },
  };

  useEffect(() => { zoom == null && setZoom(map.getZoom()); }, [zoom == null && map.getZoom()]);

  useMapEvents({ zoomend: ({ target }) => { setZoom(target._zoom); } });

  return _geo?.length > 0
    ? <Polygon positions={_geo} pathOptions={pathOptions} eventHandlers={eventHandlers}
      className={c(className, !withPopup && s.unselectable)}>
      {label != null && (zoom >= showlabelMinZoom) &&
        <Tooltip permanent direction='center' className={s.tooltip}>
          <div style={{ color: hex || '#000' }}>{label}</div>
        </Tooltip>}
      {label != null && withPopup &&
        <Popup className={s.popup}>
          <Card image={img} link={url} text={label} noPadding />
        </Popup>}
    </Polygon>
    : null;
};

export default Area;
