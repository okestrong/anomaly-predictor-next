# Node.js Puppeteer PDF 서비스 구축 - 방법 1 (URL 캡처 방식) 총정리

Next.js에서 이미 만들어진 리포트 페이지를 그대로 PDF로 변환하는 서비스를 만들겠습니다.

## 📁 전체 프로젝트 구조

```
puppeteer-pdf-service/
├── src/
│   ├── index.js              # 메인 서버 파일
│   ├── services/
│   │   └── pdfGenerator.js   # PDF 생성 서비스
│   └── utils/
│       └── logger.js          # 로깅 유틸리티
├── .env                       # 환경변수
├── package.json               # 프로젝트 설정
└── pnpm-lock.yaml            # 의존성 잠금 파일
```

## 1. 프로젝트 초기 설정

### 1.1 프로젝트 생성
```bash
# 프로젝트 폴더 생성
mkdir puppeteer-pdf-service
cd puppeteer-pdf-service

# pnpm 설치 (없는 경우)
npm install -g pnpm

# 프로젝트 초기화
pnpm init
```

### 1.2 필요한 패키지 설치
```bash
# 필수 패키지 설치
pnpm add express cors body-parser puppeteer dotenv winston

# 개발용 패키지 설치
pnpm add -D nodemon
```

### 1.3 폴더 구조 생성
```bash
# 폴더 생성
mkdir -p src/services
mkdir -p src/utils
```

## 2. 파일 작성

### 2.1 환경변수 파일 (.env)
```bash
touch .env
```

**.env 내용:**
```env
# 서버 설정
PORT=3001
NODE_ENV=development

# Puppeteer 설정
BROWSER_TIMEOUT=60000
PDF_TIMEOUT=30000

# 로그 설정
LOG_LEVEL=info

# Next.js URL (필요시)
NEXTJS_URL=http://localhost:3000
```

### 2.2 로거 유틸리티 (src/utils/logger.js)
```bash
touch src/utils/logger.js
```

**src/utils/logger.js 전체 코드:**
```javascript
const winston = require('winston');

// 로거 설정
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp({
      format: 'YYYY-MM-DD HH:mm:ss'
    }),
    winston.format.errors({ stack: true }),
    winston.format.splat(),
    winston.format.json()
  ),
  transports: [
    // 콘솔 출력
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.printf(({ level, message, timestamp }) => {
          return `${timestamp} [${level}]: ${message}`;
        })
      )
    })
  ]
});

module.exports = logger;
```

### 2.3 PDF 생성 서비스 (src/services/pdfGenerator.js)
```bash
touch src/services/pdfGenerator.js
```

