import { useCallback, useRef, useState, FC, Children, isValidElement } from 'react';
import { FaFilter } from 'react-icons/fa';
import useOnClickOutside from 'shared/utilities/useOnClickOutside';
import c from 'shared/utilities/classname';
import s from './index.module.scss';

export interface IFacetSel {
  label?: string | undefined;
  isBoolean?: boolean;
  empty?: boolean;
  selected?: string[] | string | number[] | number | boolean | undefined;
}
interface IProps {
  facetSel: IFacetSel[];
  className?: string;
  children?: React.ReactNode;
}
const FacetList: FC<IProps> = ({ children, className, facetSel }) => {
  const facetList = facetSel.filter(s => s.label != null && s.label !== '');
  const ref = useRef<HTMLDivElement | null>(null);
  const [open, setOpen] = useState<number | undefined>(undefined);
  useOnClickOutside(ref, useCallback(() => setOpen(undefined), [setOpen]));

  const handleClick = (id?: number) => () => setOpen(id === open ? undefined : id);

  const childrenList = Children.toArray(children);
  const selected = facetList.map(s => s.selected).map(s =>
    Array.isArray(s) ? s : [s]).map(s => s.filter(o => o != null));
  const labels = facetList.map(s => s.label);
  const empty = facetList.map(s => s.empty);
  const selLabels = labels.map((l, ind) =>
    l != null && selected[ind] != null && selected[ind].length > 0
      ? `${l}: ${selected[ind].map(s => s === true ? '✔' : s).join(', ')}`
      : l);

  return (
    <div className={c(s.container, className)} ref={ref}>
      <FaFilter className={s.filterIcon} />
      {Children.map(childrenList, (child, ind) =>
        isValidElement(child) && labels[ind] != null && selected[ind] != null
          ? (facetList[ind].isBoolean
            ? <div className={c(s.wrapper, empty[ind] && s.empty)} onClick={handleClick(ind)}>
              <div className={c(s.label, s.boolean, selected[ind].length > 0 && s.selected)}>
                {child}
              </div>
            </div>
            : <div className={c(s.wrapper, open === ind && s.open, empty[ind] && s.empty)}
              onClick={handleClick(ind)}>
              <div className={c(s.label, selected[ind].length > 0 && s.selected)}>
                {selLabels[ind]}
              </div>
              <div className={s.facet}>
                <div className={c(s.label, selected[ind].length > 0 && s.selected)}>
                  {labels[ind]}
                </div>
                {child}
              </div>
            </div>)
          : null)}
    </div>
  );
};

export default FacetList;
