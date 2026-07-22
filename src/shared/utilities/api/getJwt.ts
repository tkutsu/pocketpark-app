import { NextApiRequest } from 'next';
import { parse } from 'cookie';
import errorLog from 'shared/utilities/errorLog';

const getJwt = (req: NextApiRequest) => {
  try {
    const { jwt } = parse(req?.headers?.cookie || '');
    return jwt;
  } catch (e) {
    errorLog(getJwt, e as Error);
    return null;
  }
};

export default getJwt;