**src/services/pdfGenerator.js 전체 코드:**
```javascript
const puppeteer = require('puppeteer');
const logger = require('../utils/logger');

class PDFGenerator {
  constructor() {
    this.browserInstance = null;
  }

  /**
   * 브라우저 인스턴스 가져오기 (재사용)
   */
  async getBrowser() {
    if (!this.browserInstance || !this.browserInstance.isConnected()) {
      logger.info('새 브라우저 인스턴스 시작');
      this.browserInstance = await puppeteer.launch({
        headless: 'new',
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-gpu',
          '--disable-web-security',
          '--disable-features=IsolateOrigins,site-per-process',
          '--allow-running-insecure-content'
        ]
      });
    }
    return this.browserInstance;
  }

  /**
   * URL을 PDF로 변환
   * @param {string} url - 변환할 페이지 URL
   * @param {object} options - PDF 옵션
   */
  async generatePDFFromURL(url, options = {}) {
    const browser = await this.getBrowser();
    const page = await browser.newPage();

    try {
      logger.info(`PDF 생성 시작: ${url}`);

      // 뷰포트 설정 (A4 크기에 맞춤)
      await page.setViewport({
        width: 1200,
        height: 1600,
        deviceScaleFactor: 2
      });

      // 페이지로 이동
      logger.info('페이지 로드 중...');
      await page.goto(url, {
        waitUntil: ['networkidle0', 'domcontentloaded'],
        timeout: parseInt(process.env.BROWSER_TIMEOUT) || 60000
      });

      // 리포트 준비 완료 대기
      logger.info('리포트 렌더링 대기 중...');
      
      // 방법 1: data-report-ready 속성 대기
      try {
        await page.waitForSelector('[data-report-ready="true"]', {
          timeout: parseInt(process.env.PDF_TIMEOUT) || 30000
        });
        logger.info('리포트 준비 완료 신호 감지');
      } catch (e) {
        logger.warn('리포트 준비 신호를 찾을 수 없음, 대체 방법 사용');
        
        // 방법 2: 차트 렌더링 완료 대기
        await page.waitForFunction(
          () => {
            const charts = document.querySelectorAll('canvas');
            const svgs = document.querySelectorAll('svg');
            return charts.length > 0 || svgs.length > 0;
          },
          { timeout: 30000 }
        );
      }

      // 추가 대기 (차트 애니메이션, 이미지 로드 등)
      await page.waitForTimeout(2000);

      // 인쇄용 CSS 적용
      await page.addStyleTag({
        content: `
          @media print {
            .no-print { display: none !important; }
            .page-break { page-break-after: always; }
            body { -webkit-print-color-adjust: exact; }
            * {
              -webkit-transition: none !important;
              transition: none !important;
              animation: none !important;
            }
          }
        `
      });

      // PDF 생성 옵션
      const pdfOptions = {
        format: options.format || 'A4',
        printBackground: true,
        displayHeaderFooter: options.displayHeaderFooter || false,
        margin: options.margin || {
          top: '20mm',
          bottom: '20mm',
          left: '15mm',
          right: '15mm'
        },
        scale: options.scale || 1,
        preferCSSPageSize: false,
        ...options.pdfOptions
      };

      // 헤더/푸터 설정 (옵션)
      if (options.displayHeaderFooter) {
        pdfOptions.headerTemplate = options.headerTemplate || `
          <div style="font-size: 10px; text-align: center; width: 100%;">
            <span class="title"></span>
          </div>
        `;
        pdfOptions.footerTemplate = options.footerTemplate || `
          <div style="font-size: 10px; text-align: center; width: 100%;">
            <span class="pageNumber"></span> / <span class="totalPages"></span>
          </div>
        `;
      }

      // PDF 생성
      logger.info('PDF 생성 중...');
      const pdfBuffer = await page.pdf(pdfOptions);
      
      logger.info(`PDF 생성 완료: ${pdfBuffer.length} bytes`);
      
      return pdfBuffer;

    } catch (error) {
      logger.error('PDF 생성 실패:', error);
      throw error;
    } finally {
      // 페이지 닫기
      await page.close();
    }
  }

  /**
   * HTML 문자열을 PDF로 변환
   * @param {string} htmlContent - HTML 내용
   * @param {object} options - PDF 옵션
   */
  async generatePDFFromHTML(htmlContent, options = {}) {
    const browser = await this.getBrowser();
    const page = await browser.newPage();

    try {
      logger.info('HTML을 PDF로 변환 중...');

      // HTML 설정
      await page.setContent(htmlContent, {
        waitUntil: ['networkidle0', 'domcontentloaded'],
        timeout: 30000
      });

      // 추가 대기
      await page.waitForTimeout(1000);

      // PDF 생성
      const pdfBuffer = await page.pdf({
        format: options.format || 'A4',
        printBackground: true,
        margin: options.margin || {
          top: '20mm',
          bottom: '20mm',
          left: '15mm',
          right: '15mm'
        }
      });

      logger.info(`HTML PDF 생성 완료: ${pdfBuffer.length} bytes`);
      
      return pdfBuffer;

    } catch (error) {
      logger.error('HTML PDF 생성 실패:', error);
      throw error;
    } finally {
      await page.close();
    }
  }

  /**
   * 브라우저 인스턴스 종료
   */
  async closeBrowser() {
    if (this.browserInstance) {
      await this.browserInstance.close();
      this.browserInstance = null;
      logger.info('브라우저 인스턴스 종료');
    }
  }
}

// 싱글톤 인스턴스
module.exports = new PDFGenerator();
```

