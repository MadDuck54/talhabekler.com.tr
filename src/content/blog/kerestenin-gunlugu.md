---
title: "Kerestenin günlüğü"
lede: "Önceki yazıdaki ERP'yi kurarken anladım ki bazı işler kendi başına bir sistemin işi. Kereste ithalatı başlayınca bu somutlaştı: yüzlerce hammaddeyi ürün bazında izlemek, el terminaliyle ölçmek, QR'la takip etmek — sıfırdan kurulması gereken ayrı bir depo sistemi. Bu yazı bir kerestenin sahaya inişinden müşteri kamyonuna binişine kadarki yolunu ve aldığım yazılım kararlarını anlatır."
metaDescription: "Konteynerden müşteri kamyonuna: el terminali, QR ve PWA ile sıfırdan kurduğum kereste depo sistemi — yazılım kararları, donanım seçimi, saha akışı."
date: 2026-04-28
tags: [depo, wms, pwa, saha]
docNumber: 3
---

Bir önceki [yazıda](/blog/excelin-bittigi-yer) devraldığım ERP'yi modern bir yığına nasıl taşıdığımı, üstüne sahada eksik kalan üretim zincirini sıfırdan nasıl ördüğümü anlattım. Bu yazı onun devamı sayılır — çünkü o ERP'yi kurarken anladığım bir şey var: bazı işler ERP'nin işi değil. Bu projeyi de o farkındalık doğurdu.

## "Bu işi ERP'ye sığdıramazsın"

ERP'yi kurarken kafamda hep aynı soru vardı: hangi iş onun içinde olmalı, hangi iş kendi başına bir uygulamanın işi? Çünkü her şeyi tek bir sisteme yığmaya çalıştığında ya sistem hantallaşır ya da kullanım pratiği bozulur. Sahada Excel ve WhatsApp kalıbıyla yönetilen iş alanları vardı — buralara dokunmadığım için içim rahatsızdı, ama hepsini ERP'nin içine sıkıştırmak doğru değildi.

Sonra fabrikada yeni bir iş alanı doğdu: kereste ithalatı. Daha önce hammaddeyi farklı satıcılardan, yıllara dayanan ilişkilerle alıyorduk. Kereste ithalatı başka bir şeydi — yüklü hacim, hatrı sayılır miktarda mal, çoğu detayını bilmediğimiz bir iş. Bir konteyner gemiyle Türkiye'ye geliyordu, depoya iniyordu, içindeki ham keresteler raflarda günler ya da aylarca duruyordu, sonra parça parça ya da palet halinde müşteriye satılıyordu.

Önce ERP'ye modül olarak eklemeyi düşündüm. Ama düşündükçe ısrar etmem zorlaştı: bu bir teklif/sipariş ERP'siydi. Depodaki kereste ise yüzlerce parça halinde ölçülmesi, etiketlenmesi, satılana kadar adet bazında izlenmesi gereken bir hammadde. ERP'nin içinde bu kadar saha-yoğun bir akış sistemin merkezini bulanıklaştırırdı. Stack tarafında da uyumsuzluk vardı: ERP Blade + Alpine + MySQL üzerine kurulmuştu, ben buraya Vue + Inertia + Postgres + PWA yapacaktım — saha cihazları, çevrimdışı çalışma, etiket yazıcısıyla doğrudan TCP konuşmak. Bunlar başka bir uygulamanın özellikleri.

Sıfırdan, ayrı, ve yine kendim yazma kararı kolay alındı. Yazılım maliyeti yine ana gerekçeydi.

## Cihaz dünyasıyla ilk tanışma

Yazılım kararından önce bir korku vardı: el terminali. Saha cihazları benim hiç bilmediğim bir dünyaydı.

Bir test cihazı sipariş ettim — ucuz Çin malı, kapağı eğri yapıştırılmış bir Android handheld. İki gece boyunca onunla uğraştım. Barkod nasıl okunur, sistem cihazı nasıl algılar, ekran nasıl davranır, hangi tarayıcı kullanır. Aşağı yukarı standart bir Android cihaz olduğunu fark ettim, sadece üzerinde sapasağlam bir kasa, bir tetik tuşu ve bir lazer tarayıcı vardı.

