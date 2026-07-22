import { isBrowser } from 'shared/utilities/isAssertions';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const saveStorage = (key: string, data: any) => {
  if (!isBrowser()) { return undefined; }
  try {
    let string: string;
    try {
      string = JSON.stringify(data);
    } catch {
      string = data;
    }
    localStorage.setItem(key, string);
  } catch (err) { return undefined; }
};

export const loadStorage = (key: string) => {
  if (!isBrowser()) { return undefined; }
  try {
    const string = localStorage.getItem(key);
    try {
      return string ? JSON.parse(string) : string;
    } catch {
      return string;
    }
  } catch (err) { return undefined; }
};

