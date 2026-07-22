import {
  useState, createContext, useEffect, ReactNode, useContext, useCallback, useRef
} from 'react';
import { saveStorage, loadStorage } from 'shared/utilities/localStorage';
import useSocket from 'shared/utilities/useSocket';
import useGeo from 'shared/utilities/useGeo';
import geoDistance from 'shared/utilities/geoDistance';
import { ISocketUser, IUserContext } from 'shared/interfaces';
import { useNoteContext } from './contextNotes';
import useSWR, { APIRoutes } from './useSWR';

interface IContextProps {
  user: IUserContext;
  users: ISocketUser[];
  setUser: (u: IUserContext) => void;
}

const RedisUserContext = createContext<IContextProps>({
  user: {},
  users: [],
  setUser: () => { },
});

interface IProps { user?: IUserContext; children?: ReactNode; }
export const RedisUserProvider = ({ user: defUser = {}, children }: IProps) => {
  const tempId = useRef(`temp-id-${Date.now()}`);
  const { addNote } = useNoteContext();
  const { data: userData } = useSWR(APIRoutes.me);
  const [user, setUser] = useState<IUserContext>(defUser);
  const [socketData, emitData] = useSocket({});
  const geo = useGeo({ watch: true });

  const userId = user.id != null ? `${user.id}` : tempId.current;

  const users = (user.team != null && user.team !== '' && socketData.length > 0)
    ? (socketData || []).filter(u => u?.team === user?.team && u?.key !== user?.id &&
      u.key != null && u.longitude != null && u.latitude != null)
    : [];

  const usersOutsideRadius = users
    .filter(u => user.radius && geoDistance(u, user) > user.radius)
    .map(u => u.key);

  const updateUser = useCallback((_user: IUserContext) => {
    const _id = (_user?.id != null && _user.id !== '') ? `${_user.id}` : tempId.current;
    const _team = (_user?.team != null && _user.team !== '') ? `${_user.team}` : undefined;
    _id !== tempId.current && saveStorage('user', { team: _user?.team, radius: _user?.radius });
    setUser(old => ({
      id: _id,
      username: _user.username,
      email: _user.email,
      latitude: _user.latitude,
      longitude: _user.longitude,
      team: _team,
      radius: _user.radius,
      oldId: old.id
    }));
  }, [setUser, saveStorage, tempId.current]);

  useEffect(() => {
    const { team, radius } = loadStorage('user') || {};
    const id = userData?.id != null ? `${userData?.id}` : tempId.current;
    setUser(old => userData?.id !== old.id ? ({ ...old, id, team, radius }) : old);
  }, [setUser, loadStorage, userData?.id, tempId.current]);

  useEffect(() => {
    usersOutsideRadius.length > 0 &&
      addNote({
        id: 'group',
        text: `${usersOutsideRadius.length} group members beyond ${user.radius} meters`,
        warning: true,
        sticky: true
      });
  }, [user.team, user.radius, usersOutsideRadius.join(','), addNote]);

  useEffect(() => {
    if (geo?.latitude == null || geo?.longitude == null || userId == null) { return; }
    emitData({
      key: userId,
      latitude: geo.latitude,
      longitude: geo.longitude,
      team: userId === tempId.current ? undefined : user.team,
      oldKey: userId === user.oldId ? undefined : user.oldId,
    });
    updateUser({ ...user, latitude: geo.latitude, longitude: geo.longitude });
  }, [userId, geo?.latitude, geo?.longitude, user?.team, tempId.current, updateUser, emitData]);

  const value = { user, users, setUser: updateUser };
  return <RedisUserContext.Provider value={value}>{children}</RedisUserContext.Provider>;
};

export const useRedisUserContext = () => useContext(RedisUserContext);
