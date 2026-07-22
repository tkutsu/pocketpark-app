import { useState, createContext, ReactNode, useContext, useCallback, useEffect } from 'react';
import { saveStorage, loadStorage } from 'shared/utilities/localStorage';
import { IMapContext, EnumDrawType } from 'shared/interfaces';

interface IContextProps {
  mapData: IMapContext;
  setMapData: (u: IMapContext) => void;
  resetMapData: () => void;
}

const MapContext = createContext<IContextProps>({
  mapData: {},
  setMapData: () => { },
  resetMapData: () => { },
});

interface IProps { mapData?: IMapContext; children?: ReactNode }
export const MapProvider = ({ mapData: defMapData = {}, children }: IProps) => {
  const [mapData, setMapData] = useState<IMapContext>(defMapData);

  useEffect(() => {
    const storageMap = loadStorage('map') || {};
    setMapData(old => ({ ...old, ...storageMap }));
  }, [loadStorage, saveStorage, setMapData]);

  const updateMapData = useCallback((_mapData: IMapContext) => {
    setMapData(old => {
      const drawType = _mapData.drawType || old.drawType;
      const drawTotal = [...(_mapData.drawTotal || old.drawTotal || [])];
      const drawLast = _mapData.drawLast;
      let newDrawTotal = drawTotal;
      if (drawType !== old.drawType) {
        newDrawTotal = _mapData.drawTotal || [];
      } else if (drawType && drawLast?.latitude != null && drawLast?.longitude != null) {
        newDrawTotal = drawTotal.filter(({ latitude, longitude }) =>
          latitude !== drawLast?.latitude && longitude !== drawLast?.longitude);
        if (newDrawTotal.length === drawTotal.length || drawTotal.length === 0) {
          if (drawType === EnumDrawType.point || drawTotal.length === 0) {
            newDrawTotal = [drawLast];
          } else if (drawType === EnumDrawType.path || drawType === EnumDrawType.area) {
            newDrawTotal = [...drawTotal, drawLast];
          }
        }
      }
      const newMap = { ...old, ..._mapData, drawTotal: newDrawTotal };
      saveStorage('map', newMap);
      return (newMap);
    });
  }, [setMapData, saveStorage]);

  const resetMapData = useCallback(() => {
    setMapData({});
    saveStorage('map', {});
  }, [setMapData, saveStorage]);

  const value = { mapData, setMapData: updateMapData, resetMapData };

  return (
    <MapContext.Provider value={value}>
      {children}
    </MapContext.Provider>
  );
};

export const useMapContext = () => useContext(MapContext);
