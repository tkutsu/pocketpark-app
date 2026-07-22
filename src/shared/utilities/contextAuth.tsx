import axios from 'axios';
import { createContext, ReactNode, useContext, useCallback } from 'react';
import { useNoteContext } from './contextNotes';
import { useRedisUserContext } from './contextRedisUser';
import { isAxiosError } from './isAssertions';
import useSWR, { APIRoutes } from './useSWR';
import { Xuser } from 'shared/interfaces';

export interface IAuth {
  email?: string;
  username?: string;
  password?: string;
}

interface IContextProps {
  user: Xuser['data'];
  auth: (input: IAuth, type: 'register' | 'login') => void;
  logout: () => void;
}

const AuthContext = createContext<IContextProps>({
  user: {},
  auth: () => { },
  logout: () => { },
});

interface IProps { children?: ReactNode; }
export const AuthProvider = ({ children }: IProps) => {
  const { data, mutate } = useSWR(APIRoutes.me);
  const { setUser: setRedisUser } = useRedisUserContext();
  const { addNote } = useNoteContext();

  const auth = useCallback(async (input: IAuth, type: 'register' | 'login') => {
    if (!navigator?.onLine) {
      addNote({ id: 'offline', text: 'You are currently offline', warning: true });
    } else if (input.username == null || input.username.length < 4) {
      addNote({ id: 'userAuth', text: 'Usernames must be at least 4 characters', warning: true });
    } else if (input.password == null || input.password.length < 6) {
      addNote({ id: 'userAuth', text: 'Passwords must be at least 6 characters', warning: true });
    } else {
      try {
        const { data } = await axios.post(`/api/user/${type}`, input);
        if (data?.id != null) {
          addNote({ id: 'userAuth', text: `Welcome ${data.username}!` });
          setRedisUser(data);
          mutate(data);
        }
      } catch (e) {
        const axiosErr = isAxiosError(e) && e?.response?.data?.error;
        const text = axiosErr
          ? axiosErr
          : (type === 'register' ? 'Registration error' : 'Login error');
        addNote({ id: 'userAuth', text, warning: true });
      }
    }
  }, [addNote, setRedisUser, isAxiosError]);

  const logout = useCallback(async () => {
    try {
      await axios.post('/api/user/logout');
      setRedisUser({});
      addNote({ id: 'userAuth', text: `Goodbye!` });
      mutate({});
    } catch (e) {
      addNote({ id: 'userAuth', text: 'Logout error', warning: true });
    }
  }, [setRedisUser, addNote]);

  const value = { user: data, auth, logout };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuthContext = () => useContext(AuthContext);
