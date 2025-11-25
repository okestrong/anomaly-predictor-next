import CephDashboard2 from '@/components/dashboard/visualization/CephDashboard2';
import CephDashboard1 from '@/components/dashboard/visualization/CephDashboard1';
import CephDashboard from '@/components/dashboard/visualization/CephDashboard';

// Dynamic import to avoid SSR issues with Three.js
/*const CephDashboard = dynamic(() => import('@/components/dashboard/visualization/CephDashboard'), {
   loading: () => (
      <div
         style={{
            width: '100vw',
            height: '100vh',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            background: 'linear-gradient(135deg, #0a0a1a 0%, #1a0a2a 50%, #0a0a1a 100%)',
            color: '#00ffff',
            fontSize: '24px',
            fontWeight: 'bold',
         }}
      >
         Loading Ceph Dashboard...
      </div>
   ),
});*/

export default async function DashboardPage({ params }: { params: Promise<{ id: string }> }) {
   const { id } = await params;

   return <>{id === '1' ? <CephDashboard2 /> : id === '2' ? <CephDashboard1 /> : <CephDashboard cardVisible={false} />}</>;
}
