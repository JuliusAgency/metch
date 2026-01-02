import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { UploadFile } from "@/api/integrations";
import { Upload, FileText, CheckCircle } from "lucide-react";

export default function JobApplicationModal({ open, onOpenChange, job, onSubmit }) {
  const [formData, setFormData] = useState({
    cover_letter: "",
    resume_url: ""
  });
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleFileUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const { file_url } = await UploadFile({ file });
      setFormData(prev => ({ ...prev, resume_url: file_url }));
    } catch (error) {
      console.error("Error uploading file:", error);
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      await onSubmit(formData);
      setFormData({ cover_letter: "", resume_url: "" });
    } catch (error) {
      console.error("Error submitting application:", error);
    } finally {
      setSubmitting(false);
    }
  };

  if (!job) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold gradient-text">
            Apply to {job.title}
          </DialogTitle>
          <p className="text-gray-600">at {job.company}</p>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="cover_letter" className="font-medium text-gray-700">
              Cover Letter
            </Label>
            <Textarea
              id="cover_letter"
              value={formData.cover_letter}
              onChange={(e) => setFormData(prev => ({ ...prev, cover_letter: e.target.value }))}
              placeholder="Tell the employer why you're perfect for this role..."
              className="min-h-32 border-blue-200 focus:border-blue-400"
              required
            />
          </div>

          <div className="space-y-2">
            <Label className="font-medium text-gray-700">Resume</Label>
            {formData.resume_url ? (
              <div className="p-4 border border-green-200 rounded-lg bg-green-50 flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <span className="text-green-700 font-medium">Resume uploaded successfully</span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setFormData(prev => ({ ...prev, resume_url: "" }))}
                >
                  Remove
                </Button>
              </div>
            ) : (
              <div className="border-2 border-dashed border-blue-200 rounded-lg p-6 text-center hover:border-blue-300 transition-colors">
                <input
                  type="file"
                  accept=".pdf,.doc,.docx"
                  onChange={handleFileUpload}
                  className="hidden"
                  id="resume-upload"
                  disabled={uploading}
                />
                <label
                  htmlFor="resume-upload"
                  className="cursor-pointer flex flex-col items-center gap-2"
                >
                  {uploading ? (
                    <div className="w-8 h-8 border-t-2 border-blue-600 rounded-full animate-spin"></div>
                  ) : (
                    <Upload className="w-8 h-8 text-blue-500" />
                  )}
                  <span className="font-medium text-gray-700">
                    {uploading ? "Uploading..." : "Upload your resume"}
                  </span>
                  <span className="text-sm text-gray-500">PDF, DOC, or DOCX (max 10MB)</span>
                </label>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={submitting || !formData.resume_url}
              className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700"
            >
              {submitting ? "Submitting..." : "Submit Application"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}