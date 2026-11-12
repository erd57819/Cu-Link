import { BACKEND_URL } from "../config/api";
import React, { useRef, useState } from 'react';
import axios from 'axios';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import '../css/Join.css';
import { useUserId } from '../config/auth';

const Join = () => {
  const userId = useUserId();

  const id_ref = useRef();
  const pw_ref = useRef();
  const pw_confirm_ref = useRef(); // 비밀번호 재확인 추가
  const question_ref = useRef();  // question 추가
  const answer_ref = useRef();    // answer 추가
  const navigate = useNavigate();
  const location = useLocation();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const sendJoin = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;

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

    if (Object.values(joinData).some(value => !value.trim())) { alert('모든 항목을 입력해 주세요.'); return; }
    setIsSubmitting(true);
    try {
      let res = await axios.post(`${BACKEND_URL}/auth/join`, joinData, { timeout: 90000 });
      console.log(res.data);

      if (res.data.result === "success") {
        alert('회원가입 성공');
        navigate('/login', { state: location.state, replace: true });
      } else {
        alert(res.data.message || '회원가입하지 못했습니다.');
      }
    } catch (error) {
      console.error('Error during join:', error);
      alert(error.response?.data?.message || '서버 응답을 받지 못했습니다. 다시 시도해 주세요.');
    } finally { setIsSubmitting(false); }
  };

  if (userId) return <main className="saved-reports-page">
    <h1>{userId}님, 로그인되어 있습니다</h1>
    <p>새 계정을 만들려면 상단에서 로그아웃해 주세요.</p>
    <Link to="/">기사 검색으로 돌아가기</Link>
  </main>;
  return (
    <div className='content-wrapper'>
      <div className='content'>
        <div className='login-container'>
          <h2 className='login-title'>회원가입</h2>
          <form onSubmit={sendJoin} className='login-form'>
            <div className='input-container'>
              <input type='text' ref={id_ref} required placeholder='아이디' className='login-input' />
            </div>
            <div className='input-container'>
              <input type='password' ref={pw_ref} required placeholder='비밀번호' className='login-input' />
            </div>
            <div className='input-container'>
              <input type='password' ref={pw_confirm_ref} required placeholder='비밀번호 확인' className='login-input' />
            </div>
            <div className='input-container'>
              <input type='text' ref={question_ref} required placeholder='비밀번호 재설정 질문' className='login-input' />
            </div>
            <div className='input-container'>
              <input type='text' ref={answer_ref} required placeholder='비밀번호 재설정 답' className='login-input' />
            </div>
            <div className='button-container'>
              <input type='submit' value={isSubmitting ? '가입 중...' : '회원가입'} disabled={isSubmitting} className='login-button' />
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Join;
