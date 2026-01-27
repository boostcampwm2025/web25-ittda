# 공동작성 WS 협업 (Draft)

> 기본적으로 전체적인 흐름은 ws-flow-test.js 파일로 확인 가능함
> ws-presence-test.js로는 자잘한 이벤트 전송 가능
> 사용법은 ACCESS_TOKEN={ACCESS_TOKEN} LOCK_KEY=block:{block_id} node backend/scripts/ws-presence-test.js {draft_id}

## 개요

- 인증은 access token 기반이며, 클라이언트는 userId를 직접 알 수 없음
- 클라이언트 식별은 sessionId 기준으로 동작
- 락 키는 `block:{uuid}` 형식만 허용 (table은 `table:{uuid}`, 제목은 `block:title`)
  - 현재는 실제 id가 아니더라도 lock 동작을 확인 가능하도록 구현
- lock TTL: 30초, heartbeat 권장 주기: 10초
- 초기 스냅샷으로 전체 동기화 후, 이후에는 delta 이벤트로 상태 갱신
- 드래프트 최초 생성 시 기본 블록 3개(DATE/TIME/TEXT)가 포함됨 (서버에서 UUID 생성)

## 이벤트 목록

입장/Presence

- `JOIN_DRAFT { draftId }`
- `LEAVE_DRAFT { draftId? }`
- `PRESENCE_SNAPSHOT { sessionId, members, locks, version }`
- `PRESENCE_JOINED { member }`
- `PRESENCE_LEFT { sessionId }`
- `PRESENCE_REPLACED { previousSessionId, sessionId, displayName }`
- `SESSION_REPLACED {}` (기존 세션에만 전송)

Lock

- `LOCK_ACQUIRE { lockKey }`
- `LOCK_GRANTED { lockKey, ownerSessionId }`
- `LOCK_DENIED { lockKey, ownerSessionId | null }`
- `LOCK_RELEASE { lockKey }`
- `LOCK_CHANGED { lockKey, ownerSessionId | null }`
- `LOCK_HEARTBEAT { lockKey }`
- `LOCK_EXPIRED { lockKey, ownerSessionId }`

Stream/Patch/Publish

- `BLOCK_VALUE_STREAM { blockId, partialValue }`
- `STREAM_ABORTED { blockId, sessionId }`
- `PATCH_APPLY { draftId, baseVersion, patch }`
- `PATCH_COMMITTED { version, patch, authorSessionId }`
- `PATCH_REJECTED_STALE { currentVersion }`
- `DRAFT_PUBLISHED { postId }`

## 이벤트 상세 설명

### JOIN_DRAFT

- 클라이언트 → 서버 입장 요청 이벤트
- 서버는 세션 정보 생성 후 `PRESENCE_SNAPSHOT`으로 응답
- 정상 흐름에서는 이 이벤트 이후에만 LOCK 이벤트를 보내는 것을 권장

### PRESENCE_SNAPSHOT

- 서버 → 클라이언트, 초기 동기화 이벤트
- 현재 접속 중인 멤버와 락 상태를 모두 포함
- 이 이벤트 수신 시점이 “세션 준비 완료” 기준

### PRESENCE_JOINED

- 누군가 방에 새로 들어왔을 때 브로드캐스트
- UI에서 접속자 목록에 추가 처리

### LEAVE_DRAFT

- 클라이언트 → 서버, 명시적인 퇴장 요청
- 서버는 방에서 세션을 제거하고 `PRESENCE_LEFT` 브로드캐스트
- 퇴장한 본인 소켓은 룸을 떠났기 때문에 `PRESENCE_LEFT`를 수신하지 않음

### PRESENCE_LEFT

- 누군가 정상적으로 나갔을 때 브로드캐스트
- `PRESENCE_REPLACED`로 교체된 세션은 별도 처리됨

### PRESENCE_REPLACED

- 동일 사용자(actor)가 새 세션으로 교체될 때 브로드캐스트
- `previousSessionId`는 끊길 세션, `sessionId`는 새 세션
- 프론트는 교체된 세션에 안내 표시(읽기 전용/재접속 유도) 가능

### SESSION_REPLACED

- 서버가 이전 세션에 직접 보내는 이벤트
- 수신한 클라이언트는 “다른 기기/탭에서 접속” 안내 후 재접속 유도

### LOCK_ACQUIRE

- 클라이언트 → 서버 락 획득 요청
- `lockKey`가 유효하지 않으면 `LOCK_DENIED`
- 이미 점유 중이면 `LOCK_DENIED`
- 제목은 `block:title` 락을 사용

