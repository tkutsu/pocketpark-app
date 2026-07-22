import { useEffect, RefObject } from "react";

const useOnClickOutside = <T extends HTMLElement = HTMLElement>(
  ref: RefObject<T>,
  handler: (e: MouseEvent | TouchEvent) => void
) => {
  useEffect(() => {
    const clickHandler = (event: MouseEvent | TouchEvent) => {
      if (!document || !ref?.current || ref.current.contains(event.target as Node)) { return; }
      handler(event);
    };
    document.addEventListener("mousedown", clickHandler);
    document.addEventListener("touchstart", clickHandler);
    return () => {
      document.removeEventListener("mousedown", clickHandler);
      document.removeEventListener("touchstart", clickHandler);
    };
  }, [ref, handler]); // wrap handler in useCallback to avoid rerunning effect every render
};

export default useOnClickOutside;

// // example use:
// const ref = useRef(null);
// useOnClickOutside(ref, () => setIsOpen(false));
// return isModalOpen
//   ? <div ref={ref}>Click outside to close me</div>
//   : <button onClick={() => setOpen(true)}>Open</button>;
