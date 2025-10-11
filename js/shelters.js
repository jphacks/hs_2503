// 避難所データ
const shelters = [
    { name: "中央公園避難所", lat: 34.385, lng: 132.455, address: "広島市中区中央公園" },
    { name: "南区体育館避難所", lat: 34.37, lng: 132.46, address: "広島市南区" }
];

// カード生成
function createShelterCards(onClickCallback) {
  const listDiv = document.getElementById("shelter-list");
  shelters.forEach(shelter => {
    const card = document.createElement('div');
    card.className = 'shelter-card';
    card.innerHTML = `<strong>${shelter.name}</strong><br>${shelter.address}`;
    card.onclick = () => onClickCallback(shelter);
    listDiv.appendChild(card);
  });
}
