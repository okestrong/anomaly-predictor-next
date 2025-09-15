import * as THREE from 'three';

/** ─────────────────────────────────────────────────────────────
 *  HierarchicalLayout  (호스트/랙 기준 계층 배치)
 *  - 호스트를 큰 원 둘레에 배치, 각 호스트의 OSD는 해당 호스트 중심을 기준으로 소원(小圓) 배치
 *  - 첨부파일의 groupByHost/원형 배치 아이디어를 계승하되 간격/반지름 자동화
 *  ────────────────────────────────────────────────────────────*/
export class HierarchicalLayout {
   private hostGroups: Record<string, any[]>;

   constructor(private clusterData: any[]) {
      this.hostGroups = this.groupByHost(clusterData);
   }
   private groupByHost(osds: any[]) {
      const g: Record<string, any[]> = {};
      for (const osd of osds) {
         const h = osd.host ?? 'default';
         (g[h] ||= []).push(osd);
      }
      return g;
   }

   calculate(options?: {
      hostRingRadius?: number; // 호스트 중심들이 놓일 반지름
      hostGap?: number; // 호스트 간 최소 간격
      osdBaseRadius?: number; // 호스트 내부 원의 기본 반지름
      verticalStep?: number; // 호스트 내부에서 y층 간격
   }): any[] {
      const { hostRingRadius = 40, hostGap = 12, osdBaseRadius = 8, verticalStep = 3 } = options || {};
      const hostKeys = Object.keys(this.hostGroups);
      const H = hostKeys.length || 1;
      const angleStep = (Math.PI * 2) / H;

      const out: any[] = [];
      hostKeys.forEach((host, hi) => {
         const osds = this.hostGroups[host];
         const thetaHost = angleStep * hi;
         // 호스트 갯수/간격에 따라 반지름 자동 스케일
         const hostR = Math.max(hostRingRadius, Math.sqrt(H) * hostGap * 3);
         const hostCenter = new THREE.Vector3(Math.cos(thetaHost) * hostR, 0, Math.sin(thetaHost) * hostR);

         // 호스트 내부: 등각 원환 배치 + y층 구분
         const n = osds.length;
         const innerR = osdBaseRadius + Math.max(0, n - 1) * 0.8; // 개수에 따라 살짝 확장
         for (let i = 0; i < n; i++) {
            const a = (i / n) * Math.PI * 2;
            const y = (i - (n - 1) / 2) * verticalStep * 0.0; // 원하면 0이 아닌 값으로 층 표현
            out.push({
               ...osds[i],
               position: [hostCenter.x + Math.cos(a) * innerR, y, hostCenter.z + Math.sin(a) * innerR],
            });
         }
      });
      return out;
   }
}

/** ─────────────────────────────────────────────────────────────
 *  GridLayout3D  (대량 노드용 3D 그리드)
 *  - 큐브형 그리드에 중앙 정렬
 *  ────────────────────────────────────────────────────────────*/
export class GridLayout3D {
   constructor(private nodes: any[]) {}
   calculate(options?: { spacing?: number; center?: boolean }): any[] {
      const spacing = options?.spacing ?? 15;
      const center = options?.center ?? true;
      const N = this.nodes.length;
      const dim = Math.ceil(Math.cbrt(N));
      const out: any[] = [];
      let idx = 0;
      for (let x = 0; x < dim && idx < N; x++) {
         for (let y = 0; y < dim && idx < N; y++) {
            for (let z = 0; z < dim && idx < N; z++) {
               const cx = center ? (x - (dim - 1) / 2) * spacing : x * spacing;
               const cy = center ? (y - (dim - 1) / 2) * spacing : y * spacing;
               const cz = center ? (z - (dim - 1) / 2) * spacing : z * spacing;
               out.push({ ...this.nodes[idx], position: [cx, cy, cz] });
               idx++;
            }
         }
      }
      return out;
   }
}