### 2.4 메인 서버 파일 (src/index.js)
```bash
touch src/index.js
```

**src/index.js 전체 코드:**
```javascript
// 환경변수 로드
require('dotenv').config();

// 모듈 임포트
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const pdfGenerator = require('./services/pdfGenerator');
const logger = require('./utils/logger');

// Express 앱 생성
const app = express();
const PORT = process.env.PORT || 3001;

// 미들웨어 설정
app.use(cors()); // CORS 허용
app.use(bodyParser.json({ limit: '50mb' })); // JSON 파싱
app.use(bodyParser.urlencoded({ extended: true, limit: '50mb' }));

// 요청 로깅 미들웨어
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path}`);
  next();
});

// ============= API 엔드포인트 =============

/**
 * 헬스 체크
 */
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    service: 'puppeteer-pdf-service',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

/**
 * 서비스 정보
 */
app.get('/', (req, res) => {
  res.json({
    name: 'Puppeteer PDF Service',
    version: '1.0.0',
    endpoints: [
      {
        method: 'GET',
        path: '/health',
        description: '서비스 헬스 체크'
      },
      {
        method: 'POST',
        path: '/generate-pdf',
        description: 'URL을 PDF로 변환'
      },
      {
        method: 'POST',
        path: '/generate-pdf-html',
        description: 'HTML을 PDF로 변환'
      }
    ]
  });
});

/**
 * URL을 PDF로 변환
 * 
 * Request Body:
 * {
 *   "url": "http://localhost:3000/reports/123",
 *   "options": {
 *     "format": "A4",
 *     "displayHeaderFooter": false
 *   }
 * }
 */
app.post('/generate-pdf', async (req, res) => {
  try {
    const { url, options = {} } = req.body;
    
    // URL 유효성 검사
    if (!url) {
      return res.status(400).json({ 
        error: 'URL is required' 
      });
    }

    logger.info(`PDF 생성 요청: ${url}`);
    
    // PDF 생성
    const startTime = Date.now();
    const pdfBuffer = await pdfGenerator.generatePDFFromURL(url, options);
    const endTime = Date.now();
    
    logger.info(`PDF 생성 완료 (${endTime - startTime}ms)`);
    
    // PDF 응답
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Length': pdfBuffer.length,
      'Content-Disposition': `attachment; filename="report-${Date.now()}.pdf"`
    });
    
    res.send(pdfBuffer);
    
  } catch (error) {
    logger.error('PDF 생성 실패:', error);
    res.status(500).json({ 
      error: 'PDF generation failed',
      message: error.message 
    });
  }
});

/**
 * HTML을 PDF로 변환 (옵션)
 */
app.post('/generate-pdf-html', async (req, res) => {
  try {
    const { html, options = {} } = req.body;
    
    if (!html) {
      return res.status(400).json({ 
        error: 'HTML content is required' 
      });
    }

    logger.info('HTML PDF 생성 요청');
    
    const pdfBuffer = await pdfGenerator.generatePDFFromHTML(html, options);
    
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Length': pdfBuffer.length,
      'Content-Disposition': `attachment; filename="report-${Date.now()}.pdf"`
    });
    
    res.send(pdfBuffer);
    
  } catch (error) {
    logger.error('HTML PDF 생성 실패:', error);
    res.status(500).json({ 
      error: 'PDF generation failed',
      message: error.message 
    });
  }
});

// 404 핸들러
app.use((req, res) => {
  res.status(404).json({ 
    error: 'Endpoint not found' 
  });
});

// 에러 핸들러
app.use((err, req, res, next) => {
  logger.error('Unhandled error:', err);
  res.status(500).json({ 
    error: 'Internal server error',
    message: err.message 
  });
});

