import Image from 'next/image';
import Link from 'next/link';

export default function Footer() {
   return (
      <footer className="bg-gradient-to-b from-gray-100 via-white to-slate-300 border-t border-gray-200">
         <div className="max-w-[1800px] mx-auto px-6 py-12">
            {/* Top Section - Logos and Description */}
            <div className="flex items-center justify-between pb-10 border-b border-gray-200">
               <div className="flex items-center gap-8">
                  <Image src="/images/okestro-wide.png" alt="OKESTRO" width={180} height={54} className="hover:opacity-80 transition-opacity" />
                  <div className="h-12 w-px bg-gray-300" />
                  <div className="flex items-center gap-3">
                     <Image src="/images/ceph.png" alt="Ceph" width={48} height={48} className="opacity-90" />
                     <div>
                        <p className="text-gray-600 text-sm font-light">Powered by</p>
                        <p className="text-gray-900 text-lg font-semibold">Ceph Storage</p>
                     </div>
                  </div>
               </div>
               <div className="text-right">
                  <p className="text-gray-900 font-medium text-lg mb-1">AI-Powered Anomaly Prediction Dashboard</p>
                  <p className="text-gray-600 text-sm font-light">Intelligent monitoring and predictive analytics for Ceph clusters</p>
               </div>
            </div>

            {/* Main Section - Info Grid and Map */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 py-12">
               {/* Left Column - Company Info and Social Links */}
               <div className="space-y-8">
                  {/* Company Info */}
                  <div>
                     <h3 className="text-gray-900 text-lg font-semibold mb-4 flex items-center gap-2">
                        <div className="w-1 h-5 bg-blue-600 rounded-full" />
                        Contact Information
                     </h3>
                     <div className="space-y-3 text-gray-700">
                        <div className="flex items-start gap-3">
                           <svg className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path
                                 strokeLinecap="round"
                                 strokeLinejoin="round"
                                 strokeWidth={2}
                                 d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                              />
                           </svg>
                           <div>
                              <p className="text-gray-900 font-medium">OKESTRO</p>
                              <p className="text-sm">서울특별시 영등포구 여의대로 108</p>
                              <p className="text-sm">파크원타워2 43층</p>
                           </div>
                        </div>
                        <div className="flex items-center gap-3">
                           <svg className="w-5 h-5 text-blue-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path
                                 strokeLinecap="round"
                                 strokeLinejoin="round"
                                 strokeWidth={2}
                                 d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                              />
                           </svg>
                           <span>02) 6080-0029</span>
                        </div>
                        <div className="flex items-center gap-3">
                           <svg className="w-5 h-5 text-blue-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path
                                 strokeLinecap="round"
                                 strokeLinejoin="round"
                                 strokeWidth={2}
                                 d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                              />
                           </svg>
                           <a href="mailto:info@okestro.com" className="hover:text-blue-600 transition-colors">
                              info@okestro.com
                           </a>
                        </div>
                     </div>
                  </div>

                  {/* Social Links */}
                  <div>
                     <h3 className="text-gray-900 text-lg font-semibold mb-4 flex items-center gap-2">
                        <div className="w-1 h-5 bg-blue-600 rounded-full" />
                        Follow Us
                     </h3>
                     <div className="flex gap-4">
                        <Link
                           href="https://www.youtube.com/@okestro"
                           target="_blank"
                           rel="noopener noreferrer"
                           className="group flex items-center gap-2 px-4 py-2.5 bg-white hover:bg-red-50 border border-gray-300 hover:border-red-500 rounded-lg transition-all shadow-sm"
                        >
                           <svg className="w-5 h-5 text-gray-600 group-hover:text-red-600 transition-colors" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                           </svg>
                           <span className="text-sm text-gray-700 group-hover:text-red-600 transition-colors">YouTube</span>
                        </Link>

                        <Link
                           href="https://blog.naver.com/okestro"
                           target="_blank"
                           rel="noopener noreferrer"
                           className="group flex items-center gap-2 px-4 py-2.5 bg-white hover:bg-green-50 border border-gray-300 hover:border-green-600 rounded-lg transition-all shadow-sm"
                        >
                           <svg className="w-5 h-5 text-gray-600 group-hover:text-green-600 transition-colors" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M16.273 12.845 7.376 0H0v24h7.726V11.156L16.624 24H24V0h-7.727v12.845z" />
                           </svg>
                           <span className="text-sm text-gray-700 group-hover:text-green-600 transition-colors">Naver Blog</span>
                        </Link>

                        <Link
                           href="https://www.linkedin.com/company/okestro"
                           target="_blank"
                           rel="noopener noreferrer"
                           className="group flex items-center gap-2 px-4 py-2.5 bg-white hover:bg-blue-50 border border-gray-300 hover:border-blue-600 rounded-lg transition-all shadow-sm"
                        >
                           <svg className="w-5 h-5 text-gray-600 group-hover:text-blue-600 transition-colors" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                           </svg>
                           <span className="text-sm text-gray-700 group-hover:text-blue-600 transition-colors">LinkedIn</span>
                        </Link>
                     </div>
                  </div>

                  {/* Contact Person */}
                  <div className="pt-6 border-t border-gray-200">
                     <h3 className="text-gray-900 text-sm font-semibold mb-3">Inquiry</h3>
                     <div className="space-y-1.5 text-sm text-gray-700">
                        <p className="text-gray-900 font-medium">솔루션개발본부 IaaS 개발실 분산스토리지팀</p>
                        <p>이재철 수석</p>
                        <div className="flex gap-4 pt-2">
                           <a href="mailto:jc.lee@okestro.com" className="hover:text-blue-600 transition-colors">
                              jc.lee@okestro.com
                           </a>
                           <a href="tel:+821044012262" className="hover:text-blue-600 transition-colors">
                              +82 10-4401-2262
                           </a>
                        </div>
                     </div>
                  </div>
               </div>

               {/* Right Column - Map */}
               <div className="relative rounded-xl overflow-hidden border border-gray-300 shadow-xl group">
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <Image
                     src="/images/okestro-map.png"
                     alt="OKESTRO Location"
                     width={(1272 * 2) / 3}
                     height={(699 * 2) / 3}
                     className="w-full h-auto object-cover"
                  />
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-white/95 to-transparent p-6">
                     <p className="text-gray-900 font-medium mb-1">파크원타워2 43층</p>
                     <p className="text-gray-700 text-sm">서울특별시 영등포구 여의대로 108</p>
                  </div>
               </div>
            </div>

            {/* Bottom Section - Copyright */}
            <div className="pt-8 border-t border-gray-200">
               <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                  <div className="flex items-center gap-6">
                     <Image src="/images/okestro.png" alt="OKESTRO Logo" width={40} height={40} className="opacity-90" />
                     <div className="text-sm text-gray-600">
                        <p>사업자 등록번호: 674-88-01017</p>
                        <p className="mt-1">© 2024 OKESTRO. All rights reserved.</p>
                     </div>
                  </div>
                  <div className="text-sm text-gray-600 text-center md:text-right">
                     <p className="font-light">Built with 🤝 using Next.js, TypeScript, and Ceph Storage</p>
                  </div>
               </div>
            </div>
         </div>
      </footer>
   );
}
