// =====================================================================
//  사이트 내용은 전부 이 파일에서 수정합니다.
//  - 항목을 추가하려면 아래 "복사용 예시"를 복사해 해당 목록 [ ] 안에 붙여넣고 값만 바꾸세요.
//  - 각 항목 { } 사이에는 쉼표(,)가 있어야 합니다.
//  - 글자는 작은따옴표 '...' 안에 씁니다. 글 안에 ' 를 쓰려면 \' 로 씁니다.
//  - 비워둘 칸은 '' 로 두면 화면에 표시되지 않습니다.
//  - 사진은 images 폴더에 올리고 './images/파일이름.png' 처럼 적습니다.
// =====================================================================

window.siteContent = {

  // 프로젝트 필터 버튼. 왼쪽은 내부 이름(영어), 오른쪽은 화면에 보이는 이름입니다.
  categories: {
    productivity: '생산성',
    daily: '일상'
  },

  // ---------------------------------------------------------------
  //  01 / PERSONAL PROJECTS
  // ---------------------------------------------------------------
  /* 복사용 예시
    {
      title: '프로젝트 이름',
      subtitle: 'ENGLISH NAME',           // 카드 상단 창 제목 (영어 대문자 추천)
      description: '한두 문장 소개',
      category: 'daily',                  // 위 categories 의 내부 이름 중 하나
      tag: '일상 · 습관',                   // 카드에 보이는 작은 태그
      image: './images/screenshot.png',   // 스크린샷 (없으면 '')
      url: 'https://...',                 // 배포 주소 (없으면 '' → "배포 링크 준비 중")
      github: 'https://github.com/...',   // 소스 코드 저장소 (없으면 '')
      stack: 'HTML, CSS, JavaScript',     // 상세 보기에 표시 (없으면 '')
      role: '기획 · 디자인 · 개발',            // 상세 보기에 표시 (없으면 '')
      notes: '구현하면서 배운 점 등'           // 상세 보기에 표시 (없으면 '')
    },
  */
  projects: [
    {
      title: '습관 트래커',
      subtitle: 'HABIT TRACKER',
      description: '30일동안 구슬을 모아 원하는 습관/목적에 달성합니다.',
      category: 'daily',
      tag: '일상 · 습관',
      image: './weekly_planner.png',
      url: 'https://modoriin79.github.io/modoriin_habits_maker/',
      github: '',
      stack: '',
      role: '',
      notes: ''
    },
    {
      title: '주간 일정표',
      subtitle: 'WEEKLY PLANNER',
      description: '복잡한 한 주를 한눈에. 해야 할 일과 소중한 시간을 차분하게 정리합니다.',
      category: 'productivity',
      tag: '생산성 · 일정',
      image: './planner.png',
      url: 'https://modoriin79.github.io/my_weekly_planner/',
      github: '',
      stack: '',
      role: '',
      notes: ''
    }
  ],

  // ---------------------------------------------------------------
  //  02 / AWARDS   (최신 수상이 위에 오도록 맨 앞에 추가하세요)
  // ---------------------------------------------------------------
  /* 복사용 예시
    {
      date: '2026.11',
      title: '대회 이름',
      prize: '최우수상',
      project: '출품한 프로젝트 이름',
      role: '담당 역할',
      note: '결과물, 배운 점 등',
      link: 'https://...'                 // 관련 링크 (없으면 '')
    },
  */
  awards: [
    {
      date: '2026.08',
      title: '제2회 IoT 개발자 챌린지',
      prize: '우수상',
      project: 'oneM2M을 사용한 거북목 자동탐지 스마트책상',
      note: '',
      link: ''                 // 관련 링크 (없으면 '')
    }
  ],

  // ---------------------------------------------------------------
  //  03 / STUDIES   (폴더 하나 = 주제 하나, notes 에 학습 기록을 추가)
  // ---------------------------------------------------------------
  /* 학습 기록(notes) 복사용 예시
        {
          date: '2026.11.06',
          title: '기록 제목',
          summary: '한 줄 요약',
          link: 'https://...'             // 노션, 블로그, PDF 등 (없으면 '')
        },
  */
  studies: [
    {
      title: 'Intelligent Information Convergence',
      description: '융합 기술 관련 학습 노트',
      notes: [
      ]
    },
    {
      title: 'Wireless Communication',
      description: '무선 통신 관련 학습 노트',
      notes: [
      ]
    },
    {
      title: 'Robotics',
      description: '로보틱스 관련 학습 노트',
      notes: [
      ]
    },
    {
      title: 'Embedded Systems',
      description: '임베디드 시스템 관련 학습 노트',
      notes: [
      ]
    }
  ]
};
