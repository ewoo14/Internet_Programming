<template>
    <div class="diary-container">
      <!-- 지정 날짜 표시 -->
      <div class="date-display">
        지정 날짜: {{ selectedDate }}
      </div>
  
      <!-- 일기 작성 또는 표시 -->
      <div v-if="!diaryContent">
        <!-- 일기가 없을 때 -->
        <button @click="showTextField">작성</button>
      </div>
      <div v-else>
        <!-- 일기가 있을 때 -->
        {{ diaryContent }}
        <button @click="editDiary">수정</button>
      </div>
  
      <!-- 텍스트 필드와 저장 버튼 -->
      <div v-if="isEditing">
        <textarea v-model="diaryInput"></textarea>
        <button @click="saveDiary" :disabled="diaryInput.trim() === ''">저장</button>
      </div>
    </div>
</template>

<script>
    import axios from 'axios';

    export default {
        data() {
            return {
            selectedDate: '', // 앞서 선택한 날짜
            diaryContent: '', // 데이터베이스에서 불러온 일기 내용
            isEditing: false, // 텍스트 필드와 저장 버튼 표시 여부
            diaryInput: '', // 텍스트 필드 입력 내용
            };
        },
        methods: {
            showTextField() {
            this.isEditing = true;
            this.diaryInput = '';
            },
            editDiary() {
            this.isEditing = true;
            this.diaryInput = this.diaryContent;
            },
            async saveDiary() {
                try {
                    await axios.post('http://localhost:3000/savediary', {
                        user_id: this.userId, // 현재 로그인한 사용자의 ID
                        date: this.selectedDate,
                        content: this.diaryInput
                });
                alert('일기가 저장되었습니다.');
                this.isEditing = false;
                } catch (error) {
                console.error('일기 저장 실패:', error);
                alert('일기 저장에 실패했습니다.');
                }
            },
        },
    };
</script>

<style>
    .diary-container {
        max-width: 700px;
        margin: auto;
        padding: 20px;
        box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
    }

    .date-display {
        text-align: center;
        margin-bottom: 20px;
    }

    textarea {
        width: 100%;
        height: 150px;
    }
</style>
