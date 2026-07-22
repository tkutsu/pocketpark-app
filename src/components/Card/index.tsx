import Link from 'next/link';
import { FC } from 'react';
import { FaHeart } from 'react-icons/fa';
import c from 'shared/utilities/classname';
import { Xfile } from 'shared/interfaces';
import s from './index.module.scss';
import Img from 'components/Img';

interface IProps {
  image?: Xfile['data'] | Xfile['data'][] | string;
  text?: string;
  link: string;
  className?: string;
  fav?: boolean;
  noPadding?: boolean;
}
const Card: FC<IProps> = ({ className, image, text, link, noPadding, fav }) =>
  <div className={c(className, s.container, noPadding && s.noPadding)}>
    <Link href={link} scroll={false}>
      <a className={s.link}>
        {fav && <FaHeart className={s.fav} />}
        <Img image={image} alt={text} className={s.image} />
        <div className={s.textWrapper}><div className={s.text}>{text}</div></div>
      </a>
    </Link>
  </div >;

export default Card;
