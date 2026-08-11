# 솔파 간트 — 프로젝트 인수인계 문서 (AI 에이전트용)

> 이 문서는 이 프로젝트를 이어받는 AI(GPT/Codex, Claude 등)를 위한 컨텍스트다.
> 작업 시작 전 반드시 전체를 읽어라. 여기 적힌 "확정 정책"은 사용자가 결정한 것이므로 임의로 바꾸지 마라.
> 최종 갱신: 2026-08-08

> ## 🔒 UI 디자인 동결
> **사용자가 명시적으로 요청하지 않는 한 현재 UI 디자인(styles.css의 색상·타이포·간격·컴포넌트 모양, 레이아웃)을 절대 변경하지 마라.** 기능 작업에 새 UI가 필요하면 기존 디자인 토큰과 컴포넌트 스타일을 재사용할 것. 자발적 "개선" 금지. 상세는 `AGENTS.md` 참조.

## 1. 프로젝트가 무엇인가

- 유튜브 제작사 "솔파스튜디오"의 **노션 임베드 간트차트**. 채널팀의 노션 "프로덕션 플랜" DB를 읽어 타임라인으로 보여주고, 간트에서 일정 생성/수정/메모/첨부까지 처리한다.
- 임베드 URL: `https://solpa-gantt.pages.dev/embed/140b034014a1a3d4141cfade6df012553e68` (노션 "간트_확인" 페이지 등에 임베드)
- 사용자: 팀원 약 20명, 하루 종일 탭을 열어둠. **Cloudflare 무료 플랜** 내에서 운영해야 함 (Workers 요청 10만/일, KV 쓰기 1,000/일 — KV 쓰기가 가장 빠듯한 자원).

## 2. 저장소 · 배포 (가장 중요)

- 로컬 리포: `C:\Users\user\Documents\솔파스튜디오\notion-gantt-app`
- 원격: `github.com/dohg472/solfa-gantt` (비공개, 이 PC의 git 인증으로 push 가능)
- **깃 푸시로는 배포되지 않는다.** Cloudflare Pages "solpa-gantt"는 Direct Upload 방식. 수정 → 커밋 → 푸시 → 아래 명령으로 수동 배포:

```powershell
cd C:\Users\user\Documents\솔파스튜디오\notion-gantt-app
$env:PATH = "C:\Users\user\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin;" + $env:PATH
$env:XDG_CONFIG_HOME = "C:\Users\user\AppData\Roaming\xdg.config"   # wrangler OAuth 토큰 위치
node C:\Users\user\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\node_modules\pnpm\bin\pnpm.mjs dlx wrangler@latest pages deploy public --project-name solpa-gantt --branch main --commit-dirty=true
```

- 시스템에 node/npm 미설치. 위의 번들 node(v24)와 pnpm.mjs를 써라. `node --check`로 문법 검증 가능 (functions의 대괄호 파일은 해당 디렉토리로 cd 후 상대경로로).
- **배포 시마다 `public/index.html`의 `?v=YYYYMMDD-슬러그` 두 곳을 새 값으로 변경**할 것 (캐시버스팅).
- HTML은 `public/_headers`로 no-store. 클라이언트는 10분마다/탭 복귀 시 새 버전을 감지해 **자동 새로고침**한다 (드래그·모달·미저장 메모 중엔 안 함).
- 배포 후 프로덕션 별칭 전파 1~2분. 새 배포의 고유 URL(xxxx.solpa-gantt.pages.dev)은 첫 1~2분 콜드스타트로 API 404 → 앱이 빈 화면일 수 있음. 리로드하면 정상.

## 3. 데이터 구조

| 이름 | ID | 역할 |
|---|---|---|
| 채널팀 플랜 (프로덕션 플랜) | `20175c38-e3be-4b38-b81e-e8394914431e` | 읽기 전용 원본. **절대 수정 금지** (첨부/본문 포함. 과거에 쓰기 기능을 만들었다가 사용자 요청으로 제거함) |
| 간트용db (02 제작 간트) | `3b19a919-c6cd-8081-a23e-db7e03ae79be` | 쓰기 DB. 간트 생성분 + 원본 수정 시 사본(원본 ID로 연결·upsert) |
| Cloudflare KV `SOLPA_GANTT_KV` | `44406088912b484986af75a31557eaf8` | 숨김/병합기준/뷰설정/작업캐시/첨부파일(blob)/활동로그 |
| 사업 관리 DB (사업팀 관리 페이지 내) | `9c5d2ae7-9c7c-4012-ba8e-c38341ea78d2` | 간트와 무관. 사용자가 가끔 항목 추가 요청 (진행단계 "컨택/대기" 등) |

- **Notion API 직접 접근**: 리포 `.env`의 `NOTION_TOKEN`("간트차트 생성" 통합). 통합에 공유된 페이지만 접근 가능. **토큰 값을 출력하지 마라.**
- 서버(functions)는 쓰기 DB에 필요한 속성(시작일/채널/프로젝트명/일정/상태/담당자/메모/원본 ID/상위 프로젝트 relation)이 없으면 **자동 생성**한다.

## 4. 코드 구조

