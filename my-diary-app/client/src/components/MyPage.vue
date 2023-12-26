<template>
    <div class="my-container">
      <!-- 상단: 사용자 이름 -->
      <div class="user-name-section">
        {{ userName }}
      </div>
  
      <!-- 중단: 내 정보 -->
      <div class="user-info-section" @click="showUserInfo">
        내 정보
      </div>
  
      <!-- 하단: 비밀번호 재설정 -->
      <div class="password-reset-section" @click="goToSetPassword">
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
        // 내 정보 표시 로직 (팝업 등)
      },
      goToSetPassword() {
        this.$router.push('/setpassword');
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
    max-width: 300px;
    margin: auto;
    padding: 20px;
    box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
  }
  
  .user-name-section, .user-info-section, .password-reset-section {
    border-bottom: 1px solid #ddd;
    padding: 10px;
    text-align: center;
    cursor: pointer;
  }
  
  /* 마지막 섹션의 하단 경계선 제거 */
  .password-reset-section {
    border-bottom: none;
  }
  </style>
  