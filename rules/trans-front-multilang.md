**"URL 경로(Path)를 통한 다국어 처리(i18n Routing)"** 방식을 사용하면, **선택한 언어를 적용하면서 정적 렌더링(Static Rendering/Caching)도 완벽하게 지원**할 수 있습니다.

단순히 쿠키(Cookie)나 헤더(Header)에만 언어 정보를 저장하고 `headers()`, `cookies()`를 통해 읽어오면 Next.js는 "이 페이지는 사용자마다 다르구나"라고 판단하여 \*\*무조건 동적 렌더링(Dynamic Rendering)\*\*으로 전환해 버립니다. 캐시를 못 쓰게 되죠.

하지만 **URL에 언어를 포함**시키면 (`/ko/about`, `/en/about`), Next.js는 이 두 페이지를 서로 다른 **정적 페이지**로 인식하고 빌드 타임에 각각 캐싱할 수 있습니다.

-----

### 구현 전략: URL Path 기반 i18n

`app` 폴더 구조를 변경하여 모든 페이지가 `[lang]` 파라미터를 갖도록 합니다.

**구조 예시:**

```text
app/
 ├── [lang]/          <-- 동적 라우트 세그먼트 추가
 │    ├── layout.tsx
 │    ├── page.tsx
 │    └── products/
 │         └── page.tsx
 ├── globals.css
 └── middleware.ts    <-- 루트 접근 시 언어 경로로 리다이렉트
```

### 1\. `fetchWithLocale` 함수 수정

이제 `fetch` 함수 내부에서 헤더나 쿠키를 뒤지는 게 아니라, **외부에서 넘겨받은 `locale` 값**을 우선하도록 수정합니다. 이렇게 하면 `headers()`를 호출하지 않으므로 정적 렌더링이 깨지지 않습니다.

```typescript
// src/utils/api.ts

export async function fetchWithLocale(url: string, locale: string, options: RequestInit = {}) {
  // 1. 헤더 설정: 인자로 받은 locale을 최우선으로 사용
  const headers = {
    'Content-Type': 'application/json',
    'Accept-Language': locale, // 넘겨받은 언어 설정
    ...(options.headers || {}),
  };

  const baseURL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';
  const fullUrl = url.startsWith('http') ? url : `${baseURL}${url}`;

  // 2. 요청 (Next.js의 기본 캐싱 전략을 따름)
  const response = await fetch(fullUrl, {
    ...options,
    headers,
    // next: { revalidate: 3600 } // 필요하다면 캐시 시간 설정 (정적 렌더링 시 유효)
  });

  return response;
}
```

-----

### 2\. Server Component에서 사용 (`page.tsx`)

Next.js의 App Router에서 `[lang]` 폴더 아래의 페이지는 `params`를 통해 현재 언어 값을 알 수 있습니다. 이 값을 `fetch`에 넘겨주기만 하면 됩니다.

```tsx
// src/app/[lang]/page.tsx

type Props = {
  params: { lang: string }; // URL의 [lang] 부분이 들어옴 (예: 'ko', 'en')
};

export default async function Page({ params }: Props) {
  // 사용자가 /en/page 로 접속하면 params.lang은 'en'
  // 사용자가 /ko/page 로 접속하면 params.lang은 'ko'
  
  // params.lang 값을 fetch 함수에 전달 -> headers() 사용 안함 -> 정적 렌더링 가능!
  const res = await fetchWithLocale('/api/home-data', params.lang);
  const data = await res.json();

  return (
    <div>
      <h1>{params.lang === 'ko' ? '홈' : 'Home'}</h1>
      <pre>{JSON.stringify(data, null, 2)}</pre>
    </div>
  );
}
```

-----

### 3\. 정적 렌더링 활성화 (`generateStaticParams`)

이 부분이 가장 중요합니다. `[lang]`은 동적 세그먼트이지만, **어떤 언어들이 있는지 미리 알려주면** Next.js가 빌드 타임에 한국어 버전, 영어 버전 페이지를 미리 다 만들어 둡니다(SSG).

```tsx
// src/app/[lang]/layout.tsx 또는 page.tsx

export async function generateStaticParams() {
  // 미리 빌드할 언어 목록 정의
  return [{ lang: 'ko' }, { lang: 'en' }];
}

export default function RootLayout({ children, params }: any) {
  return (
    <html lang={params.lang}>
      <body>{children}</body>
    </html>
  );
}
```

이제 `npm run build`를 하면 `/ko` 페이지와 `/en` 페이지가 각각 HTML로 생성(Static)됩니다.

-----

### 4\. AppHeader에서 언어 변경 (Client Component)

`AppHeader`는 사용자가 언어를 바꾸는 곳입니다. 여기서 버튼을 누르면 단순히 **URL을 변경**(`Link` 이동)해주면 됩니다. 상태(State)를 바꿀 필요 없이 페이지를 이동시키는 개념입니다.

```tsx
// src/components/AppHeader.tsx
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function AppHeader({ currentLang }: { currentLang: string }) {
  const pathname = usePathname(); // 예: /ko/products/123

  // 경로에서 언어 부분만 바꿔주는 함수
  const getSwitchUrl = (targetLang: string) => {
    if (!pathname) return '/';
    const segments = pathname.split('/');
    segments[1] = targetLang; // [0]은 빈문자열, [1]이 언어 코드
    return segments.join('/');
  };

  return (
    <header>
      <nav>
        <span>현재 언어: {currentLang}</span>
        <div className="lang-switcher">
          <Link href={getSwitchUrl('ko')}>한국어</Link>
          <Link href={getSwitchUrl('en')}>English</Link>
        </div>
      </nav>
    </header>
  );
}
```

-----

### 요약 및 장점

1.  **동작 방식**:

    * 사용자가 한국어 버튼 클릭 -\> 브라우저가 `/ko/...` 로 이동.
    * Next.js 라우터가 `params.lang`에 `'ko'`를 담음.
    * 서버 컴포넌트가 `fetchWithLocale(..., 'ko')` 실행.
    * 백엔드에 `Accept-Language: ko` 전달.

2.  **정적 렌더링(캐시) 지원 여부**:

    * **완벽 지원 (O)**
    * `headers()`나 `cookies()` 같은 동적 함수를 쓰지 않고, `params` (URL 인자)만 사용했기 때문입니다.
    * `generateStaticParams`를 쓰면 빌드 시점에 API 응답까지 포함된 HTML을 미리 만들어 매우 빠른 속도를 낼 수 있습니다.

3.  **AppHeader**:

    * 복잡한 상태 관리 없이 `Link` 태그로 URL만 이동시키면 되어 구현이 깔끔합니다.

이 방식이 Next.js 공식 문서에서도 권장하는 **Internationalization(i18n)** 표준 패턴입니다.