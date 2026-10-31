# QR-GEN / 01

```
CLIENT-SIDE QR CODE GENERATOR // LOCAL TOOL
```

**→ [qr.ebad84.ir](https://qr.ebad84.ir)**

---

## // WHAT

A minimal QR code generator that runs entirely in the browser.  
No backend. No API. No tracking. Your data never leaves your device.

```
USER INPUT → BROWSER JS → QR ENCODER → CANVAS → DOWNLOAD
```

Supports: `URL` `TEXT` `EMAIL` `PHONE` `WIFI`  
Output: `PNG` `SVG`

---

## // EXPORT STYLE

- Every output is a white card with a subtle border and genuinely transparent,
  rounded outer corners (not just a CSS preview effect).
- **SHOW SITE ADDRESS** is enabled by default. Turn it off to remove the
  `qr.ebad84.ir` footer; the frame and rounded corners remain.
- Preview, PNG download, SVG download, clipboard, and print share the same card.
- **WIDTH (px)** sets the output width. The optional footer adds height;
  the status panel displays the actual exported dimensions.
- Margin is applied in QR modules, with a minimum four-module quiet zone for
  scanning. QR modules and finder patterns are never rounded or cropped.
- SVG is generated directly from the encoded QR matrix, not sampled pixels.
- The bundled encoder uses UTF-8 bytes for mixed Persian/English text and emoji.
  All generation still stays local, with no external fonts or services.

---

## // STACK

```
html + css + vanilla js
qrcodejs          — client-side QR encoding
jetbrains mono    — embedded, no google fonts
nginx             — served from my old PC at home
```

---

## // SELF-HOSTED

This runs on an old PC I turned into a home server.  
Not a cloud VPS. Not a managed host. Just old hardware, a public IP, and nginx.

![homelab](homelab.png)

---

## // DEPLOY

```bash
git clone https://github.com/ebad84/qr.ebad84.ir /var/www/qr.ebad84.ir
ln -s /var/www/qr.ebad84.ir/nginx/qr.ebad84.ir /etc/nginx/sites-available/qr.ebad84.ir
ln -s /etc/nginx/sites-available/qr.ebad84.ir /etc/nginx/sites-enabled/
nginx -t && systemctl reload nginx
# then: certbot --nginx -d qr.ebad84.ir
```

**update:**
```bash
cd /var/www/qr.ebad84.ir && git pull
```

---

## // LICENSE

This project is published under MIT license . Boil it, mix it, Do whatever you want

---

```
ebad84.ir // another small tool
```
