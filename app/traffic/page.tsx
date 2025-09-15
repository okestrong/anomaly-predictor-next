import { Metadata } from 'next';
import ClusterTopologyViewStyles from '@/components/topology/ClusterTopologyViewStyles';
import ClusterTopologyView from '@/components/topology/ClusterTopologyView';

export const metadata: Metadata = {
   title: 'Cluster Traffic - Ceph AI Dashboard',
   description: 'Data Traffic Flow 3D 시각화',
};

export default function TrafficPage() {
   return (
      <>
         <div>hello</div>
      </>
   );
}
