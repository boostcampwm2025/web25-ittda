# 미디어 업로드 수동 테스트

presign -> PUT 업로드 -> complete -> resolve 흐름을 수동으로 확인합니다.

## 준비물
- 백엔드: `http://localhost:4000`
- MinIO: `http://localhost:9000`
- 액세스 토큰(`ACCESS_TOKEN`)

## 현재 정책
- 허용 contentType: `image/png`, `image/jpeg`, `image/jpg`, `image/webp`
- 최대 용량: 10MB
- presign 요청 전에 프론트에서 `contentType`/`size` 선검증 권장
- 향후 PUT → POST presign 전환으로 용량 제한을 더 엄격하게 할 계획

## 1) Presign 요청

```bash
ACCESS_TOKEN=... \
curl -sS -X POST "http://localhost:4000/v1/media/presign" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "files": [
      { "contentType": "image/png", "size": 12345 }
    ]
  }'
```

응답에 `mediaId`, `uploadUrl`이 포함됩니다.

## 2) PUT 업로드

```bash
curl -v --max-time 30 -X PUT \
  -H "Content-Type: image/png" \
  --data-binary @./test.png \
  "PRESIGNED_URL"
```

성공 시 보통 200 또는 204가 반환됩니다.

## 3) Complete 요청

```bash
ACCESS_TOKEN=... \
curl -sS -X POST "http://localhost:4000/v1/media/complete" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"mediaIds":["MEDIA_ID"]}'
```

`successIds`에 업로드한 ID가 포함되어야 합니다.

## 4) Resolve (단건)

```bash
ACCESS_TOKEN=... \
curl -sS -X GET "http://localhost:4000/v1/media/MEDIA_ID/url" \
  -H "Authorization: Bearer $ACCESS_TOKEN"
```

응답에 presigned GET `url`이 포함됩니다.

## 5) Resolve (여러 개)

```bash
ACCESS_TOKEN=... \
curl -sS -X POST "http://localhost:4000/v1/media/resolve" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"mediaIds":["MEDIA_ID_1","MEDIA_ID_2"]}'
```

응답에 `items`와 `failed`가 포함됩니다.
