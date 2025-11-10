import { Metadata } from 'next';
import ClusterTopologyViewStyles from '@/components/topology/ClusterTopologyViewStyles';
import ClusterTopologyError from '@/components/topology/ClusterTopologyError';

export const metadata: Metadata = {
   title: 'Cluster Topology Error - Ceph AI Dashboard',
   description: 'Pool, PG, OSD 관계 3D 시각화',
};

export default function TopologyPage() {
   return (
      <>
         <ClusterTopologyViewStyles />
         <ClusterTopologyError />
      </>
   );
}
