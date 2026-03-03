# middleware.ts
1 ) const jwt = require('jsonwebtoken'); 
      const : 상수 변수 선언 | java의 final 변수와 같음, 한 번 할당 시 값 바꿀수 없음
                  require('jsonwebtoken') : 라이브러리 로드 | 라이브러리 자체를 변수에 할당, 라이브러리 내부 함수 호출 가능

2 ) export const runtime = 'nodejs';
      export : 공개 설정 | java의 public
                   runtime = 'nodejs' : 표준 Node.js 환경에서 실행 지정 | Next.js 프레임워크와의 약속된 설정(Configuration)

3 ) export async function middleware(request: NextRequest) {
             async : 비동기 | 자바스크립트는 싱글 스레드이기 때문에 async를 붙여야만 DB 응답을 기다리는 동안 서버 전체가 멈추지 않고 다른 일을 할 수 있음, await 키워드 사용 가능하게 해줌

4 ) request.nextUrl : URL 정보 | pathname, searchParams, host 등 

5 ) NextResponse.next() : 이 요청은 문제없으니 다음 단계로 진행시켜라 | 실제 페이지(page.tsx)나 API(route.ts)로 요청이 도달

6 ) export const config : 미들웨어가 "어떤 주소에서만 동작할지" 결정하는 필터 매핑(Filter Mapping) 설정 | Next.js 프레임워크와의 약속된 설정(Configuration)

# login/page.tsx
1 ) useRouter : 브라우저의 주소창을 제어하는 내비게이터(Navigator) 객체 | 페이지 이동, 뒤로가기, 새로고침 등 수행
                router.push('/')는 서버에 새로 요청을 보내는 게 아니라, 브라우저 주소창만 바꾸고 리액트가 화면만 샥 갈아끼우는 'Single Page Application(SPA)' 방식의 이동을 지원

2 ) const handleLogin = async (e: React.FormEvent) => {
                        async : fetch(네트워크 통신)처럼 기다림이 필요한 작업을 하겠다는 선언
                               e: React.FormEvent : 폼(Form)이 제출되었을 때 발생하는 이벤트 정보

3 ) e.preventDefault() : HTML 폼은 제출되면 페이지를 통째로 새로고침하려는 기본 성질, 이를 막고 내가 직접 JavaScript(fetch)로 처리할 테니 페이지 새로고침 하지 마!라고 명령

4 ) await: 비동기 요청 | 서버에서 응답이 올 때까지 기다림

# login/route.ts
1 ) jwt.sign : JWT 발급 | Payload (내용물), Secret Key (비밀 열쇠), 유효기간 등

2 ) cookies.set : set(이름, 값, 옵션객체) | 
<table>
      <thead>
            <tr>
                  <td>옵션명</td>
                  <td>의미</td>
            </tr>
      </thead>
      <tbody>
            <tr>
                  <td>httpOnly</td>
                  <td>JS가 접근 못 하게 차단</td>
            </tr>
            <tr>
                  <td>maxAge</td>
                  <td>쿠키 수명</td>
            </tr>
            <tr>
                  <td>expires</td>
                  <td>쿠키 만료 날짜 (Date객체)</td>
            </tr>
            <tr>
                  <td>path</td>
                  <td>쿠키를 보낼 경로 범위</td>
            </tr>
            <tr>
                  <td>secure</td>
                  <td>HTTPS에서만 전송</td>
            </tr>
            <tr>
                  <td>sameSite</td>
                  <td>타 사이트 요청 시 전송 제한</td>
            </tr>
      </tbody>
</table>

# ui/button.tsx
