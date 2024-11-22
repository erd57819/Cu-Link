import React, { useRef } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import '../css/Join.css';

const Join = () => {

  const id_ref = useRef();
  const pw_ref = useRef();
  const pw_confirm_ref = useRef(); // 비밀번호 재확인 추가
  const question_ref = useRef();  // question 추가
  const answer_ref = useRef();    // answer 추가
  const navigate = useNavigate();

  const sendJoin = async (e) => {
    e.preventDefault();

    if (pw_ref.current.value !== pw_confirm_ref.current.value) {
      alert('비밀번호가 일치하지 않습니다.');
      return;
    }

    let joinData = {
      id: id_ref.current.value,
      pw: pw_ref.current.value,
      question: question_ref.current.value, // question 추가
      answer: answer_ref.current.value      // answer 추가
    };

    try {
      let res = await axios.post('http://culink.site/auth/join', joinData);
      console.log(res.data);

      if (res.data.result === "success") {
        alert('회원가입 성공');
        navigate("/main");
      } else {
        alert('회원가입 실패');
      }
    } catch (error) {
      console.error('Error during join:', error);
      alert('서버와의 연결에 실패했습니다.');
    }
  };

  return (
    <div className='content-wrapper'>
      <div className='content'>
        <div className='login-container'>
          <h2 className='login-title'>회원가입</h2>
          <form onSubmit={sendJoin} className='login-form'>
            <div className='input-container'>
              <input type='text' ref={id_ref} placeholder='아이디' className='login-input' />
            </div>
            <div className='input-container'>
              <input type='password' ref={pw_ref} placeholder='비밀번호' className='login-input' />
            </div>
            <div className='input-container'>
              <input type='password' ref={pw_confirm_ref} placeholder='비밀번호 확인' className='login-input' />
            </div>
            <div className='input-container'>
              <input type='text' ref={question_ref} placeholder='비밀번호 재설정 질문' className='login-input' />
            </div>
            <div className='input-container'>
              <input type='text' ref={answer_ref} placeholder='비밀번호 재설정 답' className='login-input' />
            </div>
            <div className='button-container'>
              <input type='submit' value='회원가입' className='login-button' />
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Join;
