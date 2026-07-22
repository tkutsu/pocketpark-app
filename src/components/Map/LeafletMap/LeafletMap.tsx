import { FC, useState, useEffect, useCallback, useMemo } from 'react';
import { LatLng, LatLngTuple, Map as IMap, Rectangle as LRectangle } from 'leaflet';
import {
  MapContainer, TileLayer, LayersControl, LayerGroup, ZoomControl, Circle, Rectangle, Polygon
} from 'react-leaflet';
import MarkerClusterGroup from 'react-leaflet-markercluster';
import Marker from './Marker';
import Path from './Path';
import Area from './Area';
import PanMap from './PanMap';
import SetBounds from './SetBounds';
import { EnumDrawType, XObservation, XTrip, EnumType, XActivity, Xgeodata } from 'shared/interfaces';
import { useMapContext } from 'shared/utilities/contextMap';
import { useRedisUserContext } from 'shared/utilities/contextRedisUser';
import { IExtraProps } from 'shared/utilities/api/getData';
import constants from 'shared/constants';
import 'leaflet/dist/leaflet.css';
import 'react-leaflet-markercluster/dist/styles.min.css';
import 'leaflet-defaulticon-compatibility/dist/leaflet-defaulticon-compatibility.css';
import 'leaflet-defaulticon-compatibility';
import s from './index.module.scss';
import c from 'shared/utilities/classname';

