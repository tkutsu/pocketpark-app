import { useState, createContext, ReactNode, useContext, useCallback, useEffect } from 'react';
import { saveStorage, loadStorage } from 'shared/utilities/localStorage';

interface IContextProps {
  seenHints?: string[];
  removeHint: (hint: string) => void;
}

const HintContext = createContext<IContextProps>({
  seenHints: undefined,
  removeHint: () => { },
});

interface IProps { seenHints?: string[]; children?: ReactNode }
export const HintProvider = ({ seenHints: defSeenHints = undefined, children }: IProps) => {
  const [seenHints, setSeenHints] = useState<string[] | undefined>(defSeenHints);

  useEffect(() => {
    const storageHints = loadStorage('hints') || [];
    setSeenHints(storageHints);
  }, [loadStorage, saveStorage, setSeenHints]);

  const removeHint = useCallback((hint: string) => {
    setSeenHints(old => {
      if ((old || []).includes(hint)) { return old; }
      const newHintsSeen = [...(old || []), hint];
      saveStorage('hints', newHintsSeen);
      return newHintsSeen;
    });
  }, [setSeenHints, saveStorage]);

  const value = { seenHints, removeHint };

  return (
    <HintContext.Provider value={value}>
      {children}
    </HintContext.Provider>
  );
};

export const useHintContext = () => useContext(HintContext);
