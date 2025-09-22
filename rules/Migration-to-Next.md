# Migration 가이드
- 이 문서는 vue 3 프로젝트를 Next.js 프로젝트로 마이그레이션 하기 위한 가이드이다.
- Next.js 프로젝트는 predictor-next 라고 부르기로 한다.
- 이 프로젝트의 위치는 /Users/jclee/Documents/Okestro/Projects/DevSw/anomaly-predictor-next  이다.
- predictor-next 프로젝트는 next.js + typescript + pnpm + tailwind css 로 기본 구조가 만들어져 있는 상태이다.(코드베이스를 참고해라)

## 1. dependency migration
현재 프로젝트의 dependency 들을 Next.js 의 dependency 로 바꿀 때 다음 내용을 참고할 것!! vue 패키지 -> Next.js 패키지 방식으로 표기하였음.
- gsap -> @gsap/react + gsap
- three -> @react-three/fiber + @react-three/drei + three
- echarts -> @nivo/core + @nivo/line + @nivo/pie + @nivo/bar
- pinia -> zustand
- vue-router -> next.js 이므로 별도 router 는 필요없음
- tsparticles -> 삭제 (tsparticles 를 사용하는 vue 파일들은 마이그레이션 하지 말 것!!)
- @tanstack/vue-query -> 미사용 (cache 관리는 next.js 의 기능을 이용) -> 차후 pagination 필요할때 추가할 수도 있음.
- axios -> Next.js 의 fetch 로 대체 
- simplebar-vue -> simplebar-react
- troika-three-text -> 그대로 사용
- dayjs -> 그대로 사용
- @fontsource/orbitron -> 그대로 사용 (/app/layout.tsx 에서 400.css ~ 900.css 를 import 해놓은 상태)
- @heroicons/vue -> react-icons (아래와 같은 규칙으로 마이그레이션한다)
  - vue 기준: import { SparklesIcon } from '@heroicons/vue/24/outline'
  - next.js 기준 : import { HiSparkles } from 'react-icons/hi2';

## 2. Next.js 활용방안
### 2.1. 컴포넌트들은 최대한 서버컴포넌트로 만들 것!!
'use client' 를 사용해야 하는 부분을 별도의 client component 로 분리하여 이를 import 하는 방식을 사용한다.

### 2.2. 백엔드 data 를 자식한테 props 로 넘기지 말 것
자기한테 필요한 data 는 자기가 직접 fetch 하여 사용한다.

### 2.3. useSearchParams() hook 사용 자제
/search?q=book 같은 url 요청시, q=book 을 받기 위해 useSearchParams() 를 사용하지 말고, 아래와 같이 서버컴포넌트 방식으로 받는다.
- 필수불가결한 상황이나 이미 client component 인 경우는 제외
```typescript jsx
export default async function Page({ searchParams }: { searchParams: Promise<{ q?: string;}> }) {
	 const { q } = await searchParams;
	 
     ...
}
``` 

### 2.4. useParams() hook 사용 자제
/book/11 같은 요청시 [id]/page.tsx 안에서  const {id} = useParams() 와 같은 방식으로 id 를 꺼내오지 말고 아래와 같이 서버컴포넌트 방식을 사용한다.
- 필수불가결한 상황이나 이미 client component 인 경우는 제외
```typescript jsx
export default async function Page({ params }: { params: Promise<{id: string | string[]}> }) {
   const { id } = await params;

   const res = await fetch(`${process.env.NEXT_PUBLIC_API_SERVER}/book/${params.id}`);
   if (!res.ok) {
      return <div>문제가 발생했습니다...</div>;
   }

   const { coverImgUrl, title, subTitle, author, publisher, description }: BookData = await res.json();

   return (
      <div className={style.container}>
				 ...
      </div>
   );
}
``` 

### 2.5. cache 적극 활용
#### 목록 data 는 force-cache 및 revalidate 적극 사용
```typescript jsx
const response = await fetch('/books', {
    cache: 'force-cache',
    next: { revalidate: 30 }
}).then(r => r.json());
```

