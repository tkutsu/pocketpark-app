import useNextSWR from 'swr';
import axios from 'axios';

export const APIRoutes = {
  me: '/api/user/me',
};

const useSWR = (url: string) => {
  const fetcher = async (_url: string) => await axios.get(_url).then(({ data }) => data);
  const { data, error, isValidating, mutate } = useNextSWR(url, fetcher);
  return {
    data,
    error,
    loading: isValidating,
    mutate,
  };
};

export default useSWR;
