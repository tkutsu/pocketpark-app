import { FC, useEffect, useRef, useState } from 'react';
import { ChangeEvent } from 'react';
import axios from 'axios';
import Comment from './Comment';
import { XComment } from 'shared/interfaces';
import { useNoteContext } from 'shared/utilities/contextNotes';
import { ICommentAPI, EnumType } from 'shared/interfaces';
import c from 'shared/utilities/classname';
import { useAuthContext } from 'shared/utilities/contextAuth';
import s from './index.module.scss';

interface IProps {
  className?: string;
  comments?: XComment['data'][];
  id?: string;
  type?: EnumType;
  show?: number;
}

const Comments: FC<IProps> = ({ className, comments, id, type, show = 12 }) => {
  const { user } = useAuthContext();
  const { addNote } = useNoteContext();
  const [commentList, setCommentList] = useState(comments || []);
  const [showing, setShowing] = useState(show);
  const [newComment, setNewComment] = useState('');

  const handleShowMore = () => setShowing(old => old + show);

  const handleWriteComment = (e: ChangeEvent<HTMLTextAreaElement>) =>
    setNewComment(e.currentTarget.value);

  const handlePostComment = async () => {
    if (id == null || type == null) {
      addNote({ id: 'comment', text: 'Could not upload comment', warning: true });
    } else if (!navigator?.onLine) {
      addNote({ id: 'offline', text: 'You are currently offline', warning: true });
    } else {
      try {
        const req: ICommentAPI = { type, id, comment: newComment };
        const { data } = await axios.post('/api/comment/create', req);
        setCommentList(old => [data.data, ...old]);
      } catch (e) { }
    }
    setNewComment('');
  };

  const textAreaRef = useRef<HTMLTextAreaElement>(null);
  useEffect(() => {
    if (textAreaRef.current) {
      textAreaRef.current.style.height = 'inherit';
      textAreaRef.current.style.height =
        `${Math.max(2 + textAreaRef.current.scrollHeight, 6 * 16)}px`;
    }
  }, [newComment]);

  return (
    <div className={c(className, s.container)}>
      {(user?.id != null || (commentList || [])?.length > 0) &&
        <div className={c('title', s.title)}>Comments</div>}
      {user?.id != null &&
        <div>
          <label htmlFor='comment' className={s.inputGroup}>
            <div className={s.label}>New comment</div>
            <textarea name='comment' onChange={handleWriteComment} value={newComment}
              className={s.input} ref={textAreaRef} />
            <div onClick={handlePostComment} className={c(s.button, 'button')}>Post</div>
          </label>
        </div>}
      {(commentList || [])?.length > 0 && commentList
        .sort((a, b) => (a.attributes?.createdAt || 0) > (b.attributes?.createdAt || 0) ? -1 : 1)
        .filter((c, ind) => ind + 1 <= showing)
        .map((c) => <Comment data={c} key={c?.id} />)}
      {showing < (commentList || [])?.length &&
        <div className={c(s.more, 'button')} onClick={handleShowMore}>show more</div>}
    </div>
  );
};

export default Comments;
