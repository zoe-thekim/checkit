# GitHub Pages 배포

## 현재 구성
1. Pages 전용 정적 파일: `docs/`
2. 자동 배포 워크플로: `.github/workflows/pages.yml`

## GitHub에서 1회 설정
1. 저장소 `Settings` -> `Pages`
2. `Build and deployment` 의 `Source`를 `GitHub Actions`로 선택

## 배포
1. `main` 브랜치에 push
2. Actions의 `Deploy GitHub Pages`가 실행
3. URL: `https://zoe-thekim.github.io/checkit/`

## 주의
1. GitHub Pages는 서버(Spring/H2)를 실행하지 않음
2. `docs/` 버전은 브라우저 `localStorage` 기반으로 동작
