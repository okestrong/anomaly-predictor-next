# Executor Placeholder 승인 요청 처리 수정 요청

## 현재 문제

executor에서 `<placeholder>` 형식이 포함된 명령어를 승인 요청할 때 오류가 발생합니다.

예시:
```json
{
    "command": "iostat",
    "args": ["-x", "<device>", "10"],
    "context": {
        "requester": "trouble-guide-user",
        "request_reason": "Solution #1: BlueStore I/O 문제 해결",
        "session_id": "thread-xxx"
    }
}
```

위 요청을 보내면 `502 Bad Gateway` 또는 executor 내부 오류가 발생합니다.

## 요구사항

placeholder(`<...>` 형식)가 포함된 명령어도 **승인 요청(pending_approval)** 상태로 저장할 수 있어야 합니다.

### 처리 흐름

1. **승인 요청 단계**: placeholder가 포함된 명령어를 승인 요청으로 받아서 `pending_approval` 상태로 저장
2. **승인 완료 단계**: 관리자가 승인하면 `approved` 상태로 변경
3. **실행 단계**: 사용자가 웹 터미널에서 placeholder를 실제 값으로 대체한 후 별도의 실행 요청을 보냄

### 승인 요청 시 기대하는 응답

```json
{
    "request_id": "cmd-xxx",
    "status": "pending_approval",
    "requires_approval": true,
    "command": "iostat",
    "args": ["-x", "<device>", "10"]
}
```

### 수정이 필요한 부분

1. **화이트리스트/명령어 검증 로직**: placeholder가 포함된 인자를 유효한 것으로 처리
   - `<...>` 패턴이 포함된 인자는 검증을 건너뛰거나, placeholder로 인식하여 허용

2. **승인 요청 저장 로직**: placeholder가 포함된 명령어도 `pending_approval` 상태로 저장 가능하도록 수정

3. **실행 로직**: placeholder가 포함된 명령어는 **실행하지 않고** 승인 대기 상태만 반환
   - 실제 실행은 사용자가 placeholder를 채운 후 별도의 요청으로 진행

## 참고: 전체 워크플로우

```
[프론트엔드]                    [백엔드 API]                    [Executor]
     |                              |                              |
     |  "이 해결책 실행하기" 클릭    |                              |
     |----------------------------->|                              |
     |                              |  승인 요청 (placeholder 포함) |
     |                              |----------------------------->|
     |                              |     pending_approval 반환    |
     |                              |<-----------------------------|
     |     승인 대기 UI 표시        |                              |
     |<-----------------------------|                              |
     |                              |                              |
     |  [관리자가 승인 처리]        |                              |
     |                              |                              |
     |  "승인 확인" 버튼 클릭       |                              |
     |----------------------------->|  승인 상태 확인               |
     |                              |----------------------------->|
     |                              |     approved 반환            |
     |                              |<-----------------------------|
     |     웹 터미널 표시           |                              |
     |<-----------------------------|                              |
     |                              |                              |
     |  [사용자가 웹 터미널에서     |                              |
     |   placeholder를 실제 값으로  |                              |
     |   대체 후 명령어 실행]       |                              |
     |----------------------------->|  실행 요청 (실제 값)         |
     |                              |----------------------------->|
     |                              |     실행 결과 반환           |
     |                              |<-----------------------------|
     |     결과 표시                |                              |
     |<-----------------------------|                              |
```

## 예시 명령어들

placeholder가 포함될 수 있는 명령어 예시:

```bash
ceph osd crush reweight osd.<osd_id> <new_weight>
smartctl -a /dev/<disk>
ping -c 5 <host_ip>
iostat -x <device> 10
ceph osd pool set <pool_name> pg_num <pg_num>
```

## 요약

- placeholder가 포함된 명령어도 `pending_approval` 상태로 저장 가능해야 함
- 실제 실행은 placeholder가 실제 값으로 대체된 후에만 진행
- 승인 요청 단계에서는 명령어를 실행하지 않고 저장만 함

