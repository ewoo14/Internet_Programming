<template>
  <div class="main-page">
    <!-- 사용자 정보, 마이페이지 및 로그아웃 링크 -->
    <div class="user-info">
      {{ userName }}님 | 
      <router-link to="/mypage">마이페이지</router-link> |
      <a href="#" @click="logout">로그아웃</a>
    </div>

    <!-- 메인 컨테이너 -->
    <div class="main-container">
      <!-- 날짜 선택 -->
      일자 : <input type="date" v-model="selectedDate" @change="fetchDiary">
      <hr>
      <!-- 일기장 표시 -->
      <div v-if="diaryContent" class="diary-content">
        <div v-html="formattedDiaryContent"></div>
        <br><br>
        <button @click="editDiary">수정</button>
      </div>
      <div v-else class="empty-diary">
        <textarea v-model="newDiaryContent" cols="50" rows="20"></textarea>
        <br>
        <button @click="saveDiary">저장</button>
      </div>
    </div>
  </div>
</template>
  
<script>
import axios from 'axios';

export default {
  data() {
    return {
      userName: '익명',
      selectedDate: new Date().toISOString().substr(0, 10),
      diaryContent: null,
      newDiaryContent: '',
    };
  },
  computed: {
    formattedDiaryContent() {
      return this.diaryContent.replace(/\n/g, '<br>'); // 개행 문자를 <br> 태그로 변환
    }
  },
  methods: {
    logout() {
      // 로컬 스토리지에서 사용자 ID 삭제
      localStorage.removeItem('userId');
      // 로그인 페이지로 리디렉션
      this.$router.push('/userlogin');
    },

    handleDateSelect(date) {
      console.log('Selected date:', date);
      this.$router.push({ name: 'WriteDiary', query: { date: date.toISOString() } });
    },

    editDiary() {
      // 수정 모드 활성화
      this.newDiaryContent = this.diaryContent;
      this.diaryContent = null;
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
    },

    fetchDiary() {
      // 날짜 변경 시 기존 일기 내용 초기화
      this.diaryContent = null;
      this.newDiaryContent = '';

      const userId = localStorage.getItem('userId');
      axios.get(`http://localhost:3000/diary/${this.selectedDate}`, {
        params: { userId }
      })
      .then(response => {
        // 해당 날짜의 일기 내용이 존재하는 경우
        this.diaryContent = response.data.content;
      })
      .catch(error => {
        if (error.response && error.response.status === 404) {
          // 해당 날짜에 일기가 없는 경우
          this.diaryContent = null;
        } else {
          console.error('Error fetching diary:', error);
        }
      });
    },

    saveDiary() {
      const userId = localStorage.getItem('userId');
      axios.post('http://localhost:3000/savediary', {
        user_id: userId,
        date: this.selectedDate,
        content: this.newDiaryContent
      })
      .then(() => {
        this.diaryContent = this.newDiaryContent;
        this.newDiaryContent = '';
        alert('일기가 저장되었습니다.');
      })
      .catch(error => {
        console.error('Error saving diary:', error);
      });
    }
  },
  created() {
      this.fetchUserName(); // 컴포넌트 생성 시 사용자 이름 조회
      this.fetchDiary(); // 컴포넌트 생성 시 일기장 조회
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

  .main-container input {
    margin-bottom: 5px;
  }
</style>