### LOCK_GRANTED

- 서버 → 요청한 클라이언트에 락 획득 성공 응답
- UI에서 “편집 가능” 상태로 전환

### LOCK_DENIED

- 서버 → 요청한 클라이언트에 락 획득 실패 응답
- UI에서 “읽기 전용 + 누가 편집 중인지 표시” 처리

### LOCK_RELEASE

- 클라이언트 → 서버 락 해제 요청
- 해제 성공 시 룸에 `LOCK_CHANGED` 브로드캐스트

### LOCK_CHANGED

- 서버 → 룸 전체에 락 상태 변경 브로드캐스트
- `ownerSessionId=null`이면 해제 상태
- 프론트는 이 이벤트만으로 락 UI 상태를 갱신할 수 있음

### LOCK_HEARTBEAT

- 클라이언트 → 서버 락 유지 요청
- TTL 연장을 위한 신호, 서버는 응답 이벤트를 보내지 않음

### LOCK_EXPIRED

- TTL 만료로 락이 자동 해제될 때 브로드캐스트
- 이후 `LOCK_CHANGED(ownerSessionId=null)`이 뒤따름

### BLOCK_VALUE_STREAM

- 락 소유자만 전송 가능 (block/table lock)
- 룸에 브로드캐스트되어 다른 클라이언트가 임시 값을 표시
- payload: `{ blockId, partialValue, sessionId }`
- 권장 전송 주기: 2~3초

### STREAM_ABORTED

- 세션 disconnect 시 서버가 스트림 중단 브로드캐스트
- payload: `{ blockId, sessionId }`
- 클라이언트는 임시 표시 제거 및 마지막 커밋 상태로 롤백

### PATCH_APPLY

- 클라이언트 → 서버 커밋 요청
- payload: `{ draftId, baseVersion, patch }`
- patch는 단일 명령 또는 배열 형태
- 락 소유자만 PATCH 가능
  - `BLOCK_SET_TITLE`은 `block:title` 락 필요
- `BLOCK_INSERT` 성공 시 서버가 `block:{id}` 락을 자동 획득하고 `LOCK_GRANTED/LOCK_CHANGED` 브로드캐스트
- 지원 명령
  - `BLOCK_INSERT { block }`
  - `BLOCK_DELETE { blockId }`
  - `BLOCK_MOVE { blockId, layout }` (lock 없이 가능)
  - `BLOCK_MOVE { moves: [{ blockId, layout }] }` (lock 없이 가능, 전체 레이아웃 동기화용 권장)
  - `BLOCK_SET_VALUE { blockId, value }`
  - `BLOCK_SET_TITLE { title }`

### PATCH_COMMITTED

- 서버 → 룸 전체 브로드캐스트
- payload: `{ version, patch, authorSessionId }`
- 클라이언트는 이 이벤트를 기준으로 “확정됨” UI 처리

### PATCH_REJECTED_STALE

- baseVersion 불일치 시 요청자에게 전송
- payload: `{ currentVersion }`
- 클라이언트는 스냅샷 재요청 후 재시도

### DRAFT_PUBLISHED

- publish 완료 시 룸 전체 브로드캐스트
- payload: `{ postId }`
- 클라이언트는 편집 화면 종료/상세 페이지 이동

## Payload 요약

presence member

- `sessionId`, `displayName`, `profileImageId`, `permissionRole`, `lastSeenAt`

locks

- `lockKey`, `ownerSessionId`

stream

- `blockId`, `partialValue`, `sessionId`

patch

- `draftId`, `baseVersion`, `patch`

## 클라이언트 동작 가이드

- `PRESENCE_SNAPSHOT` 수신 후 세션 준비 완료로 판단
- 락 상태는 `PRESENCE_SNAPSHOT.locks`로 초기화하고, 이후 `LOCK_CHANGED/LOCK_EXPIRED`로 갱신
- `LOCK_RELEASE` 직전에 `PATCH_APPLY`를 호출해서 최종 저장
- 세션 교체 시 `SESSION_REPLACED`를 받으면 모달로 재접속 안내
- publish 중에는 PATCH/LOCK 요청이 거절될 수 있음 (서버가 임시 freeze)
- `PATCH_REJECTED_STALE` 또는 `exception` 수신 시 로컬 레이아웃 변경은 롤백 처리
- `BLOCK_MOVE`는 수신한 레이아웃 전체를 덮어쓴다고 가정하고 UI를 재배치

## TODO

- 추후 세션 교체 이벤트에 device info 확장 가능
