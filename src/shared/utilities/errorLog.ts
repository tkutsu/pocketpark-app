import { isString } from 'shared/utilities/isAssertions';
import { isAxiosError } from 'shared/utilities/isAssertions';

// eslint-disable-next-line @typescript-eslint/ban-types
const errorLog = (name: Function | string, e: Error | string) => {
  const msg = isString(e)
    ? e
    : (isAxiosError(e)
      ? e.response?.data?.error?.message
      : e.message);
  console.error(`-- Error (${isString(name) ? name : name?.name}): `, msg);
  return msg;
}

export default errorLog;