/** ─────────────────────────────────────────────────────────────
 *  SpiralLayoutTyphoon  (태풍형 나선: 중심에서 바깥으로 퍼져나감)
 *  - 아르키메데스 나선 r = a + bθ
 *  - 각 노드 간 목표 간격 `spacing`을 유지하려고 θ 증분을 동적으로 계산
 *  - 기본은 평면(Y=0). 살짝 깔때기 형상을 원하면 pitch>0 사용.
 *  ────────────────────────────────────────────────────────────*/
export class SpiralLayoutTyphoon {
   constructor(private nodes: any[]) {}
   calculate(options?: {
      startRadius?: number; // a
      spacing?: number; // 인접 노드 간 목표 거리
      radialGain?: number; // b 기본값 스케일 (spacing과 함께 반경 성장 속도)
      pitch?: number; // θ당 높이 변화(0이면 평면)
      jitter?: number; // 미세 난수(겹침 방지)
      clockwise?: boolean; // 회전 방향
   }): any[] {
      const a = options?.startRadius ?? 2;
      const spacing = Math.max(0.001, options?.spacing ?? 6);
      const bBase = options?.radialGain ?? spacing / (2 * Math.PI); // 한 바퀴마다 반경이 spacing 정도 증가
      const pitch = options?.pitch ?? 0; // 0이면 평면
      const jitter = options?.jitter ?? 0.0; // 0~1 정도
      const sgn = options?.clockwise === false ? -1 : 1;

      let theta = 0;
      let r = a;
      const out: any[] = [];

      for (let i = 0; i < this.nodes.length; i++) {
         // 위치
         const x = Math.cos(theta) * r + (Math.random() - 0.5) * jitter;
         const y = pitch * theta + (Math.random() - 0.5) * jitter * 0.2;
         const z = Math.sin(theta) * r + (Math.random() - 0.5) * jitter;

         out.push({ ...this.nodes[i], position: [x, y, z] });

         // 다음 스텝: 아크 길이 ≈ spacing 이 되도록 Δθ 조정
         // s(θ) ≈ sqrt( (dr/dθ)^2 + r^2 ) * Δθ,  r = a + bθ, dr/dθ = b
         const b = bBase;
         const step = spacing / Math.sqrt(b * b + r * r); // Δθ
         theta += sgn * step;
         r += b * step;
      }
      return out;
   }
}

/** ─────────────────────────────────────────────────────────────
 *  AdaptiveLayoutManager  (OSD 개수/메타데이터 기반 자동 선택)
 *  - 호스트 정보가 충분하면 Hierarchical
 *  - 매우 많으면 Grid
 *  - 소량이면 Spiral(시각적 구분 용이)
 *  - 그 외 ForceDirected (외부 구현 사용)
 *  ────────────────────────────────────────────────────────────*/
export class AdaptiveLayoutManager {
   selectBestLayout(clusterData: any[]) {
      const n = clusterData.length;
      const hasHost = clusterData.some(o => !!o.host);
      if (hasHost && n > 20) return 'hierarchical';
      if (n > 50) return 'grid';
      if (n < 10) return 'spiral';
      return 'force';
   }

   applyLayout(clusterData: any[], layoutType?: 'force' | 'hierarchical' | 'grid' | 'spiral', opts?: any): any[] {
      const type = layoutType ?? this.selectBestLayout(clusterData);
      switch (type) {
         case 'hierarchical':
            return new HierarchicalLayout(clusterData).calculate(opts);
         case 'grid':
            return new GridLayout3D(clusterData).calculate(opts);
         case 'spiral':
            return new SpiralLayoutTyphoon(clusterData).calculate(opts);
         case 'force':
         default:
            // 외부 ForceDirectedLayout 결과(벡터)를 [x,y,z]로 변환하는 어댑터만 제공
            // (이미 구현되어 있다고 했으므로 재사용)
            // @ts-ignore
            const initial = clusterData.osds.map(o => ({
               ...o,
               position: new THREE.Vector3((Math.random() - 0.5) * 50, (Math.random() - 0.5) * 30, (Math.random() - 0.5) * 50),
            }));
            // @ts-ignore
            const f = new ForceDirectedLayout(initial);
            // @ts-ignore
            const calc = f.calculate();
            return calc.map((n: any) => ({
               ...n,
               position: [n.position.x, n.position.y, n.position.z],
            }));
      }
   }
}
