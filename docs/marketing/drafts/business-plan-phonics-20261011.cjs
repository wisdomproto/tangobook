// 제안서용 권별 구성. 제목은 읽기 쉬운 텍스트, 생성 이미지는 보조 요소.
module.exports = ({ img }) => {
  const books = require('../assets/investor-20261010/phonics-covers/sources.json').books;
  const series = [['ko', '탱고 한글 파닉스', 4], ['en', '탱고 영어 파닉스', 5]];
  return `<div class="td-phonics-library">${series.map(([lang, title, count]) => `
    <div class="td-phonics-shelf">
      <div class="td-phonics-shelf-heading"><h3>${title}</h3><span class="td-phonics-count">총 ${count}권</span></div>
      <div class="td-phonics-books">${books.filter(b => b.id.startsWith(lang)).map(b => `
        <figure>
          <figcaption><span>${b.volume}권</span><strong>${b.title}</strong></figcaption>
          ${img('../investor-20261010/phonics-covers/' + b.chapterImage, `${b.title} 과정의 문자 예시`)}
        </figure>`).join('')}
      </div>
    </div>`).join('')}</div>
    `;
};