---

# Whitelist 수정 필요 사항

## 🚨 긴급: ceph pg repair/scrub/deep-scrub 카테고리 변경 필요

### 현재 문제

`configs/whitelist.yaml`에서 `ceph pg repair`, `ceph pg scrub`, `ceph pg deep-scrub`가 **safe** 카테고리에 있습니다.
이로 인해 **PG ID 없이 바로 실행되어** 오류가 발생했습니다.

**오류 로그:**
```json
{
  "request_id": "cmd-be15e64c-5a8c-440c-ac97-1f60aa7cbdee",
  "status": "failed",
  "requires_approval": false,  // ❌ 문제: safe 카테고리라서 바로 실행됨
  "command": "ceph",
  "args": ["pg", "repair", "--force"],
  "stderr": "command exited with code 22",
  "exit_code": 22  // EINVAL - Invalid argument (PG ID 누락)
}
```

### 수정 방법

`configs/whitelist.yaml`에서 다음 명령어들을 **safe**에서 **requires_approval**로 이동하세요:

**현재 (잘못된 설정):**
```yaml
ceph_commands:
  safe:
    # ... 다른 명령어들 ...
    - command: ceph
      subcommands: [pg, repair]
      description: "Placement Group 복구 (safe - 데이터 무결성 검증 및 복구)"
    - command: ceph
      subcommands: [pg, scrub]
      description: "Placement Group 스크럽 (데이터 무결성 검증)"
    - command: ceph
      subcommands: [pg, deep-scrub]
      description: "Placement Group 딥 스크럽 (심층 데이터 무결성 검증)"
```

**수정 후 (올바른 설정):**
```yaml
ceph_commands:
  requires_approval:
    # ... 다른 명령어들 ...
    - command: ceph
      subcommands: [pg, repair]
      risk_level: high
      description: "Placement Group 복구 - PG ID 필수 (ceph pg repair <pg_id>)"
      allow_any_args: true
      potential_impacts:
        - "PG 데이터 복구 시도"
        - "복구 과정에서 I/O 부하 발생 가능"
        - "잘못된 PG ID 지정 시 오류 발생"

    - command: ceph
      subcommands: [pg, scrub]
      risk_level: medium
      description: "Placement Group 스크럽 - PG ID 필수 (ceph pg scrub <pg_id>)"
      allow_any_args: true
      potential_impacts:
        - "PG I/O 부하 증가"
        - "일시적인 성능 저하 가능"

    - command: ceph
      subcommands: [pg, deep-scrub]
      risk_level: medium
      description: "Placement Group 딥 스크럽 - PG ID 필수 (ceph pg deep-scrub <pg_id>)"
      allow_any_args: true
      potential_impacts:
        - "PG I/O 부하 상당히 증가"
        - "일반 스크럽보다 더 긴 시간 소요"
        - "성능 저하 가능"
```

### 이유

1. **PG ID가 필수**: `ceph pg repair`, `ceph pg scrub`, `ceph pg deep-scrub`는 모두 `<pg_id>` 인자가 필수입니다.
2. **데이터 변경 명령어**: 읽기 전용이 아닌 쓰기/복구 명령어이므로 승인이 필요합니다.
3. **I/O 영향**: 실행 시 클러스터 성능에 영향을 줄 수 있습니다.

---

## Whitelist 추가 필요 명령어

executor의 whitelist에 다음 명령어들이 누락되어 있습니다. 추가해주세요.

### ceph mgr 관련 명령어 - ✅ 이미 추가됨 (확인 완료)

whitelist.yaml을 확인한 결과, `ceph mgr` 관련 명령어들은 이미 추가되어 있습니다:
- `ceph mgr stat` (safe)
- `ceph mgr status` (safe)
- `ceph mgr dump` (safe)
- `ceph mgr services` (safe)
- `ceph mgr module ls` (safe)
- `ceph mgr module enable` (requires_approval)
- `ceph mgr module disable` (requires_approval)
