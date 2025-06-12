import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import axios from 'axios';

export default function HeroEditor ({ value, onChange, onClose }) {
  const [local, setLocal] = useState(value || { image: '', heading: '', sub: '' });
  const [uploading, setUploading] = useState(false);

  const onDrop = useCallback(async files => {
    const file = files[0];
    if (!file) return;
    setUploading(true);
    try {
      // 1. Get signed parameters
      const sig = await axios.get('/api/uploads/signature').then(r => r.data);

      // 2. Build multipart form
      const form = new FormData();
      form.append('file', file);
      form.append('api_key', sig.apiKey);
      form.append('timestamp', sig.timestamp);
      form.append('signature', sig.signature);
      form.append('upload_preset', sig.uploadPreset); // works if preset is unsigned

      // 3. Upload to Cloudinary
      const res = await axios.post(
        `https://api.cloudinary.com/v1_1/${sig.cloudName}/image/upload`,
        form
      );

      setLocal({ ...local, image: res.data.secure_url });
    } catch (err) {
      /* surface Cloudinary's message */
      const msg =
        err?.response?.data?.error?.message ||
        err.message ||
        'Upload failed';
      alert(`Cloudinary error: ${msg}`);
    } finally {
      setUploading(false);
    }
  }, [local]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': [] },
    maxFiles: 1
  });

  /* save changes */
  const save = () => {
    onChange(local);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="w-[32rem] rounded-2xl bg-white p-6 space-y-4 shadow-xl">
        <h3 className="text-lg font-bold">Hero Section</h3>

        {/* uploader */}
        <div
          {...getRootProps()}
          className="border-2 border-dashed rounded-xl h-40 flex items-center justify-center cursor-pointer"
        >
          <input {...getInputProps()} />
          {uploading ? (
            'Uploading…'
          ) : local.image ? (
            <img src={local.image} alt="hero" className="max-h-36 object-contain" />
          ) : isDragActive ? (
            'Drop image'
          ) : (
            'Drag image or click to upload'
          )}
        </div>

        <div>
          <label className="block text-sm font-semibold mb-1">Heading</label>
          <input
            value={local.heading}
            onChange={e => setLocal({ ...local, heading: e.target.value })}
            className="w-full rounded-lg border border-gray-300 px-3 py-2"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold mb-1">Sub-headline</label>
          <input
            value={local.sub}
            onChange={e => setLocal({ ...local, sub: e.target.value })}
            className="w-full rounded-lg border border-gray-300 px-3 py-2"
          />
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <button onClick={onClose} className="px-4 py-2 rounded-lg bg-gray-200">
            Cancel
          </button>
          <button onClick={save} className="px-4 py-2 rounded-lg bg-indigo-600 text-white">
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