export interface IMapProps {
  observations?: XObservation['data'][];
  trips?: XTrip['data'][];
  activities?: XActivity['data'][];
  extra?: IExtraProps;
  draw?: boolean;
  withPlaceMarkers?: boolean;
  showPlaces?: boolean;
  showPark?: boolean;
  showAlertCircle?: boolean;
  panYpc?: number;
  panXpc?: number;
  className?: string;
  commentaries?: Xgeodata[];
}
const LeafletMap: FC<IMapProps> = ({
  observations = [], trips = [], activities = [], extra = {}, draw, withPlaceMarkers,
  showPlaces, panYpc = 0, panXpc = 0, showAlertCircle, showPark, className, commentaries = [],
}) => {
  const maxZoom = 22;
  const { park, places } = extra;
  const { mapData, setMapData } = useMapContext();
  const { user, users } = useRedisUserContext();
  const [map, setMap] = useState<IMap>();
  const [defCenter, setDefCenter] = useState<LatLngTuple>();

  const getAreaCentroid = (geo: Xgeodata[]): Xgeodata => {
    const first = geo[0], last = geo[geo.length - 1], nPts = geo.length;
    if (first.latitude != last.latitude || first.longitude != last.longitude) { geo.push(first); }
    let twicearea = 0, x = 0, y = 0, p1, p2, f;
    for (let i = 0, j = nPts - 1; i < nPts; j = i++) {
      p1 = geo[i]; p2 = geo[j];
      if (p1.longitude != null && p2.longitude != null &&
        p1.latitude != null && p2.latitude != null) {
        f = p1.longitude * p2.latitude - p2.longitude * p1.latitude;
        twicearea += f;
        x += (p1.longitude + p2.longitude) * f;
        y += (p1.latitude + p2.latitude) * f;
      }
    }
    f = twicearea * 3;
    return { longitude: x / f, latitude: y / f };
  };

  const boundingRect = useMemo(() => (park?.area || [])?.length >= 2 &&
    park?.area?.every((p) => p.latitude != null && p.longitude != null) && ({
      bounds: park.area.map(p => [p.latitude, p.longitude] as [number, number]),
      positions: park.area.map(p => [p.latitude, p.longitude] as [number, number]),
      pathOptions: {
        interactive: false,
        color: '#9c837d',
        fillColor: '#ebeee0',
        fillOpacity: 1,
        opacity: 1,
        dashArray: [10, 8, 3, 8],
        weight: 1,
      },
    }), [park?.area?.length]);

  const _handleMapClick = useCallback(({ latlng }: { latlng: LatLng; }) => {
    const pos = { latitude: latlng?.lat, longitude: latlng?.lng };
    if (!!boundingRect && park?.area && latlng?.lat != null && latlng?.lng != null) {
      const rect = new LRectangle(park.area.map(p => [p.latitude, p.longitude] as [number, number]));
      if (!rect.getBounds().contains([pos.latitude, pos.longitude])) {
        setMapData({ clicked: {} });
        return;
      }
    }
    setMapData(draw ? { drawLast: pos } : { clicked: { pos } });
  }, [setMapData, draw, !!boundingRect]);

  useEffect(() => {
    map?.on('click', _handleMapClick);
    return () => { map?.off('click', _handleMapClick); };
  }, [map, _handleMapClick]);

  useEffect(() => {
    if (Array.isArray(defCenter) && defCenter?.length === 2) {
      return;
    } else if (park?.entry?.latitude != null && park?.entry?.longitude != null) {
      setDefCenter([park.entry.latitude, park.entry.longitude]);
    } else if (user?.latitude != null && user?.longitude != null) {
      setDefCenter([user.latitude, user.longitude]);
    }
  }, [setDefCenter, defCenter == null]);

  useEffect(() => { setMapData({ clicked: {}, drawTotal: [] }); }, []);

  const alertCircle = useMemo(() => user.team != null && user.latitude != null
    && user.longitude != null && (user.radius || 0) > 0
    && ({
      center: [user.latitude, user.longitude] as [number, number],
      radius: user.radius,
      pathOptions: {
        interactive: false,
        color: '#42e',
        opacity: 0.5,
        fillOpacity: 0.075,
        dashArray: [4, 2],
        weight: 1,
      },
    }), [user.team != null, user.latitude, user.longitude, user.radius]);

  const boundsCoords = useMemo(() => {
    const parkBounds = park?.area || [];
    let dataBounds = [
      ...(observations || []).map(p => p?.attributes?.position),
      ...(trips || []).map(p => p?.attributes?.path),
      ...(activities || []).map(p => p?.attributes?.position),
    ];
    if (showPlaces || withPlaceMarkers) {
      dataBounds = [
        ...dataBounds,
        ...(places || []).map(p => p?.attributes?.geodata as Xgeodata).flat()
      ];
    }
    return ((dataBounds.length === 0 || showPark) ? parkBounds : dataBounds);
  }, [showPlaces, withPlaceMarkers]);

  return (
    <div className={c(s.container, className)}>
      {defCenter && boundsCoords != null &&
        <MapContainer
          center={defCenter} zoom={18} scrollWheelZoom={false} zoomControl={false}
          whenCreated={setMap} className={s.map} maxZoom={maxZoom}>
          <SetBounds bounds={boundsCoords} />
          <PanMap x={panXpc} y={panYpc} />
          <ZoomControl position='topright' />
          <LayersControl position='bottomright'>
            <TileLayer attribution={constants.MAP.COPYRIGHT} url={constants.MAP.TILES}
              maxNativeZoom={19} maxZoom={maxZoom} />
            <Marker geo={user} uid={user?.id} type={EnumType.user} />
            <LayersControl.Overlay name='team' checked={true}>
              <LayerGroup>
                {alertCircle && (showAlertCircle || (users || []).length > 0) &&
                  <Circle {...alertCircle} />}
                {(users || []).map(u =>
                  <Marker geo={u} uid={u.key} key={u.key} type={EnumType.people} />)}
              </LayerGroup>
            </LayersControl.Overlay>
            {park != null &&
              <LayersControl.Overlay name='places' checked={showPlaces || withPlaceMarkers}>
                <LayerGroup>
                  {places?.filter(p => p?.attributes?.type === 'point').map(p =>
                    <Marker geo={(p.attributes?.geodata || [])[0] || p.attributes?.position}
                      label={p.attributes?.label} uid={p.id} key={`points${p.id}`}
                      type={EnumType.building} img={(p.attributes?.images?.data || [])[0]}
                      withPopup withTooltip services={p.attributes?.services} />)}
                  {park?.entry != null &&
                    <Marker geo={park.entry} label='entrance' uid='entrance' withPopup withTooltip
                      img={(park.images?.data || [])[0]} type={EnumType.entrance} />}
                </LayerGroup>
              </LayersControl.Overlay>}
            {park != null &&
              <LayersControl.Overlay name='park' checked>
                <LayerGroup>
                  {(boundingRect && park.area && park.area.length > 1)
                    ? (park.area.length === 2
                      ? <Rectangle className={s.bounds} {...boundingRect} />
                      : <Polygon className={s.bounds} {...boundingRect} />)
                    : null}
                  {places?.filter(p => p?.attributes?.type === 'path').map(p =>
                    <Path geo={p.attributes?.geodata} type={EnumType.park} isFeatured uid={p.id}
                      className={c(draw && s.unselectable)} key={`paths${p.id}`}
                      label={p.attributes?.label} hex={p.attributes?.hex_color} />)}
                  {places?.filter(p => p?.attributes?.type === 'area').map(p =>
                    <Area className={c(draw && s.unselectable)} uid={p.id} label={p.attributes?.label}
                      geo={p.attributes?.geodata} type={EnumType.park} key={`areas${p.id}`}
                      hex={p.attributes?.hex_color} img={(p.attributes?.images?.data || [])[0]}
                      withPopup={!withPlaceMarkers && !draw} />)}
                  {withPlaceMarkers && places?.filter(p => p?.attributes?.type === 'path')
                    .map(p => p.attributes?.geodata &&
                      <Marker geo={(p.attributes?.geodata || [])[0] || p.attributes?.position}
                        label={p.attributes?.label} uid={p.id} key={`p-paths${p.id}`} withPopup
                        type={EnumType.park} img={(p.attributes?.images?.data || [])[0]} />)}
                  {withPlaceMarkers && places?.filter(p => p?.attributes?.type === 'area')
                    .map(p => p.attributes?.geodata &&
                      <Marker
                        geo={getAreaCentroid(p.attributes?.geodata) || p.attributes?.position}
                        label={p.attributes?.label} uid={p.id} key={`p-areas${p.id}`} withPopup
                        type={EnumType.park} img={(p.attributes?.images?.data || [])[0]} />)}
                </LayerGroup>
              </LayersControl.Overlay>}
            {!draw && observations?.length > 0 &&
              <LayersControl.Overlay name='observations' checked>
                <MarkerClusterGroup disableClusteringAtZoom={maxZoom} spiderfyOnMaxZoom={false}
                  maxClusterRadius={50}>
                  {observations.map(o =>
                    <Marker geo={o?.attributes?.position} label={o?.attributes?.label} uid={o.id}
                      key={o.id} type={o?.attributes?.taxon?.data?.attributes?.type}
                      img={o?.attributes?.image?.data} withPopup />)}
                </MarkerClusterGroup>
              </LayersControl.Overlay>}
            {!draw && commentaries?.length > 0 &&
              <LayersControl.Overlay name='commentaries' checked>
                <MarkerClusterGroup disableClusteringAtZoom={maxZoom} spiderfyOnMaxZoom={false}
                  maxClusterRadius={50}>
                  {commentaries.map((c, ind) =>
                    <Marker geo={c} label={c?.text} uid={c.id} withText={`${ind + 1}`}
                      key={`${c.id}-${ind}`} type={EnumType.trips} />)}
                </MarkerClusterGroup>
              </LayersControl.Overlay>}
            {!draw && trips.length === 1 && (trips[0]?.attributes?.path || [])?.length > 1 &&
              <LayersControl.Overlay name='trip' checked>
                <Path geo={trips[0]?.attributes?.path} label={trips[0]?.attributes?.label}
                  uid={trips[0]?.id} type={EnumType.trips} />
              </LayersControl.Overlay>}
            {!draw && (trips.length > 1 ||
              (trips.length === 1 && (trips[0]?.attributes?.path || [])?.length === 1)) &&
              <LayersControl.Overlay name='trips' checked>
                <MarkerClusterGroup disableClusteringAtZoom={maxZoom} spiderfyOnMaxZoom={false}
                  maxClusterRadius={50}>
                  {trips.map(t => t?.attributes?.path &&
                    <Marker geo={t?.attributes?.path[0]} label={t?.attributes?.label} withPopup
                      uid={t.id} key={t.id} type={EnumType.trips}
                      img={t.attributes.image?.data} />)}
                </MarkerClusterGroup>
              </LayersControl.Overlay>}
            {!draw && activities.length > 0 &&
              <LayersControl.Overlay name='activities' checked>
                <MarkerClusterGroup disableClusteringAtZoom={maxZoom} spiderfyOnMaxZoom={false}
                  maxClusterRadius={50}>
                  {activities.map(t => t?.attributes?.position &&
                    <Marker geo={t?.attributes?.position} label={t?.attributes?.label} withPopup
                      uid={t.id} key={t.id} type={EnumType.activities}
                      img={(t.attributes?.images?.data || [])[0]} />)}
                </MarkerClusterGroup>
              </LayersControl.Overlay>}
            {draw &&
              <LayersControl.Overlay name='draw' checked>
                <LayerGroup>
                  {mapData.drawType !== EnumDrawType.point && observations.map(o =>
                    <Marker geo={o?.attributes?.position} label={o?.attributes?.label} uid={o.id}
                      key={o.id} type={o?.attributes?.taxon?.data?.attributes?.type} />)}
                  {mapData?.drawTotal?.map((d, ind) =>
                    <Marker geo={d} key={ind} draw type={EnumType.generic}
                      withText={mapData.drawType === EnumDrawType.path ? ind + 1 : undefined} />)}
                  {mapData.drawType === EnumDrawType.path &&
                    <Path geo={mapData.drawTotal} type={EnumType.trips} />}
                  {mapData.drawType === EnumDrawType.area &&
                    <Area geo={mapData.drawTotal} type={EnumType.park} />}
                </LayerGroup>
              </LayersControl.Overlay>}
          </LayersControl>
        </MapContainer>}
    </div>
  );
};

export default LeafletMap;

