// frontend/src/components/HeroEditor.jsx
import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import axios from 'axios'

/**
 * Props
 *   value    → { img, heading, sub }
 *   onChange → (newVal) => void
 *   onClose  → () => void
 */
export default function HeroEditor ({ value, onChange, onClose }) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const onDrop = useCallback(async files => {
    if (!files.length) return
    setError(''); setBusy(true)

    try {
      // 1️⃣ wrap file in FormData and hit raw upload
      const file = files[0]
      const form = new FormData()
      form.append('file', file)

      const rawRes = await axios.post('/api/uploads/raw', form, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      const { publicId } = rawRes.data

      // 2️⃣ compress & re-upload
      const compRes = await axios.post('/api/uploads/compress', { publicId })
      const { url: tinyUrl } = compRes.data

      // 3️⃣ hand back compressed image URL
      onChange({ ...value, img: tinyUrl })
    } catch (e) {
      console.error(e)
      setError(
        e.response?.data?.error ||
        e.message ||
        'Upload/compress failed'
      )
    } finally {
      setBusy(false)
    }
  }, [value, onChange])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop, multiple: false, accept: { 'image/*': [] }
  })

  const field = (label, key, placeholder = '') => (
    <div>
      <label className="block mb-1 text-sm font-semibold text-gray-700">
        {label}
      </label>
      <input
        className="w-full rounded-lg border border-gray-300 px-3 py-2"
        placeholder={placeholder}
        value={value[key] || ''}
        onChange={e => onChange({ ...value, [key]: e.target.value })}
      />
    </div>
  )

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-lg rounded-3xl bg-white p-8 shadow-2xl">
        <h2 className="mb-6 text-xl font-semibold">Hero Section</h2>

        <div
          {...getRootProps()}
          className="mb-6 flex h-44 w-full cursor-pointer items-center justify-center rounded-2xl border-2 border-dashed border-gray-300 bg-gray-50 text-gray-500"
        >
          <input {...getInputProps()} />
          {busy
            ? <span>Uploading…</span>
            : value.img
              ? <img src={value.img}
                alt="hero preview"
                className="h-full w-full object-cover rounded-2xl" />
              : <span>
                {isDragActive
                  ? 'Drop to upload'
                  : 'Drag image or click to upload'}
              </span>
          }
        </div>

        <div className="space-y-4">
          {field('Heading', 'heading', 'e.g. Premium Pool Builders')}
          {field('Sub-headline', 'sub', 'Serving Orlando & Central Florida')}
        </div>

        {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

        <div className="mt-8 flex justify-end">
          <button
            onClick={onClose}
            className="rounded-lg bg-gray-200 px-4 py-2 hover:bg-gray-300"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
