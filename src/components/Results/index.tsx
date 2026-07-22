import { FC, Children, useState } from 'react';
import c from 'shared/utilities/classname';
import s from './index.module.scss';

interface IProps {
  children?: React.ReactNode;
  className?: string;
  show?: number;
}
const Results: FC<IProps> = ({ className, children, show = 12 }) => {
  const [showing, setShowing] = useState(show);
  const handleShowMore = () => setShowing(old => old + show);
  return (
    <div className={c(className, s.container)}>
      {Children.toArray(children).slice(0, showing)}
      <div className={s.break} />
      {showing < Children.toArray(children).length &&
        <div className={c(s.button, 'button')} onClick={handleShowMore}>show more</div>}
    </div>);
}


export default Results;
