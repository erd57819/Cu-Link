import React, { useState } from 'react';
import { BACKEND_URL } from '../config/api';
import { askForLogin, setCurrentUser, useUserId } from '../config/auth';
import '../css/Baner.css';
import { Link, useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
const logo = `${process.env.PUBLIC_URL}/images/cu-link-logo-v2.png`;

function Baner() {
  const navigate = useNavigate();
  const userId = useUserId();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = () => {
    if (isLoggingOut) return;
    Swal.fire({
      title: '로그아웃하시겠습니까?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: '로그아웃',
      cancelButtonText: '취소'
    }).then(async (result) => {
      if (result.isConfirmed) {
        setIsLoggingOut(true);
        try {
          const response = await fetch(`${BACKEND_URL}/auth/logout`, {
            method: 'POST', credentials: 'include', signal: AbortSignal.timeout(90000),
          });
          if (!response.ok) throw new Error('logout failed');
          setCurrentUser(null, true);
          navigate('/', { replace: true });
          Swal.fire('로그아웃 되었습니다', '', 'success');
        } catch {
          Swal.fire('로그아웃 실패', '서버 응답을 받지 못했습니다. 다시 시도해 주세요.', 'error');
        } finally { setIsLoggingOut(false); }
      }
      // No를 클릭하면 아무 작업도 하지 않음
    });
  };
  const handleMynews = () => {
    if (!userId) {
      askForLogin(navigate, '/news');
    } else {
      navigate('/news'); // 로그인되어 있으면 '내 기사' 페이지로 이동
    }
  };

  return (
    <header className='banner'>
      <div className='left-item'>
        <Link to='/' className='brand-home' aria-label='Cu-Link 홈'>
          <img src={logo} alt='Cu-Link' width='174' height='58' />
        </Link>
      </div>
      <nav className='mid-item' aria-label='주요 메뉴'>
        <Link to='/intro' className='link'>사용법</Link>
        <span aria-hidden='true'>|</span>
        <button type='button' className='nav-button' onClick={handleMynews}>내 기사</button>
        <span aria-hidden='true'>|</span>
        <Link to='/reports' className='link reports-nav-link'>내 레포트</Link>
      </nav>
      <div className='right-item'>
        {userId ? (
          // 로그인 상태라면 로그아웃을 보여줌
          <><span className="signed-in-user" title={userId}>{userId}님</span>
          <button type="button" className="nav-button" onClick={handleLogout} disabled={isLoggingOut}>
            {isLoggingOut ? '로그아웃 중...' : '로그아웃'}
          </button></>
        ) : (
          // 로그인 상태가 아니라면 로그인/회원가입을 보여줌
          <div>
            <span><Link to={'/login'} className='link'>로그인 </Link></span>
            <span>&nbsp;&nbsp;&nbsp;|&nbsp;&nbsp;&nbsp;</span>
            <span><Link to={'/join'} className='link'> 회원가입</Link></span>
          </div>
        )}
      </div>
    </header>
  );
}

export default Baner;