// 서버 시작
const server = app.listen(PORT, () => {
  logger.info('========================================');
  logger.info('  Puppeteer PDF Service');
  logger.info('========================================');
  logger.info(`  Status:  Running`);
  logger.info(`  Port:    ${PORT}`);
  logger.info(`  Env:     ${process.env.NODE_ENV || 'development'}`);
  logger.info(`  PID:     ${process.pid}`);
  logger.info('========================================');
  logger.info(`  http://localhost:${PORT}`);
  logger.info('========================================');
});

// 프로세스 종료 처리
const gracefulShutdown = async () => {
  logger.info('Shutting down gracefully...');
  
  // 서버 종료
  server.close(() => {
    logger.info('HTTP server closed');
  });
  
  // 브라우저 종료
  await pdfGenerator.closeBrowser();
  
  process.exit(0);
};

// 종료 시그널 처리
process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

// 예외 처리
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  gracefulShutdown();
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
  gracefulShutdown();
});
```

### 2.5 package.json 설정
**package.json 수정:**
```json
{
  "name": "puppeteer-pdf-service",
  "version": "1.0.0",
  "description": "PDF generation service using Puppeteer for Next.js reports",
  "main": "src/index.js",
  "scripts": {
    "start": "node src/index.js",
    "dev": "nodemon src/index.js",
    "test": "curl http://localhost:3001/health"
  },
  "keywords": ["pdf", "puppeteer", "nodejs"],
  "author": "",
  "license": "MIT",
  "dependencies": {
    "express": "^4.18.2",
    "cors": "^2.8.5",
    "body-parser": "^1.20.2",
    "puppeteer": "^21.0.0",
    "dotenv": "^16.3.1",
    "winston": "^3.10.0"
  },
  "devDependencies": {
    "nodemon": "^3.0.1"
  },
  "engines": {
    "node": ">=18.0.0"
  }
}
```

## 3. 서비스 실행

### 3.1 개발 모드 실행
```bash
# 파일 변경 시 자동 재시작
pnpm dev
```

### 3.2 프로덕션 모드 실행
```bash
# 일반 실행
pnpm start
```

### 3.3 서비스 테스트
```bash
# 헬스 체크
curl http://localhost:3001/health

# 서비스 정보
curl http://localhost:3001/
```

## 4. Next.js 통합

### 4.1 리포트 페이지에 준비 신호 추가

**app/reports/[id]/page.tsx:**
```tsx
'use client'

import { useEffect, useState } from 'react'
import { useReportData } from '@/hooks/useReportData'
import ReportContent from '@/components/reports/ReportContent'

export default function ReportPage({ params }: { params: { id: string } }) {
  const [isReady, setIsReady] = useState(false)
  const { report, isLoading } = useReportData(params.id)
  
  useEffect(() => {
    if (!isLoading && report) {
      // 모든 차트가 렌더링될 때까지 대기
      const checkInterval = setInterval(() => {
        const charts = document.querySelectorAll('[data-chart-ready="true"]')
        const totalCharts = document.querySelectorAll('[data-chart]')
        
        if (charts.length === totalCharts.length && totalCharts.length > 0) {
          setIsReady(true)
          clearInterval(checkInterval)
        }
      }, 100)
      
      // 타임아웃 설정 (10초)
      const timeout = setTimeout(() => {
        setIsReady(true)
        clearInterval(checkInterval)
      }, 10000)
      
      return () => {
        clearInterval(checkInterval)
        clearTimeout(timeout)
      }
    }
  }, [isLoading, report])
  
  return (
    <div 
      data-report-ready={isReady}
      className="min-h-screen bg-white print:bg-white"
    >
      {report && <ReportContent report={report} />}
    </div>
  )
}
```

### 4.2 PDF 다운로드 API 라우트

**app/api/reports/[id]/pdf/route.ts:**
```typescript
import { NextRequest, NextResponse } from 'next/server'

