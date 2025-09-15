import * as THREE from 'three';

export const loadTexture = async (url: string) => {
   let textureLoader = new THREE.TextureLoader();
   return new Promise(resolve => {
      textureLoader.load(url, texture => {
         resolve(texture);
      });
   });
};

export function makeSphereTexture(gl: THREE.WebGLRenderer, text: string, bgColor: string = '#fff', textColor: string = '#00D4FF') {
   const DPR = typeof window !== 'undefined' ? Math.min(window.devicePixelRatio ?? 1, 2) : 1;
   const width = 2048 * DPR;
   const height = 1024 * DPR;

   const canvas = document.createElement('canvas');
   canvas.width = width;
   canvas.height = height;
   const ctx = canvas.getContext('2d')!;

   // 배경
   ctx.fillStyle = bgColor;
   ctx.fillRect(0, 0, width, height);

   // 텍스트
   const fontSize = Math.floor(height * 0.18);
   ctx.font = `900 ${fontSize}px "Inter", Arial, sans-serif`;
   ctx.textAlign = 'center';
   ctx.textBaseline = 'middle';
   ctx.lineWidth = Math.max(6 * DPR, 4);
   ctx.strokeStyle = '#ffffff';
   ctx.fillStyle = textColor;
   ctx.strokeText(text, width / 2, height / 2);
   ctx.fillText(text, width / 2, height / 2);

   const tex = new THREE.CanvasTexture(canvas);
   // ✦ 핵심: 컬러 텍스처는 UVMapping을 써야 함
   tex.mapping = THREE.UVMapping;
   tex.flipY = true; // CanvasTexture 기본
   tex.wrapS = THREE.ClampToEdgeWrapping;
   tex.wrapT = THREE.ClampToEdgeWrapping;
   tex.repeat.set(1, 1);
   tex.center.set(0.5, 0.5);
   tex.rotation = 0;
   tex.anisotropy = gl.capabilities.getMaxAnisotropy?.() ?? 1;
   tex.generateMipmaps = true;
   tex.minFilter = THREE.LinearMipmapLinearFilter;
   tex.magFilter = THREE.LinearFilter;
   tex.colorSpace = THREE.SRGBColorSpace;

   return tex;
}
