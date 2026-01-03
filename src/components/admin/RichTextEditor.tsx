'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { 
  Code, 
  Eye, 
  Layout, 
  Columns, 
  Square, 
  Type, 
  Image as ImageIcon,
  MoreHorizontal
} from 'lucide-react';
import { ImageCropperModal } from './ImageCropperModal';

// Dynamic import for ReactQuill to avoid SSR issues
const ReactQuill = dynamic(() => import('react-quill-new'), { ssr: false });
import 'react-quill-new/dist/quill.snow.css';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
  onImageUpload?: (file: File) => Promise<string>;
}

const MODULES = {
  toolbar: [
    [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
    ['bold', 'italic', 'underline', 'strike'],
    [{ 'list': 'ordered'}, { 'list': 'bullet' }],
    [{ 'color': [] }, { 'background': [] }],
    [{ 'align': [] }],
    ['link', 'video'], // Removed 'image' from default toolbar to use custom handler
    ['clean']
  ],
};

const FORMATS = [
  'header',
  'bold', 'italic', 'underline', 'strike',
  'list',
  'color', 'background',
  'align',
  'link', 'image', 'video'
];

export function RichTextEditor({ value, onChange, className, onImageUpload }: RichTextEditorProps) {
  const [mode, setMode] = useState<'visual' | 'code'>('visual');
  const [internalValue, setInternalValue] = useState(value);
  const [uploading, setUploading] = useState(false);
  
  // Cropper State
  const [cropImageSrc, setCropImageSrc] = useState<string | null>(null);
  
  const quillRef = useRef<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync internal value when prop changes (if not focused to avoid cursor jumps)
  useEffect(() => {
    if (value !== internalValue) {
        setInternalValue(value);
    }
  }, [value]);

  const handleChange = (val: string) => {
    setInternalValue(val);
    onChange(val);
  };

  const handleImageClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0 || !onImageUpload) return;
    
    const file = e.target.files[0];
    
    // Read file as Data URL to show in cropper
    const reader = new FileReader();
    reader.addEventListener('load', () => {
      setCropImageSrc(reader.result?.toString() || null);
    });
    reader.readAsDataURL(file);
    
    // Clear input so same file can be selected again if cancelled
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleCropComplete = async (croppedBlob: Blob) => {
    if (!onImageUpload) return;
    
    setCropImageSrc(null); // Close modal
    setUploading(true);
    
    try {
      // Create a File from Blob
      const file = new File([croppedBlob], "cropped-image.jpg", { type: "image/jpeg" });
      
      const url = await onImageUpload(file);
      
      // Insert image at cursor or end
      if (mode === 'visual') {
         const imgHtml = `<img src="${url}" alt="Uploaded image" />`;
         const current = internalValue;
         handleChange(current + imgHtml);
      } else {
         insertHtml(`<img src="${url}" alt="Uploaded image" />`);
      }
    } catch (error) {
      console.error("Image upload failed", error);
      alert("Failed to upload image");
    } finally {
      setUploading(false);
    }
  };

  const handleCropCancel = () => {
    setCropImageSrc(null);
  };

  const insertHtml = (html: string) => {
    if (mode === 'code') {
      const textarea = document.querySelector('.code-editor-textarea') as HTMLTextAreaElement;
      if (textarea) {
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const text = textarea.value;
        const newText = text.substring(0, start) + html + text.substring(end);
        handleChange(newText);
        // Restore focus
        setTimeout(() => {
            textarea.focus();
            textarea.setSelectionRange(start + html.length, start + html.length);
        }, 0);
      }
    } else {
        // Visual mode insert
        // Note: Quill insertHTML is a bit tricky, it might strip classes.
        // We append to the end for simplicity in this implementation, 
        // or try to insert at cursor if possible.
        
        // Basic append approach if cursor not found
        const current = internalValue;
        handleChange(current + html);
    }
  };

  const templates = [
    {
      name: '2 Columns',
      icon: <Columns className="h-4 w-4" />,
      html: `<div class="grid md:grid-cols-2 gap-8 my-8"><div class="p-4 border rounded">Column 1</div><div class="p-4 border rounded">Column 2</div></div><p><br/></p>`
    },
    {
      name: '3 Columns',
      icon: <Layout className="h-4 w-4" />,
      html: `<div class="grid md:grid-cols-3 gap-8 my-8"><div class="p-4 border rounded">Col 1</div><div class="p-4 border rounded">Col 2</div><div class="p-4 border rounded">Col 3</div></div><p><br/></p>`
    },
    {
      name: 'Section',
      icon: <Square className="h-4 w-4" />,
      html: `<section class="py-12 bg-gray-50 my-8"><div class="container mx-auto px-4"><h2 class="text-2xl font-bold mb-4">Section Title</h2><p>Section content...</p></div></section><p><br/></p>`
    },
    {
      name: 'Button',
      icon: <Type className="h-4 w-4" />,
      html: `<a href="#" class="inline-block bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition-colors my-4">Click Me</a><p><br/></p>`
    }
  ];

  return (
    <div className={`rich-text-editor border border-[var(--secondary)]/20 rounded-lg overflow-hidden bg-[var(--background)] ${className}`}>
      {/* Custom Toolbar for Layouts & Mode Switch */}
      <div className="flex flex-wrap items-center justify-between p-2 bg-[var(--secondary)]/5 border-b border-[var(--secondary)]/20 gap-2">
        <div className="flex items-center gap-2">
           <div className="text-xs font-semibold text-[var(--secondary)] uppercase tracking-wider mr-2">Insert Layout:</div>
           {templates.map((t) => (
             <button
               key={t.name}
               type="button"
               onClick={() => insertHtml(t.html)}
               className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-[var(--background)] border border-[var(--secondary)]/20 rounded hover:bg-[var(--secondary)]/10 hover:border-[var(--brand)] transition-all text-[var(--foreground)]"
               title={`Insert ${t.name}`}
             >
               {t.icon}
               <span>{t.name}</span>
             </button>
           ))}
           
           {onImageUpload && (
             <>
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  className="hidden" 
                  accept="image/*" 
                  onChange={handleFileChange} 
                />
                <button
                  type="button"
                  onClick={handleImageClick}
                  disabled={uploading}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-[var(--background)] border border-[var(--secondary)]/20 rounded hover:bg-[var(--secondary)]/10 hover:border-[var(--brand)] transition-all text-[var(--foreground)]"
                  title="Insert Image"
                >
                  {uploading ? <div className="h-3.5 w-3.5 animate-spin border-2 border-current border-t-transparent rounded-full" /> : <ImageIcon className="h-4 w-4" />}
                  <span>Image</span>
                </button>
             </>
           )}
        </div>

        <div className="flex items-center gap-2 bg-[var(--background)] rounded-md border border-[var(--secondary)]/20 p-1">
          <button
            type="button"
            onClick={() => setMode('visual')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded transition-colors ${
              mode === 'visual' 
                ? 'bg-[var(--brand)] text-[var(--background)]' 
                : 'text-[var(--secondary)] hover:bg-[var(--secondary)]/10'
            }`}
          >
            <Eye className="h-3.5 w-3.5" />
            Visual
          </button>
          <button
            type="button"
            onClick={() => setMode('code')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded transition-colors ${
              mode === 'code' 
                ? 'bg-[var(--brand)] text-[var(--background)]' 
                : 'text-[var(--secondary)] hover:bg-[var(--secondary)]/10'
            }`}
          >
            <Code className="h-3.5 w-3.5" />
            Code
          </button>
        </div>
      </div>

      {/* Editor Area */}
      <div className="relative min-h-[400px]">
        {mode === 'visual' ? (
          <div className="quill-wrapper">
             <ReactQuill
                theme="snow"
                value={internalValue}
                onChange={handleChange}
                modules={MODULES}
                formats={FORMATS}
                className="h-full min-h-[400px] text-[var(--foreground)]"
             />
             <style jsx global>{`
                .quill-wrapper .ql-container {
                    min-h: 400px;
                    font-size: 1rem;
                    border: none !important;
                }
                .quill-wrapper .ql-toolbar {
                    border: none !important;
                    border-bottom: 1px solid rgba(0,0,0,0.1) !important;
                    background: var(--background);
                }
                .quill-wrapper .ql-editor {
                    min-h: 400px;
                    background: var(--background);
                    color: var(--foreground);
                }
             `}</style>
          </div>
        ) : (
          <textarea
            value={internalValue}
            onChange={(e) => handleChange(e.target.value)}
            className="code-editor-textarea w-full h-full min-h-[400px] p-4 font-mono text-sm bg-slate-900 text-slate-50 focus:outline-none resize-y"
            placeholder="Write HTML or Markdown here..."
          />
        )}
      </div>
      
      {/* Cropper Modal */}
      {cropImageSrc && (
        <ImageCropperModal
          imageSrc={cropImageSrc}
          onCancel={handleCropCancel}
          onCropComplete={handleCropComplete}
        />
      )}
    </div>
  );
}
