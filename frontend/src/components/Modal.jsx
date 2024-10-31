import React, { useState, useRef, useEffect, useCallback } from 'react';
import '../css/Modal.css';

function Modal({ summaryData, onClose }) {
  const modalRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [offset, setOffset] = useState({ x: 0, y: 0 });

  // 드래그 중 위치 이동 처리
  const handleMouseMove = useCallback((e) => {
    if (!isDragging) return;
    const modal = modalRef.current;
    const newLeft = e.clientX - offset.x;
    const newTop = e.clientY - offset.y;

    const maxLeft = window.innerWidth - modal.offsetWidth;
    const maxTop = window.innerHeight - modal.offsetHeight;
    const clampedLeft = Math.max(0, Math.min(newLeft, maxLeft));
    const clampedTop = Math.max(0, Math.min(newTop, maxTop));

    modal.style.left = `${clampedLeft}px`;
    modal.style.top = `${clampedTop}px`;
  }, [isDragging, offset]);

  // 드래그 종료
  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  // 드래그 이벤트 리스너 등록 및 해제
  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    } else {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    }
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, handleMouseMove, handleMouseUp]);

  // 모달이 화면 중앙에 위치하도록 설정
  useEffect(() => {
    if (modalRef.current) {
      const modal = modalRef.current;
      const left = (window.innerWidth - modal.offsetWidth) / 2;
      const top = (window.innerHeight - modal.offsetHeight) / 2;
      modal.style.left = `${left}px`;
      modal.style.top = `${top}px`;
    }
  }, []);

  return (
    <div className='modal-overlay' onClick={onClose}>
      <div
        ref={modalRef}
        className='modal-content'
        onClick={(e) => e.stopPropagation()}
        onMouseDown={(e) => {
          setIsDragging(true);
          const rect = modalRef.current.getBoundingClientRect();
          setOffset({ x: e.clientX - rect.left, y: e.clientY - rect.top });
        }}
      >
        <div className='modal-header'>
          <span>요약 결과</span>
          <button className='close-button' onClick={onClose}>&times;</button>
        </div>
        <div className='modal-body'>
          {summaryData && summaryData.length > 0 ? (
            summaryData.map((item, index) => (
              <p key={index}>{item}</p>  // 리스트 형태로 요약 결과를 표시
            ))
          ) : (
            <p>요약 데이터를 불러오는 중입니다...</p>
          )}
        </div>
      </div>
    </div>
  );
}

export default Modal;