- `public/app.js` (~12,000줄, 바닐라 JS 단일 파일) + `public/styles.css` + `public/index.html`
- `functions/api/[[path]].js` — Cloudflare Pages Functions. Notion API 프록시 + KV. 전 API는 embed key 인증 (`?key=`), 예외: 서명된 첨부 GET(`exp`+`sig` HMAC).
- 주요 서브시스템:
  - **매칭 엔진**: 프로젝트 이름 유사도로 촬영↔업로드 자동 짝매칭. 핵심 규칙 — 일반단어(촬영/업로드/영상 등) 제거 후 토큰 포함관계면 자동 짝, 3글자+ 공유 토큰은 "제안만"(자동 병합 금지), 3글자+ 토큰의 **한 글자 차이는 같은 토큰 취급**(뚱센느≈통센느), 회차(EP) 다르면 차단, 업로드는 촬영 이후 45일 이내만.
  - **자동 숨김**: 업로드 완료 +2일 / 촬영만 있고 업로드 미정 +30일 / "라이브" 촬영은 당일 완결(업로드 불요, 지나면 완료 취급) / 30일 지난 꼬리 촬영은 완료판정 안 막음.
  - **성능**: /api/tasks는 KV 캐시 stale-while-revalidate(신선 5분, 스테일 30분 즉시응답+백그라운드 갱신+락). 페이지 오픈 시 강제 refresh 금지(수동 ↻만). 상태 폴링 60초, 숨김탭 중지. 선택/클릭은 DOM 재빌드 없이 클래스 토글(`renderSelectionOnly`). 스크롤은 순수 네이티브(재렌더 금지 — 바는 절대좌표로 한 번만 그림).
  - **주의(실환경 버그 전례)**: 셀렉션 드래그의 `setPointerCapture`가 일부 임베디드 크로뮴에서 클릭을 테이블로 재타게팅시켜 사이드바 행 클릭이 죽었었음. 캡처는 6px 드래그 후에만 + 좌표 기반 복구 핸들러 존재. **합성 이벤트 테스트는 이런 버그를 놓친다 — 검증은 실환경 기준으로.**

## 5. 확정 정책 (사용자 결정 — 변경 금지)

1. **간트 메모(내용)는 독립 저장** (쓰기 DB 메모 속성). 프로덕션 플랜 페이지 본문에 절대 역기록하지 않는다. 플랜 본문 텍스트는 메모가 비었을 때 시딩(복사)만.
2. **첨부파일은 간트 전용(KV 저장)**. 플랜 페이지에 업로드하지 않는다. 15MB 제한, 서명 URL로 오피스 뷰어 미리보기.
3. **상세일정 행의 노션 건명 = 일정 종류**("촬영"/"업로드"). 프로젝트 맥락은 "프로젝트명" 속성 + "상위 프로젝트" relation이 가진다. 프로젝트 행 건명 = 프로젝트명.
4. **생성 UX**: 새 작업은 접힌 드롭다운(채널→프로젝트 종속, "+ 신규" 항목으로 직접입력), 노션 제목 필드 없음, 종료일 비우면 하루짜리. 우클릭 생성 시 채널/프로젝트 잠금.
5. **클릭 한 번**에 편집 패널 열림 (행·바·이름텍스트 모두). 메모는 **나갈 때 자동저장** (키입력마다 저장 금지 — KV 쿼터).
6. **슬랙 알림 사용 안 함** (코드는 SLACK_WEBHOOK_URL 미설정으로 영구 no-op. 다시 제안하지 말 것. 원하면 "일일 요약" 형태로만).
7. 디자인은 **노션 네이티브**(플랫 파스텔 바 + color-mix, 노션 팔레트/타이포). 기능 수정 시 디자인 임의 변경 금지.

## 6. 사용자 작업 스타일 / 소통

- 한국어. 결론부터 간결하게. 스스로 검증하고 근거를 보여주는 것을 신뢰함. "완료"라고 말하려면 실환경에서 검증됐어야 함.
- 큰 수정은 스펙 작성 → 실행 → diff 검수 → 배포 → 검증의 사이클. 작은 수정(상수, 몇 줄)은 바로.
- 테스트로 실데이터를 만들면 **반드시 정리**하고 사용자에게 알릴 것.
- 커밋: 영어 제목 + 본문, `Co-Authored-By` 트레일러 사용해 왔음. 머지된 브랜치는 삭제.

## 7. 미결 사항 / 다음 목표

1. **[대기] 자동화 구조** (사용자가 시작 신호 주면 착수): 노션 "프로젝트 관리" DB ↔ 간트 양방향. 원칙 합의됨 — "같은 데이터의 원본은 한 곳": 프로젝트 정체성/진행단계 = 프로젝트 관리 DB, 일정 = 프로덕션 플랜. A) 간트에서 생성 → 프로젝트 관리에 기록, B) 프로젝트 관리에서 날짜 확정 → 플랜에 일정 자동 생성(크론 워커 필요할 수 있음), 역방향 상태 동기화(업로드 완료→단계 이동). 착수 시 프로젝트 관리 DB 링크/스키마 필요.
2. **[정리 필요] 임시 디버그 로깅**: `sendClickDebug`/`/api/debug-log`/캡처 클릭 로거(app.js) — 사이드바 클릭 픽스가 사용자 실환경에서 확인되면 제거할 것.
3. 노션 간트용db의 "하위 항목" 표시는 사용자가 UI에서 켜야 함 (⋯ → 하위 항목 → 상위 프로젝트).

## 8. 빠른 검증 치트시트

```bash
# 문법 검사
node --check public/app.js
cd functions/api && node --check './[[path]].js'

# 배포 확인 (별칭 전파 후)
curl -s "https://solpa-gantt.pages.dev/" | grep -o "v=[a-z0-9-]*"

# API 상태 (connection.write가 true여야 정상)
curl -s "https://solpa-gantt.pages.dev/api/tasks?key=140b034014a1a3d4141cfade6df012553e68" | head -c 300
```
