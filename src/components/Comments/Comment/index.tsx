import { FC, memo } from 'react';
import Avatar from 'components/Avatar';
import { XComment } from 'shared/interfaces';
import s from './index.module.scss';
import formatISODate from 'shared/utilities/formatISODate';

interface IProps {
  data: XComment['data'];
}

const Comment: FC<IProps> = ({ data }) => {
  const name = data.attributes?.creator?.data?.attributes?.username || 'anonymous';
  const date = data.attributes?.createdAt;
  return (
    <div className={s.container}>
      <Avatar className={s.avatar} username={name} />
      <div className={s.comment}>
        <div className={s.text}>{data.attributes?.text}</div>
        <div className={s.date}>{formatISODate(date)}</div>
      </div>
    </div>);
};

export default memo(Comment);
