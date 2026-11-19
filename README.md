# AG Robotik — 3D İnteraktif Web Deneyimi (`www.alkevtech.com`)

ALKEV Özel Okulları **AG Robotik (#24230 & #28743 — FTC & FRC)** için Three.js ve GSAP ScrollTrigger ile hazırlanmış, 3 boyutlu ve kaydırma odaklı (scrollytelling) web deneyimi.

## Özellikler

- **Sabit Şeffaf 3D Katman:** Sayfa arka planına sabitlenmiş (`pointer-events: none`) WebGL `<canvas>` sahnesi üzerinde akan modern HTML/CSS arayüzü.
- **Prosedürel PBR Yarışma Robotu + `.glb` Desteği:** Fırçalanmış alüminyum, karbon fiber, mekanum tekerlekler, REV Control Hub, hareketli kaldırma kolu ve okunabilir arka teknik bilgi plakası. `public/assets/3d/robot.glb` eklendiğinde harici 3D model otomatik olarak yüklenir.
- **5 Bölümlük Kaydırma Senaryosu (GSAP ScrollTrigger):**
  1. **Hero:** Hafif süzülme, fare parallax eğilimi ve kayan stüdyo ışığı.
  2. **FTC Değerleri & İç Yapı:** Robotun parçalarına ayrılması (*exploded view*) ve 3D-2D projeksiyonlu mühendislik etiketleri.
  3. **Takım & Sezon Seçici:** `#24230 AG Robotik`, `#28743 Jr. AG Robotik`, `FRC REBUILT` ve `FTC BIOBUZZ` temaları arasında yumuşak renk, LED, plaka ve ışık geçişi.
  4. **360° Teknik İnceleme:** Arka teknik telemetri plakasının kameraya dönmesi, fare/dokunmatik/klavye ile 360° döndürme ve manuel parçalama kontrolü.
  5. **Kapanış & İletişim:** Geniş açı kompozisyon, veli görüşleri, SSS ve iletişim formu.
- **Mobil Performans Optimizasyonu:** Küçük/düşük çekirdekli cihazlarda otomatik poligon, gölge, DPR ve partikül azaltımı.

## Kurulum ve Çalıştırma

```bash
npm install
npm run dev
```

Üretim derlemesi:

```bash
npm run build
npm run preview
```

## Kendi 3D Modelinizi Kullanma

Özel bir `.glb` modeliniz varsa `public/assets/3d/robot.glb` yoluna ekleyin. Uygulama açılışta bu dosyayı otomatik algılar ve mevcut stüdyo ışıkları ile scroll animasyonlarına entegre eder.
