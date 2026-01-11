import { supabase } from './supabaseClient';



/**
 * Invoke LLM (OpenAI) integration
 * @param {Object} params - LLM parameters
 * @param {string} params.prompt - The prompt to send
 * @param {string} params.model - The model to use (default: gpt-3.5-turbo)
 * @param {number} params.temperature - Temperature setting
 * @param {number} params.max_tokens - Max tokens in response
 * @returns {Promise<Object>} LLM response
 */
export async function InvokeLLM({
  prompt,
  model = 'gpt-3.5-turbo',
  temperature = 0.7,
  max_tokens = 1000,
  messages = null
}) {
  const apiKey = import.meta.env.VITE_OPENAI_API_KEY;

  if (!apiKey) {
    throw new Error('VITE_OPENAI_API_KEY environment variable is not set');
  }

  const requestBody = {
    model,
    temperature,
    max_tokens,
  };

  if (messages) {
    requestBody.messages = messages;
  } else {
    requestBody.messages = [{ role: 'user', content: prompt }];
  }

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify(requestBody)
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    console.error('OpenAI API Error Details:', {
      status: response.status,
      statusText: response.statusText,
      data: errorData
    });
    throw new Error(`OpenAI API error: ${response.status} ${response.statusText} - ${JSON.stringify(errorData)}`);
  }

  const data = await response.json();
  return {
    content: data.choices[0].message.content,
    usage: data.usage,
    model: data.model
  };
}

/**
 * Send email using Resend
 * @param {Object} params - Email parameters
 * @param {string} params.to - Recipient email
 * @param {string} params.from - Sender email
 * @param {string} params.subject - Email subject
 * @param {string} params.html - HTML content
 * @param {string} params.text - Plain text content
 * @returns {Promise<Object>} Send result
 */
export async function SendEmail({ to, from, subject, html, text, attachments }) {
  const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-email`;
  const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${anonKey}`,
      'apikey': anonKey
    },
    body: JSON.stringify({
      to,
      from,
      subject,
      html,
      text,
      attachments
    })
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    console.error('Email Function Error Details:', errorData);
    const errorMessage = errorData.error || response.statusText;
    throw new Error(`Failed to send email: ${errorMessage}`);
  }

  return await response.json();
}

/**
 * Upload file to Supabase Storage (public)
 * @param {Object} params - Upload parameters
 * @param {File} params.file - The file to upload
 * @param {string} params.bucket - Storage bucket name
 * @param {string} params.path - File path in bucket
 * @returns {Promise<Object>} Upload result with public URL
 */
export async function UploadFile({ file, bucket = 'public-files', path }) {
  const fileName = path || `${Date.now()}-${file.name}`;

  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(fileName, file, {
      cacheControl: '3600',
      upsert: false
    });

  if (error) {
    throw error;
  }

  const { data: { publicUrl } } = supabase.storage
    .from(bucket)
    .getPublicUrl(fileName);

  return {
    path: data.path,
    publicUrl,
    fullPath: data.fullPath
  };
}

/**
 * Upload private file to Supabase Storage
 * @param {Object} params - Upload parameters
 * @param {File} params.file - The file to upload
 * @param {string} params.bucket - Storage bucket name
 * @param {string} params.path - File path in bucket
 * @returns {Promise<Object>} Upload result
 */
export async function UploadPrivateFile({ file, bucket = 'private-files', path }) {
  const fileName = path || `${Date.now()}-${file.name}`;

  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(fileName, file, {
      cacheControl: '3600',
      upsert: false
    });

  if (error) {
    throw error;
  }

  return {
    path: data.path,
    fullPath: data.fullPath
  };
}

/**
 * Create signed URL for private file access
 * @param {Object} params - URL parameters
 * @param {string} params.bucket - Storage bucket name
 * @param {string} params.path - File path in bucket
 * @param {number} params.expiresIn - Expiration time in seconds (default: 3600)
 * @returns {Promise<Object>} Signed URL
 */
export async function CreateFileSignedUrl({ bucket = 'private-files', path, expiresIn = 3600 }) {
  const { data, error } = await supabase.storage
    .from(bucket)
    .createSignedUrl(path, expiresIn);

  if (error) {
    throw error;
  }

  return {
    signedUrl: data.signedUrl,
    path
  };
}

/**
 * Generate image using AI (placeholder implementation)
 * @param {Object} params - Image generation parameters
 * @param {string} params.prompt - Image generation prompt
 * @param {string} params.size - Image size (e.g., '1024x1024')
 * @returns {Promise<Object>} Generated image URL
 */
