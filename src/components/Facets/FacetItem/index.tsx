import { ComponentPropsWithoutRef } from 'react';
import { FaTimes } from 'react-icons/fa';
import c from 'shared/utilities/classname';
import s from './index.module.scss';

interface IFacetItem extends ComponentPropsWithoutRef<'div'> {
  label?: string;
  total?: number;
  isBoolean?: boolean;
  selected?: boolean;
}
const FacetItem = ({ label, total, selected, isBoolean, ...props }: IFacetItem) => label
  ? <div {...props} className={c(s.listItem, selected && s.selected)}>
    <div className={s.label}>{label}</div>
    {isBoolean
      ? selected && ': ✔'
      : (selected
        ? <FaTimes className={s.clearIcon} />
        : <div className={s.total}>({total})</div>)}
  </div>
  : null;

export default FacetItem;
