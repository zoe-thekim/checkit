# checkit 배포 가이드 (Render)

## 1) 코드 업로드
1. 이 프로젝트를 GitHub 저장소에 push

## 2) Render에서 생성
1. https://render.com 접속 후 로그인
2. `New +` -> `Blueprint` 선택
3. GitHub 저장소 연결 후 배포
4. `render.yaml`을 읽어 자동 생성됨

## 3) 배포 완료 후
1. `https://<서비스명>.onrender.com` URL 발급
2. 누구나 어디서나 접속 가능

## 참고
1. 데이터는 Render Disk(`/data`)에 저장되어 재배포 후에도 유지됨
2. H2 콘솔은 외부 노출 방지를 위해 기본 비활성화
3. 앱 포트는 Render의 `PORT` 환경변수를 자동 사용
