import * as THREE from 'three';
import { PoolData } from '@/types';

const criticalStates = [
   'down', // PG가 다운됨
   'incomplete', // 데이터 손실 가능성
   'inconsistent', // 데이터 불일치
   'stale', // 오래된 상태 (MON과 통신 끊김)
];

// Warning 상태 - 복구 가능하지만 주의 필요
const warningStates = [
   'degraded', // 복제본 부족
   'undersized', // 복제본 수 미달
   'remapped', // PG 재배치 중
   'backfilling', // 백필 진행 중
   'backfill_wait', // 백필 대기 중
   'recovering', // 복구 진행 중
   'recovery_wait', // 복구 대기 중
   'repair', // 수리 중
   'peering', // 동기화 중 (일시적)
   'activating', // 활성화 중
];

// 정상 작업 (Warning으로 표시하지 않음)
const normalOperations = [
   'scrubbing', // 정상 스크럽
   'deep', // Deep scrub
   'snaptrim', // 스냅샷 정리
   'snaptrim_wait', // 스냅샷 정리 대기
];

export const calculatePgState = (state: string) => {
   const stateLower = state?.toLowerCase() ?? '';

   // Critical 체크
   for (const criticalState of criticalStates) {
      if (stateLower.includes(criticalState)) {
         return {
            status: 'critical',
            color: '#ff0000', // 빨강
            severity: 3,
            message: `Critical: ${criticalState}`,
         };
      }
   }

   // Warning 체크
   for (const warningState of warningStates) {
      if (stateLower.includes(warningState)) {
         return {
            status: 'warning',
            color: '#ff8800', // 주황
            severity: 2,
            message: `Warning: ${warningState}`,
         };
      }
   }

   // Active+Clean = Healthy
   if (stateLower === 'active+clean') {
      return {
         status: 'healthy',
         color: '#00ff00', // 초록
         severity: 0,
         message: 'Healthy',
      };
   }

   // Active이지만 clean이 아닌 경우 - Warning
   if (stateLower.includes('active') && !stateLower.includes('clean')) {
      // 하지만 정상 작업 중이면 healthy로 처리
      const isNormalOperation = normalOperations.some(op => stateLower.includes(op));

      if (isNormalOperation) {
         return {
            status: 'healthy',
            color: '#00ff00',
            severity: 0,
            message: 'Healthy (maintenance)',
         };
      }

      return {
         status: 'warning',
         color: '#ff8800',
         severity: 2,
         message: 'Warning: Not clean',
      };
   }

   // Active가 없으면 Critical
   if (!stateLower.includes('active')) {
      return {
         status: 'critical',
         color: '#ff0000',
         severity: 3,
         message: 'Critical: Not active',
      };
   }

   // 알 수 없는 상태 - Warning으로 처리
   return {
      status: 'warning',
      color: '#ffaa00',
      severity: 1,
      message: 'Unknown state',
   };
};

