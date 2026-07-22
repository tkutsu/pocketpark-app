import dynamic from 'next/dynamic';

export default dynamic(() => import('./LeafletMap'), { ssr: false });
export type { IMapProps } from './LeafletMap';

