const axios = require('axios');

// 레포트 생성 버튼 누르면 동작하는 함수
exports.createArticleReport = async (req, res) => {
    const newsIds  = req.body;
    console.log('', newsIds );
    res.status(200).send({
        message: '자알~ 받았습니다~',
        data: req.body  // FastAPI에서 전달받은 데이터 포함
    });
    // 전달 된 값만 확인

    // 아래 코드는 fastapi로 id값 전달하는 코드 - 아직 수정 전 _ 아인
    // try{
    //     const response = await axios.post('http://localhost:8000/api/fetchNews', { ids: newsIds });
    //     res.json(response.data)        
    // }catch(error){
    //     console.error('Fast API 에러', error);
    //     req.status(500).send('Fast API 에러');
    // }
}