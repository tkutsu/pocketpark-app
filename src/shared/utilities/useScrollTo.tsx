import { useEffect } from 'react';

export enum EnumScrollType {
  bottom = 'bottom',
  title = 'title',
  backToTitle = 'backToTitle',
}

const useScrollTo = (scrollTo?: EnumScrollType) => {
  useEffect(() => {
    if (!window) {
      return;
    } else if (scrollTo === EnumScrollType.bottom) {
      window.scrollTo(0, document.body.scrollHeight);
    } else if (scrollTo === EnumScrollType.title || scrollTo === EnumScrollType.backToTitle) {
      const titleH = 16 * 7.5;
      const currScroll = document.documentElement.scrollTop || document.body.scrollTop;
      const clientH = document.documentElement.clientHeight || window.innerHeight;
      ((currScroll >= clientH - titleH) || scrollTo === EnumScrollType.title) &&
        window.scrollTo({ top: clientH - titleH, behavior: 'smooth' });
    } else {
      window.scrollTo(0, 0);
    }
  }, []);
};

export default useScrollTo;
