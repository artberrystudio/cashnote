# 💰 CashNote — 개인 수입 활동 트래커

모바일 우선 수입 기록 앱. 일별 수입 활동을 기록하고 카테고리·기간별로 분석합니다.

## 기능

- 📊 **대시보드** — 오늘/이번 달 수입 요약, 카테고리별 누적 막대 차트, 최근 5건 목록
- ➕ **수입 추가/수정** — 활동명, 금액(₩), 카테고리, 날짜, 메모 입력
- 📋 **전체 기록** — 전체/오늘/이번 주/이번 달 탭 필터, 날짜 내림차순 정렬
- 🗑️ **삭제** — 항목별 삭제 (확인 다이얼로그 포함)
- 💾 **로컬 저장** — AsyncStorage 기반 영구 저장

## 카테고리

| 카테고리 | 색상 |
|---------|------|
| 프리랜서 | 청록(Teal) |
| 콘텐츠 | 보라(Purple) |
| 투자 | 파랑(Blue) |
| 판매 | 황금(Amber) |
| 컨설팅 | 산호(Coral) |
| 기타 | 회색(Gray) |

## 실행 방법

```bash
# 의존성 설치 (이미 완료)
npm install

# Expo Go 앱으로 실행 (QR 코드 스캔)
npm start

# 웹 브라우저에서 실행
npm run web

# Android 에뮬레이터
npm run android
```

## 기술 스택

- **React Native** + **Expo** (SDK 56)
- **Zustand** — 전역 상태 관리
- **AsyncStorage** — 로컬 데이터 영구 저장
- **React Navigation** — 탭 네비게이션
- **react-native-svg** — 커스텀 카테고리 차트
- **TypeScript** — 전체 타입 안전성

## 프로젝트 구조

```
src/
├── types/         # IncomeRecord, Category 타입 정의
├── store/         # Zustand 스토어 (CRUD + AsyncStorage)
├── utils/
│   ├── format.ts  # ₩ 포맷터, 날짜 유틸
│   └── categories.ts  # 카테고리 색상/아이콘/레이블
├── components/
│   ├── AddRecordModal.tsx  # 추가/수정 바텀시트
│   ├── RecordCard.tsx      # 기록 카드
│   ├── CategoryBadge.tsx   # 카테고리 배지
│   ├── CategoryChart.tsx   # 가로 막대 차트
│   └── SummaryCard.tsx     # 요약 카드
└── screens/
    ├── DashboardScreen.tsx  # 홈 화면
    └── RecordsScreen.tsx    # 전체 기록 화면
```
