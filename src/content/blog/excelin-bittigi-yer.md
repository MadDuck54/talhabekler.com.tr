---
title: "Excel'in bittiği yer"
lede: Geçen Aralık'ta yarı bitmiş bir ERP devraldım. Sales-side'ı ASP.NET + C# + MS SQL ile yazılmış, üretim tarafı planda ama yazılmamıştı. Modern bir Laravel yığınına taşıdım, üretim zincirini sıfırdan ördüm. Dört buçuk aydır üzerinde çalışıyorum, hâlâ bitmedi. Sahanın bana öğrettikleri burada.
metaDescription: "Yarı bitmiş bir ERP devraldım: ASP.NET'ten Laravel'e taşıdım, üretim zincirini sıfırdan ördüm. Sahanın bana öğrettiklerini dört buçuk ayda not aldım."
date: 2026-04-28
tags: [erp, üretim, saha, altyapı]
docNumber: 2
---

Üretim ve operasyon işletmeleri için iç araçlar yazıyorum. En çok zaman ayırdığım proje, içinde çalıştığım bir endüstriyel işletmenin ERP/MES platformu. Bu yazı, sıfırdan benim kurduğum bir sistemin değil; yarı bitmiş halde elime geçen, taşıdığım, üstüne ördüğüm, hâlâ örmekte olduğum bir sistemin notu. Dört buçuk ay birikmişti.

## Eski hayat: Excel + WhatsApp + kağıt

Sistem gelmeden önce fabrikada üç araç paralel çalışıyordu. Satış ekibi siparişleri ve raporları **Excel** dosyalarında tutardı. **Kağıt formlar** sipariş bildirimi, imalat raporu ve sevkiyat kağıdı için kullanılırdı. İmalat ekibi imalat raporunu, sevkiyat ekibi sevkiyat kağıdını doldururdu. Birimler arası iletişim ise **WhatsApp** üzerinden, gruplarda akardı.

Bu yapı dışarıdan "el yapımı" görünür ama içeride iki büyük çatlak vardı.

İlki, **aynı bilgiyi iki ayrı yere yazma** zorunluluğu. Satış bir sipariş açtığında bilgisi sevkiyat tarafına aynen kopyalanmak zorundaydı; imalat içinde de aynı veri farklı kayıtlara dağılırdı. İki kişi aynı dosyayı eş zamanlı açıp birinin diğerini ezmesi tipik bir vakaydı.

İkincisi daha sert. Bir levha imalattan çıkıp **ebatlamaya, oradan macunlamaya, zımparaya ve son aşama olan film prese giderdi**. Beş halkalı bir zincir. "Şu parça şu anda hangi makinada?" sorusunu sorduğunda, eski sistemde cevabı kimse bilemezdi. Üretim müdürü mü? Ebatlamacı mı? Pres operatörü mü? Hiç kimse, çünkü kimsenin sorumlu olduğu sistematik bir kayıt yoktu. Ya hatırlardın, ya kalkıp kendin gidip bakardın.

Bu kadar dağınık bir veri haritasının üstüne, müşteri telefonu çaldığında "tamam, sizinki şu anda zımparada" diye cevap verebilmenin imkânı yoktu.

## Devraldığım sistem: yarı kapsamlı bir spec

Aralık 2025'te bir paket teslim aldım. İçinde **ASP.NET Core 9 + C# + MS SQL Server 2016** ile yazılmış bir ERP, yetmiş dört sayfalık bir feature spec dokümanı ve ekran tasarımları vardı. Sistemin kapsamı temiz tanımlanmıştı: müşteri yönetimi, ürünler (parametrik fiyatlandırma + manuel ürünler), teklif lifecycle'ı, iş emirleri, multi-currency (TCMB API ile günlük kur), multi-company (host-şirket bazlı veri ayırma), roller ve izinler, dashboard, platform ayarları.

Yani **sales-side** tamamlanmıştı. Bir müşteriden teklif alıp, ürünü parametrelerine göre fiyatlandırıp, teklifi versiyonlayıp, onaylanınca iş emrine çevirmeye kadar olan kısım yazılıydı.

Spec'in kendi cümlesi açıktı:

> *"this proposal system is intended as the very first part of a much larger ERP system that is being planned. It can be taught as the first module of a complete ERP system, which can be used to manage the entire plywood factory's production and other operations."*

