import { useState } from 'react';
import toast from 'react-hot-toast';
import { validateImageFile } from '../utils/validators';

export function useFileUpload({ multiple = false } = {}) {
  const [files, setFiles] = useState([]);
  const [previews, setPreviews] = useState([]);

  const onSelectFiles = async (incoming) => {
    const nextFiles = Array.from(incoming ?? []);
    const accepted = [];
    const nextPreviews = [];

    for (const file of nextFiles) {
      const error = await validateImageFile(file);
      if (error) {
        toast.error(error);
        continue;
      }
      accepted.push(file);
      nextPreviews.push({ name: file.name, url: URL.createObjectURL(file), size: file.size });
      if (!multiple) break;
    }

    setFiles(accepted);
    setPreviews(nextPreviews);
    return accepted;
  };

  const clearFiles = () => {
    previews.forEach((item) => URL.revokeObjectURL(item.url));
    setFiles([]);
    setPreviews([]);
  };

  return { files, previews, onSelectFiles, clearFiles, file: files[0] ?? null };
}
