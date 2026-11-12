import { BACKEND_URL } from "../config/api";
// src/components/Login.jsx
import React, { useEffect, useRef, useState } from 'react';
import axios from 'axios';
import { Link, useNavigate,useLocation } from 'react-router-dom';
import Swal from 'sweetalert2';
import '../css/Join.css'
import { safeReturnPath, setCurrentUser, refreshSession, useUserId } from '../config/auth';

const Login = () => {
  const userId = useUserId();
  const id_Ref = useRef();
  const pw_Ref = useRef();
  const navigate = useNavigate();
  const location = useLocation();
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [isWaiting, setIsWaiting] = useState(false);

  useEffect(() => {
    if (!isLoggingIn) {
      setIsWaiting(false);
      return;
    }
    const timer = setTimeout(() => setIsWaiting(true), 8000);
    return () => clearTimeout(timer);
  }, [isLoggingIn]);
  
  const handleLogin = async (e) => {
    e.preventDefault();
    if (isLoggingIn) return;
    const redirectTo = safeReturnPath(location.state?.from);

    let logMember = {
      id: id_Ref.current.value.trim(),
      pw: pw_Ref.current.value
    };

    if (!logMember.id || !logMember.pw.trim()) {
      Swal.fire({ title: '입력 내용을 확인해 주세요', text: '아이디와 비밀번호를 입력해 주세요.', icon: 'info' });
      return;
    }
    setIsLoggingIn(true);
    try {
      let res = await axios.post(`${BACKEND_URL}/auth/login`, logMember, { withCredentials: true, timeout: 90000 });


      if (res.data.result === 'success') {
        const verifiedUser = await refreshSession();
        if (!verifiedUser) throw new Error('로그인 쿠키가 저장되지 않았습니다. 브라우저의 쿠키 설정을 확인해 주세요.');
        setCurrentUser(verifiedUser);
        Swal.fire({
          title: '로그인 성공',
          text: `${logMember.id}님 환영합니다 o(〃＾▽＾〃)o`,
          icon: 'success'
        }).then(() => {
          navigate(redirectTo, { replace: true }); // 메인 페이지로 이동
        });
      } else {
        Swal.fire({
          title: '로그인 실패',
          text: res.data.message || '아이디 또는 비밀번호가 잘못되었습니다.',
          icon: 'error'
        });
      }
    } catch (error) {
      console.error('로그인 중 오류 발생:', error);
      Swal.fire({
        title: '서버 오류',
        text: error.response?.data?.message || error.message || '서버와의 연결에 실패했습니다.',
        icon: 'error'
      });
    } finally {
      setIsLoggingIn(false);
    }
  };
    
  if (userId) return <main className="saved-reports-page">
    <h1>{userId}님, 로그인되어 있습니다</h1>
    <p>다른 계정을 사용하려면 상단에서 로그아웃해 주세요.</p>
    <button onClick={() => navigate(safeReturnPath(location.state?.from), { replace: true })}>이전 화면으로 돌아가기</button>
    <Link to="/reports">내 레포트 보기</Link>
  </main>;
  return (
    <div className='content-wrapper'>
      <div className='content'>
        <div className='login-container'>
          <h2 className='login-title'>로그인</h2>
          <p className='auth-flow-hint'>로그인하면 기사와 레포트를 저장하고 다시 볼 수 있습니다.</p>
          {location.state?.from && <p className='auth-flow-hint'>로그인 후 이전 화면으로 돌아갑니다.</p>}
          <form onSubmit={handleLogin} className='login-form' aria-busy={isLoggingIn}>
            <div className='input-container'>
              <input type='text' ref={id_Ref} required autoComplete='username' placeholder='아이디' className='login-input' />
            </div>
            <div className='input-container'>
              <input type='password' ref={pw_Ref} required autoComplete='current-password' placeholder='비밀번호' className='login-input' />
            </div>
            <div className='button-container'>
              <input type='submit' value={isLoggingIn ? '로그인 중...' : '로그인'} disabled={isLoggingIn} className='login-button' />
            </div>
            {isLoggingIn && <p role="status">{isWaiting
              ? '서버 응답을 기다리는 중입니다. 무료 서버의 첫 접속은 약 1분 걸릴 수 있습니다.'
              : '로그인 정보를 확인하고 있습니다.'}</p>}
          </form>
          <div className='login-links'>
            <p>
              <Link to={'/join'} state={location.state} className='link'>
                <span>Cu-Link이 처음이라면? </span>
                <span className='login-links_join'>회원가입</span>
              </Link>
            </p>
            <p>
              <Link to={'/resetPW'} state={location.state} className='link'>
                <span>비밀번호가 기억나지 않아요 </span>
                <span className='login-links_findpw'>비밀번호찾기</span>
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