Bu rahatlattı, ama aynı anda yeni bir korku çıkardı: madem Android, demek ki uygulamayı APK olarak yazmam gerekecek. Hiç Android tecrübem yoktu — APK ne, hangi dilde yazılır, hangi DB kullanılır, deploy nasıl yapılır, hiçbir fikrim yoktu. *"Bu işin altından nasıl kalkarım?"* diye düşündüğüm o gerçek bir an oldu.

Çözüm aslında uygulamanın geri planında vardı: zorunda değildim native APK yazmaya. Depo takip uygulaması için web tarayıcısında çalışan bir şey yapsam yeterdi — el terminalindeki Chrome zaten Vue çalıştırırdı. Üstüne PWA ekledim (manifest, service worker, offline cache); kullanıcı için "uygulama" hissi de kalıyor — açılışta tam ekran, çevrimdışı çalışma, ana ekrana eklenebilirlik.

Yani PWA seçimim "modern bir teknoloji denemek" değildi. Bilmediğim bir alanı (Android native) bildiğim bir alana (web) çekme manevrasıydı. Kullanıcı bunu fark eder mi? Hayır. Bana avantaj sağlar mı? Aşırı.

Bugünkü saha cihazımız Zebra TC21, profesyonel bir Android handheld. Etiket yazıcı tarafı da iki adımda oturdu: önce küçük taşınabilir bir Zebra ZPL 320 denedik — bağlantı sorunlu çıktı, etiket boyutu yetersizdi. TSC TE210'a geçtik (203 dpi, 70×50 mm). Verimli, sorunsuz, hâlâ kullanıyoruz. Yazıcıyla doğrudan TCP soketi üzerinden 9100. portuna konuşuyoruz; TSPL2 komutlarını sunucu üretiyor, code page 1254 ile Türkçe karakterleri düzgün basıyor.

## Tam palet mi, parçalı mı?

Sistemi kurmaya başlarken bilinçli bir tasarım kararı vardı: paleti hiç bozmayız. Müşteri palet alır, perakende satmayız. Bu hem operasyonel açıdan rahatlık sağlardı, hem de sistemi sade tutardı — adet bazında izlemek için ekstra bir state machine gerekmezdi.

Ama aklımın bir köşesi sürekli aynı soruya dönüyordu: *ya birisi paleti bozup parça parça isterse, kalanı nasıl izleyeceğiz?*

Bu soru bir süre sonra cevap istedi. Sistemi adet bazına kadar takip edebilecek şekilde tasarladım — palet QR'ı sabit kalıyor, ama içindeki kerestelerin durumu (`stokta` / `rezerve` / `satıldı`) JSON-data ile state olarak taşınıyor. Bir el terminali paleti tarayınca sistem şunu söyleyebiliyor artık: *"Bu palet açıldı, içinden 3 kereste şu müşteriye satıldı, geriye 7 kereste kaldı."*

Bu kararın somut karşılığı bir sonraki bölümde görünecek — adet bazlı satışta saha akışı bu evrime göre kuruldu.

Senaryolar test edildi, açık göremiyorum. Ama gerçek hayatta atlamış olduğum bir şey çıkar mı bilmiyorum — zamanla göreceğiz.

## Bir kerestenin yolu

Sistemin yaptığı işi en iyi tek bir kereste üzerinden anlatmak.

Konteyner Türkiye'ye gelmeden günler önce tedarikçiden çeki listesi geliyor — yani *"şu konteynerde şu boyutlarda, şu cinste, şu adette kereste var"* dökümü. Bu PDF'i sisteme yüklüyoruz; mal kabul kullanıcısı el terminalinden açıp ne geleceğini önceden görüyor. Bu küçük bir detay ama sahada büyük fark yaratıyor: kullanıcı konteyner gelmeden ürünün ne olduğunu kafasında kuruyor. Sistemde olmasaydı her seferinde "şimdi ne geliyordu" diye telefon edip ofise sormak zorunda kalırdı.

