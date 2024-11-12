// src/components/Login.jsx
import React, { useRef } from 'react';
import axios from 'axios';
import { Link, useNavigate,useLocation } from 'react-router-dom';
import Swal from 'sweetalert2';
import '../css/Join.css'

const Login = () => {
  const id_Ref = useRef();
  const pw_Ref = useRef();
  const navigate = useNavigate();
  const location = useLocation();
  
  const handleLogin = async (e) => {
    e.preventDefault();
    const redirectTo = location.state?.from ||'/';

    let logMember = {
      id: id_Ref.current.value,
      pw: pw_Ref.current.value
    };

    try {
      let res = await axios.post('http://localhost:3000/auth/login', logMember,{withCredentials:true});

      if (res.data.result === 'success') {
        Swal.fire({
          title: '로그인 성공',
          text: `${logMember.id}님 환영합니다 o(〃＾▽＾〃)o`,
          icon: 'success'
        }).then(() => {
          sessionStorage.setItem('userId', res.data.user_id); // 세션에 userId 저장
          navigate(redirectTo); // 메인 페이지로 이동
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
        text: '서버와의 연결에 실패했습니다.',
        icon: 'error'
      });
    }
  };
    
  return (
    <div className='content-wrapper'>
      <div className='content'>
        <div className='login-container'>
          <h2 className='login-title'>로그인</h2>
          <form onSubmit={handleLogin} className='login-form'>
            <div className='input-container'>
              <input type='text' ref={id_Ref} placeholder='아이디' className='login-input' />
            </div>
            <div className='input-container'>
              <input type='password' ref={pw_Ref} placeholder='비밀번호' className='login-input' />
            </div>
            <div className='button-container'>
              <input type='submit' value='로그인' className='login-button' />
            </div>
          </form>
          <div className='login-links'>
            <p>
              <Link to={'/join'} className='link'>
                <span>Cu-Link이 처음이라면? </span>
                <span className='login-links_join'>회원가입</span>
              </Link>
            </p>
            <p>
              <Link to={'/resetPW'} className='link'>
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
