# 팀 잇다-

## 🧩 서비스 소개

<br />

## 👉 배포 링크

TODO: ncp 배포 주소

<br />

## 👥 팀원 소개

| <img src="https://avatars.githubusercontent.com/u/56586470?v=4" width="150" /> | <img src="https://avatars.githubusercontent.com/u/138753711?v=4" width="150"/> | <img src="https://avatars.githubusercontent.com/u/167273831?v=4" width="150" /> | <img src="https://avatars.githubusercontent.com/u/129252277?v=4" width="150" /> |
| ------------------------------------------------------------------------------ | ------------------------------------------------------------------------------ | ------------------------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| [도비(황수연)](https://github.com/H-sooyeon)                                   | [앤프(하민영)](https://github.com/IENFI)                                       | [두리(이기필)](https://github.com/openLeeWorld)                                 | [주디(이시영)](https://github.com/Yeong-si)                                     |
| ISFP                                                                           | ISTP                                                                           | INTP                                                                            | ISFP                                                                            |

<br />

## 🤝 협업 전략 (브랜치 구조와 분업하기, 의존적인 작업하기)

### 최종 브랜치 전략

- 프로덕션/배포 브랜치(main)
  - 이 브랜치에 머지/푸시될 때만 실제 클라우드 배포 실행
- 기본(기준) 브랜치(develop)
  - 모든 기능 브랜치의 머지 대상
  - 브랜치 보호 규칙 설정 및 CI 실행 브랜치
  - 기능 브랜치

<br />

**네이밍 규칙**: `[Type]/작업-이슈번호<br />
예: feat/login-#23, fix/header-layout-#10

<br />

## 🧸 그라운드룰

### 💬 커뮤니케이션

**데일리 체크인**: 아침 진행 상황/컨디션 공유

- 중요한 논의는 반드시 문서화(GitHub Issue, Notion 등)
- 불명확한 요구사항 → 질문 먼저, 추측 금지
- 의견 주장 시 — AI 근거 사용 금지, 본인 판단·검증된 근거 우선
- 슬랙 응답: 코어타임에는 즉시 응답 or 최소 리액션
- 말투·억양 등 개인 특성으로 오해하지 않기 (경상도 억양 등)

### 🕒 일정 / 작업 규칙

- 데드라인은 조정 가능하되, 지연될 경우 반드시 사전 공유
- 하루 작업 시간은 자유롭게, 대신 최소 1회 진행 상황 공유 필수
- 회의는 1시간 / 휴식 10분 원칙
- 목요일 저녁~금요일 오전: 통합 테스트 기간
- 배포 흐름:
  - dev 브랜치 → push 시 CI 실행
  - main 브랜치 → push 시 CD(배포) 실행

### 🧪 코드 & PR 규칙

- PR/커밋 전에 모든 유닛 테스트 작성 + 통과 필수
- PR에는 반드시 결과 스크린샷 또는 테스트 결과 포함
- PR 리뷰 시:
  - 코드 실행 여부 반드시 확인
  - 팀원 모두 실행 가능한 환경 보장
  - 테스트 통과한 코드만 import·사용 가능
  - lint-staged + husky 활용 (pre-commit, pre-push)

### 😊 팀 분위기

- 서로의 의견을 존중하고, 말투나 억양로 오해하지 않기
- 완벽보다 빠른 합의 → 지속적인 개선
- 지치지 않는 흐름 만들기
- 각자의 성향·약점 이해하기
- 커뮤니케이션 시 부드럽고 명확하게

<br />

## 📜 커밋 템플릿, 이슈 템플릿 : 개발 작업을 위한 공통 자료

### 📝 Commit Message

```txt
type: 제목 (#이슈번호)

- 본문

---

feat 새로운 기능 추가
fix 버그 수정
refactor 코드 구조 개선
chore 설정/빌드 수정
test 테스트 코드
docs 문서
style 코드 포매팅/스타일 변경`
```

### 이슈 템플릿

**1. 버그**

```yml
name: '🐞 Bug'
description: '버그가 발생했나요?'
labels: '🐞 Bug'
body:
  - type: textarea
    attributes:
      label: 🐞 Describe
      description: 버그에 대한 설명을 작성해 주세요.
      placeholder: 자세히 적을수록 좋습니다!
    validations:
      required: true
  - type: textarea
    attributes:
      label: 📄 Logs
      description: 로그가 있으면 복붙해 주세요.
      render: shell
    validations:
      required: false
  - type: textarea
    attributes:
      label: 🌏 Environment
      description: 버그가 발생한 환경에 대해 작성해 주세요.
      placeholder: |
        OS: macOS 12.2.1
    validations:
      required: true
  - type: textarea
    attributes:
      label: 🙋🏻 More
      description: 더 하고 싶은 말이 있다면 작성해 주세요.
```

<br />

**2. feature**

```yml
name: '✨ Feature'
description: '새로운 기능 또는 명세가 있나요?'
labels: '✨ Feature'
body:
  - type: textarea
    attributes:
      label: ✨ Describe
      description: 새로운 기능에 대한 설명을 작성해 주세요.
      placeholder: 자세히 적을수록 좋습니다!
    validations:
      required: true
  - type: textarea
    attributes:
      label: ✅ Tasks
      description: 해야 하는 일에 대한 Tasks를 작성해 주세요.
      placeholder: 최대한 세분화 해서 적어주세요!
    validations:
      required: true
  - type: textarea
    attributes:
      label: 🙋🏻 More
      description: 더 하고 싶은 말이 있다면 작성해 주세요.
```

<br />

**3. test**

```yml
name: '🔨 Test'
description: '테스트을 해야할 부분이 있나요?'
labels: '🔨 Test'
body:
  - type: textarea
    attributes:
      label: 🔨 Describe
      description: 어떤 테스트를 해야하는지 설명해주세요!
      placeholder: 간단한 테스트 종류(Unit, Integration, E2E, Stress 등)
    validations:
      required: true
  - type: textarea
    attributes:
      label: ✅ Tasks
      description: 테스트를 할 부분에 대해서 자세히 작성해 주세요.
      placeholder: 최대한 세분화 해서 적어주세요!
    validations:
      required: true
  - type: textarea
    attributes:
      label: 🙋🏻 More
      description: 더 하고 싶은 말이 있다면 작성해 주세요.
```

<br />

**4. refactor**

```yml
name: '🔨 Refactor'
description: '리팩터링을 해야할 부분이 있나요?'
labels: '🔨 Refactor'
body:
  - type: textarea
    attributes:
      label: 🔨 Describe
      description: 왜 리팩터링을 해야하는지 설명해주세요!
      placeholder: 자세히 적을수록 좋습니다!
    validations:
      required: true
  - type: textarea
    attributes:
      label: ✅ Tasks
      description: 리팩터링을 할 부분에 대해서 자세히 작성해 주세요.
      placeholder: 최대한 세분화 해서 적어주세요!
    validations:
      required: true
  - type: textarea
    attributes:
      label: 🙋🏻 More
      description: 더 하고 싶은 말이 있다면 작성해 주세요.
```

<br>

## 📒 기획/디자인 링크

- [기획서](https://www.notion.so/12-11-2c618227616c804186b4eccdb6f103ce)
- [화면설계안](https://www.figma.com/design/6VcNOelb7c6mt5rGP0Hv1P/web25-%EA%B7%B8%EB%A3%B9-%ED%94%84%EB%A1%9C%EC%A0%9D%ED%8A%B8?node-id=0-1&p=f&t=n0kXJA9JwNWpdLFS-0)

<br />

## 📒 회의록/이슈/위키 연결 : 협업과 개발 과정의 문서 자료

- [회의록](https://github.com/boostcampwm2025/web25-boostcamp/wiki/12%EC%9B%94-%ED%9A%8C%EC%9D%98%EB%A1%9D)
- [이슈](https://github.com/boostcampwm2025/web25-boostcamp/issues)
- [깃허브 프로젝트](https://github.com/orgs/boostcampwm2025/projects/227)
- [프로젝트 위키 링크](https://github.com/boostcampwm2025/web25-boostcamp/wiki)
