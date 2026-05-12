# ☕ Dinamik Kafe Personel ve Vardiya Optimizasyon Sistemi

Bu proje, dinamik çalışma saatlerine sahip işletmelerin (özellikle kafelerin) personel yönetimini ve vardiya çizelgeleme süreçlerini otomatize eden, kural tabanlı (constraint-based) bir operasyon yönetim sistemidir. 

İşletmelerdeki yoğunluk saatleri, personel yetkinlikleri (barista, garson, kasa yetkisi) ve yasal/operasyonel çalışma sınırları göz önünde bulundurularak, insan hatasını en aza indiren optimum vardiya kombinasyonları üretmek amacıyla geliştirilmiştir.

## 🚀 Projenin Amacı ve Çözdüğü Problem
Kafelerde haftalık veya günlük vardiya yazmak; kimin hangi gün izinli olduğu, üst üste kaç gün çalıştığı, dükkanda en az bir kasa yetkilisinin bulunup bulunmadığı gibi birçok değişkenin aynı anda hesaplanmasını gerektirir. Bu proje, manuel olarak Excel veya kağıt üzerinde yapılan bu karmaşık "Çok Kriterli Karar Verme" (MCDM) sürecini dijitalleştirerek yöneticiye **birbirinden farklı, kurallara tam uyan alternatif vardiya senaryoları** sunar.

## ✨ Temel Özellikler
* **Kural Tabanlı Algoritma (Hard Constraints):** Her vardiyada minimum 1 barista, 1 garson ve 1 kasa yetkilisi bulunmasını garanti eder.
* **Akıllı Çizelgeleme:** Sabah, aracı (8 saat net çalışma) ve akşam (kapanış) döngülerini mekanın açık olduğu 09:00 - 00:00 saatleri arasına eksiksiz dağıtır.
* **Geçmiş Veri ve Yorgunluk Takibi:** Personelin üst üste kaç gün çalıştığını hesaplayarak takvim üzerinde (Örn: *Ali Yılmaz - 4. Gün*) dinamik olarak gösterir.
* **Gelişmiş İzin Yönetimi:** Belirli günler için izinli girilen personeli o günkü optimizasyon algoritmasından otomatik olarak çıkarır.
* **Dinamik Alternatif Üretimi:** Tek bir dayatma yapmak yerine, algoritmik olarak doğrulanmış en az 3 farklı vardiya opsiyonu üreterek son kararı yöneticiye bırakır.
* **Görsel Renk Kodlaması:** Kullanıcı arayüzünde baristalar ve garsonlar için farklı renk temaları kullanarak takvimin okunabilirliğini artırır.

## 🛠️ Kullanılan Teknolojiler (Tech Stack)
* **Arka Uç (Backend) & Algoritma:** Node.js (JavaScript)
* **Veritabanı:** SQLite (Maliyetsiz, yerel ve hızlı veri okuma/yazma işlemleri için tercih edilmiştir)
* **Ön Yüz (Frontend):** HTML5, CSS3, Vanilla JavaScript (Herhangi bir ağır framework kullanılmadan, saf performans odaklı tasarlanmıştır)

## 📷 Proje Görselleri 
<img width="1905" height="912" alt="Ekran Resmi 2026-05-12 19 10 18" src="https://github.com/user-attachments/assets/7e428942-19a8-4b80-bce0-5e89a99d5ef8" />
<img width="1879" height="911" alt="Ekran Resmi 2026-05-12 19 05 50" src="https://github.com/user-attachments/assets/672cecaf-d9e7-41af-b3f3-89493c6fd6f8" />
<img width="1895" height="896" alt="Ekran Resmi 2026-05-12 19 07 09" src="https://github.com/user-attachments/assets/6c2ef83e-578d-4e9c-ad20-86e051ff685e" />
<img width="1881" height="904" alt="Ekran Resmi 2026-05-12 19 07 51" src="https://github.com/user-attachments/assets/0fa78ab0-2036-44cd-ae26-5b3cf7637c3f" />
<img width="1878" height="905" alt="Ekran Resmi 2026-05-12 19 09 08" src="https://github.com/user-attachments/assets/bdb786b0-0ab6-4124-9459-8fd6a3f8ac6f" />
<img width="1888" height="907" alt="Ekran Resmi 2026-05-12 19 09 17" src="https://github.com/user-attachments/assets/21de68d2-d101-4a64-85e4-7961effca0a6" />


