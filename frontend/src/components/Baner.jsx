import React from 'react';
import '../css/Baner.css';
import { Link, useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';

function Baner() {
  const navigate = useNavigate();
  const userId = sessionStorage.getItem('userId'); // 세션에서 userId 가져오기

  const handleLogout = () => {
    Swal.fire({
      title: '로그아웃하시겠습니까?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes',
      cancelButtonText: 'No'
    }).then((result) => {
      if (result.isConfirmed) {
        // Yes를 클릭하면 로그아웃 수행
        sessionStorage.removeItem('userId'); // 세션에서 userId 삭제
        Swal.fire('로그아웃 되었습니다', '', 'success').then(() => {
          navigate('/'); // 로그아웃 후 메인 페이지로 이동
        });
      }
      // No를 클릭하면 아무 작업도 하지 않음
    });
  };

  return (
    <div className='banner'>
      <div className='left-item'>
        <h2><Link to={'/'} className='link'>Cu-Link</Link></h2>
        <h5>레포트가 쉬워지다</h5>
      </div>
      <div className='mid-item'>
        <span><Link to={'/intro'} className='link'>사용법</Link></span>
        <span>|</span>
        <span><Link to={'/news'} className='link'>내 기사</Link></span>
      </div>
      <div className='right-item'>
        {userId ? (
          // 로그인 상태라면 로그아웃을 보여줌
          <span onClick={handleLogout} style={{ cursor: 'pointer' }}>로그아웃</span>
        ) : (
          // 로그인 상태가 아니라면 로그인/회원가입을 보여줌
          <div>
            <span><Link to={'/login'} className='link'>로그인 </Link></span>
            <span>&nbsp;&nbsp;&nbsp;|&nbsp;&nbsp;&nbsp;</span>
            <span><Link to={'/join'} className='link'> 회원가입</Link></span>
          </div>
        )}
      </div>
    </div>
  );
}

export default Baner;
