import { FC, memo } from 'react';
import s from './index.module.scss';

const stringToColor = (string = '') => {
  const intToHash = (str: string) => str.split('').reduce((acc, cur) => {
    const newHash = cur.charCodeAt(0) + ((acc << 5) - acc);
    return newHash & newHash; // Convert to 32bit integer
  }, 0);
  const intToHSL = (num: number) => `hsl(${num % 360}, 70%, 70%)`;
  return intToHSL(intToHash(string));
};

interface IProps { username?: string; className?: string; }
const Avatar: FC<IProps> = ({ username = 'anonymous' }) => {
  const nameCap = username.charAt(0).toUpperCase() + username.slice(1);
  const background = stringToColor(username);
  return (<div className={s.container} style={{ background }}>{nameCap.substring(0, 2)}</div>);
};

export default memo(Avatar);