Yani: planda var ama yazılmamış. İş emri çıkana kadar olan kısım sistematik. Ondan sonrası, yani üretim, ebatlama, sevkiyat, stok, lot izleme, etiket; sahada hâlâ Excel + WhatsApp + kağıttı.

Karar burada şekillendi.

## Taşıma kararı: neden Laravel + PHP + MySQL

Mevcut C# yığınıyla devam edip yeni modülleri eklemek de mümkündü. Ama üç maliyet kalemi birden silindiği için karar kolay oldu:

- **Lisans yok.** MS SQL Server ve Windows Server lisansları kalıcı bir bütçe satırıydı. PHP, MySQL, Linux ücretsiz.
- **Sunucu zaten kurulu.** Linux'ta kendi sunucum vardı; Caddy ile reverse proxy, Tailscale ile özel ağ, Docker ile servisler. Ek bir Windows sunucusu kurmaya gerek yoktu.
- **Geliştirme satırındaki kişi bendim.** Yazılım ekibi tutuluyor olsa, her özellik isteği bir adam-saat bedeli demekti. Ben yaparsam o satır da bütçeden çıkıyor, çünkü o satırdaki kişi bendim.

Üç kalem birden silinince, ASP.NET Core 9'dan **Laravel 12 + PHP 8.3 + MySQL**'e taşımayı seçmek mantıklı oldu. Frontend zaten HTML 5 + CSS 3 + JavaScript'ti, orada yığın değişmedi. Blade template motoru + Alpine.js + TailwindCSS ile yeni karşılığını yazdım.

İlk birkaç ay neredeyse tamamı **port** işiydi: yani C# kodunu satır satır okuyup, aynı işi yapan PHP/Laravel kodunu yazmak. Müşteriler, ürünler, parametrik fiyatlandırma, teklif lifecycle, iş emri, multi-tenant veri ayırma, çoklu para birimi, snapshot versiyonlama; hepsi spec'te vardı, hepsini sırayla taşıdım.

## Üstüne ne ördüm

Asıl ilginç kısım taşıma sonrası başladı: spec'te yazmayan üretim zincirini eklemek.

İlk modül **imalat planlama** oldu. Bilerek oradan başladım, çünkü zincirin başıydı, sonraki adımların hepsi (ebatlama, macunlama, zımpara, film pres) imalattan beslenecekti. Sonra saha zincirini halka halka ördüm:

- **Ebatlama:** makina atamaları, iş günü planlama, giriş/çıkış takibi
- **Macunlama:** iş havuzu, tamamlanış kaydı, fire/atık takibi
- **Zımpara:** durum havuzu, hacim hesabı (m³)
- **Filmli pres:** pres tanımı, göz konfigürasyonu, filmaş planlaması, günlük log

Bunların etrafına **lot izleme** sistemi geldi. Her parçanın benzersiz numarası, hangi aşamada, kim sorumlu, ne zaman geçti. Buna **etiketleme + QR + TSPL yazıcı** entegrasyonunu ekledim; şimdi bir levha imalat çıkışında etiketleniyor, saha boyunca taranabiliyor. Sonra **stok**, **sevkiyat**, **ihracat ekleri** (ATR, EUR.1, fatura, irsaliye), tenant'a özel sipariş durumları, üretim güncellemelerinde **pessimistic locking**: yani aynı satıra iki kişi yazınca race condition'a düşmemek için.

Yöntemim sprint disiplini değildi. **Gün gün senaryolar yazıyorum**: "şu sahnede operatör ne yapar, sistem ne kayıt eder, hangi hesap çalışır". Sonra sahaya gidip ekiplere kullandırıyorum, geri bildirimleri topluyorum, hataları düzeltip yeniden gönderiyorum. Bu yüzden modülleri sırayla "kapatıp bırakmak" yok; çoğu modülün üzerine sürekli geri dönüyorum.

## Sahanın bana öğrettiği iki ders

İki ders var ki, bunlar olmadan platform "milyonluk" da olsa çöpe gider.

### "İlk giriş yanlışsa zincir çürük"

Sistem ne kadar zarif olursa olsun, **ham veri yanlış girilince** zincirin sonundaki rapor da yanlış. Bunun en bariz hali şurada çıktı: imalat çıkışında `100 adet` kaydedilen bir parti, ebatlamaya geldiğinde `95 adet` olarak doğrulanıyor. Aradaki 5 adet hayalet; sistemin içinde dolaşıyor, raporda var, sahada yok.

