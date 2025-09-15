import * as THREE from 'three';
import { useMemo } from 'react';

export default function Atmosphere({ radius = 1, intensity = 1.1, power = 2.0, color = '#6ec8ff' }) {
   const mat = useMemo(() => {
      const uniforms = {
         uColor: { value: new THREE.Color(color) },
         uIntensity: { value: intensity },
         uPower: { value: power },
      };

      const vert = /* glsl */ `
      varying vec3 vWorldNormal;
      varying vec3 vWorldPos;
      void main() {
        vec4 worldPos = modelMatrix * vec4(position, 1.0);
        vWorldPos = worldPos.xyz;
        vWorldNormal = normalize(mat3(modelMatrix) * normal);
        gl_Position = projectionMatrix * viewMatrix * worldPos;
      }
    `;

      const frag = /* glsl */ `
      varying vec3 vWorldNormal;
      varying vec3 vWorldPos;
      uniform vec3 uColor;
      uniform float uIntensity;
      uniform float uPower;
      void main() {
        vec3 V = normalize(cameraPosition - vWorldPos);
        // Fresnel: 가장자리에서 강하고 정면에서 약함
        float fresnel = pow(1.0 - max(dot(normalize(vWorldNormal), V), 0.0), uPower);
        float alpha = clamp(fresnel * uIntensity, 0.0, 1.0);
        gl_FragColor = vec4(uColor * (fresnel * uIntensity), alpha);
      }
    `;

      return new THREE.ShaderMaterial({
         uniforms,
         vertexShader: vert,
         fragmentShader: frag,
         transparent: true,
         blending: THREE.AdditiveBlending,
         depthWrite: true,
         side: THREE.DoubleSide, // 바깥쪽 림이 보이도록 뒤집힌 면 사용
      });
   }, [color, intensity, power]);

   return (
      <mesh scale={1.05}>
         <sphereGeometry args={[radius, 64, 64]} />
         <primitive object={mat} attach="material" />
      </mesh>
   );
}
