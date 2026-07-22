import { FC, useEffect, useState } from 'react';
import { useMap } from 'react-leaflet';

const defY = 0;
const defX = 0;
interface IProps { x?: number; y?: number; }
const PanMap: FC<IProps> = ({ x = defX, y = defY }) => {
  const map = useMap();
  const [firstPan, setFirstPan] = useState(true);
  const [lastPan, setLastPan] = useState({ x: defX, y: defY });

  useEffect(() => {
    map.panBy(
      [map.getSize().x * (x - lastPan.x) / 2, map.getSize().y * (y - lastPan.y) / 2],
      { animate: !firstPan }
    );
    setFirstPan(false);
    setLastPan({ x, y });
  }, [x, y, setFirstPan, setLastPan, map != null]);
  return null;
};

export default PanMap;
