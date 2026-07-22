import { useState, useEffect } from 'react';
import { Xgeodata } from 'shared/interfaces';
import { useNoteContext } from './contextNotes';

const defaultSettings = {
  enableHighAccuracy: true,
  timeout: 5000,
  maximumAge: 5000,
};

const useGeo = ({ watch = false, settings = {} }) => {
  const _settings = { ...defaultSettings, ...settings };
  const { addNote } = useNoteContext();
  const [position, setPosition] = useState<Xgeodata>();
  const [error, setError] = useState<string | null>(null);

  const onChange: PositionCallback = ({ coords, timestamp }) => {
    setPosition({ latitude: coords?.latitude, longitude: coords?.longitude, id: `${timestamp}` });
    setError(null);
  };

  const onError: PositionErrorCallback = (error) => setError(
    error?.code === 1
      ? 'Geolocation permission denied'
      : (error?.code === 2 ? 'Geolocation device error' : null));

  useEffect(() => {
    error != null && error !== '' && addNote({ id: 'geoError', text: error, warning: true });
  }, [error]);

  useEffect(() => {
    const geo = navigator?.geolocation;
    if (!geo) { return setError('Geolocation not supported'); }
    geo.getCurrentPosition(onChange, onError, _settings);
    if (watch) {
      const watcher = geo.watchPosition(onChange, onError, _settings);
      return () => geo.clearWatch(watcher);
    }
  }, [watch, _settings.enableHighAccuracy, _settings.timeout, _settings.maximumAge]);

  return { ...position, error };
};

export default useGeo;
