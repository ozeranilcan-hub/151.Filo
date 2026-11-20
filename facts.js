const AVIATION_FACTS = [
    { cat: 'IFR / HOLDING', text: 'Standart holding paterninde dönüşler sağa yapılır ve düz outbound bacağı genellikle 1800 ft ve altında 1 dakika, 1800 ft üzerinde ise 1.5 dakika tutulur.' },
    { cat: 'NAVIGATION', text: '60 Kuralı'na (1-in-60 Rule) göre 60 NM mesafede 1 NM'lik sapma yaklaşık 1° hataya karşılık gelir; hatayı düzeltmek için sapma açısının iki katı kadar düzeltme yapmak gerekir.' },
    { cat: 'METEOROLOGY', text: 'ISA (International Standard Atmosphere) deniz seviyesinde 15°C sıcaklık ve 1013.25 hPa (29.92 inHg) basınç kabul eder; her 1000 ft irtifada sıcaklık yaklaşık 2°C düşer.' },
    { cat: 'PERFORMANCE', text: 'Süzülüş (glide) sırasında rüzgar kafa rüzgarı (headwind) ise belirli bir irtifadan kat edilebilecek yer mesafesi azalır; kuyruk rüzgarında (tailwind) ise artar.' },
    { cat: 'INSTRUMENTS', text: 'HSI (Horizontal Situation Indicator) üzerinde lubber line her zaman uçağın anlık burun başını (HDG) gösterir; pusula gülü döndükçe sabit indeksler uçağa göre bağıl yönü verir.' },
    { cat: 'AIRSPACE', text: 'VFR uçuşlarda Manyetik Baş 000°–179° arasındayken tek binlik irtifalar (ör. 3500 ft, 5500 ft), 180°–359° arasındayken çift binlik irtifalar (ör. 4500 ft, 6500 ft) kullanılır.' },
    { cat: 'AERODYNAMICS', text: 'Kanat yüklemesi (wing loading) arttığında stall hızı yükselir; dönüşlerde bank açısı arttıkça load factor artacağı için stall hızı da normal düz uçuşa göre yükselir.' },
    { cat: 'RADIO / PHRASEOLOGY', text: 'Havacılık telsiz haberleşmesinde sayıların her hanesi tek tek okunur (örneğin 120 "one-two-zero"); binlik irtifalarda ise "thousand" ifadesi kullanılır (örneğin 4500 ft → "four thousand five hundred").' }
];

let lastFactIndex = -1;
function renderRandomAviationFact() {
    const textEl = document.getElementById('aviationFactText');
    const catEl = document.getElementById('aviationFactCategory');
    if (!textEl || !catEl || AVIATION_FACTS.length === 0) return;
    let idx = Math.floor(Math.random() * AVIATION_FACTS.length);
    if (AVIATION_FACTS.length > 1 && idx === lastFactIndex) idx = (idx + 1) % AVIATION_FACTS.length;
    lastFactIndex = idx;
    catEl.textContent = AVIATION_FACTS[idx].cat;
    textEl.textContent = AVIATION_FACTS[idx].text;
}
