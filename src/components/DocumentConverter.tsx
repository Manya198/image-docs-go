import { useState } from 'react';
import { ImageUpload, type UploadedFile } from './ImageUpload';
import { DocumentPreview } from './DocumentPreview';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Zap, FileText, CheckCircle, AlertCircle } from 'lucide-react';
import { initializeOCR, extractTextFromImage, loadImage } from '@/lib/ocrService';
import { toast } from 'sonner';

export const DocumentConverter = () => {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingProgress, setProcessingProgress] = useState(0);
  const [ocrInitialized, setOcrInitialized] = useState(false);

  const handleFilesAdded = (newFiles: UploadedFile[]) => {
    setFiles(prev => [...prev, ...newFiles]);
  };

  const handleFileRemove = (id: string) => {
    setFiles(prev => prev.filter(file => file.id !== id));
  };

  const processImages = async () => {
    if (files.length === 0) {
      toast.error('Please upload some images first');
      return;
    }

    setIsProcessing(true);
    setProcessingProgress(0);

    try {
      // Initialize OCR if not already done
      if (!ocrInitialized) {
        toast.info('Initializing OCR engine...');
        await initializeOCR();
        setOcrInitialized(true);
      }

      const pendingFiles = files.filter(file => file.status === 'pending');
      
      if (pendingFiles.length === 0) {
        toast.info('All images have already been processed');
        setIsProcessing(false);
        return;
      }

      // Process each file
      for (let i = 0; i < pendingFiles.length; i++) {
        const file = pendingFiles[i];
        
        // Update file status to processing
        setFiles(prev => prev.map(f => 
          f.id === file.id ? { ...f, status: 'processing' } : f
        ));

        try {
          // Load and process image
          const imageElement = await loadImage(file.file);
          const result = await extractTextFromImage(imageElement);
          
          // Update file with extracted text
          setFiles(prev => prev.map(f => 
            f.id === file.id 
              ? { ...f, status: 'completed', extractedText: result.text }
              : f
          ));

          toast.success(`Extracted text from ${file.file.name}`);
        } catch (error) {
          console.error(`Error processing ${file.file.name}:`, error);
          
          // Update file status to error
          setFiles(prev => prev.map(f => 
            f.id === file.id ? { ...f, status: 'error' } : f
          ));

          toast.error(`Failed to process ${file.file.name}`);
        }

        // Update progress
        setProcessingProgress(((i + 1) / pendingFiles.length) * 100);
      }

      toast.success('All images processed successfully!');
    } catch (error) {
      console.error('Error during processing:', error);
      toast.error('Failed to process images');
    } finally {
      setIsProcessing(false);
      setProcessingProgress(0);
    }
  };

  const getStatusCounts = () => {
    const pending = files.filter(f => f.status === 'pending').length;
    const processing = files.filter(f => f.status === 'processing').length;
    const completed = files.filter(f => f.status === 'completed').length;
    const error = files.filter(f => f.status === 'error').length;
    
    return { pending, processing, completed, error };
  };

  const statusCounts = getStatusCounts();

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center gap-3 mb-4">
          <div className="p-3 bg-gradient-primary rounded-full shadow-glow">
            <FileText className="w-8 h-8 text-primary-foreground" />
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Document Converter
          </h1>
        </div>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Transform your images into beautiful, shareable documents using advanced OCR technology
        </p>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Left Column - Upload and Processing */}
        <div className="space-y-6">
          <ImageUpload 
            onFilesAdded={handleFilesAdded}
            files={files}
            onFileRemove={handleFileRemove}
          />

          {files.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="w-5 h-5" />
                  Processing Status
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Status Summary */}
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-muted"></div>
                    <span>Pending: {statusCounts.pending}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-warning animate-pulse"></div>
                    <span>Processing: {statusCounts.processing}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-success" />
                    <span>Completed: {statusCounts.completed}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-destructive" />
                    <span>Errors: {statusCounts.error}</span>
                  </div>
                </div>

                {/* Progress Bar */}
                {isProcessing && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Processing images...</span>
                      <span>{Math.round(processingProgress)}%</span>
                    </div>
                    <Progress value={processingProgress} className="h-2" />
                  </div>
                )}

                {/* Process Button */}
                <Button 
                  onClick={processImages}
                  disabled={isProcessing || statusCounts.pending === 0}
                  variant="gradient"
                  className="w-full"
                >
                  {isProcessing ? (
                    <>
                      <div className="w-4 h-4 border-2 border-current border-t-transparent animate-spin rounded-full"></div>
                      Processing Images...
                    </>
                  ) : (
                    <>
                      <Zap className="w-4 h-4" />
                      Extract Text from Images
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right Column - Document Preview */}
        <div>
          <DocumentPreview files={files} />
        </div>
      </div>
    </div>
  );
};