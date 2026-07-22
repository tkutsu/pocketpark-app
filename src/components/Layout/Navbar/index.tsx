import Link from 'next/link';
import { FC } from 'react';
import { useRouter } from 'next/router';
import { FaSearch, FaHome, FaUser } from 'react-icons/fa';
import { useAuthContext } from 'shared/utilities/contextAuth';
import c from 'shared/utilities/classname';
import s from './index.module.scss';

interface IProps {
  opaque?: boolean;
  crumb?: { link?: string; label?: string; };
}
const Header: FC<IProps> = ({ opaque, crumb }) => {
  const { user } = useAuthContext();
  const router = useRouter();
  return (
    <div className={s.container}>
      <div className={c(s.navBar, opaque && s.opaque)}>
        {router.asPath !== '/' &&
          <Link href='/' scroll={false}>
            <a className={c(s.button, 'button', s.crumb)}>
              <FaHome className={s.icon} />
              <div className={s.text}>Park</div>
              <div className={s.arrow} />
            </a>
          </Link>}
        {crumb?.link && crumb?.label &&
          <Link href={crumb.link} scroll={false}>
            <a className={c(s.button, 'button', s.crumb)}>
              <FaSearch className={s.icon} />
              <div className={s.text}>{crumb.label}</div>
              <div className={s.arrow} />
            </a>
          </Link>}
        <Link href='/account' scroll={false}>
          <a className={c(s.button, 'button', s.account)}>
            <div className={s.text}>{user?.id != null ? 'Account' : 'Login'}</div>
            <FaUser className={s.icon} />
          </a>
        </Link>
      </div>
    </div>);
};


export default Header;