Konteyner indirildikten sonra mal kabul süreci başlıyor. Kullanıcı el terminalinden *"mal kabul et"* diyor:

1. Tarih seçer ve onaylar.
2. Tedarikçi seçer. Burada bilinçli bir tasarım kararı var — sistem ona tüm tedarikçileri göstermez, yalnızca **satın alımı yapılmış ve yakında teslim edilecek** olanları gösterir. Onlarca tedarikçi listede yan yana olsa kullanıcı yanlışlıkla farklı birini seçebilir; ben listeyi daraltarak bu hata olasılığını sıfıra çekiyorum.
3. Ürün ve kalite seçilir.
4. Sistem bir soru soruyor: *"Gireceğin kerestenin uzunluğu ve kalınlığı aynı mı?"* — paletteki tüm keresteler aynı kalınlık × uzunluktaysa "evet" der, sistem o iki ortak değeri bir kere alır, sonra her kereste için sadece **genişlik** istemekle yetinir. Aksi halde her keresteyi tek tek üç değerle girmek gerekir. Bu, el terminalinde yapılan iş yükünü neredeyse üçte birine indiriyor — ve daha önemlisi, kullanıcıya el terminalinin onu ezmediğini ispatlıyor.
5. Kullanıcı tek tek kereste ölçüyor: 10×20×400, 10×10×300… Sistem her birinin metreküpünü otomatik hesaplıyor (altı ondalık, çünkü m³ farkı küçük gibi görünür ama parti büyüdükçe birikir).
6. Palet bittiğinde *"paleti kapat"* diyor. O an sistem yazıcıyı tetikliyor — palet QR kodu artı içindeki tüm keresteler için bireysel QR kodları, **tek seferde**, art arda yazıcıdan çıkıyor.
7. Kullanıcı her etiketi kerestesine yapıştırıyor, palet etiketini palete yapıştırıyor, palet stoğa giriyor.

Sıradaki palet için aynı akış. Konteyner bitene kadar.

Aylar sonra bir alıcı kereste istiyor. Ofiste satış emri açılıyor. El terminaline bildirim düşüyor. Sahadaki kullanıcı emri açıyor, fiziki sevkiyatı doğrulamaya başlıyor.

Tam palet satışında akış basit: palet QR'ını okuyor, sistem o paletteki tüm keresteleri tek seferde *"satıldı"* işaretliyor. Adet bazlı satışta ise zarif bir doğrulama akışı koydum — önce palet okutuluyor. Sistem o paletin gerçekten satılması beklenen palet olduğunu kontrol ediyor; eğer yanlışsa kullanıcıya hata veriyor, doğru paleti bulana kadar tarama tekrar başlıyor. Doğru palet açılınca, içindeki keresteler kullanıcıya seçilebilir geliyor; satılacak adetleri tek tek tarayarak işaretliyor. Doğrulama tamamlanmadan sistem sevkiyatı kapatmıyor.

Bu mantığı koymamın sebebi tek bir şey: yanlış paletten yanlış kereste satma riskini sıfıra indirmek. Saha karanlık, yorgun, dikkat dağılır — sistem dikkat dağılsa bile yanlışı engellemeli.

## Yazılımcı kafası ile saha kafası aynı kafa

Önceki yazıda *"satış sorumlusu nasıl davranır diye değil, satış sorumlusu olarak ben şu an ne istiyorum diye düşünüyorum"* demiştim. Bu projede o tezi gerçekten tatbik etmek zorunda kaldığım koşulu yaşadım.

Sistemin tasarımı bana dışardan birinden gelmedi. Çeki listesi fikri, mal kabuldeki tedarikçi listesinin sınırlanması, *"uzunluk ve kalınlık aynı mı?"* sorusu, palet doğrulama mantığı — hiçbiri *"satışçıya soralım"*, *"depocuya soralım"*, *"yazılımcıya soralım"* diye gelmedi. Hepsini kendi kendime, kendi senaryolarımı kurarak, kendi tecrübelerimi konuşturarak buldum.

