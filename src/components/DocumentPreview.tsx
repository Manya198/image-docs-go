import { useState } from 'react';
import { FileText, Download, Edit, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { generatePDF, generateTextFile, type DocumentOptions, type DocumentSection } from '@/lib/pdfGenerator';
import { UploadedFile } from './ImageUpload';

interface DocumentPreviewProps {
  files: UploadedFile[];
}

export const DocumentPreview = ({ files }: DocumentPreviewProps) => {
  const [documentTitle, setDocumentTitle] = useState('Extracted Document');
  const [author, setAuthor] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [editedSections, setEditedSections] = useState<{ [key: string]: string }>({});

  const completedFiles = files.filter(file => file.status === 'completed' && file.extractedText);

  const handleSectionEdit = (fileId: string, newText: string) => {
    setEditedSections(prev => ({ ...prev, [fileId]: newText }));
  };

  const getSectionContent = (file: UploadedFile): string => {
    return editedSections[file.id] || file.extractedText || '';
  };

  const exportToPDF = () => {
    const sections: DocumentSection[] = completedFiles.map((file, index) => ({
      title: `Section ${index + 1} - ${file.file.name}`,
      content: getSectionContent(file)
    }));

    const options: DocumentOptions = {
      title: documentTitle,
      author: author || undefined,
      subject: 'Document extracted from images using OCR',
      sections
    };

    generatePDF(options);
  };

  const exportToText = () => {
    const sections: DocumentSection[] = completedFiles.map((file, index) => ({
      title: `Section ${index + 1} - ${file.file.name}`,
      content: getSectionContent(file)
    }));

    const options: DocumentOptions = {
      title: documentTitle,
      author: author || undefined,
      subject: 'Document extracted from images using OCR',
      sections
    };

    generateTextFile(options);
  };

  if (completedFiles.length === 0) {
    return (
      <Card className="text-center py-12">
        <CardContent>
          <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No Document Ready</h3>
          <p className="text-muted-foreground">
            Upload and process images to generate a document preview.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Document Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Document Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="title">Document Title</Label>
            <Input
              id="title"
              value={documentTitle}
              onChange={(e) => setDocumentTitle(e.target.value)}
              placeholder="Enter document title..."
            />
          </div>
          <div>
            <Label htmlFor="author">Author (Optional)</Label>
            <Input
              id="author"
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
              placeholder="Enter author name..."
            />
          </div>
        </CardContent>
      </Card>

      {/* Document Preview */}
      <Card className="bg-gradient-document shadow-document">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Document Preview</CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsEditing(!isEditing)}
            className="gap-2"
          >
            {isEditing ? <Eye className="w-4 h-4" /> : <Edit className="w-4 h-4" />}
            {isEditing ? 'Preview' : 'Edit'}
          </Button>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Document Header */}
          <div className="text-center pb-4 border-b">
            <h1 className="text-2xl font-bold mb-2">{documentTitle}</h1>
            {author && <p className="text-muted-foreground">by {author}</p>}
            <p className="text-sm text-muted-foreground mt-2">
              Generated on {new Date().toLocaleDateString()}
            </p>
          </div>

          {/* Document Sections */}
          <div className="space-y-8">
            {completedFiles.map((file, index) => (
              <div key={file.id} className="space-y-3">
                <h2 className="text-lg font-semibold text-primary">
                  Section {index + 1} - {file.file.name}
                </h2>
                
                {isEditing ? (
                  <Textarea
                    value={getSectionContent(file)}
                    onChange={(e) => handleSectionEdit(file.id, e.target.value)}
                    className="min-h-32 font-mono text-sm"
                    placeholder="Edit extracted text..."
                  />
                ) : (
                  <div className="bg-card p-4 rounded-lg border">
                    <p className="whitespace-pre-wrap leading-relaxed">
                      {getSectionContent(file) || 'No text extracted from this image.'}
                    </p>
                  </div>
                )}
                
                {index < completedFiles.length - 1 && <Separator className="mt-6" />}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Export Options */}
      <Card>
        <CardHeader>
          <CardTitle>Export Document</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            <Button onClick={exportToPDF} className="gap-2">
              <Download className="w-4 h-4" />
              Download PDF
            </Button>
            <Button variant="outline" onClick={exportToText} className="gap-2">
              <Download className="w-4 h-4" />
              Download Text
            </Button>
          </div>
          <p className="text-sm text-muted-foreground mt-3">
            Export your extracted document in PDF or plain text format.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};