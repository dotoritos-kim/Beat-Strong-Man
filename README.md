# Beat-Strong-Man

Be-Music Script Web Emulator

## 개요

### 1-1. 프로젝트 목표

웹 브라우저에서 비트매니아와 유사한 리듬 게임을 사용자에게 제공하여, 플랫폼에 관계없이 다양한 디바이스에서 접근 가능한 비트매니아 경험을 제공하는 것.

### 1-2. 목표 기능

#### 리듬 게임 플레이

-   [ ] 비트맵 로드
-   [ ] 리더보드
-   [ ] 수직동기화
-   [ ] 높은 프레임
-   [ ] 채보 미리보기
-   [ ] 리플레이
-   [ ] 5 key
-   [ ] 7+1 key
-   [ ] 9 key

#### 사용자 정의 설정

-   [ ] 사용자 정의 스킨
-   [ ] 판정 및 기타 게임 플레이 설정
-   [ ] 키
-   [ ] 사용자 구분을 위한 서버

### 3. 향후 개발 방향

#### 실시간 반응성:

브라우저의 제한과 크로미움 엔진을 고려하여 효율적인 게임 로직 구현.

#### 퍼포먼스 최적화:

다양한 기기에서 매끄러운 게임 실행을 위한 최적화.

불쾌하지 않고 적당히 성능과 타협된 오디오

#### 보안:

사용자 데이터를 보호하기 위한 인증 및 데이터 암호화.

#### 모바일 지원:

들고 다니는 가벼운 기계라고 안전할 줄 알았습니까?

#### 그 외 번뜩이는 아이디어:

-   깔끔한 사용자 경험
-   소셜 기능
-   다양한 레벨 체계 지원
-   AI 가지고 뭐 할거 없나
-   성능 차력쑈
-   에디터가 가능할진 미지수

## 프로젝트

### 설치 및 환경설정

#### 1. 필수 요구사항

-   Node.js 버전 16 이상 (현재 v22.11.0 사용중)
-   npm 패키지 매니저

#### 2. 프로젝트 설치

```bash
git clone https://github.com/dotoritos-kim/Beat-Strong-Man.git
cd Beat-Strong-Man
npm install
```

#### 3. 기본 개발 및 빌드 명령어

> build

```bash
npm run build:dev
npm run build:prod
```

> watch

```bash
npm run watch
```

> test

```bash
npm run test
```

#### 4. 주요 의존성

**프론트엔드 라이브러리**

-   React 및 React-DOM: React로 UI를 구성하고 브라우저 DOM과 상호작용.
-   Three.js: 웹 브라우저에서 3차원 컴퓨터 그래픽스 애니메이션 응용을 만들고 표현하기 위해 사용되는 자바스크립트 라이브러리이자 API
-   @react-three/fiber: 3D 씬을 구현하기 위한 라이브러리로, Three.js와 React의 통합.
-   @react-three/drei: 3D 그래픽 요소의 부가적인 기능을 제공하여 개발 속도를 향상.
-   zustand: 상태 관리를 위한 라이브러리.
-   Leva: 3D 그래픽 환경에서 UI 조작을 위한 컨트롤 패널.

**개발 및 빌드 도구**

-   Webpack: 모듈 번들러로, 개발 및 프로덕션 빌드를 관리.
-   TypeScript: 정적 타이핑을 지원하여 안전하고 오류를 줄임.
-   SWC: 빠른 컴파일러로, 프로젝트 빌드 속도를 크게 향상.
-   Jest 및 Testing Library: 테스트를 위한 도구.

#### 5. 브라우저 지원

.browserslist 설정에 따라 최신 브라우저 환경에서 실행되며, 크롬, 파이어폭스, 사파리 최신 버전을 지원합니다.

사실 크로미움 엔진에 맞는 브라우저는 다 돌아가게 끔 만들 생각입니다.

## 코드 컨벤션

### Naming

1. 기본적으로 파일명 혹은 변수 클래스 등의 식별자는 camel case를 따른다.
2. 이름은 최대한 의도를 밝혀 명확하게 작성한다.
3. 상수는 scream snake case를 따른다.

### Structure

src 폴더가 기본 소스코드 디렉토리이며 레포지토리 혹은 인프라 세팅과 관련된 코드들만 이 상위 폴더에 작성한다.

./src

-   /assets: css, scss, sass 및 폰트와 정적 홈페이지 이미지와 변하지 않고 고정으로 사용될 리소스 저장
-   /Components: 여러곳에 중복되어 사용될 작은 컴포넌트를 이곳에서 작성
-   /json: i18n, 혹은 정적의 string 데이터를 관리할 json 파일 작성
-   /Helpers: 시각적으로 보여주는게 없거나 모듈, 클래스, 라이브러리 형태의 기능과 소스코드들은 여기서 작성한다.
-   /Layouts: 홈페이지의 큰 레이아웃을 작성한다. Header, Footer, Sidebar 등이 이에 속한다.
-   /Pages: Body에 해당하는 컴포넌트들을 작성한다. 이 컴포넌트들은 Routes에서 설정하여 주소마다 각각 따로 접근 할 수 있어야한다.
-   /Stores: 전역상태관리를 위한 스토어와 타입을 작성.
-   App.tsx
-   index.tsx
-   \*.d.ts
-   reportWebVitals.ts 등의 웹브라우저 디버거
-   setupTests.ts

## License

[GPL-2.0 license](https://www.gnu.org/licenses/old-licenses/gpl-2.0.html)
