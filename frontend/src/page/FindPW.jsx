import { BACKEND_URL } from "../config/api";
import React, { useRef, useState } from 'react';
import axios from 'axios';
import { useNavigate, useLocation } from 'react-router-dom';
import '../css/Join.css';

const ResetPassword = () => {
  const id_ref = useRef();
  const question_ref = useRef();
  const answer_ref = useRef();
  const new_pw_ref = useRef();
  const navigate = useNavigate();
  const location = useLocation();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const sendResetPassword = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;

    let resetData = {
      id: id_ref.current.value,
      question: question_ref.current.value,
      answer: answer_ref.current.value,
      newPassword: new_pw_ref.current.value,
    };

    if (Object.values(resetData).some(value => !value.trim())) { alert('모든 항목을 입력해 주세요.'); return; }
    setIsSubmitting(true);
    try {
      let res = await axios.post(`${BACKEND_URL}/auth/resetPW`, resetData, { timeout: 90000 });
      console.log(res.data);

      if (res.data.result === "성공") {
        alert('비밀번호 재설정 성공');
        navigate('/login', { state: location.state, replace: true });
      } else {
        alert(res.data.message || '입력한 정보가 일치하지 않습니다.');
      }
    } catch (error) {
      console.error('Error during password reset:', error);
      alert(error.response?.data?.message || '서버 응답을 받지 못했습니다. 다시 시도해 주세요.');
    } finally { setIsSubmitting(false); }
  };

  return (
    <div className='content-wrapper'>
      <div className='content'>
        <div className='login-container'>
          <h2 className='login-title'>비밀번호 재설정</h2>
          <form onSubmit={sendResetPassword} className='login-form'>
            <div className='input-container'>
              <input type='text' ref={id_ref} required placeholder='아이디' className='login-input' />
            </div>
            <div className='input-container'>
              <input type='text' ref={question_ref} required placeholder='비밀번호 재설정 질문' className='login-input' />
            </div>
            <div className='input-container'>
              <input type='text' ref={answer_ref} required placeholder='비밀번호 재설정 답' className='login-input' />
            </div>
            <div className='input-container'>
              <input type='password' ref={new_pw_ref} required placeholder='새로운 비밀번호' className='login-input' />
            </div>
            <div className='button-container'>
              <input type='submit' value={isSubmitting ? '변경 중...' : '확인'} disabled={isSubmitting} className='login-button' />
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