const PUPPETEER_SERVICE_URL = process.env.PUPPETEER_SERVICE_URL || 'http://localhost:3001'
const NEXT_PUBLIC_URL = process.env.NEXT_PUBLIC_URL || 'http://localhost:3000'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // 리포트 페이지 URL
    const reportUrl = `${NEXT_PUBLIC_URL}/reports/${params.id}`
    
    // Puppeteer 서비스 호출
    const response = await fetch(`${PUPPETEER_SERVICE_URL}/generate-pdf`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        url: reportUrl,
        options: {
          format: 'A4',
          displayHeaderFooter: true,
          headerTemplate: `
            <div style="font-size: 10px; text-align: center; width: 100%;">
              Ceph Cluster Report
            </div>
          `,
          footerTemplate: `
            <div style="font-size: 10px; text-align: center; width: 100%;">
              Page <span class="pageNumber"></span> of <span class="totalPages"></span>
            </div>
          `
        }
      })
    })
    
    if (!response.ok) {
      throw new Error('PDF generation failed')
    }
    
    // PDF 데이터 가져오기
    const pdfBuffer = await response.arrayBuffer()
    
    // 응답 반환
    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="report-${params.id}.pdf"`,
        'Cache-Control': 'no-cache, no-store, must-revalidate'
      }
    })
    
  } catch (error) {
    console.error('PDF generation error:', error)
    return NextResponse.json(
      { error: 'Failed to generate PDF' },
      { status: 500 }
    )
  }
}
```

### 4.3 PDF 다운로드 버튼 컴포넌트

**components/reports/PDFDownloadButton.tsx:**
```tsx
'use client'

import { useState } from 'react'
import { Download, Loader2 } from 'lucide-react'

interface PDFDownloadButtonProps {
  reportId: string
  className?: string
}

export default function PDFDownloadButton({ 
  reportId, 
  className = '' 
}: PDFDownloadButtonProps) {
  const [isGenerating, setIsGenerating] = useState(false)
  
  const handleDownload = async () => {
    setIsGenerating(true)
    
    try {
      const response = await fetch(`/api/reports/${reportId}/pdf`)
      
      if (!response.ok) {
        throw new Error('PDF 생성 실패')
      }
      
      const blob = await response.blob()
      
      // 다운로드 링크 생성
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `report-${reportId}.pdf`
      document.body.appendChild(a)
      a.click()
      
      // 정리
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      
    } catch (error) {
      console.error('PDF 다운로드 실패:', error)
      alert('PDF 다운로드에 실패했습니다.')
    } finally {
      setIsGenerating(false)
    }
  }
  
  return (
    <button
      onClick={handleDownload}
      disabled={isGenerating}
      className={`
        flex items-center gap-2 px-4 py-2 
        bg-blue-600 text-white rounded-lg
        hover:bg-blue-700 disabled:opacity-50
        disabled:cursor-not-allowed transition-colors
        ${className}
      `}
    >
      {isGenerating ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin" />
          PDF 생성 중...
        </>
      ) : (
        <>
          <Download className="w-4 h-4" />
          PDF 다운로드
        </>
      )}
    </button>
  )
}
```

## 5. Spring Boot 통합

### 5.1 PDF 서비스

**PDFService.java:**
```java
package com.ceph.dashboard.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.http.*;
import java.util.HashMap;
import java.util.Map;

@Service
public class PDFService {
    
    @Value("${puppeteer.service.url:http://localhost:3001}")
    private String puppeteerServiceUrl;
    
    @Value("${nextjs.url:http://localhost:3000}")
    private String nextjsUrl;
    
    private final RestTemplate restTemplate = new RestTemplate();
    
    /**
     * 리포트를 PDF로 변환
     */
    public byte[] generateReportPDF(String reportId) {
        // Next.js 리포트 페이지 URL
        String reportUrl = nextjsUrl + "/reports/" + reportId;
        
        // 요청 본문 생성
        Map<String, Object> request = new HashMap<>();
        request.put("url", reportUrl);
        
        Map<String, Object> options = new HashMap<>();
        options.put("format", "A4");
        options.put("displayHeaderFooter", true);
        request.put("options", options);
        
        // Puppeteer 서비스 호출
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        
        HttpEntity<Map<String, Object>> entity = 
            new HttpEntity<>(request, headers);
        
        ResponseEntity<byte[]> response = restTemplate.postForEntity(
            puppeteerServiceUrl + "/generate-pdf",
            entity,
            byte[].class
        );
        
        return response.getBody();
    }
}
```