Bunu yaparken biraz şizofren gibiydim aslında.

Sahaya indim, terminali aldım elime, gerçekten mal kabul yaptım. Bilgisayarımı çıkardım, sistemi kontrol ettim, eksikleri gördüm. Belki onlarca kez kereste ölçtüm, baştan sona bir mal kabul yaşadım. Bir kullanıcının işini zorlaştıran bir akışı buldukça üstüne düşündüm, çözümledim, test ettim, eksikleri giderdim, hataları analiz ettim, tekrar kodladım. Sonra yine sahaya indim.

Anlatmak istediğim şey şu: malı alan da bendim, kabul eden de, satan da. Kendimi sistemin her bir parçası olarak programladım. Doğru veriyi elde edene kadar.

Bu, yazılım yazma pratiğinin az konuşulan ama çok güçlü bir hâli. Bir başka geliştirici bu projeyi yazsa, sahaya gidip kullanıcıyla konuşması, döngüyü öğrenmesi, masaya dönüp kodlamaya çalışması, bir hafta sonra geri gelip *"bu olmadı"* demesi gerekirdi. Ben döngünün içindeyken kodu yazıyordum — aralarındaki gecikme sıfır.

Bu projede *"yazılımcı kafasıyla düşünmüşüm, sahada öyle olmuyormuş"* anı da bu yüzden yaşamadım. Önceki yazıda bunu sıkça yaşamıştım — orada başkasının kararları üzerime bırakılmıştı, deneyim aşamasından geçmek gerekti. Burada her karar geçmiş bir mal kabul anısının ya da bir satış telefonu sahnesinin altından çıkıyordu.

## Hâlâ çözemediğim şey

Yine de bir açık problem var, dürüst olmak gerek.

Mal kabul aşamasında tek tek keresteleri ölçmek hâlâ insan emeğine bağlı. Bir kullanıcı bir keresteyi alır, metreyi açar, kalınlık-genişlik-uzunluk değerlerini el terminaline tek tek girer. Yüzlerce kereste olunca bu birkaç saatlik bir iş, yorgunluk ölçüm hatasına dönüşür. Sistem en başta da en sonda da bu ham veriden besleniyor — başka bir deyişle önceki yazıdaki [*"ilk giriş yanlışsa zincir çürük"*](/blog/excelin-bittigi-yer) dersi burada da çalışıyor, ama tetikleyici farklı: yorgunluktan girilen yanlış değer, sistemin sonsuza kadar yanlış metreküp tutmasına yol açıyor.

Aklımdaki çözüm palet bazında ölçüm. Dünya genelinde pratik bu yönde — tek tek her keresteyi metreyle ölçmek yerine paletin tamamını bir bütün olarak ölçüp toplam hacmini hesaplamak. Henüz buraya geçmedim, ama gidiş yönü orası.

## Kapanış

Bu yazının bir bölümünde şu cümleyi yazdım: *"İleride aynı dönemde birkaç tedarikçiden mal gelirse karışıklık olabilir — şimdilik açık konu."* Bu cümleyi yazıyı yazarken fark ettim. Daha önce aklıma gelmemişti.

Önceki yazının kapanışında *"bu yazı, biraz da bu körlüğe karşı bir not"* demiştim. İşte gerçek-zamanlı bir kanıt — yazı yazmak düşünme aracı, sadece kayıt değil. Bir bölümün altında oturmuş, akışı sıralarken sistemin daha fark etmediğim bir gediği ortaya çıkıyor. Bunu dosyanın yan tarafına not düşüyorum.

Belki blog yazmak uzun vadede sistemi besleyen bir geliştirme aracı, sadece bir aktarım değil. Bunu bir süre daha test edeceğim.

Bu sistem hâlâ büyüyor. *"Bitti"* yine yok. Bir sonraki adım muhtemelen kereste ölçümünü otomatize etmek olacak — kameralar, görüntü işleme, belki bir yıl sonra. Şimdilik insan eli, metre, terminal ekranı.
