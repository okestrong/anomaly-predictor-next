import { FC } from 'react';
import { Canvas } from '@react-three/fiber';

interface Props {}

const WorldTrafficView: FC<Props> = () => {
   return (
      <Canvas
         gl={{
            antialias: false,
         }}
         shadows
      ></Canvas>
   );
};

export default WorldTrafficView;
