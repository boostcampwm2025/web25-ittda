6. Controller 적용 예시 (api는 예시일 뿐)

6.1 개인 기록 (로그인만 필요)

```ts
@UseGuards(JwtAuthGuard)
@Get('records/me')
getMyRecords(@Req() req) {
    return this.recordService.findByUser(req.user.sub);
}
```

6.2 그룹 기록 조회 (VIEWER 이상)

```ts
@UseGuards(JwtAuthGuard, GroupRoleGuard)
@GroupRoles('OWNER', 'EDITOR', 'VIEWER')
@Get('groups/:groupId/records')
getGroupRecords() {}
```

6.3 그룹 기록 수정 (EDITOR 이상)

```ts
@UseGuards(JwtAuthGuard, GroupRoleGuard)
@GroupRoles('OWNER', 'EDITOR')
@Patch('groups/:groupId/records/:id')
updateGroupRecord() {}
```

6.4 그룹 설정 변경 (OWNER 전용)

```ts
@UseGuards(JwtAuthGuard, GroupRoleGuard)
@GroupRoles('OWNER')
@Delete('groups/:groupId')
deleteGroup() {}
```

7. 실행 흐름 (정확한 순서)

```text
Request
→ JwtAuthGuard
→ JWT 검증
→ req.user 세팅
→ RolesGuard (있다면)
→ 전역 Role 검사
→ GroupRoleGuard (있다면)
→ DB 조회 (groupId + userId)
→ Controller
```

8. Postman / 브라우저 테스트 포인트

JWT 없는 경우

JwtAuthGuard → 401

그룹 멤버 아닌 경우

GroupRoleGuard → 403

권한 부족

Role 불일치 → 403

9. 중요한 설계 원칙 (실무 핵심)

JWT에는 최소 정보만 (stateless)

리소스 종속 권한은 항상 DB 조회

Guard는 “판단”, Service는 “정책”

OWNER ⊃ EDITOR ⊃ VIEWER 관계를 코드로 하드코딩하지 말 것
→ DB role 값으로 통제
