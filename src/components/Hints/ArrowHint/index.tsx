import { FC } from 'react';
import { FaArrowsAltV } from 'react-icons/fa';
import c from 'shared/utilities/classname';
import { useHintContext } from 'shared/utilities/contextHints';
import s from './index.module.scss';

interface IProps {
  className?: string;
  name: string;
}
const ArrowHint: FC<IProps> = ({ className, name }) => {
  const { removeHint, seenHints } = useHintContext();
  const handleClick = () => removeHint(name);
  return (seenHints == null || seenHints.includes(name)
    ? null
    : <div className={s.container}>
      <div className={c(s.hand, className)} onClick={handleClick}>
        <FaArrowsAltV />
      </div>
    </div>);
}

export default ArrowHint;
