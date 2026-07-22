import { FC } from 'react';
import { FaTimes } from 'react-icons/fa';
import c from 'shared/utilities/classname';
import s from './index.module.scss';
import { useNoteContext } from 'shared/utilities/contextNotes';

const Notifications: FC = () => {
  const { noteData, removeNote } = useNoteContext();

  const handleClose = (id: string) => () => { removeNote(id); };

  return (
    <div className={s.container}>
      {noteData.map(note =>
        <div className={c(s.notification, note.warning && s.warning)} key={note.id}
          onClick={handleClose(note.id)}>
          <div className={s.text}>{note.text}</div>
          <div className={s.close}><FaTimes /></div>
        </div>)}
    </div>
  );
};

export default Notifications;
