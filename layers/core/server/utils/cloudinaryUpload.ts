/**
 * Shared server-side Cloudinary upload — the same REST call used by
 * media/upload.post.ts (a multipart file from the client), factored out so
 * other server code that already has raw bytes (e.g. a re-uploaded remote
 * image) doesn't have to duplicate the request-building logic.
 */

export interface CloudinaryUploadResult {
  url: string
  public_id: string
  type: 'IMAGE' | 'VIDEO' | 'AUDIO'
}

export async function uploadBufferToCloudinary(
  buffer: Buffer,
  mimeType: string,
  filename: string,
): Promise<CloudinaryUploadResult> {
  const config = useRuntimeConfig()
  const cloudName = config.public.cloudName
  const uploadPreset = config.public.cloudinaryUploadPreset

  if (!cloudName) {
    throw new Error('Cloudinary not configured')
  }

  const isAudio = mimeType.startsWith('audio/')
  const resourceType =
    mimeType.startsWith('video/') || isAudio ? 'video' : 'image'
  const mediaType: CloudinaryUploadResult['type'] = isAudio
    ? 'AUDIO'
    : resourceType === 'video'
      ? 'VIDEO'
      : 'IMAGE'

  const uploadFormData = new FormData()
  const blob = new Blob([new Uint8Array(buffer)], { type: mimeType })
  uploadFormData.append('file', blob, filename)
  uploadFormData.append('folder', 'reelshop')

  if (uploadPreset) {
    uploadFormData.append('upload_preset', uploadPreset)
  }

  const uploadUrl = `https://api.cloudinary.com/v1_1/${cloudName}/${resourceType}/upload`

  const cloudinaryApiKey = config.public.CloudinaryApiKey
  const cloudinaryApiSecret = config.private?.cloudinary?.apiSecret

  if (cloudinaryApiKey && cloudinaryApiSecret && !uploadPreset) {
    const timestamp = Math.round(Date.now() / 1000)
    uploadFormData.append('api_key', cloudinaryApiKey)
    uploadFormData.append('timestamp', timestamp.toString())
  }

  const uploadResult = await $fetch<{
    secure_url: string
    public_id: string
  }>(uploadUrl, {
    method: 'POST',
    body: uploadFormData,
  })

  return {
    url: uploadResult.secure_url,
    public_id: uploadResult.public_id,
    type: mediaType,
  }
}
