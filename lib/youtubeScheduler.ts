import fs from 'fs';
import { google } from 'googleapis';

interface ScheduleOptions {
  videoPath: string;
  thumbnailPath: string;
  title: string;
  description: string;
  keywords: string[];
  publishAt?: string;
}

type ScheduleResult =
  | {
      success: true;
      videoId?: string;
      videoUrl?: string;
    }
  | {
      success: false;
      reason: string;
    };

export const scheduleToYouTube = async ({
  videoPath,
  thumbnailPath,
  title,
  description,
  keywords,
  publishAt
}: ScheduleOptions): Promise<ScheduleResult> => {
  try {
    const clientId = process.env.YOUTUBE_CLIENT_ID;
    const clientSecret = process.env.YOUTUBE_CLIENT_SECRET;
    const refreshToken = process.env.YOUTUBE_REFRESH_TOKEN;

    if (!clientId || !clientSecret || !refreshToken) {
      return {
        success: false as const,
        reason: 'Missing YouTube OAuth credentials. Set YOUTUBE_CLIENT_ID, YOUTUBE_CLIENT_SECRET, YOUTUBE_REFRESH_TOKEN.'
      };
    }

    const oauth = new google.auth.OAuth2(clientId, clientSecret);
    oauth.setCredentials({ refresh_token: refreshToken });
    const youtube = google.youtube({ version: 'v3', auth: oauth });

    const requestBody = {
      snippet: {
        title,
        description,
        tags: keywords
      },
      status: {
        privacyStatus: 'private' as const,
        selfDeclaredMadeForKids: false
      }
    };

    if (publishAt) {
      Object.assign(requestBody.status, {
        privacyStatus: 'private' as const,
        publishAt
      });
    }

    const uploadResponse = await youtube.videos.insert({
      part: ['snippet', 'status'],
      requestBody,
      media: {
        body: fs.createReadStream(videoPath)
      },
      notifySubscribers: false
    });

    const videoId = uploadResponse.data.id ?? undefined;

    if (videoId && thumbnailPath) {
      await youtube.thumbnails.set({
        videoId,
        media: {
          body: fs.createReadStream(thumbnailPath)
        }
      });
    }

    if (publishAt && videoId) {
      await youtube.videos.update({
        part: ['status'],
        requestBody: {
          id: videoId,
          status: {
            privacyStatus: 'private',
            publishAt
          }
        }
      });
    }

    return {
      success: true as const,
      videoId,
      videoUrl: videoId ? `https://youtube.com/watch?v=${videoId}` : undefined
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to schedule video';
    return {
      success: false as const,
      reason: message
    };
  }
};
