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
