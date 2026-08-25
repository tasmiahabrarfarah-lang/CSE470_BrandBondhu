import axios from 'axios';

// FR-4: Multi-Platform Content Publishing Connection Layer
// This service acts as the bridge to Facebook/Instagram Graph APIs.

export const publishToFacebook = async (pageAccessToken, pageId, message, mediaUrl = null) => {
  try {
    const baseUrl = `https://graph.facebook.com/v19.0/${pageId}`;
    
    // If media is provided, post a photo
    if (mediaUrl) {
      const response = await axios.post(`${baseUrl}/photos`, {
        url: mediaUrl,
        message: message,
        access_token: pageAccessToken
      });
      return { success: true, providerId: response.data.id };
    } else {
      // Text only post
      const response = await axios.post(`${baseUrl}/feed`, {
        message: message,
        access_token: pageAccessToken
      });
      return { success: true, providerId: response.data.id };
    }
  } catch (error) {
    console.error('Facebook publish error:', error?.response?.data || error.message);
    return { 
      success: false, 
      error: error?.response?.data?.error?.message || error.message 
    };
  }
};

export const replyToFacebookComment = async (pageAccessToken, commentId, message) => {
  try {
    const response = await axios.post(`https://graph.facebook.com/v19.0/${commentId}/comments`, {
      message: message,
      access_token: pageAccessToken
    });
    return { success: true, providerId: response.data.id };
  } catch (error) {
    console.error('Facebook reply error:', error?.response?.data || error.message);
    return { 
      success: false, 
      error: error?.response?.data?.error?.message || error.message 
    };
  }
};
