import Image from 'next/image';
import { FC, useEffect, useRef, useState } from 'react';
import { FaRegImage } from 'react-icons/fa';
import c from 'shared/utilities/classname';
import { Xfile } from 'shared/interfaces';
import constants from 'shared/constants';
import s from './index.module.scss';

interface IProps {
  image?: Xfile['data'] | Xfile['data'][] | string;
  className?: string;
  imgClass?: string;
  alt?: string;
}
const Img: FC<IProps> = ({ className, image, imgClass, alt }) => {
  const ref = useRef<HTMLDivElement>(null);
  const [error, setError] = useState(false);
  const [vw, setVw] = useState(20);
  const isStr = typeof image === 'string';
  const url = isStr
    ? image
    : ((Array.isArray(image) ? (image.length > 0 ? image[0] : {}) : image)?.attributes?.url);
  const urlArr = (url || '').split('/');
  const src = isStr
    ? image
    : constants.STRAPI.API +
    urlArr.slice(0, urlArr.length - 1).join('/') +
    '/' + urlArr[urlArr.length - 1];

  useEffect(() => {
    const imgW = ref?.current?.offsetWidth;
    if (typeof window !== 'undefined' && imgW) {
      const newSize = 10 * Math.ceil(10 * Math.min(imgW, window.innerWidth) / window.innerWidth);
      setVw(old => old > newSize ? old : newSize);
    }
  }, [typeof window !== 'undefined', ref?.current?.offsetWidth]);

  const handleError = () => { setError(true); }

  return (
    <div className={c(className, s.container)} ref={ref}>
      {error || !url
        ? <div className={s.placeholder}><FaRegImage /></div>
        : <Image layout='fill' priority src={src} draggable='false' alt={alt} sizes={`${vw}vw`}
          className={c(imgClass, s.image)} onError={handleError} />}
    </div>);
};

export default Img;
