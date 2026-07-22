import { FC, MouseEventHandler, useCallback, useEffect, useRef, useState } from 'react';
import { useInView } from 'react-intersection-observer';
import debounce from 'lodash/debounce';
import LeafletMap, { IMapProps } from './LeafletMap';
import Layout from 'components/Layout';
import ArrowHint from 'components/Hints/ArrowHint';
import useScrollTo, { EnumScrollType } from 'shared/utilities/useScrollTo';
import { useHintContext } from 'shared/utilities/contextHints';
import c from 'shared/utilities/classname';
import s from './index.module.scss';

interface IProps extends IMapProps {
  children?: React.ReactNode;
  className?: string;
  scrollTo?: EnumScrollType;
  crumb?: { link?: string; label?: string; };
}
const Map: FC<IProps> = ({ children, className, crumb, scrollTo, ...props }) => {
  useScrollTo(scrollTo || EnumScrollType.backToTitle);
  const hintName = 'map-open-overlay';
  const [openRatio, setOpenRatio] = useState(0);
  const { removeHint } = useHintContext();
  const containerRef = useRef<HTMLDivElement>(null);
  const [overlayRef, inView] = useInView({
    rootMargin: `${-8 * 16}px 0px 0px 0px`,
    initialInView: true,
  });

  const handleClickOpen = () => openRatio !== 0
    ? window.scrollTo({ top: 0, behavior: 'smooth' })
    : containerRef.current?.scrollIntoView({ block: 'start', behavior: 'smooth' });

  const handleClick: MouseEventHandler<HTMLDivElement> = () => {
    handleClickOpen();
  };

  const handleOpenRatioUpdate = useCallback(() => {
    const currScroll = window.scrollY || document.documentElement.scrollTop ||
      document.body.scrollTop || 0;
    const windowHeight = window.innerHeight || 800;
    const scrollRatio = currScroll / windowHeight;
    setOpenRatio(scrollRatio);
    scrollRatio > 0.05 && removeHint(hintName);
  }, [setOpenRatio]);

  useEffect(() => {
    if (!window) { return; }
    handleOpenRatioUpdate();
    const debounceHandleOpenRatioUpdate = debounce(handleOpenRatioUpdate, 250);
    window.addEventListener('scroll', debounceHandleOpenRatioUpdate);
    return () => {
      debounceHandleOpenRatioUpdate.cancel();
      window.removeEventListener('scroll', debounceHandleOpenRatioUpdate);
    };
  }, [handleOpenRatioUpdate]);

  return (
    <Layout opaqueHeader={!inView} crumb={crumb}>
      <LeafletMap {...props} className={s.map} panYpc={openRatio} />
      <div className={c(s.container)}>
        <div className={c(s.overlay, !inView && s.flat)} ref={containerRef}>
          <ArrowHint className={s.hint} name={hintName} />
          <div className={s.handle} onClick={handleClick} ref={overlayRef} />
        </div>
        <div className={c(s.childrenContainer, className)}>{children}</div>
      </div>
    </Layout>);
};

export default Map;
