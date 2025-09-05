import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, X, FileImage } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';

export interface UploadedFile {
  id: string;
  file: File;
  preview: string;
  status: 'pending' | 'processing' | 'completed' | 'error';
  extractedText?: string;
}

interface ImageUploadProps {
  onFilesAdded: (files: UploadedFile[]) => void;
  files: UploadedFile[];
  onFileRemove: (id: string) => void;
}

export const ImageUpload = ({ onFilesAdded, files, onFileRemove }: ImageUploadProps) => {
  const [uploadProgress, setUploadProgress] = useState(0);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const validFiles = acceptedFiles.filter(file => {
      if (!file.type.startsWith('image/')) {
        toast.error(`${file.name} is not a valid image file`);
        return false;
      }
      if (file.size > 10 * 1024 * 1024) { // 10MB limit
        toast.error(`${file.name} is too large (max 10MB)`);
        return false;
      }
      return true;
    });

    if (validFiles.length === 0) return;

    setUploadProgress(0);
    const uploadedFiles: UploadedFile[] = [];

    validFiles.forEach((file, index) => {
      const reader = new FileReader();
      reader.onload = () => {
        const uploadedFile: UploadedFile = {
          id: `${Date.now()}-${index}`,
          file,
          preview: reader.result as string,
          status: 'pending'
        };
        
        uploadedFiles.push(uploadedFile);
        setUploadProgress(((index + 1) / validFiles.length) * 100);
        
        if (uploadedFiles.length === validFiles.length) {
          onFilesAdded(uploadedFiles);
          setUploadProgress(0);
          toast.success(`${validFiles.length} image(s) uploaded successfully!`);
        }
      };
      reader.readAsDataURL(file);
    });
  }, [onFilesAdded]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.bmp', '.webp']
    },
    multiple: true
  });

  return (
    <div className="space-y-6">
      <Card 
        {...getRootProps()} 
        className={`
          relative overflow-hidden cursor-pointer transition-all duration-300
          ${isDragActive 
            ? 'border-primary bg-primary/5 shadow-upload scale-[1.02]' 
            : 'border-dashed border-2 hover:border-primary/50 hover:shadow-document'
          }
        `}
      >
        <input {...getInputProps()} />
        <div className="flex flex-col items-center justify-center py-12 px-6">
          <div className={`
            p-4 rounded-full mb-4 transition-all duration-300
            ${isDragActive 
              ? 'bg-primary text-primary-foreground shadow-glow' 
              : 'bg-gradient-primary text-primary-foreground'
            }
          `}>
            <Upload className="w-8 h-8" />
          </div>
          
          <h3 className="text-xl font-semibold mb-2">
            {isDragActive ? 'Drop your images here' : 'Upload Images'}
          </h3>
          
          <p className="text-muted-foreground text-center max-w-sm">
            Drag and drop your images here, or click to browse. 
            Supports PNG, JPG, GIF, and more formats.
          </p>
          
          <div className="flex items-center gap-2 mt-4 text-sm text-muted-foreground">
            <FileImage className="w-4 h-4" />
            <span>Max 10MB per image • Multiple files supported</span>
          </div>
        </div>
        
        {uploadProgress > 0 && (
          <div className="absolute bottom-0 left-0 right-0">
            <Progress value={uploadProgress} className="h-1 rounded-none" />
          </div>
        )}
      </Card>

      {files.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {files.map((file) => (
            <Card key={file.id} className="relative group overflow-hidden">
              <div className="aspect-square bg-muted rounded-lg overflow-hidden">
                <img 
                  src={file.preview} 
                  alt={file.file.name}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
              </div>
              
              <div className="p-3">
                <p className="text-sm font-medium truncate" title={file.file.name}>
                  {file.file.name}
                </p>
                <p className="text-xs text-muted-foreground">
                  {(file.file.size / 1024 / 1024).toFixed(1)} MB
                </p>
                
                <div className="flex items-center justify-between mt-2">
                  <span className={`
                    text-xs px-2 py-1 rounded-full font-medium
                    ${file.status === 'completed' ? 'bg-success/10 text-success' : 
                      file.status === 'processing' ? 'bg-warning/10 text-warning' :
                      file.status === 'error' ? 'bg-destructive/10 text-destructive' :
                      'bg-muted text-muted-foreground'
                    }
                  `}>
                    {file.status}
                  </span>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onFileRemove(file.id)}
                    className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};