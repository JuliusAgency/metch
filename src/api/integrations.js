import { supabase, uploadFile, getFileUrl, deleteFile } from './supabaseClient';

// Core integration wrapper
export const Core = {
  // Database operations through supabase
  db: supabase,

  // Storage operations
  storage: {
    uploadFile,
    getFileUrl,
    deleteFile
  }
};

// LLM Integration using OpenAI API
export const InvokeLLM = async (prompt, options = {}) => {
  const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('OpenAI API key not configured');
  }

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: options.model || 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: options.maxTokens || 1000,
      temperature: options.temperature || 0.7,
    }),
  });

  if (!response.ok) {
    throw new Error(`OpenAI API error: ${response.status}`);
  }

  const data = await response.json();
  return {
    text: data.choices[0].message.content,
    usage: data.usage,
    model: data.model
  };
};

// Email Integration using Resend API
export const SendEmail = async (to, subject, html, options = {}) => {
  const apiKey = import.meta.env.VITE_RESEND_API_KEY;
  if (!apiKey) {
    throw new Error('Resend API key not configured');
  }

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      from: options.from || 'noreply@yourapp.com',
      to: Array.isArray(to) ? to : [to],
      subject,
      html,
      ...(options.replyTo && { reply_to: options.replyTo }),
      ...(options.cc && { cc: options.cc }),
      ...(options.bcc && { bcc: options.bcc }),
    }),
  });

  if (!response.ok) {
    throw new Error(`Email API error: ${response.status}`);
  }

  const data = await response.json();
  return data;
};

// File Upload using Supabase Storage
export const UploadFile = async (file, options = {}) => {
  const bucket = options.bucket || 'uploads';
  const fileName = options.fileName || `${Date.now()}-${file.name}`;

  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(fileName, file, {
      cacheControl: '3600',
      upsert: false
    });

  if (error) throw error;

  return {
    path: data.path,
    fullPath: data.fullPath,
    url: getFileUrl(bucket, fileName)
  };
};

// Generate Image using OpenAI DALL-E
export const GenerateImage = async (prompt, options = {}) => {
  const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('OpenAI API key not configured');
  }

  const response = await fetch('https://api.openai.com/v1/images/generations', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: options.model || 'dall-e-3',
      prompt,
      n: options.n || 1,
      size: options.size || '1024x1024',
      quality: options.quality || 'standard',
      style: options.style || 'vivid',
    }),
  });

  if (!response.ok) {
    throw new Error(`OpenAI Image API error: ${response.status}`);
  }

  const data = await response.json();
  return {
    images: data.data.map(item => ({
      url: item.url,
      revisedPrompt: item.revised_prompt
    }))
  };
};

// Extract data from uploaded file (placeholder implementation)
export const ExtractDataFromUploadedFile = async (fileUrl, options = {}) => {
  // This is a placeholder implementation
  // In a real scenario, you might use OCR services or AI to extract data
  // For now, return basic file info

  return {
    fileName: fileUrl.split('/').pop(),
    fileSize: 'unknown',
    extractedText: 'Text extraction not implemented yet',
    metadata: {
      uploadedAt: new Date().toISOString(),
      ...options
    }
  };
};

// Create signed URL for private files
export const CreateFileSignedUrl = async (bucket, fileName, expiresIn = 3600) => {
  const { data, error } = await supabase.storage
    .from(bucket)
    .createSignedUrl(fileName, expiresIn);

  if (error) throw error;
  return data.signedUrl;
};

// Upload private file
export const UploadPrivateFile = async (file, options = {}) => {
  const bucket = options.bucket || 'private';
  const fileName = options.fileName || `${Date.now()}-${file.name}`;

  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(fileName, file, {
      cacheControl: '3600',
      upsert: false
    });

  if (error) throw error;

  // Create signed URL for private access
  const signedUrl = await CreateFileSignedUrl(bucket, fileName, options.expiresIn || 3600);

  return {
    path: data.path,
    fullPath: data.fullPath,
    url: signedUrl
  };
};






