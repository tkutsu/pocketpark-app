import { GetStaticProps, NextPage } from 'next';
import Head from 'next/head';
import { ChangeEventHandler, useState, ChangeEvent, useEffect } from 'react';
import Map from 'components/Map';
import LoadWrapper from 'components/LoadWrapper';
import { isString } from 'shared/utilities/isAssertions';
import getData, { IExtraProps } from 'shared/utilities/api/getData';
import { useRedisUserContext } from 'shared/utilities/contextRedisUser';
import { useNoteContext } from 'shared/utilities/contextNotes';
import { useAuthContext } from 'shared/utilities/contextAuth';
import { IUserContext } from 'shared/interfaces';
import { EnumScrollType } from 'shared/utilities/useScrollTo';
import c from 'shared/utilities/classname';
import s from './index.module.scss';

export const getStaticProps: GetStaticProps = async () => {
  const { extraProps } = await getData({ withPark: true });
  return { props: { extraProps }, revalidate: 1 };
};

interface IProps {
  extraProps: IExtraProps;
}

interface IProps { extraProps: IExtraProps; }
const AccountPage: NextPage<IProps> = ({ extraProps }) => {
  const { user, auth, logout } = useAuthContext();
  const { user: redisUser, setUser: setRedisUser } = useRedisUserContext();
  const { addNote } = useNoteContext();
  const [input, setInput] = useState<IUserContext>({});
  const [team, setTeam] = useState<string>();
  const [hideEmail, setHideEmail] = useState(false);
  const [hideLogin, setHideLogin] = useState(false);
  const [loading, setLoading] = useState(false);
  const [radius, setRadius] = useState<string | undefined>(undefined);
  const noRedisTeam = redisUser.team == null || redisUser.team === '';

  const handleTeamChange = (e: ChangeEvent<HTMLInputElement>) =>
    setTeam((e.currentTarget.value || '').toLowerCase());

  const handleRadiusChange = (e: ChangeEvent<HTMLInputElement>) =>
    setRadius(e.currentTarget.value);

  const handleRadiusSubmit = (_radius: number | string) => () => {
    const num = _radius != null ? (isString(_radius) ? parseFloat(_radius) : _radius) : null;
    if (num != null && !isNaN(num) && num > 0) {
      setRedisUser({ ...redisUser, radius: num });
      addNote({ id: 'group', text: 'Group alert distance set' });
    } else {
      setRedisUser({ ...redisUser, radius: undefined });
      addNote({ id: 'group', text: 'Group alert distance reset' });
    }
  };

  const handleTeamSubmit = (_team: string) => () => {
    if (_team === '' || _team == null) {
      setRadius(undefined);
      setRedisUser({ ...redisUser, team: undefined, radius: undefined });
    } else {
      setRedisUser({ ...redisUser, team: _team });
    }
    addNote({ id: 'group', text: `${_team === '' ? 'Left' : 'Joined'} group ${_team}` });
  };

  const handleInput = (param: 'email' | 'username' | 'password'): ChangeEventHandler => (e) =>
    setInput({ ...input, [param]: ((e.target as HTMLInputElement).value || '').trim() });

  const handleAuth = (type: 'register' | 'login') => async () => {
    setLoading(true);
    await auth(input, type);
    setLoading(false);
  };

  const handleLogout = async () => {
    setLoading(true);
    await logout();
    setLoading(false);
  };

  useEffect(() => {
    setHideLogin(input.email != null && input.email !== '');
  }, [input.email]);

  const handleHideEmail = (hide: boolean) => () => { setHideEmail(hide); };

  const isStr = (str: string | null | undefined) => isString(str) && str !== '';
  const canLogin = isStr(input?.username) && isStr(input?.password);
  const canRegister = isStr(input?.username) && isStr(input?.password) && isStr(input?.email);
  const teamInputVal = (team != null ? team : redisUser.team) || '';
  const radiusInputVal = (radius != null ? radius : redisUser.radius) || '';

  return (
    <Map extra={extraProps} className={s.container} showAlertCircle scrollTo={EnumScrollType.title}>
      <Head>
        <title key='title'>Account</title>
      </Head>
      <div className={'title'}>Account</div>
      {user?.id == null
        ? <div className={s.wrapper}>
          <div className={s.section}>
            <div className={s.subtitle}>Authentication</div>
            <div className={s.description}>
              Enter all fields to register, or username & password to login.
            </div>
            <div className={c(s.inputGroup, hideEmail && s.disabled)}>
              <div className={s.text}>Email <i>(for registration)</i></div>
              <input className={s.input} value={input?.email || ''}
                onChange={handleInput('email')} type='text' />
            </div>
            <div className={s.inputGroup}>
              <div className={s.text}>Username</div>
              <input className={s.input} value={input?.username || ''} required
                onChange={handleInput('username')} type='text' />
            </div>
            <div className={s.inputGroup}>
              <div className={s.text}>Password</div>
              <input className={s.input} value={input?.password || ''} minLength={6} required
                onChange={handleInput('password')} type='password' />
            </div>
            <LoadWrapper className={s.buttonGroup} isLoading={loading}>
              <div className={c(s.button, (!canRegister || loading) && s.disabled, 'button')}
                onClick={handleAuth('register')}>
                Register
              </div>
              <div onMouseEnter={handleHideEmail(true)} onMouseLeave={handleHideEmail(false)}
                onClick={handleAuth('login')} className={c(
                  s.button, (!canLogin || hideLogin || loading) && s.disabled, 'button'
                )}>
                Login
              </div>
            </LoadWrapper>
          </div>
        </div>
        : <div className={s.wrapper}>
          <div className={s.section}>
            <div className={s.subtitle}>Group</div>
            <div className={s.description}>
              Enter the same group code as your friends/family to view their whereabouts.
            </div>
            <div className={s.inputGroup}>
              <div className={s.text}>Group code</div>
              <input className={s.input} onChange={handleTeamChange}
                value={teamInputVal} />
              <div className={c(s.button, !team && noRedisTeam && s.disabled, 'button')}
                onClick={handleTeamSubmit((!noRedisTeam && !team) ? '' : teamInputVal)}>
                {(!noRedisTeam && !team) ? 'Reset' : 'Join'}
              </div>
            </div>
            <div className={c(s.description, noRedisTeam && s.disabled)} >
              Enter a group max distance to get notified if anyone gets too far away.
            </div>
            <div className={c(s.inputGroup, noRedisTeam && s.disabled)} >
              <div className={s.text}>Group alert distance</div>
              <input className={s.input} disabled={noRedisTeam} onChange={handleRadiusChange}
                value={radiusInputVal} type='number' />
              <div className={s.inputExtra}>meters</div>
              <div className={c(s.button, 'button')} onClick={handleRadiusSubmit(radiusInputVal)}>
                Save
              </div>
            </div>
          </div>
          <LoadWrapper isLoading={loading}>
            <div className={c(s.button, s.logout, loading && s.disabled, 'button')}
              onClick={handleLogout}>
              Logout
            </div>
          </LoadWrapper>
        </div>}
    </Map>
  );
};

export default AccountPage;