Buna karşı sertleştirme şu an aktif çalıştığım konu. **Değişkenleri** önceden modelleyip ham giriş aşamasında zorlamak gerekiyor. Kim, ne zaman, hangi koşulda, neye dayanarak girdi? Sistem tasarımı sırasında bunları fark etmemiştim, sahadan döne döne öğrendim.

GIGO klasiği, *garbage in, garbage out*, kitabi bir cümledir. Sahadaki versiyonu çok daha sert: yazılım sana cümlenin ikinci yarısını ödetiyor, ilk yarısını sahadaki insan ödetiyor sana.

### "Kullanıcıyı ikna etmek teknik soru değil"

Sistem hazır, ekran çalışıyor, butonlar yerinde. Operatör hâlâ Excel'e yazmak istiyor. Çünkü Excel onun yıllardır tuttuğu dosya, onu açmak refleks; senin sistemin yeni, yabancı, ekran düzeni anlamadığı bir şey.

Saha ekibi **istekli ve sorumluluk sahibi olmazsa** sistem yine çürür. Yazılım iyi olabilir, eğitim yapılmış olabilir, ama bir-iki kişi "ben Excel'de tutmaya devam edeceğim" derse zincir kopuyor. Çünkü zincirin tek bir halkası kayıt tutmaz hale gelince, geriye dönük rapor dürüst değil.

Bu kod yazarak çözülen bir sorun değil. UX iyileştirmesiyle bir kısmı çözülür (kullanması Excel'den daha kolay olsun); gerisi ekibin kararına ve yöneticinin tavrına bağlı.

## Geliştirici + son kullanıcı aynı kişi olmak

Alışılmış bir kombinasyon değil. Bir ERP'yi yazıyorum, aynı zamanda satış ve sevkiyat sorumlusu olarak onu kullanıyorum.

Avantajı net: spec okurken **"satış sorumlusu nasıl davranır"** diye değil, **"satış sorumlusu olarak ben şu an ne istiyorum"** diye düşünüyorum. [Sektörde 11. yılım](/). Bir teklifin nasıl açıldığını, bir konteynerin Türkiye'den hangi rotalarla nereye gittiğini, navlun maliyetinin nasıl hesaplandığını, müşterinin telefonda ne sorduğunu, ekran kafamda zaten kurulu şekilde geliyor. Bu, dış geliştiricinin asla sahip olamayacağı bir bağlamdır.

Ama bunun bir bedeli var ve dürüst olmak lazım.

**Birinci risk: ana işim bu değil.** Satış ve sevkiyat asıl iş, yazılım yan iş. Bu yüzden sprint disiplini yok. Canım sıkıldıkça bir parça ekliyorum, başka gün hiç dokunmuyorum. Önemli bir feature için "iki hafta süreceğim" planı yapamıyorum çünkü iki haftalık iş günü zaten satış işine ayrılmış.

**İkinci risk: karşı görüşten yoksun olmak.** Kendi yazdığını kullandığında, "böyle olsa daha iyi" düşüncen, dış geliştiricinin "bunu kullanan kim, gerçekten böyle mi düşünür" sorgusuna kapalı. Yazılım kararlarımın bir kısmı sallıyor da olabilir, disiplinsiz çalıştığım için. Tek bilen ben olduğum için, bunu söyleyecek dış göz de yok.

Bu yazı, biraz da bu körlüğe karşı bir not.

## Kapanış

Veri bütünlüğü olmazsa, ne kadar zarif tasarladığın "milyonluk" yazılım olsun, çöpe gider. Saha ekibi sorumluluk hissetmiyorsa sistem yine çürür. Bu iki cümle, dört buçuk ayın geriye baktığımda en sert öğrettiği şey.

"Bitti" yok. Belki bir yıl daha böyle gider, belki üç. Sistemin örülmesi, sahada test edilmesi, kullanıcı alışkanlıklarının dönüşmesi, "ilk giriş" disiplininin yerleşmesi; hiçbiri bir release tarihi olan iş değil. Yazılımı bitirirsin, sahadan dönüş gelir, geri dönüp düzeltirsin. Sonra yine.

Belki ana ders bu: bir fabrikayı yazmak, bir kerelik bir iş değil. Hep birlikte gelişen, sahaya gömülü, kalıcı bir ilişki. Bu sistemin yanına ördüğüm bağımsız depo sistemini [*Kerestenin günlüğü*](/blog/kerestenin-gunlugu) yazısında anlattım.
