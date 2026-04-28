---
title: Merhaba — bu blog burada olacak
lede: Notların, denemelerin ve üretim hatlarının kayıt altına alındığı yer. Birinci yazı, sistem doğrulaması.
date: 2026-04-28
tags: [meta, altyapı]
docNumber: 1
---

Bu yazı, blog altyapısının çalıştığını kanıtlamak için yazıldı. Burada zaman içinde **iç sistemler**, **endüstriyel donanım entegrasyonu**, **çok-ajanlı yapay zekâ akışları** ve **kendi sunucumda neyi nasıl çalıştırdığım** üzerine notlar olacak.

## Neden bir blog

ERP'den TSPL yazıcısına, Caddy reverse-proxy'sinden Claude Code subagent orkestrasyonuna — gün içinde değdiğim katmanlar arasındaki boşlukları yazıyla doldurmak iki işe yarıyor:

1. **Karar takibi.** Bir karar verdiğimde *neden* öyle yaptığımı altı ay sonra bulmam gerekiyor. Commit mesajı yetersiz kalıyor.
2. **Açık not defteri.** Aynı sorunla boğuşan biri Türkçe arama yaptığında bir şey bulsun istiyorum.

## Yazı tipi

Şu kategoriler altında yazacağım:

- `altyapı` — self-hosted Linux sunucu, Caddy, Cloudflare Tunnel, Tailscale, systemd notları
- `erp` — Laravel modüler mimari, multi-tenant, snapshot fiyatlama, optimistic locking gibi kararlar
- `ai` — Claude Code subagent dizilimi, multi-agent verifikasyon akışları, Vercel AI SDK kalıpları
- `donanım` — TSPL etiket yazıcı, QR akış, el terminali entegrasyonu, RFID
- `meta` — bu blog dahil, sistemin kendisi hakkında yazılar

## Yığın hakkında bir not

Bu sayfa, [Astro 6](https://astro.build) içinde Markdown content collection'ı olarak yazıldı. Yazı dosyaları `src/content/blog/*.md` altında, schema `src/content.config.ts` içinde tanımlı. Build çıktısı klasör-per-route (`/blog/yazi-basligi/index.html`) — Caddy `try_files` ile sorunsuz servis ediyor.

```bash
# yeni yazı
vim src/content/blog/yeni-yazi.md
git add . && git commit -m "post: yeni yazı"
git push talha main
# 30 saniye sonra canlıda
```

Çalıştığını gördüğümüze göre, ikinci yazıda ilk gerçek konuya geçiyoruz.
