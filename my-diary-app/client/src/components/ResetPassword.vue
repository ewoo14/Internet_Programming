<template>
    <div class="reset-password-container">
      <h1 class="reset-password-header">비밀번호 재설정</h1>
      <div class="inputs-container">
        <div>
          <input type="password" placeholder="새 비밀번호" class="input-field" v-model="newPassword" @input="validateNewPassword" :class="{ 'is-invalid': !isNewPasswordValid, 'is-valid': isNewPasswordValid }" />
          <p v-if="!isNewPasswordValid" class="warning-text">비밀번호를 입력해주세요.</p>
        </div>
        <div>
          <input type="password" placeholder="새 비밀번호 확인" class="input-field" v-model="confirmPassword" @input="validateConfirmPassword" :class="{ 'is-invalid': !isConfirmPasswordValid, 'is-valid': isConfirmPasswordValid }" />
          <p v-if="!isConfirmPasswordValid" class="warning-text">같은 비밀번호를 입력해주세요.</p>
        </div>
        <button class="reset-password-btn" @click="updatePassword" :disabled="!isFormValid">재설정</button>
      </div>
    </div>
</template>
  
<script>
  import axios from 'axios';

  export default {
    data() {
      return {
        newPassword: '',
        confirmPassword: '',
        isNewPasswordValid: false,
        isConfirmPasswordValid: false,
        userId: this.$route.query.userId
      };
    },
    computed: {
      isFormValid() {
        return this.isNewPasswordValid && this.isConfirmPasswordValid;
      }
    },
    methods: {
      validateNewPassword() {
        this.isNewPasswordValid = this.newPassword.length > 0;
      },
      validateConfirmPassword() {
        this.isConfirmPasswordValid = this.newPassword === this.confirmPassword;
      },
      updatePassword() {
        if (!this.isNewPasswordValid || !this.isConfirmPasswordValid) {
            alert("비밀번호 유효성 검사를 통과하지 못했습니다.");
            return;
        }
        axios.post('http://localhost:3000/updatePassword', {
            userId: this.userId,
            newPassword: this.newPassword
        })
        .then(() => {
            alert("비밀번호가 성공적으로 변경되었습니다.");
            this.$router.push('/userlogin');
        })
        .catch(error => {
            console.error('비밀번호 변경 오류:', error);
            alert('비밀번호 변경 중 오류가 발생했습니다.');
        });
      }
    }
  };
</script>
  
<style scoped>
  .reset-password-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 20px;
    border-radius: 10px;
    box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
    width: 400px;
    margin: auto;
  }
  
  .reset-password-header {
    font-size: 1.5rem;
    color: #333;
    margin-bottom: 20px;
  }
  
  .inputs-container {
    width: 100%;
  }
  
  .input-field {
    width: 250px;
    padding: 10px;
    margin-bottom: 10px;
    border: 1px solid #ddd;
    border-radius: 4px;
  }
  
  button {
    width: 100%;
    padding: 10px;
    background-color: #007bff;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
  }
  
  button:disabled {
    background-color: #ccc;
    cursor: not-allowed;
  }
  
  .input-field.is-valid {
    border: 1px solid green;
  }
  
  .input-field.is-invalid {
    border: 1px solid red;
  }
  
  .warning-text {
    color: red;
    font-size: 0.8rem;
    margin-top: -5px;
  }
</style>  