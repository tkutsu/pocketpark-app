import { FC, useEffect, useMemo, useState } from 'react';
import { Marker as LMarker, Popup, Tooltip, useMap, useMapEvents } from 'react-leaflet';
import { icon as LIcon } from 'leaflet';
import {
  FaBinoculars, FaCreativeCommonsBy, FaFireExtinguisher, FaFirstAid,
  FaHandHoldingWater, FaHome, FaInfo, FaParking, FaPhone,
} from 'react-icons/fa';
import Card from 'components/Card';
import { EnumType, Xfile, Xgeodata, XService } from 'shared/interfaces';
import { EnumXService } from 'shared/interfaces/graphql/XService';
import { useMapContext } from 'shared/utilities/contextMap';
import c from 'shared/utilities/classname';
import s from './index.module.scss';

type IProps = {
  geo?: Xgeodata;
  uid?: string;
  label?: string;
  services?: XService[];
  draw?: boolean;
  type?: EnumType;
  img?: Xfile['data'];
  withPopup?: boolean;
  withTooltip?: boolean;
  withText?: string | number;
};
const Marker: FC<IProps> = ({
  geo = {}, uid, label, draw, type, img, withPopup, withTooltip, services = [], withText,
}) => {
  const showlabelMinZoom = 17;
  const [clicked, setClicked] = useState(false);
  const { mapData, setMapData } = useMapContext();
  const map = useMap();
  const [zoom, setZoom] = useState(showlabelMinZoom);

  const getMarkerPath = (name: EnumType, isSelected?: boolean) => '/markers/' +
    `marker-${name}${isSelected && label != null ? '-selected' : ''}` +
    `.${name === EnumType.shadow ? 'png' : 'svg'}`;

  const eventHandlers = {
    click: () => {
      const clickedId = mapData?.clicked?.uid === uid && mapData.clicked?.type === type
        ? undefined
        : uid;
      geo && setMapData(draw ? { drawLast: geo } : { clicked: { uid: clickedId, type } });
    },
  };

  useEffect(() => {
    setClicked(mapData.clicked?.uid === uid && mapData.clicked?.type === type);
  }, [uid, mapData.clicked?.uid, mapData.clicked?.type, type]);

  useEffect(() => { zoom == null && setZoom(map.getZoom()); }, [zoom == null && map.getZoom()]);

  useMapEvents({ zoomend: ({ target }) => { setZoom(target._zoom); } });

  const icon = useMemo(() => LIcon({
    iconUrl: getMarkerPath(type || EnumType.generic, clicked || draw),
    shadowUrl: type === EnumType.user ? undefined : getMarkerPath(EnumType.shadow),
    iconSize: type === EnumType.user ? [22, 22] : [50, 50],
    iconAnchor: type === EnumType.user ? [11, 11] : [25, 50],
    shadowSize: type === EnumType.user ? undefined : [50, 50],
    shadowAnchor: type === EnumType.user ? undefined : [15, 50],
    popupAnchor: type === EnumType.user ? [0, 22] : [0, -50],
  }), [type, getMarkerPath, clicked, draw]);

  const url = useMemo(() => {
    if (type === EnumType.entrance) {
      return '/';
    } else if (type === EnumType.animals || type === EnumType.plants) {
      return `/observations/${uid}`;
    } else if (type === EnumType.building) {
      return `/park/${uid}`;
    } else {
      return `/${type}/${uid}`;
    }
  }, [type, uid]);

  const IconList = useMemo(() => services.map((s, ind) => {
    if (s?.value === EnumXService.drinking_water) {
      return <FaHandHoldingWater key={ind} />;
    } else if (s?.value === EnumXService.entrance_services) {
      return <FaHome key={ind} />;
    } else if (s?.value === EnumXService.fire_hydrant) {
      return <FaFireExtinguisher key={ind} />;
    } else if (s?.value === EnumXService.first_aid) {
      return <FaFirstAid key={ind} />;
    } else if (s?.value === EnumXService.information) {
      return <FaInfo key={ind} />;
    } else if (s?.value === EnumXService.observation_point) {
      return <FaBinoculars key={ind} />;
    } else if (s?.value === EnumXService.telephone) {
      return <FaPhone key={ind} />;
    } else if (s?.value === EnumXService.parking) {
      return <FaParking key={ind} />;
    } else if (s?.value === EnumXService.toilet) {
      return <FaCreativeCommonsBy key={ind} />;
    } else {
      return null;
    }
  }), [services?.length]);

  return (geo?.latitude == null || geo?.longitude == null ? null :
    <LMarker position={[geo.latitude, geo.longitude]} eventHandlers={eventHandlers} icon={icon}
      interactive={type !== EnumType.user}>
      {withPopup
        ? <Popup className={s.popup}>
          <Card image={img} link={url} text={label} noPadding />
        </Popup>
        : label != null && !withTooltip && <Tooltip>{label}</Tooltip>}
      {withTooltip && (zoom >= showlabelMinZoom)
        ? <Tooltip permanent direction='center'
          className={c(s.tooltip, services.length > 0 && s.withIcons)}>
          {label}
          {services.length > 0 && <div className={s.icons}>{IconList}</div>}
        </Tooltip>
        : withText != null && withText !== '' &&
        <Tooltip permanent direction='center' className={c(s.tooltip, s.text)}>
          {withText}
        </Tooltip>}
      {withText != null && withText !== '' && !withPopup &&
        <Popup className={s.textPopup}>{label}</Popup>}
    </LMarker>
  );
};

export default Marker;
