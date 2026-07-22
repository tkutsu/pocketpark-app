/* eslint-disable @typescript-eslint/ban-types */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { AxiosError } from 'axios';

export const isProduction = () => process?.env?.NODE_ENV !== 'development';
export const isBrowser = () => typeof window !== 'undefined' && typeof document !== 'undefined';
export const isObject = (o?: any): o is object => typeof o === 'object' && o !== null;
export const isCheckbox = (el: HTMLInputElement | HTMLElement): el is HTMLInputElement =>
  'checked' in el && el.type === 'checkbox';
export const isString = (str?: any): str is string =>
  (typeof str === 'string' || str instanceof String);
export const isAxiosError = (e: any): e is AxiosError => e.isAxiosError === true;