#### 동적 경로에 full route cache 적용 (generateStaticParams 적극 사용)
- 예를 들어 '/book/[id]' 라는 동적경로를 사용하는 /app/book/[id]/page.tsx 에서 generateStaticParams 를 선언하여 "풀 라우트 캐시" 를 적용한다.
```typescript jsx
// 접속 가능한 (잦은 접속이 예상되는) 동적경로를 미리 선언. (값은 꼭 string 이어야 함)
// 만약 /book/5 로 접속한다 해도 처음 한번은 동적으로 data 를 fetch 한 후, 정적페이지로 만들어서 풀 라우트 캐시에 저장해버린다.
export const generateStaticParams = () => [{id: '1'}, {id: '2'}, {id: '3'}];

export default async function Page({params}: { params: Promise<{id: string | string[]}> }) {
    const { id } = await params;
    
    ...
}
```

### 2.6. Streaming 적극 사용
- 동적함수를 사용하는 dynamic page 에 streaming 기능(`<Suspense>`) 적극 사용.
  - dynamic page 는 cookie, header 의 값을 사용하거나, searchParams 를 사용하는 모든 page 를 말한다.
- `<Suspense>` 태그를 이용하여 컴포넌트 단위로 스트리밍하여, 페이지 내 컴포넌트들의 data fetch 가 모두 끝날때까지 사용자가 기다리게 하지 않는다.(fetch 가 먼저 끝난, 혹은 fetch 를 하지 않는 페이지들을 먼저 표시)
```typescript jsx
async function SearchResult({ q }: { q: string }) {
   const res = await fetch(`${process.env.NEXT_PUBLIC_API_SERVER}/book/search?q=${q}`, {
      cache: 'force-cache',
   });

   if (!res.ok) {
      return <div>문제가 발생했습니다...</div>;
   }

   const books: BookData[] = await res.json();

   return (
      <div className="search">
         {books.map(book => (
            <BookItem key={book.id} {...book} />
         ))}
      </div>
   );
}

export default async function Page({ searchParams }: { searchParams: Promise<{ q: Maybe<string> }> }) {
   const { q } = await searchParams;

   return (
      <Suspense fallback={<CustomLoading />} key={q ?? ''}>
         <SearchResult q={q ?? ''} />
      </Suspense>
   );
}
```


## 3. 꼭 지켜야할 주의사항
- 최대한 서버컴포넌트를 사용해라. 'use client' 는 필수불가결한 경우에만 선언한다.
- useXxx 같은 hook 이나 onClick 같은 이벤트핸들러 를 사용해야 하는 경우, 즉 'use client' 를 사용해야 하는 경우가 생기면, 현재 컴포넌트를 통째로 client component 로 만들지 말고 가능한 한 해당하는 부분을 별도 컴포넌트로 분리해라.
- SSR 과 On-Demanded ISR 을 철저하게 상황에 맞게 사용할 것!! (이 문서와 같은 위치에 있는 ISR_SSR.md 문서를 꼭 참고해라)
- client component 의 자식컴포넌트로 server component 를 넣어야 하는 경우, children props 를 이용할 것!! (아래 예제코드 참고)

**나쁜 코드**
```typescript jsx
'use client';

import { FC } from 'react';
import ServerComponent from '@/app/(with-searchbar)/bad/_component/server-component';

const ClientComponent: FC = () => {
   return (
      <div>
         <ServerComponent />
      </div>
   );
};

export default ClientComponent;
```

**좋은 코드**
```typescript jsx
'use client';

import { FC, ReactNode } from 'react';

interface Props {
   children: ReactNode;     // 이 놈이 서버컴포넌트
}

const ClientComponent: FC<Props> = ({ children }) => {
   return <div>{ children }</div>;
};

export default ClientComponent;
```

**좋은 코드를 사용하는 부분**
```typescript jsx
import ClientComponent from '@/app/_component/client-component';
import ServerComponent from '@/app/_component/server-component';

export default async function Page() {
   return (
      <div>
         <ClientComponent>
            <ServerComponent />
         </ClientComponent>
      </div>
   );
}
```