export const calculatePoolState = (poolData: PoolData) => {
   const poolInfo = poolData.pool_info;
   const pgs = poolData.pgs || [];

   if (!poolInfo) {
      throw new Error('poolData not available');
   }

   const stats = poolInfo.statistics;
   const utilization = poolInfo.utilization;

   let score = 100;
   let issues = [];
   let criticalIssues = [];
   let warningIssues = [];

   // ============================================
   // 1. PG 상태 체크 (가중치: 40점)
   // ============================================
   let activeCleanCount = 0;
   let warningPgCount = 0;
   let criticalPgCount = 0;

   pgs.forEach(pg => {
      const state = pg.state.toLowerCase();

      // Critical PG 상태
      if (state.includes('down') || state.includes('incomplete') || state.includes('inconsistent') || state.includes('stale')) {
         criticalPgCount++;
      }
      // Warning PG 상태
      else if (
         state.includes('degraded') ||
         state.includes('undersized') ||
         state.includes('peering') ||
         state.includes('recovering') ||
         state.includes('backfilling') ||
         state.includes('remapped')
      ) {
         warningPgCount++;
      }
      // Healthy PG 상태
      else if (state === 'active+clean') {
         activeCleanCount++;
      }
   });

   const totalPgs = pgs.length;
   const activeCleanRatio = totalPgs > 0 ? activeCleanCount / totalPgs : 1;

   if (criticalPgCount > 0) {
      score -= 40;
      criticalIssues.push(`${criticalPgCount} PG(s) in critical state`);
   } else if (activeCleanRatio < 0.95) {
      score -= 40;
      criticalIssues.push(`Only ${(activeCleanRatio * 100).toFixed(1)}% PGs are active+clean`);
   } else if (activeCleanRatio < 0.99) {
      score -= 20;
      warningIssues.push(`${warningPgCount} PG(s) not optimal`);
   } else if (warningPgCount > 0) {
      score -= 10;
      warningIssues.push(`${warningPgCount} PG(s) in recovery/maintenance`);
   }

   // ============================================
   // 2. 용량 사용률 체크 (가중치: 25점)
   // ============================================
   const usagePercent = utilization.usage_percent * 100;

   if (usagePercent > 90) {
      score -= 25;
      criticalIssues.push(`Storage critically full: ${usagePercent.toFixed(1)}%`);
   } else if (usagePercent > 85) {
      score -= 20;
      criticalIssues.push(`Storage nearly full: ${usagePercent.toFixed(1)}%`);
   } else if (usagePercent > 75) {
      score -= 10;
      warningIssues.push(`Storage usage high: ${usagePercent.toFixed(1)}%`);
   } else if (usagePercent > 60) {
      score -= 5;
      warningIssues.push(`Storage usage moderate: ${usagePercent.toFixed(1)}%`);
   }

   // ============================================
   // 3. Degraded 객체 체크 (가중치: 20점)
   // ============================================
   if (stats.degraded > 0) {
      const degradedRatio = stats.objects > 0 ? stats.degraded / stats.objects : 0;

      if (degradedRatio > 0.1) {
         // 10% 이상
         score -= 20;
         criticalIssues.push(`${stats.degraded} objects degraded (${(degradedRatio * 100).toFixed(1)}%)`);
      } else if (degradedRatio > 0.05) {
         // 5% 이상
         score -= 15;
         criticalIssues.push(`${stats.degraded} objects degraded`);
      } else if (degradedRatio > 0.01) {
         // 1% 이상
         score -= 10;
         warningIssues.push(`${stats.degraded} objects degraded`);
      } else {
         score -= 5;
         warningIssues.push(`${stats.degraded} objects degraded (minor)`);
      }
   }

   // ============================================
   // 4. Unfound 객체 체크 (가중치: 10점) - 매우 심각
   // ============================================
   if (stats.unfound > 0) {
      score -= 10;
      criticalIssues.push(`${stats.unfound} objects unfound (data loss risk!)`);
   }

   // ============================================
   // 5. Misplaced 객체 체크 (가중치: 5점)
   // ============================================
   if (stats.misplaced > 0) {
      const misplacedRatio = stats.objects > 0 ? stats.misplaced / stats.objects : 0;

      if (misplacedRatio > 0.1) {
         // 10% 이상
         score -= 5;
         warningIssues.push(`${stats.misplaced} objects misplaced`);
      } else if (misplacedRatio > 0.01) {
         score -= 2;
         warningIssues.push(`${stats.misplaced} objects misplaced (rebalancing)`);
      }
   }

   // ============================================
   // 6. Size/Min_size 체크
   // ============================================
   if (poolInfo.size < poolInfo.min_size) {
      score -= 30;
      criticalIssues.push(`Pool size (${poolInfo.size}) below min_size (${poolInfo.min_size})`);
   }

   // ============================================
   // 7. Missing on Primary 체크
   // ============================================
   if (stats.missing_on_primary > 0) {
      score -= 15;
      criticalIssues.push(`${stats.missing_on_primary} objects missing on primary`);
   }

   // ============================================
   // 최종 상태 결정
   // ============================================
   let status, color, emissiveIntensity, blinkSpeed;

   if (score >= 90) {
      status = 'healthy';
      color = '#00ff00';
      emissiveIntensity = 0.3;
   } else if (score >= 70) {
      status = 'warning';
      color = '#ff8800';
      emissiveIntensity = 0.5;
      blinkSpeed = 2.0;
   } else {
      status = 'critical';
      color = '#ff0000';
      emissiveIntensity = 0.8;
      blinkSpeed = 1.0;
   }

   issues = [...criticalIssues, ...warningIssues];

   return {
      status,
      color,
      score,
      severity: 100 - score,
      emissiveIntensity,
      blinkSpeed,
      issues: issues.length > 0 ? issues : ['All systems normal'],
      criticalIssues,
      warningIssues,
   };
};

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
