import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const jnid = formData.get('jnid') as string;
    const fileName = formData.get('fileName') as string;

    // Validate required fields
    if (!file || !jnid || !fileName) {
      return NextResponse.json(
        { error: 'File, customer JNID, and file name are required' },
        { status: 400 }
      );
    }

    const jnApiKey = process.env.JOBNIMBUS_API_KEY;
    if (!jnApiKey) {
      return NextResponse.json(
        { error: 'JobNimbus API key not configured' },
        { status: 500 }
      );
    }

    // Step 1: Get presigned URL for file upload
    console.log(`Requesting presigned URL for file: ${fileName}`);

    const presignedUrlResponse = await fetch(
      'https://api.jobnimbus.com/files/v1/uploads/url',
      {
        method: 'POST',
        headers: {
          Authorization: `bearer ${jnApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          filename: fileName,
          key: `${jnid}/${fileName}`,
        }),
      }
    );

    if (!presignedUrlResponse.ok) {
      const errorData = await presignedUrlResponse.text();
      console.error(`Failed to get presigned URL (${presignedUrlResponse.status}):`, errorData);
      throw new Error(`Failed to get upload URL from JobNimbus: ${presignedUrlResponse.status}`);
    }

    const urlData = await presignedUrlResponse.json();
    console.log(`Presigned URL response received`);
    const presignedUrl = (urlData as any).data?.url;
    const fileJnid = (urlData as any).data?.jnid;

    if (!presignedUrl || !fileJnid) {
      console.error('Invalid presigned URL response:', JSON.stringify(urlData).substring(0, 500));
      throw new Error('Invalid response from JobNimbus: missing URL or file JNID');
    }

    console.log(`Got presigned URL, file JNID: ${fileJnid}`);

    // Step 2: Upload file to presigned URL
    const fileBuffer = await file.arrayBuffer();

    console.log(`Uploading file to presigned URL, size: ${fileBuffer.byteLength} bytes`);

    const uploadResponse = await fetch(presignedUrl, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/octet-stream',
      },
      body: fileBuffer,
    });

    if (!uploadResponse.ok) {
      const errorData = await uploadResponse.text();
      console.error(`Failed to upload file (${uploadResponse.status}):`, errorData);
      throw new Error(`Failed to upload file to JobNimbus: ${uploadResponse.status}`);
    }

    console.log('File uploaded successfully to S3');

    // Step 3: Link the file to the contact by updating the file record
    // Use PUT to update the file with contact association
    console.log(`Linking file ${fileJnid} to contact ${jnid}`);

    const linkFileResponse = await fetch(
      `https://app.jobnimbus.com/api1/files/${fileJnid}`,
      {
        method: 'PUT',
        headers: {
          Authorization: `bearer ${jnApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          primary: {
            id: jnid,
            type: 'contact',
          },
          type: 'Document',
        }),
      }
    );

    if (!linkFileResponse.ok) {
      const errorData = await linkFileResponse.text();
      console.warn(`File linking returned ${linkFileResponse.status}:`, errorData);
      // Continue anyway - the file is still uploaded to S3 and accessible
    } else {
      const linkResult = await linkFileResponse.json();
      console.log('File linked to contact successfully:', linkResult);
    }

    return NextResponse.json({
      success: true,
      message: 'Scope document uploaded to JobNimbus successfully',
      fileJnid: fileJnid,
    });
  } catch (error) {
    console.error('Error uploading to JobNimbus:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to upload to JobNimbus' },
      { status: 500 }
    );
  }
}
