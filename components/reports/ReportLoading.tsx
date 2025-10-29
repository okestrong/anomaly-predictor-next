import { FC } from 'react';

interface Props {
   title: string;
   desc: string;
}

const ReportLoading: FC<Props> = ({ title, desc }) => {
   return (
      // <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-secondary-900 via-ai-neural to-secondary-800">
      <div className="flex items-center justify-center min-h-screen bg-black">
         <div className="text-center">
            <video className="mx-auto mb-4" autoPlay loop muted playsInline>
               <source src="/videos/loading_cyber.mp4" type="video/mp4" />
            </video>
            <p className="text-lg text-white">{title}</p>
            <p className="text-sm text-slate-300 mt-2">{desc}</p>
         </div>
      </div>
   );
};

export default ReportLoading;
