import { Metadata } from 'next';
import ClusterTopologyViewStyles from '@/components/topology/ClusterTopologyViewStyles';
import ClusterTopologyView from '@/components/topology/ClusterTopologyView';

export const metadata: Metadata = {
   title: 'Cluster Topology - Ceph AI Dashboard',
   description: 'Pool, PG, OSD 관계 3D 시각화',
};

export default function TopologyPage() {
   return (
      <>
         <ClusterTopologyViewStyles />
         <ClusterTopologyView />
      </>
   );
}
