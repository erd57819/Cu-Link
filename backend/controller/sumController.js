const axios = require('axios');

// 요약 생성 버튼 누르면 동작하는 함수
exports.createSumReport = async (req, res) => {
    const newsIds  = req.body;
    console.log('', newsIds );
    res.status(200).send({
        message: '요청성공',
        data: req.body  // FastAPI에서 전달받은 데이터 포함
    });
}