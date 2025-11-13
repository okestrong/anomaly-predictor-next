import { ReactNode } from 'react';
import Footer from '@/components/common/Footer';

interface Props {
   children: ReactNode | ReactNode[];
}

export default function FooterLayout({ children }: Props) {
   return (
      <div>
         <div>{children}</div>
         <Footer />
      </div>
   );
}
