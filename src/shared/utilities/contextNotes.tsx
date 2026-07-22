import { useState, createContext, ReactNode, useContext, useCallback, useEffect } from 'react';
import { saveStorage, loadStorage } from 'shared/utilities/localStorage';

const autoRemoveNoteSec = 6;

interface INotification {
  id: string;
  text: string;
  warning?: boolean;
  timeoutId?: number;
  sticky?: boolean;
}
interface IContextProps {
  noteData: INotification[];
  addNote: (note: INotification) => void;
  removeNote: (id: string) => void;
}

const NoteContext = createContext<IContextProps>({
  noteData: [],
  addNote: () => { },
  removeNote: () => { },
});

interface IProps { noteData?: INotification[]; children?: ReactNode; }
export const NoteProvider = ({ noteData: defNoteData = [], children }: IProps) => {
  const [noteData, setNotes] = useState<INotification[]>(defNoteData || []);

  const removeNote = useCallback((id: string) => {
    setNotes(old => {
      const newNotes = old.filter(n => n?.id !== id);
      const prevNote = old.find(n => n?.id === id);
      prevNote?.timeoutId != null && window.clearTimeout(prevNote.timeoutId);
      saveStorage('notifications', newNotes);
      return (newNotes);
    });
  }, [setNotes, saveStorage]);

  const autoRemoveNote = useCallback((id: string, oldTimeoutId?: number): number => {
    oldTimeoutId != null && window.clearTimeout(oldTimeoutId);
    return window.setTimeout(() => removeNote(id), autoRemoveNoteSec * 1000);
  }, [autoRemoveNoteSec, removeNote]);

  const addNote = useCallback((note: INotification) => {
    setNotes(old => {
      const newNotes = old.filter(n => n?.id !== note?.id);
      const prevNote = old.find(n => n?.id === note?.id);
      const timeoutId = note?.sticky ? undefined : autoRemoveNote(note?.id, prevNote?.timeoutId);
      newNotes.push({ ...note, timeoutId });
      saveStorage('notifications', newNotes);
      return (newNotes);
    });
  }, [setNotes, saveStorage, autoRemoveNote]);

  useEffect(() => {
    const storageNotes = loadStorage('notifications') || [];
    const arrNotes = Array.isArray(storageNotes) ? storageNotes : [];
    setNotes(arrNotes);
    arrNotes.forEach((n: INotification) => n?.id != null && autoRemoveNote(n.id));
  }, [loadStorage, saveStorage, setNotes]);

  const value = { noteData, addNote, removeNote };

  return (
    <NoteContext.Provider value={value}>
      {children}
    </NoteContext.Provider>
  );
};

export const useNoteContext = () => useContext(NoteContext);
