// Hizmet işçisi: uygulamanın bütün dosyalarını ilk açılışta önbelleğe alır; sonraki açılışlar internetsiz çalışır.
// Yer tutucuları araclar/derle.py doldurur. Yalnız hesap tarayıcının içinde yapılırken kaydedilir (bkz. ui/src/motor.ts).
const AD = 'elab-1.2.0-422dc8e4e7'            // sürüm + içerik özeti: herhangi bir dosya değişirse ad da değişir ve önbellek yenilenir
const TEMEL = ["apple-touch-icon.png", "assets/Dokunma3D-D8iZppxz.js", "assets/index-BDQ4ICh_.css", "assets/index-Bcx0rwVH.js", "elab.zip", "ikon-192.png", "ikon-512.png", "ikon-kare-512.png", "ikon.svg", "index.html", "manifest.webmanifest", "motor-worker.js", "pyodide/pyodide-lock.json", "pyodide/pyodide.asm.mjs", "pyodide/pyodide.asm.wasm", "pyodide/pyodide.mjs", "pyodide/python_stdlib.zip", "surum.json"]                // uygulamanın çalışması için gereken dosyalar (biri eksikse kurulum başarısız sayılır)
const EK = ["gorseller/Easergy_P3_eSetup/01_87T_diferansiyel_dI.png", "gorseller/Easergy_P3_eSetup/02_soguk_yuk_alma_ve_kapama_darbesi.png", "gorseller/Easergy_P3_eSetup/03_ark_korumasi.png", "gorseller/Easergy_P3_eSetup/04_64REF_sinirlanmis_toprak_dIo.png", "gorseller/Easergy_P3_eSetup/05_50-51_faz_asiri_akim_I.png", "gorseller/Easergy_P3_eSetup/06_67_yonlu_faz_asiri_akim_Iphi.png", "gorseller/Easergy_P3_eSetup/07_46_negatif_bilesen_I2.png", "gorseller/Easergy_P3_eSetup/08_49T_termik_asiri_yuk.png", "gorseller/Easergy_P3_eSetup/09_50N-51N_toprak_Io_kademe1.png", "gorseller/Easergy_P3_eSetup/10_50N-51N_toprak_Io_kademe2.png", "gorseller/Easergy_P3_eSetup/11_67N_yonlu_toprak_Iophi.png", "gorseller/Easergy_P3_eSetup/12_67N_direct_EF_Iophi_kademe4.png", "gorseller/Easergy_P3_eSetup/13_59_asiri_gerilim_V.png", "gorseller/Easergy_P3_eSetup/14_27_dusuk_gerilim_V.png", "gorseller/Easergy_P3_eSetup/15_47_hatali_faz_sirasi_V2.png", "gorseller/Easergy_P3_eSetup/16_24_asiri_aki_Vf.png", "gorseller/Easergy_P3_eSetup/17_59N_notr_gerilim_kaymasi_Vo.png", "gorseller/Easergy_P3_eSetup/18_81_frekans_fX.png", "gorseller/Easergy_P3_eSetup/19_81U_dusuk_frekans_f.png", "gorseller/Easergy_P3_eSetup/20_81R_ROCOF_df-dt.png"]                      // röle ekran görüntüleri (alınamayan olursa kurulum yine tamamlanır)

self.addEventListener('install', e => e.waitUntil((async () => {
  const c = await caches.open(AD)
  await c.addAll(TEMEL.map(u => new Request(encodeURI(u), { cache: 'reload' })))
  await Promise.allSettled(EK.map(u => c.add(new Request(encodeURI(u), { cache: 'reload' }))))
  await self.skipWaiting()
})()))

self.addEventListener('activate', e => e.waitUntil((async () => {
  for (const k of await caches.keys()) if (k.startsWith('elab-') && k !== AD) await caches.delete(k)
  await self.clients.claim()
})()))

self.addEventListener('fetch', e => {
  const u = new URL(e.request.url), kapsam = new URL(self.registration.scope)
  if (e.request.method !== 'GET' || u.origin !== kapsam.origin || !u.pathname.startsWith(kapsam.pathname)) return     // /api/… ve başka siteler: dokunma
  e.respondWith((async () => {
    const c = await caches.open(AD)
    const kok = u.pathname === kapsam.pathname
    const hit = await c.match(kok ? new URL('index.html', kapsam).href : u.origin + u.pathname)
    if (hit) return hit
    try { return await fetch(e.request) } catch (err) {
      if (e.request.mode === 'navigate') { const i = await c.match(new URL('index.html', kapsam).href); if (i) return i }
      throw err
    }
  })())
})
