# Cloudflare Pages 배포 체크리스트

## 1. 환경변수 위치

Cloudflare 대시보드에서 아래 순서로 들어갑니다.

1. `Workers & Pages`
2. 방금 만든 Pages 프로젝트 선택
3. 상단 또는 왼쪽의 `Settings`
4. `Variables and Secrets`
5. `Production` 섹션에서 `Add variable` 또는 `Add secret`

`NOTION_TOKEN`만 추가하면 됩니다. 가능하면 `Secret`으로 넣고, 현재 Cloudflare UI에서 Secret 저장/배포가 막히면 `Text`로 넣어도 앱은 동작합니다. `Text`는 Cloudflare 프로젝트 관리자에게 값이 보일 수 있지만, 브라우저 사용자에게 공개되지는 않습니다.

## 2. Cloudflare UI에 직접 넣을 환경변수

직접 넣을 값은 노션 API 키 하나만 남겨두었습니다.

```env
NOTION_TOKEN=노션 API 키
```

`NOTION_TOKEN`은 값이 노출되지 않게 `Secret`으로 넣는 것이 좋습니다. Secret 타입 때문에 저장 또는 배포가 막히면 우선 `Text` 타입으로 넣고 배포를 진행하세요.

아래 값들은 [wrangler.toml](./wrangler.toml)의 `[vars]`와 Function 코드 기본값에 이미 들어 있습니다. GitHub repo에 같이 올라가면 Cloudflare Pages Functions가 이 값을 읽고, 혹시 wrangler vars가 적용되지 않아도 코드 기본값으로 동작합니다.

```env
NOTION_VERSION=2022-06-28

NOTION_READ_DATABASE_ID=20175c38-e3be-4b38-b81e-e8394914431e
NOTION_WRITE_DATABASE_ID=b6e89562-3634-4ef2-bd75-c592a438e372

NOTION_TITLE_PROP=이름
NOTION_DATE_PROP=날짜
NOTION_START_PROP=날짜
NOTION_CHANNEL_PROP=채널명
NOTION_PROJECT_PROP=이름
NOTION_DETAIL_PROP=카테고리
NOTION_CATEGORY_PROP=카테고리
NOTION_STATUS_PROP=상태
NOTION_ASSIGNEE_PROP=사람

NOTION_WRITE_TITLE_PROP=프로젝트
NOTION_WRITE_CHANNEL_PROP=채널
NOTION_WRITE_PROJECT_PROP=프로젝트
NOTION_WRITE_DETAIL_PROP=일정
NOTION_WRITE_DATE_PROP=날짜
NOTION_WRITE_STATUS_PROP=상태
NOTION_WRITE_ASSIGNEE_PROP=담당자
NOTION_WRITE_DESCRIPTION_PROP=메모

APP_ALLOW_TARGET_ARCHIVE=false
APP_EMBED_KEY=140b034014a1a3d4141cfade6df012553e68
```

## 3. KV 바인딩 추가

Cloudflare에서는 로컬 파일 `data/local-store.json`을 쓸 수 없으므로 KV 저장소 하나가 필요합니다.

1. `Workers & Pages`
2. Pages 프로젝트 선택
3. `Settings`
4. `Bindings`
5. `KV namespace bindings`
6. `Add binding`
7. Variable name: `SOLPA_GANTT_KV`
8. KV namespace: 새로 만들거나 기존 namespace 선택

이 KV에는 숨김, 프로젝트 병합 기준, 보기 설정, 기준선, 활동 로그가 저장됩니다.

## 4. Pages 빌드 설정

Cloudflare Pages 프로젝트 설정에서:

```text
Framework preset: None
Build command: 비움
Build output directory: public
```

GitHub repo에 push하면 Cloudflare가 자동 배포합니다.

## 5. 노션 임베드 주소

배포가 끝나면 Cloudflare가 아래 같은 주소를 줍니다.

```text
https://solpa-gantt.pages.dev
```

노션 Embed에는 아래 주소를 넣습니다.

```text
https://solpa-gantt.pages.dev/embed/140b034014a1a3d4141cfade6df012553e68
```

## 6. 동기화 기준

- 간트에서 생성/수정/숨김: 즉시 Notion `간트_확인` DB에 저장
- 노션 원본에서 직접 수정: 새로고침하면 즉시, 그냥 켜두면 최대 5분 안에 반영
- 서버 상태 확인: 활성 탭에서 60초마다 가볍게 확인
- 비활성 탭: 자동 요청 중지
