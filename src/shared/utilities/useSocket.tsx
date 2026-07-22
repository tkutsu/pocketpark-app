import { useCallback, useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { ISocketUser } from 'shared/interfaces';
import config from 'shared/constants';

interface IUseSocket {
  (props: { event?: string, channel?: string }): [ISocketUser[], (d: ISocketUser) => void];
}

const useSocket: IUseSocket = ({ event = config.REDIS.EVENT, channel = config.REDIS.CHANNEL }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [data, setData] = useState<ISocketUser[]>([]);

  const handleUpdate = useCallback((newData: ISocketUser[]) => {
    setData((oldData = []) => {
      const _oldData = oldData.filter(o => !newData.some(d => d.key === o.key));
      return [..._oldData, ...newData];
    });
  }, [setData]);

  useEffect(() => {
    const _socket = io(config.REDIS.URL, { withCredentials: true });
    setSocket(_socket);
    _socket?.on(channel, (data) => { handleUpdate(data); });
    return () => { _socket.disconnect(); }
  }, [setSocket, handleUpdate, config.REDIS.URL, io]);

  const emitData = useCallback(
    ({ key, longitude, latitude, team = null, oldKey = null }: ISocketUser) =>
      key != null && key !== '' && socket?.emit(event, key, longitude, latitude, team, oldKey),
    [socket]);

  return ([data, emitData]);
};

export default useSocket;