### 5.2 컨트롤러

**ReportController.java:**
```java
package com.ceph.dashboard.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/reports")
public class ReportController {
    
    @Autowired
    private PDFService pdfService;
    
    @GetMapping("/{reportId}/pdf")
    public ResponseEntity<byte[]> downloadReportPDF(
            @PathVariable String reportId) {
        
        // PDF 생성
        byte[] pdfData = pdfService.generateReportPDF(reportId);
        
        // 응답 헤더 설정
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_PDF);
        headers.setContentDisposition(
            ContentDisposition.attachment()
                .filename("report-" + reportId + ".pdf")
                .build()
        );
        
        return new ResponseEntity<>(pdfData, headers, HttpStatus.OK);
    }
}
```

## 6. Docker 배포 (선택사항)

### 6.1 Dockerfile
```dockerfile
FROM node:18-slim

# 필요한 시스템 패키지 설치
RUN apt-get update && apt-get install -y \
    wget \
    gnupg \
    ca-certificates \
    fonts-liberation \
    libappindicator3-1 \
    libasound2 \
    libatk-bridge2.0-0 \
    libatk1.0-0 \
    libcups2 \
    libdbus-1-3 \
    libgdk-pixbuf2.0-0 \
    libgtk-3-0 \
    libnspr4 \
    libnss3 \
    libx11-xcb1 \
    libxcomposite1 \
    libxcursor1 \
    libxdamage1 \
    libxrandr2 \
    libxss1 \
    libxtst6 \
    xdg-utils \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# 패키지 파일 복사
COPY package.json pnpm-lock.yaml ./

# pnpm 설치 및 의존성 설치
RUN npm install -g pnpm
RUN pnpm install --frozen-lockfile

# 소스 코드 복사
COPY src ./src
COPY .env ./

# 포트 노출
EXPOSE 3001

# 실행
CMD ["pnpm", "start"]
```

### 6.2 docker-compose.yml
```yaml
version: '3.8'

services:
  puppeteer-pdf:
    build: .
    container_name: puppeteer-pdf-service
    ports:
      - "3001:3001"
    environment:
      - NODE_ENV=production
      - PORT=3001
    restart: unless-stopped
    networks:
      - app-network

networks:
  app-network:
    driver: bridge
```

## 7. 테스트

### 7.1 curl로 테스트
```bash
# PDF 생성 테스트
curl -X POST http://localhost:3001/generate-pdf \
  -H "Content-Type: application/json" \
  -d '{
    "url": "http://localhost:3000/reports/test-report-id",
    "options": {
      "format": "A4"
    }
  }' \
  --output test-report.pdf

# 파일 확인
ls -la test-report.pdf
```

### 7.2 문제 해결

**포트 충돌 시:**
```bash
# .env 파일에서 포트 변경
PORT=3002
```

**권한 오류 시:**
```bash
# Puppeteer 실행 권한 부여
sudo chmod -R 755 node_modules/puppeteer/.local-chromium
```

**메모리 부족 시:**
```bash
# Node.js 메모리 증가
NODE_OPTIONS="--max-old-space-size=4096" pnpm start
```

## 🎯 핵심 요약

1. **단순한 구조**: URL을 받아서 PDF로 변환하는 단일 목적 서비스
2. **Next.js 통합**: 이미 만들어진 리포트 페이지를 그대로 PDF로 변환
3. **폐쇄망 지원**: 외부 CDN 의존 없음
4. **성능 최적화**: 브라우저 인스턴스 재사용
5. **에러 처리**: 상세한 로깅과 에러 처리

이제 `pnpm dev`로 서비스를 실행하고, Next.js 리포트 페이지의 URL을 전달하면 PDF가 생성됩니다!