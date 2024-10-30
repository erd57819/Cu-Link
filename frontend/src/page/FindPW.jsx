import React, { useRef } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import '../css/Join.css';

const ResetPassword = () => {
  const id_ref = useRef();
  const question_ref = useRef();
  const answer_ref = useRef();
  const new_pw_ref = useRef();
  const navigate = useNavigate();

  const sendResetPassword = async (e) => {
    e.preventDefault();

    let resetData = {
      id: id_ref.current.value,
      question: question_ref.current.value,
      answer: answer_ref.current.value,
      newPassword: new_pw_ref.current.value,
    };

    try {
      let res = await axios.post('http://localhost:3000/auth/resetPW', resetData);
      console.log(res.data);

      if (res.data.result === "성공") {
        alert('비밀번호 재설정 성공');
        navigate('/login');
      } else {
        alert('비밀번호 재설정 실패');
      }
    } catch (error) {
      console.error('Error during password reset:', error);
      alert('서버와의 연결에 실패했습니다.');
    }
  };

  return (
    <div className='content-wrapper'>
      <div className='content'>
        <div className='login-container'>
          <h2 className='login-title'>비밀번호 재설정</h2>
          <form onSubmit={sendResetPassword} className='login-form'>
            <div className='input-container'>
              <input type='text' ref={id_ref} placeholder='아이디' className='login-input' />
            </div>
            <div className='input-container'>
              <input type='text' ref={question_ref} placeholder='비밀번호 재설정 질문' className='login-input' />
            </div>
            <div className='input-container'>
              <input type='text' ref={answer_ref} placeholder='비밀번호 재설정 답' className='login-input' />
            </div>
            <div className='input-container'>
              <input type='password' ref={new_pw_ref} placeholder='새로운 비밀번호' className='login-input' />
            </div>
            <div className='button-container'>
              <input type='submit' value='확인' className='login-button' />
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
