'use client';

interface ClusterInformationProps {
   data: {
      clusterName?: string;
      site?: string;
      environment?: string;
      clusterId?: string;
      cephVersion?: string;
      deployment?: string;
      hostCount?: number;
      monCount?: number;
      osdCount?: number;
      mgrCount?: number;
      poolCount?: number;
      uptime?: string;
      publicNetwork?: string;
      clusterNetwork?: string;
   };
}

export default function ClusterInformation({ data }: ClusterInformationProps) {
   return (
      <div>
         <div className="mb-6 print:mb-2">
            <h1 className="text-2xl print:text-xl font-bold text-gray-900 mb-1 print:mb-0 border-b-2 border-cyan-600 pb-2">Cluster Information</h1>
            <p className="text-xs print:text-[9px] text-gray-600 mt-1">Detailed configuration and network settings of your Ceph cluster</p>
         </div>

         {/* Information Grid - Minimal Professional Design */}
         <div className="border border-gray-300">
            {/* Header Row (Only Web) */}
            <div className="bg-gradient-to-r from-cyan-600 to-cyan-700 px-6 py-3 print:hidden">
               <div className="flex items-center justify-between">
                  <h2 className="text-lg font-bold text-white">{data.clusterName || 'Production Cluster 01'}</h2>
                  <div className="flex items-center gap-2">
                     <div className="w-2 h-2 bg-green-400 animate-pulse"></div>
                     <span className="text-white text-xs font-semibold">OPERATIONAL</span>
                  </div>
               </div>
            </div>
            {/* Information Rows */}
            <div className="divide-y divide-gray-200">
               {/* Row 1: Cluster Name & ID */}
               <div className="flex items-center px-6 py-2.5 bg-white text-xs">
                  <span className="font-semibold text-gray-700 min-w-[90px]">Cluster:</span>
                  <span className="text-gray-900">{data.clusterName || 'Production Cluster 01'}</span>
                  <span className="mx-3 text-gray-300">|</span>
                  <span className="font-semibold text-gray-700">ID:</span>
                  <span className="ml-2 font-mono text-[10px] text-cyan-700 bg-cyan-50 px-2 py-0.5">{data.clusterId || 'N/A'}</span>
               </div>

               {/* Row 2: Site & Environment */}
               <div className="flex items-center px-6 py-2.5 bg-gray-50 text-xs">
                  <span className="font-semibold text-gray-700 min-w-[90px]">Site:</span>
                  <span className="text-gray-900">{data.site || 'Seoul DC1'}</span>
                  <span className="mx-3 text-gray-300">|</span>
                  <span className="font-semibold text-gray-700">Environment:</span>
                  <span className="ml-2 text-gray-900 bg-blue-100 px-2 py-0.5 font-medium">{data.environment || 'Production'}</span>
               </div>

               {/* Row 3: Ceph Version & Deployment */}
               <div className="flex items-center px-6 py-2.5 bg-white text-xs">
                  <span className="font-semibold text-gray-700 min-w-[90px]">Ceph Version:</span>
                  <span className="text-gray-900 font-medium">{data.cephVersion || 'N/A'}</span>
                  <span className="mx-3 text-gray-300">|</span>
                  <span className="font-semibold text-gray-700">Deployment:</span>
                  <span className="ml-2 text-gray-900">{data.deployment || 'Cephadm'}</span>
               </div>

               {/* Row 4: Nodes */}
               <div className="flex items-center px-6 py-2.5 bg-gray-50 text-xs">
                  <span className="font-semibold text-gray-700 min-w-[90px]">Nodes:</span>
                  <div className="flex items-center gap-3 flex-wrap">
                     <span className="bg-green-100 text-green-800 px-2 py-0.5 font-medium border border-green-200">{data.monCount || 0} MON</span>
                     <span className="bg-purple-100 text-purple-800 px-2 py-0.5 font-medium border border-purple-200">{data.osdCount || 0} OSD</span>
                     <span className="bg-blue-100 text-blue-800 px-2 py-0.5 font-medium border border-blue-200">{data.mgrCount || 0} MGR</span>
                     <span className="bg-orange-100 text-orange-800 px-2 py-0.5 font-medium border border-orange-200">{data.hostCount || 0} HOST</span>
                     <span className="bg-indigo-100 text-indigo-800 px-2 py-0.5 font-medium border border-indigo-200">{data.poolCount || 0} POOL</span>
                  </div>
               </div>

               {/* Row 5: Uptime & Network */}
               <div className="flex items-center px-6 py-2.5 bg-white text-xs">
                  <span className="font-semibold text-gray-700 min-w-[90px]">Uptime:</span>
                  <span className="text-gray-900 font-medium">{data.uptime || 'N/A'}</span>
                  <span className="mx-3 text-gray-300">|</span>
                  <span className="font-semibold text-gray-700">Network:</span>
                  <span className="ml-2 text-gray-900">
                     Public <span className="font-mono text-[10px] bg-gray-100 px-1.5 py-0.5 border border-gray-200">{data.publicNetwork || 'N/A'}</span>
                     {', '}
                     Cluster <span className="font-mono text-[10px] bg-gray-100 px-1.5 py-0.5 border border-gray-200">{data.clusterNetwork || 'N/A'}</span>
                  </span>
               </div>
            </div>
            {/* Bottom Row (Only Print) */}
            <div className="bg-gradient-to-r from-cyan-600 to-cyan-700 px-6 py-1 hidden print:block">
               <div className="flex items-center justify-between">
                  <h2 className="text-xs font-bold text-white">{data.clusterName || 'Production Cluster 01'}</h2>
                  <div className="flex items-center gap-2">
                     <div className="w-2 h-2 bg-green-400 animate-pulse"></div>
                     <span className="text-white text-xs font-semibold">OPERATIONAL</span>
                  </div>
               </div>
            </div>
         </div>
      </div>
   );
}
