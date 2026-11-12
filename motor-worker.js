// Tarayıcı motoru: hesap çekirdeğini (elab.zip) tarayıcının içindeki Python'da (Pyodide) çalıştırır.
// Ayrı bir işçide (Web Worker) çalışır; böylece hesap sürerken ekran donmaz. Arayüzle sözleşme (ui/src/motor.ts):
//   gelen : { id, islem, govde }                islem: spec | run | dersnotu | surum   (elab/kopru.py → cagir)
//   giden : { id, metin }  ya da  { id, hata }   metin: kopru.cagir()'ın döndürdüğü JSON
//           { durum, ek }                        açılış aşamaları: python → cekirdek → hazir
import { loadPyodide } from './pyodide/pyodide.mjs'

const adres = ad => new URL(ad, import.meta.url).href
let cagir = null

const hazir = (async () => {
  self.postMessage({ durum: 'python' })
  const py = await loadPyodide({ indexURL: adres('./pyodide/') })
  self.postMessage({ durum: 'cekirdek' })
  const r = await fetch(adres('./elab.zip'))
  if (!r.ok) throw new Error('hesap çekirdeği (elab.zip) alınamadı: ' + r.status)
  py.unpackArchive(await r.arrayBuffer(), 'zip', { extractDir: '/uygulama' })
  py.runPython('import sys\nsys.path.insert(0, "/uygulama")\nfrom elab import kopru')
  cagir = py.globals.get('kopru').cagir
  self.postMessage({ durum: 'hazir', ek: { pyodide: py.version, python: String(py.runPython('sys.version')).split(' ')[0] } })
})()
hazir.catch(e => self.postMessage({ durum: 'hata', ek: String(e && e.message || e) }))

self.onmessage = async e => {
  const { id, islem, govde } = e.data
  try {
    await hazir
    self.postMessage({ id, metin: cagir(islem, JSON.stringify(govde || {})) })
  } catch (err) {
    self.postMessage({ id, hata: String(err && err.message || err) })
  }
}