export async function GenerateImage({ prompt, size = '1024x1024', model = 'dall-e-2' }) {
  const apiKey = import.meta.env.VITE_OPENAI_API_KEY;

  if (!apiKey) {
    throw new Error('VITE_OPENAI_API_KEY environment variable is not set');
  }

  const response = await fetch('https://api.openai.com/v1/images/generations', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model,
      prompt,
      n: 1,
      size
    })
  });

  if (!response.ok) {
    throw new Error(`OpenAI API error: ${response.statusText}`);
  }

  const data = await response.json();
  return {
    url: data.data[0].url,
    prompt
  };
}

/**
 * Send WhatsApp message using Green API (via secure Edge Function)
 * @param {Object} params - Message parameters
 * @param {string} params.phoneNumber - Recipient phone number
 * @param {string} params.message - Message text
 * @returns {Promise<Object>} Send result
 */
export async function SendWhatsAppMessage({ phoneNumber, message }) {
  const { data, error } = await supabase.functions.invoke('send-whatsapp', {
    body: { phoneNumber, message }
  });

  if (error) {
    console.error('Error calling send-whatsapp function:', error);
    throw new Error(`Failed to send WhatsApp message: ${error.message}`);
  }

  return data;
}

/**
 * Extract data from uploaded file (e.g., PDF, images)
 * This would typically use an OCR or document parsing service
 * @param {Object} params - Extraction parameters
 * @param {string} params.fileUrl - URL of the file to extract from
 * @param {string} params.fileType - Type of file (pdf, image, etc.)
 * @returns {Promise<Object>} Extracted data
 */
export async function ExtractDataFromUploadedFile({ fileUrl, fileType }) {
  // This is a placeholder implementation
  // In production, you would integrate with services like:
  // - Google Cloud Vision API
  // - AWS Textract
  // - Azure Form Recognizer
  // - Or custom OCR solutions

  console.warn('ExtractDataFromUploadedFile is a placeholder. Implement with actual OCR/parsing service.');

  return {
    text: '',
    metadata: {
      fileUrl,
      fileType,
      extractedAt: new Date().toISOString()
    },
    warning: 'This is a placeholder implementation. Please integrate with an actual document parsing service.'
  };
}

/**
 * Invoke OpenAI Assistant
 * @param {Object} params - Parameters
 * @param {string} params.assistantId - The Assistant ID
 * @param {string} params.prompt - The user message
 * @returns {Promise<Object>} Assistant response
 */
export async function InvokeAssistant({
  assistantId,
  prompt
}) {
  const apiKey = import.meta.env.VITE_OPENAI_API_KEY;

  if (!apiKey) {
    throw new Error('VITE_OPENAI_API_KEY environment variable is not set');
  }

  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${apiKey}`,
    'OpenAI-Beta': 'assistants=v2'
  };

  // 1. Create Thread with Message
  const threadResponse = await fetch('https://api.openai.com/v1/threads', {
    method: 'POST',
    headers,
    body: JSON.stringify({
      messages: [{ role: 'user', content: prompt }]
    })
  });

  if (!threadResponse.ok) {
    const err = await threadResponse.json();
    throw new Error(`Failed to create thread: ${JSON.stringify(err)}`);
  }
  const thread = await threadResponse.json();

  // 2. Run Assistant
  const runResponse = await fetch(`https://api.openai.com/v1/threads/${thread.id}/runs`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ assistant_id: assistantId })
  });

  if (!runResponse.ok) {
    const err = await runResponse.json();
    throw new Error(`Failed to create run: ${JSON.stringify(err)}`);
  }
  const run = await runResponse.json();

  // 3. Poll for completion
  let runStatus = run.status;
  while (runStatus === 'queued' || runStatus === 'in_progress') {
    await new Promise(resolve => setTimeout(resolve, 1000));
    const statusResponse = await fetch(`https://api.openai.com/v1/threads/${thread.id}/runs/${run.id}`, {
      headers
    });
    const statusData = await statusResponse.json();
    runStatus = statusData.status;

    if (['failed', 'cancelled', 'expired'].includes(runStatus)) {
      throw new Error(`Assistant run failed: ${runStatus}`);
    }
  }

  // 4. Get Messages
  const messagesResponse = await fetch(`https://api.openai.com/v1/threads/${thread.id}/messages`, {
    headers
  });
  const messagesData = await messagesResponse.json();
  const lastMessage = messagesData.data.find(m => m.role === 'assistant');

  if (!lastMessage) {
    throw new Error('No response from assistant');
  }

  const content = lastMessage.content[0].text.value;

  return {
    content,
    threadId: thread.id
  };
}

/**
 * Core integration namespace
 */
export const Core = {
  InvokeLLM,
  SendEmail,
  UploadFile,
  GenerateImage,
  UploadPrivateFile,
  InvokeAssistant,
  SendWhatsAppMessage
};
