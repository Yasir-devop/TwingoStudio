# TWINGO STUDIO — PROJE TALİMATLAR BELGESİ

## 📌 PROJE TANIMI
Twingo Studio, Etsy'de çoklu mağaza yöneten bir ekip için geliştirilmiş, Firebase tabanlı iş yönetim platformudur.
Tüm araçlar tek bir URL'den erişilebilir: **https://twingostudio.netlify.app**

---

## 🏗️ TEKNİK ALTYAPI

### Hosting & Deploy
- **Platform:** Netlify (GitHub otomatik deploy)
- **GitHub:** https://github.com/Yasir-devop/TwingoStudio
- **Branch:** master

### Auth & Database
- **Firebase Projesi:** twingostudio-cc351
- **Firebase Config:**
```js
apiKey: "AIzaSyCv_YX6Q5ZCO-KalyFZ4qh2RJMGxULrlas"
authDomain: "twingostudio-cc351.firebaseapp.com"
projectId: "twingostudio-cc351"
storageBucket: "twingostudio-cc351.firebasestorage.app"
messagingSenderId: "236093689838"
appId: "1:236093689838:web:b502546fdf61b1cc6288ff"
```

### Firestore Koleksiyonları
| Koleksiyon | Açıklama |
|---|---|
| `tasks` | Team Board görevleri (userId bazlı) |
| `presets` | Mockup konum grupları (paylaşımlı) |
| `feed_posts` | Tasarım Feed paylaşımları (24s auto-delete) |
| `etsy_stores/shared` | Tüm bağlı Etsy mağazaları + tokenlar (ortak) |
| `users` | Firebase kullanıcı listesi (paylaşım için) |

### Firestore Security Rules
```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /tasks/{taskId} {
      allow read, write: if request.auth != null && request.auth.uid == resource.data.userId;
      allow create: if request.auth != null;
    }
    match /presets/{docId} {
      allow read, write: if request.auth != null;
    }
    match /feed_posts/{postId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null;
      allow update, delete: if request.auth != null;
    }
    match /etsy_tokens/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    match /etsy_stores/shared {
      allow read: if request.auth != null;
      allow write: if request.auth != null && request.auth.token.email == 'admin@gmail.com';
    }
    match /users/{userId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

### Netlify Function
- **Dosya:** `netlify/functions/etsy-auth.js`
- **URL:** `https://twingostudio.netlify.app/.netlify/functions/etsy-auth`
- **Desteklenen action'lar:**
  - `token` → Etsy OAuth token exchange
  - `refresh` → Etsy token yenileme
  - `api` → Etsy API proxy (GET/POST)
  - `taxonomy` → Etsy kategori listesi
  - `scrape` → Etsy sayfa scraping (Brightdata)
  - `chatgpt` → OpenAI GPT-4o-mini proxy
  - `claude-vision` → Claude Haiku vision proxy
  - `upload-image` → Etsy listing görsel upload

### Netlify Environment Variables
| Key | Açıklama |
|---|---|
| `OPENAI_API_KEY` | OpenAI API key (SEO için) |
| `CLAUDE_API_KEY` | Anthropic Claude API key (SEO vision için) |
| `GEMINI_API_KEY` | Google Gemini API key (kullanılmıyor şu an) |

