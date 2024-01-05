<template>
  <div class="my-container">
    <!-- 페이지 제목 -->
    <h1 class="my-title">My Page</h1>

    <!-- 사용자 이름 표시 -->
    <div class="user-name-section">
      {{ userName }} 님
    </div>

    <!-- 내 정보 -->
    <div class="user-info-section" @click="showUserInfo">
      내 정보 조회
    </div>

    <!-- 비밀번호 재설정 -->
    <div class="password-reset-section" @click="ResetPassword">
      비밀번호 재설정
    </div>
  </div>
</template>

<script>
import axios from 'axios';

export default {
  data() {
    return {
      userName: '익명',
    };
  },
  methods: {
    showUserInfo() {
      const userId = localStorage.getItem('userId');
      if (!userId) {
        alert("사용자 정보를 불러올 수 없습니다.");
        return;
      }
      axios.get(`http://localhost:3000/userinfo/${userId}`)
        .then(response => {
          const userInfo = response.data;
          alert(`귀하의 정보입니다.\n이메일: ${userInfo.email}\n이름: ${userInfo.name}\n전화번호: ${userInfo.phone}`);
        })
        .catch(error => {
          console.error('Error fetching user info:', error);
          alert('사용자 정보를 불러오는데 실패했습니다.');
        });
    },
    ResetPassword() {
      const userId = localStorage.getItem('userId');
      if (!userId) {
        alert("사용자 ID를 불러올 수 없습니다.");
        return;
      }
      this.$router.push({ path: '/reset-password', query: { userId } });
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
.my-container {
  width: 300px; /* 가로 길이 100px 증가 */
  height: 400px;
  margin: auto;
  padding: 20px;
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
  text-align: center;
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  display: flex;
  justify-content: center;
  align-items: center;
  flex-direction: column;
}

.my-title {
  font-size: 3rem;
  margin-bottom: 20px;
}

.user-name-section, .user-info-section, .password-reset-section {
  width: 100%;
  border-bottom: 1px solid #ddd;
  padding: 30px 0;
  cursor: pointer;
  font-size: 30px;
}

.password-reset-section {
  border-bottom: none;
}
</style>