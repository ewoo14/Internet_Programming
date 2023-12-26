<template>
  <div class="login-container">
    <div class="login-box">
      <div class="inputs-container">
        <div class="fields-container">
          <input type="email" placeholder="이메일" class="input-field" v-model="email" />
          <input type="password" placeholder="비밀번호" class="input-field" v-model="password" />
        </div>
        <button class="login-btn" @click="login">로그인</button>
      </div>
      <div class="links">
        <a href="/userregister">회원가입</a> |
        <a href="/forgot-password">아이디/비밀번호 찾기</a>
      </div>
    </div>
  </div>
</template>

<script>
  import axios from 'axios';
  import router from '../router'; // 라우터 인스턴스

  export default {
    data() {
        return {
        email: '',
        password: '',
        errorMessage: '' // 로그인 실패 시 에러 메시지를 저장할 변수
        };
    },
    methods: {
      login() {
      const userData = {
        email: this.email,
        password: this.password
      };
      
      axios.post('http://localhost:3000/userlogin', userData)
        .then(response => {
          // 로그인 성공
          console.log('로그인 성공:', response.data);
          localStorage.setItem('userId', response.data.userId);
          router.push('/mainpage');
        })
        .catch(error => {
          // 로그인 실패
          console.error('로그인 실패:', error.response);
          this.errorMessage = error.response.data.message || "로그인에 실패했습니다.";
        });
      }
    }
  };
</script>
  
<style scoped>
.login-container {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
}

.login-box {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  padding: 20px;
  border: 1px solid #000;
}

.inputs-container {
  display: flex;
  justify-content: space-between; /* 필드와 버튼 사이에 공간을 만듭니다 */
}

.fields-container {
  display: flex;
  flex-direction: column; /* 필드들을 수직으로 정렬합니다 */
}

.input-field {
  margin-bottom: 10px; /* 입력 필드 사이의 간격 */
  width: 150px; /* 입력 필드의 너비를 조정합니다 */
}

.login-btn {
  height: 52px; /* 로그인 버튼의 높이를 조정합니다 */
  width: 52px; /* 로그인 버튼의 너비를 조정합니다 */
  margin-left: 20px;
  background-color: blue;
  color: white;
  cursor: pointer;
}

.links {
  text-align: center;
  width: 100%; /* 링크 부분 너비 */
}
</style>
