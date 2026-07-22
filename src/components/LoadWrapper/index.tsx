import { FC } from 'react';
import c from 'shared/utilities/classname';
import s from './index.module.scss';

interface IProps {
  children?: React.ReactNode;
  isLoading?: boolean;
  className?: string;
}
const LoadWrapper: FC<IProps> = ({ children, isLoading, className }) => {
  return (
    <div className={c(s.container, className, isLoading && s.loading)}>
      {children}
      {isLoading &&
        <div className={s.wrapper}>
          <div className={s.loader}><div /><div /><div /><div /></div>
        </div>}
    </div >);
};


export default LoadWrapper;