### Harici Servisler & API Key'ler
| Servis | Key / Bilgi |
|---|---|
| **Etsy API** | Key: `z8vhgq1wdi92trm3t24f2g92` / Secret: `vixpjw50mh` |
| **Etsy App ID** | 1495724967528 |
| **Etsy Callback URL** | `https://twingostudio.netlify.app/etsy-callback.html` |
| **Etsy OAuth Scopes** | `transactions_r listings_r listings_w listings_d shops_r shops_w` |
| **ImgBB** | Key: `cad6fea711a7a4ffc3d99ffc0727d6aa` |
| **Brightdata** | Key: `98fb7364-0746-4e51-8239-caa78bd72a6c` / Zone: `web_unlocker1` |
| **Claude API** | `sk-ant-api03-ZQ5IEO3d5Dinxvvcn-...` (Netlify env'de) |
| **OpenAI API** | `sk-proj-uissa5xK...` (Netlify env'de) |

---

## 📁 DOSYA YAPISI

```
index.html              → Ana sayfa (Firebase auth zorunlu)
login.html              → Firebase Email/Password giriş + kayıt
dashboard.html          → Etsy Dashboard (çok mağaza)
twingoMockup.html       → Mockup Studio (v55)
twingoTeamBoard.html    → Team Board
twingoFeed.html         → Tasarım Feed
twingoSEO.html          → SEO Studio (Claude Vision + kurallar)
etsy-callback.html      → Etsy OAuth callback
netlify/functions/etsy-auth.js  → Netlify Function (tüm API proxy)
netlify.toml            → Netlify config
```

---

## 🖥️ UYGULAMALAR & ÖZELLİKLER

### 1. Ana Sayfa (index.html)
- Firebase auth kontrolü — giriş olmadan girilemiyor
- 4 sütunlu kompakt kart grid
- Kartlar: Dashboard, Mockup Studio, Tasarım Feed, Team Board, SEO Studio
- Ayarlar (tema toggle)

### 2. Login (login.html)
- Firebase Email/Password giriş & kayıt
- Login/kayıt sırasında kullanıcı `users` Firestore koleksiyonuna eklenir (paylaşım için)

### 3. Dashboard (dashboard.html)
- **Çok mağaza:** Her mağaza ayrı Etsy OAuth token ile `etsy_stores/shared` dokümanında
- **Admin:** Sadece `admin@gmail.com` mağaza ekleyebilir/silebilir
- **Diğer kullanıcılar:** Sadece verileri görebilir
- **Token auto-refresh:** 55 dakikada bir
- **Stat kartları:** Toplam Sipariş (adet), Toplam Gelir ($), Günlük Ort. Sipariş, Aktif Listing
- **Sol sidebar:** Tüm mağazaların bugün/dün sipariş farkı (badge)
- **Chart:** Günlük satış grafiği (default 30 gün, Today/Aylık toggle)
- **En Çok Satan:** Ürün listesi
- **Son seçilen mağaza:** localStorage'da hatırlanır

### 4. Mockup Studio (twingoMockup.html)
- Mockup setleri IndexedDB'de saklanır
- Konum grupları (presets) Firestore'a sync
- Set grupları accordion + sürükle-bırak
- Toplu Checkout, önizleme modu, global PNG sürükle-bırak
- İndirilen dosyalar mockup kendi adıyla gelir

### 5. Tasarım Feed (twingoFeed.html)
- Görsel paylaşım (ImgBB CDN)
- Beğeni + yorum sistemi
- 12/24/48 saat otomatik silme seçeneği
- Firestore gerçek zamanlı

### 6. Team Board (twingoTeamBoard.html)
- Görevler Firestore'da, her kullanıcı kendi görevlerini görür
- Kanban + Liste görünümü
- **@mention sistemi:** Firestore `users` koleksiyonundan gerçek kullanıcılar
- Link desteği (https:// tıklanabilir)
- **Paylaş butonu:** Seçili görev/notu email ile başka kullanıcıya gönder
- Kullanıcılar artık localStorage'dan değil Firestore'dan geliyor

### 7. SEO Studio (twingoSEO.html)
- **Dark mode UI** (imgupscaler.com benzeri)
- **Görsel yükleme:** Canvas ile otomatik resize (max 1024px)
- **Tür seçimi:** Custom (kişiselleştirilebilir) / Non-Custom (hazır tasarım)
- **Referans:** Bestseller title veya tag girilebilir (opsiyonel)
- **AI:** Claude Haiku 4.5 vision ile görsel analiz
- **Çıktı:** 4 farklı SEO seti (1 orijinal + 3 AI üretimi)
- **Her set:** 1 title (130-140 karakter) + 13 tag (max 20 karakter, long-tail)
- **"bday" kuralı:** Taglerde "birthday" yerine "bday" kullan (karakter tasarrufu)
- **Kopyalama:** Title, Tags, Tümünü ayrı ayrı kopyalanabilir

#### SEO Kuralları (Özet)
- Custom: Personalizasyon önce, sanat sonra
- Birthday custom: "Family Matching Shirts" title'da ZORUNLU
- Non-custom: Bestseller arama niyetini taklit et
- Title min 130, max 140 karakter
- Tag max 20 karakter, long-tail keyword

---

## 👤 KULLANICI YÖNETİMİ

### Admin Hesabı
- **Email:** admin@gmail.com
- **Yetkiler:** Etsy mağaza ekle/sil, tüm verileri görür

### Normal Kullanıcılar
- Sadece mevcut mağaza verilerini görebilir
- Mağaza ekleyemez/silemez
- Team Board'da kendi görevlerini yönetir
- Feed'e paylaşım yapabilir

### Kayıtlı Kullanıcılar (Firebase Auth)
- admin@gmail.com
- nuredam2001@gmail.com
- mahirkurt10@gmail.com
- yasirku4@gmail.com

---

## 🔐 ÖNEMLİ GÜVENLİK NOTLARI
- Admin kontrolü client-side (`email === 'admin@gmail.com'`) — güvenlik açığı var, ileride Firebase Custom Claims'e taşınmalı
- Etsy token'ları Firestore'da açık duruyor — şifreleme eklenebilir
- API key'ler Netlify environment variable'da, kod içinde yok

---

## 🚀 GELECEK PLANLAR (YAPILACAKLAR)

### Kısa Vadeli
1. **Pinterest Entegrasyonu (twingoPin.html)**
   - Pinterest Developer App: TwingoStudio
   - Callback URL: `https://twingostudio.netlify.app/pinterest-callback.html`
   - Özellikler: Görsel yükle, başlık/açıklama yaz, board seç, pin at
   - Toplu pin desteği (birden fazla görsel)
   - SEO Studio ile entegrasyon (title/desc otomatik)
   - Birden fazla Pinterest hesabı

2. **SEO Studio iyileştirme**
   - Daha fazla kural ekleme
   - Toplu analiz (birden fazla görsel)
   - Geçmiş analiz sayfası

### Orta Vadeli
3. **Listing Otomasyonu**
   - Vela/Etsy'ye otomatik listing
   - Puppeteer/Playwright ile browser automation
   - Ayrı sunucu gerekiyor (Railway/Render)

4. **Etsy Dashboard Detay**
   - Kargo takibi
   - Sipariş durumu güncelleme
   - Müşteri notu

### Uzun Vadeli
5. **Rol bazlı erişim** (Firebase Custom Claims)
6. **Mobil PWA**
7. **Analitik:** Kar marjı, trend analizi, sezonsal karşılaştırma
8. **SEO Studio:** eRank CSV entegrasyonu

---

## 🛠️ GELİŞTİRME NOTLARI

### Netlify Function Kısıtları
- Max timeout: 10-26 saniye (plana göre)
- Max body size: 6MB
- Etsy scraping çalışmıyor (bot koruması + timeout)
- Brightdata Web Unlocker denenip timeout nedeniyle bırakıldı

### shopId Tip Uyumsuzluğu
- Etsy API shopId'yi number döndürüyor
- HTML onclick'te string oluyor
- Tüm karşılaştırmalarda `String(shopId) === String(targetId)` kullanılıyor

### Görsel Upload
- Etsy API görsel URL kabul etmiyor, binary upload gerekiyor
- SEO Studio'da canvas ile max 1024px resize yapılıyor
- ImgBB Tasarım Feed için kullanılıyor

### n8n (Kullanılmadı)
- n8n Cloud hesabı var: twingo-studio.app.n8n.cloud
- Etsy SEO için denenip bırakıldı (Etsy scraping yine çalışmadı)
- İleride başka otomasyonlar için kullanılabilir

---

## 📝 CLAUDE'A NOT
Bu belgeyi alan Claude, yukarıdaki tüm teknik detayları bilerek projeye devam etmeli.
Yeni özellik eklerken mevcut Firebase yapısını, Netlify Function action'larını ve güvenlik kurallarını bozmadan geliştirmelidir.
Her dosya değişikliğinde "yaptıklarını unutma" prensibini uygula — önceki tüm değişiklikler aktif olmalı.

