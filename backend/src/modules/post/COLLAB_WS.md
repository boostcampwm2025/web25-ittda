# 공동작성 WS 협업 (Draft)

> 기본적으로 전체적인 흐름은 ws-presence-test.js 파일로 확인 가능함
> 사용법은 ACCESS_TOKEN={ACCESS_TOKEN} LOCK_KEY=block:{block_id} node backend/scripts/ws-presence-test.js {draft_id}

## 개요

- 인증은 access token 기반이며, 클라이언트는 userId를 직접 알 수 없음
- 클라이언트 식별은 sessionId 기준으로 동작
- 락 키는 `block:{uuid}` 형식만 허용 (table은 `table:{uuid}`)
  - 현재는
- lock TTL: 30초, heartbeat 권장 주기: 10초
- 초기 스냅샷으로 전체 동기화 후, 이후에는 delta 이벤트로 상태 갱신

## 이벤트 목록

입장/Presence

- `JOIN_DRAFT { draftId }`
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

## Payload 요약

presence member

- `sessionId`, `displayName`, `profileImageId`, `permissionRole`, `lastSeenAt`

locks

- `lockKey`, `ownerSessionId`

## 클라이언트 동작 가이드

- `PRESENCE_SNAPSHOT` 수신 후 세션 준비 완료로 판단
- 락 상태는 `PRESENCE_SNAPSHOT.locks`로 초기화하고, 이후 `LOCK_CHANGED/LOCK_EXPIRED`로 갱신
- `LOCK_RELEASE` 직전에 `PATCH_APPLY`를 호출해서 최종 저장 (PATCH/STREAM은 다음 이슈에서 구현)
- 세션 교체 시 `SESSION_REPLACED`를 받으면 모달로 재접속 안내

## TODO

- blockId 존재 검증은 PATCH/STREAM 단계에서 추가
- 추후 세션 교체 이벤트에 device info 확장 가능
