import { XPark, XPlace } from 'shared/interfaces';
import { GraphQLClient } from 'graphql-request';
import constants from 'shared/constants';

export interface IExtraProps {
  park?: XPark['data']['attributes'];
  places?: XPlace['data'][];
}

interface IGetData {
  q?: string;
  // eslint-disable-next-line @typescript-eslint/ban-types
  params?: object;
  withPark?: boolean;
}
const getData = async ({ q = '', params, withPark = false }: IGetData) => {
  const headers = { headers: { Authorization: `bearer ${process.env.STRAPI_TOKEN}` } };
  const client = new GraphQLClient(`${constants.STRAPI.API}/graphql`, headers);
  const data = q ? await client.request(q, params) : {};

  const parkQ = `{
    park { data { attributes {
      label description open_hours closed_unplanned email phone
      entry { latitude longitude }
      area { latitude longitude }
      images { data { id attributes { url height width } } }
      logo { data { id attributes { url height width } } }
      image_plant { data { id attributes { url height width } } }
      image_activity { data { id attributes { url height width } } }
      image_place { data { id attributes { url height width } } }
      image_trip { data { id attributes { url height width } } }
      image_animal { data { id attributes { url height width } } }
      image_new_observation { data { id attributes { url height width } } }
      image_new_trip { data { id attributes { url height width } } }
    } } }
    places { data { id attributes {
      label description type hex_color services { value }
      geodata {latitude longitude}
      images { data { id attributes { url height width } } }
      fav_users { data { id } }
    } } }
  }`;
  const parkData = withPark ? await client.request(parkQ, {}) : {};
  const extraProps: IExtraProps = {
    park: parkData?.park?.data?.attributes || {},
    places: parkData?.places?.data || [],
  };
  return { ...data, extraProps };
};

export default getData;
