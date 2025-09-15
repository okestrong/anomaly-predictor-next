'use client';

import { createGlobalStyle } from 'styled-components';

export default createGlobalStyle`
   .topology-container {
      position: relative;
      width: 100vw;
      height: calc(100vh - 65px);
      overflow: hidden;
   }

   /* 전체화면 모드 스타일 */
   .topology-container.fullscreen-mode {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      width: 100vw;
      height: 100vh;
      z-index: 9999;
   }

   .topology-canvas {
      width: 100% !important;
      height: 100% !important;
      display: block;
   }

   .info-panel {
      position: absolute;
      top: 20px;
      right: 20px;
      width: 300px;
      background: rgba(0, 0, 0, 0.9);
      border: 1px solid rgba(0, 210, 255, 0.5);
      border-radius: 8px;
      padding: 20px;
      backdrop-filter: blur(10px);
      z-index: 10;
   }

   .info-panel h3 {
      color: #00d2ff;
      margin-bottom: 15px;
      font-size: 18px;
      font-weight: bold;
   }

   .info-content p {
      color: #f3f4f6;
      margin: 10px 0;
      font-size: 14px;
      line-height: 1.5;
   }

   .close-btn {
      position: absolute;
      top: 10px;
      right: 15px;
      background: none;
      border: none;
      color: #9ca3af;
      font-size: 24px;
      cursor: pointer;
      transition: color 0.2s;
   }

   .close-btn:hover {
      color: #f3f4f6;
   }

   /* Loading Spinner Styles */
   .loading-spinner-container {
      position: fixed;
      top: 0;
      left: 0;
      bottom: 0;
      width: 100%;
      display: flex;
      justify-content: center;
      align-items: center;
      background: rgba(0, 0, 0, 0.3);
      backdrop-filter: blur(5px);
      z-index: 9999;
   }

   .loading-spinner {
      position: relative;
      width: 120px;
      height: 120px;
   }

   .spinner-ring {
      position: absolute;
      width: 100%;
      height: 100%;
      border-radius: 50%;
      border: 3px solid transparent;
      border-top-color: #00d2ff;
      animation: spin 1.5s linear infinite;
   }

   .spinner-ring:nth-child(1) {
      animation-delay: 0s;
      border-top-color: #00d2ff;
   }

   .spinner-ring:nth-child(2) {
      width: 80%;
      height: 80%;
      top: 10%;
      left: 10%;
      animation-delay: 0.2s;
      animation-direction: reverse;
      border-top-color: #8b5cf6;
   }

   .spinner-ring:nth-child(3) {
      width: 60%;
      height: 60%;
      top: 20%;
      left: 20%;
      animation-delay: 0.4s;
      border-top-color: #4ade80;
   }

   .spinner-text {
      position: absolute;
      bottom: -40px;
      left: 50%;
      transform: translateX(-50%);
      color: #00d2ff;
      font-size: 14px;
      font-weight: 500;
      text-align: center;
      white-space: nowrap;
      animation: pulse 1.5s ease-in-out infinite;
   }

   @keyframes spin {
      0% {
         transform: rotate(0deg);
      }
      100% {
         transform: rotate(360deg);
      }
   }

   @keyframes pulse {
      0%,
      100% {
         opacity: 0.6;
      }
      50% {
         opacity: 1;
      }
   }
   /* 우주선 계기판 스타일 패널 */
   .spaceship-panel {
      position: fixed;
      background: linear-gradient(135deg, rgba(20, 20, 20, 0.7) 0%, rgba(25, 25, 25, 0.8) 50%, rgba(30, 30, 30, 0.7) 100%);
      backdrop-filter: blur(12px);
      transition:
         transform 0.8s cubic-bezier(0.16, 1, 0.3, 1),
         opacity 0.6s ease-out,
         box-shadow 0.3s ease;
      overflow: hidden;
      z-index: 40;
   }

   /* 패널별 색상 테마 - 상단 및 하단 중앙 (cyan/blue) */
   .panel-top,
   .panel-left,
   .panel-right,
   .panel-bottom {
      border: 1px solid rgba(0, 210, 255, 0.3);
      box-shadow:
         0 0 40px rgba(0, 210, 255, 0.2),
         0 0 80px rgba(0, 210, 255, 0.1),
         inset 0 0 20px rgba(0, 210, 255, 0.05);
   }

   .panel-top::before,
   .panel-left::before,
   .panel-right::before,
   .panel-bottom::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 1px;
      background: linear-gradient(90deg, transparent 0%, rgba(0, 210, 255, 0.8) 50%, transparent 100%);
      animation: scanline 3s linear infinite;
   }

   @keyframes scanline {
      0% {
         transform: translateX(-100%);
      }
      100% {
         transform: translateX(100%);
      }
   }

   /* 패널 위치 및 크기 */
   .panel-top {
      left: 50%;
      transform: translateX(-50%);
      width: 50vw;
      max-width: 800px;
      height: 220px;
   }

   .panel-left {
      bottom: 10px;
      left: 10px;
      width: 33vw;
      height: 250px;
   }

   .panel-bottom {
      bottom: 10px;
      left: 50%;
      transform: translateX(-50%);
      width: 32vw;
      height: 180px;
   }

   .panel-right {
      bottom: 10px;
      right: 10px;
      width: 33vw;
      height: 250px;
   }

   /* 패널 헤더 */
   .panel-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 8px 8px 0 14px;
      background: transparent;
      *background: linear-gradient(90deg, rgba(0, 210, 255, 0.1) 0%, rgba(0, 210, 255, 0.05) 100%);
      *border-bottom: 1px solid rgba(0, 210, 255, 0.2);
   }

   .panel-header.compact {
      padding: 4px 15px;
   }

   .panel-title {
      display: flex;
      align-items: center;
      gap: 12px;
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 2px;
      color: rgba(0, 210, 255, 0.9);
      text-shadow: 0 0 10px rgba(0, 210, 255, 0.5);
   }

   .title-indicator {
      width: 8px;
      height: 8px;
      background: radial-gradient(circle, #00d2ff 0%, transparent 70%);
      border-radius: 50%;
      animation: pulse 2s ease-in-out infinite;
   }

   .title-indicator.ai {
      background: radial-gradient(circle, #ff00ff 0%, transparent 70%);
   }

   .title-indicator.perf {
      background: radial-gradient(circle, #00ff88 0%, transparent 70%);
   }

   .panel-collapse-btn,
   .panel-fullscreen-btn {
      background: rgba(0, 210, 255, 0.1);
      border: 1px solid rgba(0, 210, 255, 0.3);
      color: rgba(0, 210, 255, 0.8);
      padding: 4px 8px;
      border-radius: 4px;
      cursor: pointer;
      transition: all 0.3s;
   }

   .panel-fullscreen-btn {
      margin-right: 8px;
   }

   .panel-collapse-btn:hover,
   .panel-fullscreen-btn:hover {
      background: rgba(0, 210, 255, 0.2);
      border-color: rgba(0, 210, 255, 0.5);
      box-shadow: 0 0 10px rgba(0, 210, 255, 0.3);
   }

   /* 패널 콘텐츠 */
   .panel-content {
      padding: 14px;
      height: calc(100% - 50px);
   }

   .panel-content.compact {
      padding: 15px;
      height: calc(100% - 40px);
   }

   .scrollable {
      overflow-y: auto;
      *height: 198px;
      padding-bottom: 20px;
      scrollbar-width: thin;
      scrollbar-color: rgba(0, 210, 255, 0.8) transparent;
   }

   .panel-content::-webkit-scrollbar {
      width: 6px;
   }

   .panel-content::-webkit-scrollbar-track {
      background: rgba(0, 0, 0, 0.2);
   }

   .panel-content::-webkit-scrollbar-thumb {
      background: rgba(0, 210, 255, 0.3);
      border-radius: 3px;
   }

   /* 클러스터 메트릭 그리드 */
   .cluster-metrics-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
      gap: 15px;
      height: 100%;
   }

   .metric-card {
      background: rgba(0, 0, 0, 0.3);
      border: 1px solid rgba(0, 210, 255, 0.15);
      border-radius: 8px;
      padding: 12px;
      position: relative;
      overflow: hidden;
   }

   .metric-card::after {
      content: '';
      position: absolute;
      top: 0;
      left: -100%;
      width: 100%;
      height: 100%;
      background: linear-gradient(90deg, transparent 0%, rgba(0, 210, 255, 0.1) 50%, transparent 100%);
      animation: sweep 4s ease-in-out infinite;
   }

   @keyframes sweep {
      0%,
      100% {
         left: -100%;
      }
      50% {
         left: 100%;
      }
   }

   .metric-label {
      font-size: 10px;
      font-weight: 600;
      letter-spacing: 1.5px;
      color: rgba(0, 210, 255, 0.6);
      margin-bottom: 8px;
      text-transform: uppercase;
   }

   .metric-value {
      font-size: 14px;
      font-weight: 700;
      color: #00ff88;
      text-shadow: 0 0 15px rgba(0, 255, 136, 0.5);
      font-family: 'Orbitron', monospace;
   }

   .metric-value.health-HEALTH_OK {
      color: #00ff88;
   }

   .metric-value.health-HEALTH_WARN {
      color: #ffaa00;
   }

   .metric-value.health-HEALTH_ERR {
      color: #ff3333;
   }

   .metric-indicator {
      margin-top: 8px;
      height: 3px;
      background: rgba(0, 0, 0, 0.5);
      border-radius: 2px;
      overflow: hidden;
   }

   .indicator-bar {
      height: 100%;
      background: linear-gradient(90deg, #00ff88 0%, #00d2ff 100%);
      box-shadow: 0 0 10px rgba(0, 255, 136, 0.5);
      transition: width 0.5s ease;
   }

   /* OSD 그리드 */
   .metric-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 8px;
   }

   .mini-metric {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 4px;
      background: rgba(0, 0, 0, 0.2);
      border-radius: 4px;
   }

   .mini-label {
      font-size: 9px;
      color: rgba(0, 210, 255, 0.5);
      letter-spacing: 1px;
   }

   .mini-value {
      font-size: 18px;
      font-weight: 700;
      font-family: 'Orbitron', monospace;
      color: #00d2ff;
   }

   .mini-value.up {
      color: #00ff88;
   }

   .mini-value.down {
      color: #ff3333;
   }

   /* Capacity 시각화 */
   .capacity-visual {
      display: flex;
      align-items: center;
      gap: 15px;
   }

   .capacity-ring {
      position: relative;
      width: 80px;
      height: 80px;
   }

   .capacity-ring svg {
      width: 100%;
      height: 100%;
      transform: rotate(-90deg);
   }

   .capacity-track {
      fill: none;
      stroke: rgba(0, 0, 0, 0.3);
      stroke-width: 5;
   }

   .capacity-fill {
      fill: none;
      stroke: url(#capacityGradient);
      stroke-width: 5;
      stroke-linecap: round;
      transition: stroke-dasharray 1s ease;
      filter: drop-shadow(0 0 5px rgba(0, 210, 255, 0.5));
   }

   .capacity-percent {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      font-size: 20px;
      font-weight: 700;
      font-family: 'Orbitron', monospace;
      color: #00d2ff;
   }

   .capacity-details {
      font-size: 11px;
      color: rgba(0, 210, 255, 0.7);
   }

   /* IOPS Display */
   .iops-display {
      display: flex;
      flex-direction: column;
      gap: 10px;
   }

   .iops-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 8px;
      background: rgba(0, 0, 0, 0.2);
      border-radius: 4px;
      border: 1px solid rgba(0, 210, 255, 0.1);
   }

   .iops-type {
      font-size: 10px;
      font-weight: 600;
      letter-spacing: 1px;
      padding: 2px 8px;
      border-radius: 3px;
   }

   .iops-type.read {
      background: rgba(0, 136, 255, 0.2);
      color: #0088ff;
   }

   .iops-type.write {
      background: rgba(0, 255, 136, 0.2);
      color: #00ff88;
   }

   .iops-value {
      font-size: 16px;
      font-weight: 700;
      font-family: 'Orbitron', monospace;
      color: #ffffff;
   }

   /* PG Status */
   .pg-status {
      display: flex;
      flex-direction: column;
      gap: 8px;
   }

   .pg-stat {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 6px;
      background: rgba(0, 0, 0, 0.2);
      border-radius: 4px;
   }

   .pg-label {
      font-size: 10px;
      color: rgba(0, 210, 255, 0.6);
   }

   .pg-value {
      font-size: 14px;
      font-weight: 700;
      font-family: 'Orbitron', monospace;
   }

   .pg-value.clean {
      color: #00ff88;
   }

   .pg-value.degraded {
      color: #ffaa00;
   }

   /* Predictions List */
   .predictions-list {
      display: flex;
      flex-direction: column;
      gap: 12px;
   }

   .prediction-item {
      background: rgba(0, 0, 0, 0.3);
      border: 1px solid rgba(0, 210, 255, 0.15);
      border-radius: 8px;
      padding: 12px;
      transition: all 0.3s;
   }

   .prediction-item:hover {
      background: rgba(0, 0, 0, 0.4);
      border-color: rgba(0, 210, 255, 0.3);
      box-shadow: 0 0 15px rgba(0, 210, 255, 0.1);
   }

   .prediction-item.risk-low {
      border-left: 3px solid #06b6d4;
   }

   .prediction-item.risk-medium {
      border-left: 3px solid #f59e0b;
   }

   .prediction-item.risk-high {
      border-left: 3px solid #f97316;
   }

   .prediction-item.risk-critical {
      border-left: 3px solid #ef4444;
      animation: criticalPulse 2s ease-in-out infinite;
   }

   @keyframes criticalPulse {
      0%,
      100% {
         background: rgba(239, 68, 68, 0.1);
      }
      50% {
         background: rgba(239, 68, 68, 0.2);
      }
   }

   .pred-header {
      display: flex;
      align-items: center;
      gap: 10px;
      margin-bottom: 8px;
   }

   .pred-icon {
      font-size: 20px;
   }

   .pred-title {
      flex: 1;
      font-size: 12px;
      font-weight: 600;
      color: #ffffff;
   }

   .pred-risk {
      font-size: 9px;
      font-weight: 700;
      letter-spacing: 1px;
      padding: 2px 6px;
      border-radius: 3px;
      background: rgba(0, 210, 255, 0.1);
      color: rgba(0, 210, 255, 0.8);
   }

   .pred-details {
      display: flex;
      justify-content: space-between;
      font-size: 10px;
      color: rgba(255, 255, 255, 0.6);
      margin-bottom: 8px;
   }

   .pred-progress {
      height: 3px;
      background: rgba(0, 0, 0, 0.5);
      border-radius: 2px;
      overflow: hidden;
   }

   .pred-progress-bar {
      height: 100%;
      background: linear-gradient(90deg, #ff00ff 0%, #00d2ff 100%);
      box-shadow: 0 0 10px rgba(255, 0, 255, 0.5);
      transition: width 0.5s ease;
   }

   /* Quick Stats */
   .quick-stats {
      display: flex;
      justify-content: space-around;
      align-items: center;
      height: 100%;
   }

   .quick-stat {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 8px;
   }

   .stat-label {
      font-size: 10px;
      font-weight: 600;
      letter-spacing: 1px;
      color: rgba(0, 210, 255, 0.6);
      text-transform: uppercase;
   }

   .stat-value {
      font-size: 20px;
      font-weight: 700;
      font-family: 'Orbitron', monospace;
      color: #00d2ff;
      text-shadow: 0 0 10px rgba(0, 210, 255, 0.5);
   }

   .stat-value.alert {
      color: #ffaa00;
      animation: alertBlink 2s ease-in-out infinite;
   }

   @keyframes alertBlink {
      0%,
      100% {
         opacity: 1;
      }
      50% {
         opacity: 0.6;
      }
   }

   /* Performance Grid */
   .performance-grid {
      display: flex;
      flex-direction: column;
      gap: 10px;
   }

   .perf-metric {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 8px;
      background: rgba(0, 0, 0, 0.2);
      border-radius: 4px;
      border: 1px solid rgba(0, 210, 255, 0.1);
   }

   .perf-name {
      width: 80px;
      font-size: 11px;
      font-weight: 600;
      color: rgba(0, 210, 255, 0.7);
   }

   .perf-bar-container {
      flex: 1;
      height: 20px;
      background: rgba(0, 0, 0, 0.5);
      border-radius: 10px;
      overflow: hidden;
      position: relative;
   }

   .perf-bar {
      height: 100%;
      background: linear-gradient(90deg, #0088ff 0%, #00ff88 100%);
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: flex-end;
      padding-right: 8px;
      transition: width 0.5s ease;
      box-shadow: 0 0 10px rgba(0, 255, 136, 0.3);
   }

   .perf-value {
      font-size: 10px;
      font-weight: 700;
      color: #ffffff;
      text-shadow: 0 0 5px rgba(0, 0, 0, 0.5);
   }

   .perf-status {
      width: 60px;
      font-size: 9px;
      font-weight: 700;
      text-align: center;
      padding: 2px 4px;
      border-radius: 3px;
      letter-spacing: 0.5px;
   }

   .perf-status.normal {
      background: rgba(0, 255, 136, 0.2);
      color: #00ff88;
   }

   .perf-status.warning {
      background: rgba(255, 170, 0, 0.2);
      color: #ffaa00;
   }

   .perf-status.critical {
      background: rgba(255, 51, 51, 0.2);
      color: #ff3333;
   }

   .perf-status.optimal {
      background: rgba(0, 210, 255, 0.2);
      color: #00d2ff;
   }

   /* 펼치기 버튼 */
   .expand-btn {
      position: fixed;
      background: linear-gradient(135deg, rgba(0, 20, 40, 0.9) 0%, rgba(0, 40, 80, 0.8) 100%);
      border: 1px solid rgba(0, 210, 255, 0.4);
      color: rgba(0, 210, 255, 0.9);
      padding: 8px 12px;
      cursor: pointer;
      z-index: 99;
      transition: all 0.3s;
      backdrop-filter: blur(8px);
      box-shadow: 0 0 20px rgba(0, 210, 255, 0.2);
   }

   .expand-btn:hover {
      background: linear-gradient(135deg, rgba(0, 40, 80, 0.95) 0%, rgba(0, 60, 120, 0.85) 100%);
      border-color: rgba(0, 210, 255, 0.6);
      box-shadow: 0 0 30px rgba(0, 210, 255, 0.4);
   }

   .expand-top {
      top: 0;
      left: 50%;
      transform: translateX(-50%);
      border-bottom-left-radius: 8px;
      border-bottom-right-radius: 8px;
      border-top: none;
   }

   .expand-left {
      bottom: 135px;
      left: 0;
      border-top-right-radius: 8px;
      border-bottom-right-radius: 8px;
      border-left: none;
   }

   .expand-bottom {
      bottom: 0;
      left: 50%;
      transform: translateX(-50%);
      border-top-left-radius: 8px;
      border-top-right-radius: 8px;
      border-bottom: none;
   }

   .expand-right {
      bottom: 135px;
      right: 0;
      border-top-left-radius: 8px;
      border-bottom-left-radius: 8px;
      border-right: none;
   }

   /* 비대칭 레이아웃 스타일 */
   .asymmetric-layout {
      display: grid;
      grid-template-columns: 1fr 1fr 1fr;
      grid-template-rows: auto auto auto;
      gap: 15px;
      height: 100%;
      *padding: 15px;
   }

   /* 메인 컨트롤 패널 - 좌측 */
   .main-control-panel {
      grid-column: 1 / 2;
      grid-row: 1 / 3;
      background: rgba(0, 210, 255, 0.05);
      border: 1px solid rgba(0, 210, 255, 0.2);
      border-radius: 8px;
      padding: 15px;
      display: flex;
      flex-direction: column;
      gap: 12px;
   }

   .control-header {
      display: flex;
      align-items: center;
      gap: 12px;
   }

   .status-icon {
      color: rgba(0, 210, 255, 0.8);
      animation: pulse 2s ease-in-out infinite;
   }

   .control-info {
      flex: 1;
   }

   .control-title {
      font-size: 12px;
      color: rgba(255, 255, 255, 0.6);
      margin-bottom: 4px;
   }

   .control-status {
      font-size: 14px;
      font-weight: 600;
      color: #4ade80;
   }

   .status-HEALTH_OK {
      color: #4ade80;
   }

   .health-gauge {
      margin: 10px 0;
   }

   .gauge-container {
      position: relative;
      height: 24px;
      background: rgba(255, 255, 255, 0.1);
      border-radius: 12px;
      overflow: hidden;
   }

   .gauge-fill {
      height: 100%;
      background: linear-gradient(90deg, #4ade80, #22c55e);
      border-radius: 12px;
      transition: width 0.5s ease;
      position: relative;
   }

   .gauge-value {
      position: absolute;
      right: 8px;
      top: 50%;
      transform: translateY(-50%);
      font-size: 12px;
      font-weight: 600;
      color: white;
      z-index: 2;
   }

   .capacity-display {
      margin-top: 10px;
   }

   .capacity-label {
      font-size: 10px;
      color: rgba(255, 255, 255, 0.6);
      margin-bottom: 6px;
   }

   .capacity-bar {
      height: 6px;
      background: rgba(255, 255, 255, 0.1);
      border-radius: 3px;
      overflow: hidden;
      margin-bottom: 6px;
   }

   .capacity-fill {
      height: 100%;
      background: linear-gradient(90deg, rgba(0, 210, 255, 0.8), rgba(0, 210, 255, 0.6));
      border-radius: 3px;
      transition: width 0.5s ease;
   }

   .capacity-text {
      font-size: 10px;
      color: rgba(255, 255, 255, 0.7);
   }

   /* 토글/스위치 섹션 - 우측 상단 */
   .toggle-section {
      grid-column: 2 / 4;
      grid-row: 1;
      display: flex;
      gap: 10px;
      align-items: flex-start;
   }

   .toggle-card {
      flex: 1;
      background: rgba(0, 210, 255, 0.03);
      border: 1px solid rgba(0, 210, 255, 0.15);
      border-radius: 6px;
      padding: 8px;
      text-align: center;
   }

   .toggle-label {
      font-size: 9px;
      color: rgba(255, 255, 255, 0.6);
      margin-bottom: 6px;
   }

   .toggle-switch {
      width: 32px;
      height: 16px;
      background: rgba(255, 255, 255, 0.1);
      border-radius: 8px;
      position: relative;
      cursor: pointer;
      transition: all 0.3s ease;
      margin: 0 auto;
   }

   .toggle-switch.active {
      background: rgba(0, 210, 255, 0.6);
   }

   .toggle-slider {
      width: 12px;
      height: 12px;
      background: white;
      border-radius: 50%;
      position: absolute;
      top: 2px;
      left: 2px;
      transition: all 0.3s ease;
   }

   .toggle-switch.active .toggle-slider {
      transform: translateX(16px);
   }

   /* OSD 매트릭스 - 중앙 */
   .osd-matrix {
      grid-column: 2 / 3;
      grid-row: 2;
      background: rgba(0, 210, 255, 0.03);
      border: 1px solid rgba(0, 210, 255, 0.15);
      border-radius: 6px;
      padding: 10px;
   }

   .matrix-label {
      font-size: 10px;
      color: rgba(255, 255, 255, 0.6);
      margin-bottom: 8px;
      text-align: center;
   }

   .osd-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 6px;
   }

   .osd-item {
      background: rgba(255, 255, 255, 0.05);
      border-radius: 4px;
      padding: 6px;
      text-align: center;
      border: 1px solid rgba(255, 255, 255, 0.1);
   }

   .osd-item.up {
      border-color: rgba(34, 197, 94, 0.4);
      background: rgba(34, 197, 94, 0.1);
   }

   .osd-item.down {
      border-color: rgba(239, 68, 68, 0.4);
      background: rgba(239, 68, 68, 0.1);
   }

   .osd-count {
      display: block;
      font-size: 14px;
      font-weight: 700;
      color: rgba(0, 210, 255, 0.9);
      margin-bottom: 2px;
   }

   .osd-item.up .osd-count {
      color: #4ade80;
   }

   .osd-item.down .osd-count {
      color: #ef4444;
   }

   .osd-label {
      font-size: 8px;
      color: rgba(255, 255, 255, 0.6);
   }

   /* 성능 매트릭스 - 우측 하단 */
   .performance-matrix {
      grid-column: 3 / 4;
      grid-row: 2;
      background: rgba(0, 210, 255, 0.03);
      border: 1px solid rgba(0, 210, 255, 0.15);
      border-radius: 6px;
      padding: 10px;
      display: flex;
      flex-direction: column;
      gap: 8px;
   }

   .perf-item {
      display: flex;
      flex-direction: column;
      gap: 4px;
   }

   .perf-label {
      font-size: 9px;
      color: rgba(255, 255, 255, 0.6);
   }

   .perf-progress {
      height: 6px;
      background: rgba(255, 255, 255, 0.1);
      border-radius: 3px;
      overflow: hidden;
   }

   .progress-bar {
      height: 100%;
      background: linear-gradient(90deg, rgba(0, 210, 255, 0.8), rgba(0, 210, 255, 0.6));
      border-radius: 3px;
      transition: width 0.5s ease;
   }

   .progress-bar.warning {
      background: linear-gradient(90deg, rgba(251, 191, 36, 0.8), rgba(251, 191, 36, 0.6));
   }

   .perf-value {
      font-size: 10px;
      color: rgba(255, 255, 255, 0.8);
      font-weight: 600;
   }

   /* PG 상태 섹션 - 하단 */
   .pg-status-section {
      grid-column: 1 / 4;
      grid-row: 3;
      display: flex;
      justify-content: center;
      align-items: center;
   }

   .pg-indicator {
      display: flex;
      gap: 20px;
      align-items: center;
   }

   .pg-icon {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 12px;
      font-weight: 600;
   }

   .pg-icon.clean {
      color: #4ade80;
   }

   .pg-icon.degraded {
      color: #f59e0b;
   }

   /* Vue Transition 애니메이션 */
   .slide-top-enter-active,
   .slide-top-leave-active {
      transition: all 0.8s cubic-bezier(0.16, 1, 0.3, 1);
   }
   .slide-top-enter-from {
      transform: translateX(-50%) translateY(-100%);
      opacity: 0;
   }
   .slide-top-leave-to {
      transform: translateX(-50%) translateY(-100%);
      opacity: 0;
   }

   .slide-left-enter-active,
   .slide-left-leave-active {
      transition: all 0.8s cubic-bezier(0.16, 1, 0.3, 1);
   }
   .slide-left-enter-from {
      transform: translateX(-100%);
      opacity: 0;
   }
   .slide-left-leave-to {
      transform: translateX(-100%);
      opacity: 0;
   }

   .slide-bottom-enter-active,
   .slide-bottom-leave-active {
      transition: all 0.8s cubic-bezier(0.16, 1, 0.3, 1);
   }
   .slide-bottom-enter-from {
      transform: translateX(-50%) translateY(100%);
      opacity: 0;
   }
   .slide-bottom-leave-to {
      transform: translateX(-50%) translateY(100%);
      opacity: 0;
   }

   .slide-right-enter-active,
   .slide-right-leave-active {
      transition: all 0.8s cubic-bezier(0.16, 1, 0.3, 1);
   }
   .slide-right-enter-from {
      transform: translateX(100%);
      opacity: 0;
   }
   .slide-right-leave-to {
      transform: translateX(100%);
      opacity: 0;
   }

   /* Slide-in Animations */
   @keyframes slideInFromTop {
      0% {
         transform: translateX(-50%) translateY(-100%);
         opacity: 0;
      }
      100% {
         transform: translateX(-50%) translateY(0);
         opacity: 1;
      }
   }

   @keyframes slideInFromLeft {
      0% {
         transform: translateX(-100%);
         opacity: 0;
      }
      100% {
         transform: translateX(0);
         opacity: 1;
      }
   }

   @keyframes slideInFromBottom {
      0% {
         transform: translateX(-50%) translateY(100%);
         opacity: 0;
      }
      100% {
         transform: translateX(-50%) translateY(0);
         opacity: 1;
      }
   }

   @keyframes slideInFromRight {
      0% {
         transform: translateX(100%);
         opacity: 0;
      }
      100% {
         transform: translateX(0);
         opacity: 1;
      }
   }

   /* Collapsed 상태 추가 효과 */
   .spaceship-panel[style*='translateY(-100%)'] {
      opacity: 0;
      pointer-events: none;
   }

   .spaceship-panel[style*='translateX(-100%)'] {
      opacity: 0;
      pointer-events: none;
   }

   .spaceship-panel[style*='translateY(100%)'] {
      opacity: 0;
      pointer-events: none;
   }

   .spaceship-panel[style*='translateX(100%)'] {
      opacity: 0;
      pointer-events: none;
   }

   /* 펼치기 버튼 애니메이션 */
   .expand-btn {
      background: rgba(0, 210, 255, 0.2);
      border: 1px solid rgba(0, 210, 255, 0.4);
      color: rgba(0, 210, 255, 0.9);
      transition: all 0.3s ease;
      animation: pulseExpandBtn 2s ease-in-out infinite;
   }

   .expand-btn:hover {
      background: rgba(0, 210, 255, 0.3);
      box-shadow: 0 0 15px rgba(0, 210, 255, 0.4);
      transform: scale(1.1);
   }

   .expand-btn.expand-top:hover,
   .expand-btn.expand-bottom:hover {
      transform: scale(1.1) translateX(-50%);
   }

   @keyframes pulseExpandBtn {
      0%,
      100% {
         box-shadow: 0 0 10px rgba(0, 210, 255, 0.3);
      }
      50% {
         box-shadow: 0 0 20px rgba(0, 210, 255, 0.6);
      }
   }

   /* OSD Performance Table 스타일 */
   .osd-performance-table {
      height: 100%;
      display: flex;
      flex-direction: column;
   }

   .table-header {
      margin-bottom: 12px;
   }

   .table-title {
      font-size: 12px;
      font-weight: 700;
      color: rgba(0, 210, 255, 0.9);
      text-align: center;
      letter-spacing: 0.5px;
   }

   .table-container {
      flex: 1;
      overflow: hidden;
      border-radius: 6px;
      border: 1px solid rgba(0, 210, 255, 0.2);
   }

   .performance-grid {
      width: 100%;
      border-collapse: collapse;
      font-size: 10px;
      height: 100%;
   }

   .performance-grid th {
      background: rgba(0, 210, 255, 0.1);
      color: rgba(255, 255, 255, 0.8);
      padding: 6px 4px;
      text-align: left;
      font-weight: 600;
      font-size: 9px;
      border-bottom: 1px solid rgba(0, 210, 255, 0.3);
   }

   .performance-grid td {
      padding: 4px;
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
      vertical-align: middle;
   }

   .performance-grid tr:hover {
      background: rgba(0, 210, 255, 0.05);
   }

   .osd-id {
      font-family: 'Courier New', monospace;
      font-weight: 700;
      color: rgba(0, 210, 255, 0.9);
   }

   .iops-cell {
      position: relative;
   }

   .iops-cell .metric-value {
      display: block;
      font-weight: 600;
      color: rgba(255, 255, 255, 0.9);
      margin-bottom: 2px;
   }

   .mini-bar {
      width: 100%;
      height: 3px;
      background: rgba(255, 255, 255, 0.1);
      border-radius: 2px;
      overflow: hidden;
   }

   .bar-fill {
      height: 100%;
      background: linear-gradient(90deg, rgba(0, 210, 255, 0.8), rgba(0, 210, 255, 0.6));
      border-radius: 2px;
      transition: width 0.5s ease;
   }

   .latency-cell .metric-value {
      color: rgba(255, 255, 255, 0.8);
      font-weight: 600;
   }

   .high-latency {
      color: #f59e0b !important;
   }

   .util-cell {
      position: relative;
      display: flex;
      align-items: center;
      gap: 6px;
   }

   .util-ring {
      width: 16px;
      height: 16px;
      border-radius: 50%;
      background: conic-gradient(rgba(0, 210, 255, 0.8) calc(var(--progress) * 3.6deg), rgba(255, 255, 255, 0.1) 0deg);
      flex-shrink: 0;
   }

   .temp-cell .metric-value {
      color: rgba(255, 255, 255, 0.8);
      font-weight: 600;
   }

   .hot-temp {
      color: #ef4444 !important;
   }

   .status-badge {
      display: flex;
      align-items: center;
      gap: 4px;
      padding: 2px 6px;
      border-radius: 12px;
      font-size: 8px;
      font-weight: 600;
   }

   .status-indicator {
      width: 6px;
      height: 6px;
      border-radius: 50%;
      flex-shrink: 0;
   }

   .badge-optimal {
      background: rgba(34, 197, 94, 0.2);
      color: #22c55e;
   }

   .badge-optimal .status-indicator {
      background: #22c55e;
   }

   .badge-normal {
      background: rgba(59, 130, 246, 0.2);
      color: #3b82f6;
   }

   .badge-normal .status-indicator {
      background: #3b82f6;
   }

   .badge-warning {
      background: rgba(251, 191, 36, 0.2);
      color: #fbbf24;
   }

   .badge-warning .status-indicator {
      background: #fbbf24;
   }

   .badge-critical {
      background: rgba(239, 68, 68, 0.2);
      color: #ef4444;
   }

   .badge-critical .status-indicator {
      background: #ef4444;
   }

   /* 테이블 행 상태별 스타일링 */
   .status-optimal {
      border-left: 2px solid rgba(34, 197, 94, 0.6);
   }

   .status-warning {
      border-left: 2px solid rgba(251, 191, 36, 0.6);
   }

   .status-critical {
      border-left: 2px solid rgba(239, 68, 68, 0.6);
   }

   /* 검색 패널 스타일 */
   .search-panel {
      position: fixed;
      left: 10px;
      width: 320px;
      background: linear-gradient(135deg, rgba(20, 20, 20, 0.5) 0%, rgba(25, 25, 25, 0.5) 50%, rgba(30, 30, 30, 0.5) 100%);
      backdrop-filter: blur(12px);
      border: 1px solid rgba(0, 210, 255, 0.3);
      border-radius: 8px;
      box-shadow:
         0 0 40px rgba(0, 210, 255, 0.2),
         0 0 80px rgba(0, 210, 255, 0.1),
         inset 0 0 20px rgba(0, 210, 255, 0.05);
      z-index: 101;
      overflow: hidden;
      transition:
         transform 0.8s cubic-bezier(0.16, 1, 0.3, 1),
         opacity 0.6s ease-out,
         box-shadow 0.3s ease;
   }

   .search-panel::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 1px;
      background: linear-gradient(90deg, transparent 0%, rgba(0, 210, 255, 0.8) 50%, transparent 100%);
      animation: scanline 3s linear infinite;
   }

   .search-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 8px 14px 0 8px;
   }

   .search-title {
      display: flex;
      justify-content: center;
      align-items: center;
      gap: 8px;
      font-size: 12px;
      font-weight: 700;
      color: rgba(0, 210, 255, 0.9);
      text-shadow: 0 0 10px rgba(0, 210, 255, 0.5);
      font-family: 'Orbitron', monospace;
      letter-spacing: 0.5px;
   }

   .search-indicator {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: rgba(0, 210, 255, 0.8);
      box-shadow: 0 0 8px rgba(0, 210, 255, 0.6);
      animation: pulse 2s ease-in-out infinite;
   }

   .search-collapse-btn {
      background: transparent;
      border: none;
      color: rgba(0, 210, 255, 0.7);
      cursor: pointer;
      padding: 4px;
      border-radius: 4px;
      transition: all 0.3s ease;
   }

   .search-collapse-btn:hover {
      color: rgba(0, 210, 255, 1);
      background: rgba(0, 210, 255, 0.1);
   }

   .search-content {
      padding: 16px;
   }

   .search-controls {
      display: flex;
      flex-direction: column;
      gap: 12px;
   }

   .search-select {
      width: 100%;
      padding: 8px 12px;
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid rgba(0, 210, 255, 0.3);
      border-radius: 6px;
      color: rgba(255, 255, 255, 0.9);
      font-size: 12px;
      font-family: 'Orbitron', monospace;
      outline: none;
      transition: all 0.3s ease;
   }

   .search-select:focus {
      border-color: rgba(0, 210, 255, 0.6);
      box-shadow: 0 0 10px rgba(0, 210, 255, 0.3);
   }

   .search-select option {
      background: rgba(20, 20, 20, 0.95);
      color: rgba(255, 255, 255, 0.9);
   }

   .search-select option:disabled {
      color: rgba(255, 255, 255, 0.4);
      background: rgba(20, 20, 20, 0.6);
   }

   .search-field-container {
      display: flex;
      position: relative;
   }

   .search-field {
      flex: 1;
      padding: 8px 40px 8px 12px;
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid rgba(0, 210, 255, 0.3);
      border-radius: 6px;
      color: rgba(255, 255, 255, 0.9);
      font-size: 12px;
      font-family: 'Orbitron', monospace;
      outline: none;
      transition: all 0.3s ease;
   }

   .search-field:focus {
      border-color: rgba(0, 210, 255, 0.6);
      box-shadow: 0 0 10px rgba(0, 210, 255, 0.3);
   }

   .search-field::placeholder {
      color: rgba(255, 255, 255, 0.4);
   }

   .search-btn {
      position: absolute;
      right: 2px;
      top: 2px;
      bottom: 2px;
      width: 32px;
      background: rgba(0, 210, 255, 0.2);
      border: none;
      border-radius: 4px;
      color: rgba(0, 210, 255, 0.8);
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.3s ease;
   }

   .search-btn:hover {
      background: rgba(0, 210, 255, 0.3);
      color: rgba(0, 210, 255, 1);
   }

   /* 검색 패널 펼치기 버튼 */
   .search-expand-btn {
      position: fixed;
      left: 0;
      width: 40px;
      height: 40px;
      transform: translateY(-50%);
      background: rgba(0, 210, 255, 0.2);
      border: 1px solid rgba(0, 210, 255, 0.4);
      border-left: 0;
      border-radius: 0 8px 8px 0;
      color: rgba(0, 210, 255, 0.9);
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 101;
      transition: all 0.3s ease;
      animation: pulseExpandBtn 2s ease-in-out infinite;
   }

   .search-expand-btn:hover {
      background: rgba(0, 210, 255, 0.3);
      box-shadow: 0 0 15px rgba(0, 210, 255, 0.4);
      transform: scale(1.05) translateY(-50%);
   }

   /* 검색 패널 애니메이션 */
   .slide-search-enter-active,
   .slide-search-leave-active {
      transition: all 0.8s cubic-bezier(0.16, 1, 0.3, 1);
   }
   .slide-search-enter-from {
      transform: translateX(-100%);
      opacity: 0;
   }
   .slide-search-leave-to {
      transform: translateX(-100%);
      opacity: 0;
   }
`;
