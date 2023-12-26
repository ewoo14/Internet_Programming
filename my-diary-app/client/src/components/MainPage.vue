<template>
    <div class="main-page">
      <!-- 사용자 정보와 마이페이지 링크 -->
      <div class="user-info">
        {{ userName }}님
        <router-link to="/mypage">마이페이지</router-link>
      </div>
  
      <!-- 메인 컨테이너 -->
      <div class="main-container">
        <!-- 달력 컴포넌트 -->
        <v-calendar @dayclick="handleDateSelect"></v-calendar>
      </div>
    </div>
</template>
  
<script>
  import VCalendar from 'v-calendar';
  import axios from 'axios';
  
  export default {
    data() {
      return {
        userName: '익명',
      };
    },
    components: {
      VCalendar
    },
    methods: {
      handleDateSelect(date) {
        console.log('Selected date:', date);
        this.$router.push({ name: 'WriteDiary', query: { date: date.toISOString() } });
      },
      fetchUserName() {
        axios.get('http://localhost:3000/username', {
            params: {
            userId: localStorage.getItem('userId') // 사용자 ID 가져오기
            }
        })
        .then(response => {
            this.userName = response.data.name; // 사용자 이름 설정
        })
        .catch(error => {
            console.error('Error fetching user name:', error);
        });
      }
    },
    created() {
        this.fetchUserName(); // 컴포넌트 생성 시 사용자 이름 조회
    }
  };
</script>
  
<style>
  .main-page {
    padding: 20px;
    max-width: 800px;
    margin: auto;
  }

  .user-info {
    text-align: right;
    font-size: 1.2em;
    margin-bottom: 20px;
  }
  
  .main-container {
    max-width: 500px;
    margin: auto;
    padding: 20px;
    box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
  }
</style>