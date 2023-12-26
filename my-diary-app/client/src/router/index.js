import { createRouter, createWebHistory } from 'vue-router';
import UserLogin from '../components/UserLogin.vue';
import UserRegister from '../components/UserRegister.vue';
import MainPage from '../components/MainPage.vue';
import MyPage from '../components/MyPage.vue';
import WriteDiary from '../components/WriteDiary.vue';

// 라우터 정의
const routes = [
  {
    path: '/',
    name: 'Home',
    component: UserLogin // 기본 페이지로 설정
  },
  {
    path: '/userlogin',
    name: 'UserLogin',
    component: UserLogin
  },
  {
    path: '/userregister',
    name: 'UserRegister',
    component: UserRegister
  },
  {
    path: '/mainpage',
    name: 'MainPage',
    component: MainPage
  },
  {
    path: '/mypage',
    name: 'MyPage',
    component: MyPage
  },
  {
    path: '/writediary',
    name: 'WriteDiary',
    component: WriteDiary
  },
];

// 라우터 인스턴스 생성 및 내보내기
const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes
});

export default router;
