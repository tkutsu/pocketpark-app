import { FC } from 'react';
import Navbar from './Navbar';
import Notifications from './Notifications';
import s from './index.module.scss';

interface IProps {
  children?: React.ReactNode;
  opaqueHeader?: boolean;
  crumb?: { link?: string; label?: string; }
}
const Layout: FC<IProps> = ({ children, opaqueHeader, crumb }) => {
  return (
    <div className={s.container}>
      {children}
      <Navbar opaque={opaqueHeader} crumb={crumb} />
      <Notifications />
    </div>);
};


export default Layout;
