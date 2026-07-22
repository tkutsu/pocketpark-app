import { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';
import nextConnect from 'next-connect';
import multer from 'multer';
import FormData from 'form-data';
import getJwt from 'shared/utilities/api/getJwt';
import constants from 'shared/constants';
import errorLog from 'shared/utilities/errorLog';

const createImage = nextConnect<NextApiRequest, NextApiResponse>({
  onError(e, req, res) {
    errorLog('createImage', e);
    res.status(501).json({ error: e.message });
  },
  onNoMatch(req, res) {
    errorLog('createImage', `Method "${req.method}" Not Allowed`);
    res.status(405).json({ error: `Method "${req.method}" Not Allowed` });
  },
});

createImage.use(multer().any()); // use multer as middleware

// eslint-disable-next-line @typescript-eslint/no-explicit-any
createImage.post<{ files: any[] }>(async (req, res) => {
  const formData = new FormData();
  if ((req?.files || [])?.length > 0 && req.files[0] != null) {
    formData.append('files', req?.files[0]?.buffer, { filename: req?.files[0]?.originalname });
    Object.keys(req?.body).forEach(k => formData.append(k, req?.body[k]));
    const headers = {
      headers: {
        ...formData.getHeaders(),
        authorization: req?.headers?.authorization || `Bearer ${getJwt(req)}`
      }
    };
    const { data } = await axios.post(`${constants.STRAPI.API}/api/upload`, formData, headers);
    res.status(200).json(data);
  } else {
    throw new Error('No files found');
  }
});

export default createImage;
export const config = { api: { bodyParser: false } }; // Disallow body parsing, consume as stream
