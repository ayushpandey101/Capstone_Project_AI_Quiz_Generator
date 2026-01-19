// backend/utils/contentFetcher.js
import axios from 'axios';

/**
 * Content Fetcher Service with 4-Section Categorization
 * Searches Google and YouTube for learning resources
 * Uses intelligent ranking algorithms to filter best results
 * Organizes results into: Academic, Learning Platforms, Technical Articles, Video Tutorials
 */

// Domain categorization maps for 4 distinct sections
const DOMAIN_CATEGORIES = {
  academic: [
    '.edu', 'scholar.google', 'arxiv.org', 'researchgate.net', 'ieee.org',
    'acm.org', 'springer.com', 'sciencedirect.com', 'jstor.org', 'pubmed.ncbi',
    'nature.com', 'journals.', 'academic.', 'research.', 'university.'
  ],
  learningPlatforms: [
    'coursera.org', 'udemy.com', 'edx.org', 'khanacademy.org', 'codecademy.com',
    'pluralsight.com', 'linkedin.com/learning', 'udacity.com', 'skillshare.com',
    'datacamp.com', 'treehouse', 'freecodecamp.org', 'exercism.org',
    'leetcode.com', 'hackerrank.com', 'codewars.com', 'scrimba.com'
  ],
  technicalArticles: [
    'docs.', 'developer.', 'dev.to', 'medium.com', 'hashnode.', 'stackoverflow.com',
    'github.com', 'mozilla.org', 'w3.org', 'tc39.es', 'blog.', 'engineering.',
    'tech.', 'developers.', 'w3schools.com', 'geeksforgeeks.org', 'tutorialspoint.com',
    'realpython.com', 'digitalocean.com', 'css-tricks.com', 'smashingmagazine.com'
  ],
  // Domains to exclude (spam, forums, social media, etc.)
  excluded: [
    'pinterest.com', 'facebook.com', 'twitter.com', 'instagram.com', 'tiktok.com',
    'reddit.com', 'quora.com', 'answers.', 'forum.', 'discussion.', 'chat.',
    'marketplace', 'shop.', 'store.', 'buy', 'download', 'crack', 'torrent',
    'pdf-download', 'free-download', 'warez', 'pirate'
  ]
};

/**
 * Validate URL quality and legitimacy
 */
const isValidURL = (url) => {
  try {
    const urlObj = new URL(url);
    const hostname = urlObj.hostname.toLowerCase();
    
    // Must be http/https
    if (!['http:', 'https:'].includes(urlObj.protocol)) return false;
    
    // Check against excluded domains
    for (const excluded of DOMAIN_CATEGORIES.excluded) {
      if (hostname.includes(excluded.toLowerCase())) return false;
    }
    
    // Check for spam patterns in URL
    const spamPatterns = ['?ref=', '&affiliate=', 'ad-click', 'redirect'];
    const urlString = url.toLowerCase();
    for (const pattern of spamPatterns) {
      if (urlString.includes(pattern)) return false;
    }
    
    return true;
  } catch {
    return false;
  }
};

/**
 * Categorize URL into one of 4 sections
 */
const categorizeURL = (url) => {
  const urlLower = url.toLowerCase();
  
  // Priority 1: Academic sources (highest authority)
  for (const domain of DOMAIN_CATEGORIES.academic) {
    if (urlLower.includes(domain.toLowerCase())) return 'academic';
  }
  
  // Priority 2: Learning platforms
  for (const domain of DOMAIN_CATEGORIES.learningPlatforms) {
    if (urlLower.includes(domain.toLowerCase())) return 'learningPlatform';
  }
  
  // Priority 3: Technical articles
  for (const domain of DOMAIN_CATEGORIES.technicalArticles) {
    if (urlLower.includes(domain.toLowerCase())) return 'technicalArticle';
  }
  
  // Default: Technical article if URL is valid
  return 'technicalArticle';
};

/**
 * Enhanced relevance scoring with spam detection
 */
const calculateRelevanceScore = (item, query) => {
  const queryWords = query.toLowerCase().split(/\s+/).filter(w => w.length >= 3);
  const title = (item.title || '').toLowerCase();
  const description = (item.snippet || item.description || '').toLowerCase();
  let score = 0;
  
  // Exact phrase match (highest priority - 40%)
  if (title.includes(query.toLowerCase())) score += 40;
  else if (description.includes(query.toLowerCase())) score += 25;
  
  // Individual word matches (30%)
  let titleMatches = 0;
  let descMatches = 0;
  queryWords.forEach(word => {
    if (title.includes(word)) titleMatches++;
    if (description.includes(word)) descMatches++;
  });
  score += (titleMatches / queryWords.length) * 20;
  score += (descMatches / queryWords.length) * 10;
  
  // Quality indicators (20%)
  const qualityKeywords = [
    'tutorial', 'guide', 'introduction', 'learn', 'course',
    'documentation', 'complete', 'comprehensive', 'official', 
    'beginner', 'step by step', 'explained'
  ];
  qualityKeywords.forEach(keyword => {
    if (title.includes(keyword)) score += 2;
    if (description.includes(keyword)) score += 1;
  });
  
  // Spam/clickbait detection (penalties)
  const spamKeywords = [
    'click here', 'download now', 'free download', 'crack', 'hack',
    'watch now', 'click to', 'amazing trick', 'one weird trick',
    'doctors hate', 'you won\'t believe', 'shocking'
  ];
  spamKeywords.forEach(spam => {
    if (title.includes(spam)) score -= 30;
    if (description.includes(spam)) score -= 20;
  });
  
  // Recency bonus (10%)
  if (item.publishedAt) {
    const daysOld = (Date.now() - new Date(item.publishedAt).getTime()) / (1000 * 60 * 60 * 24);
    if (daysOld < 180) score += 10; // Within 6 months
    else if (daysOld < 365) score += 5; // Within 1 year
  }
  
  return Math.max(0, Math.min(100, score));
};

export const searchGoogleContent = async (query, category = 'tutorial') => {
  try {
    const apiKey = process.env.GOOGLE_SEARCH_API_KEY;
    const cx = process.env.GOOGLE_SEARCH_CX;

    if (!apiKey || !cx) {
      return simulateGoogleSearch(query, category);
    }

    // Search with expanded results
    const response = await axios.get('https://www.googleapis.com/customsearch/v1', {
      params: {
        key: apiKey,
        cx: cx,
        q: `${query} tutorial programming learn`,
        num: 10,
      }
    });

    const items = response.data.items || [];
    
    // Validate, categorize, and score each result
    const processedResults = items
      .filter(item => isValidURL(item.link)) // Remove spam/invalid URLs
      .map(item => ({
        title: item.title,
        description: item.snippet,
        url: item.link,
        source: new URL(item.link).hostname,
        category: categorizeURL(item.link),
        relevanceScore: calculateRelevanceScore(item, query),
        publishedAt: item.pagemap?.metatags?.[0]?.['article:published_time'] || null,
        autoGenerated: true,
      }))
      .filter(item => item.relevanceScore >= 35); // Filter low-quality results
    
    return processedResults;
  } catch (error) {
    console.error('Google search error:', error.message);
    return simulateGoogleSearch(query, category);
  }
};

export const searchYouTubeVideos = async (query, videoType = 'all') => {
  try {
    const apiKey = process.env.YOUTUBE_API_KEY;

    if (!apiKey) {
      console.log('YouTube API key not configured, using simulation mode');
      return simulateYouTubeSearch(query);
    }

    // EDUCATIONAL FOCUS: Only search for learning/tutorial content
    const searchQueries = [
      `${query} tutorial`,
      `${query} course`,
      `learn ${query}`,
      `${query} full course`,
    ];

    let allVideos = [];
    let allPlaylists = [];

    // Search videos if needed
    if (videoType === 'all' || videoType === 'video') {
      for (const searchQuery of searchQueries.slice(0, 2)) { // Use first 2 to save API quota
        try {
          const response = await axios.get('https://www.googleapis.com/youtube/v3/search', {
            params: {
              key: apiKey,
              part: 'snippet',
              q: searchQuery,
              type: 'video',
              maxResults: 15,
              order: 'relevance',
              videoDuration: 'any',
              videoDefinition: 'any',
              videoEmbeddable: true,
              videoSyndicated: true,
              safeSearch: 'strict',
              relevanceLanguage: 'en',
            }
          });

          if (response.data.items) {
            allVideos = allVideos.concat(response.data.items);
          }
        } catch (err) {
          console.error(`YouTube video search failed for "${searchQuery}":`, err.message);
        }
      }
    }

    // Search playlists if needed
    if (videoType === 'all' || videoType === 'playlist') {
      try {
        const response = await axios.get('https://www.googleapis.com/youtube/v3/search', {
          params: {
            key: apiKey,
            part: 'snippet',
            q: `${query} course playlist`,
            type: 'playlist',
            maxResults: 10,
            order: 'relevance',
            safeSearch: 'strict',
            relevanceLanguage: 'en',
          }
        });

        if (response.data.items) {
          allPlaylists = response.data.items;
        }
      } catch (err) {
        console.error('YouTube playlist search failed:', err.message);
      }
    }

    // Combine and process results
    let finalResults = [];

    // Process videos
    if (allVideos.length > 0) {
      const uniqueVideos = Array.from(
        new Map(allVideos.map(v => [v.id.videoId, v])).values()
      );

      const videoIds = uniqueVideos.map(v => v.id.videoId).join(',');
      const statsResponse = await axios.get('https://www.googleapis.com/youtube/v3/videos', {
        params: {
          key: apiKey,
          part: 'statistics,contentDetails,snippet',
          id: videoIds,
        }
      });

      const detailedVideos = statsResponse.data.items || [];
      const videoDetailsMap = {};
      detailedVideos.forEach(video => {
        videoDetailsMap[video.id] = video;
      });

      const processedVideos = uniqueVideos.map(video => {
        const details = videoDetailsMap[video.id.videoId];
        if (!details) return null;

        const statistics = details.statistics || {};
        const contentDetails = details.contentDetails || {};

        return {
          title: video.snippet.title,
          description: video.snippet.description,
          url: `https://www.youtube.com/watch?v=${video.id.videoId}`,
          videoId: video.id.videoId,
          thumbnail: video.snippet.thumbnails.high?.url || video.snippet.thumbnails.default?.url || video.snippet.thumbnails.medium?.url,
          channelTitle: video.snippet.channelTitle,
          channelId: video.snippet.channelId,
          publishedAt: video.snippet.publishedAt,
          viewCount: parseInt(statistics.viewCount || 0),
          likeCount: parseInt(statistics.likeCount || 0),
          commentCount: parseInt(statistics.commentCount || 0),
          duration: contentDetails.duration || 'PT0S',
          definition: contentDetails.definition || 'sd',
          caption: contentDetails.caption === 'true',
          score: calculateAdvancedVideoScore(video, statistics, contentDetails, query),
          isPlaylist: false,
        };
      }).filter(v => v !== null);

      finalResults = finalResults.concat(processedVideos);
    }

    // Process playlists
    if (allPlaylists.length > 0) {
      const playlistIds = allPlaylists.map(p => p.id.playlistId).join(',');
      const playlistDetailsResponse = await axios.get('https://www.googleapis.com/youtube/v3/playlists', {
        params: {
          key: apiKey,
          part: 'snippet,contentDetails',
          id: playlistIds,
        }
      });

      const processedPlaylists = playlistDetailsResponse.data.items.map(playlist => ({
        title: playlist.snippet.title,
        description: playlist.snippet.description,
        url: `https://www.youtube.com/playlist?list=${playlist.id}`,
        videoId: playlist.id,
        thumbnail: playlist.snippet.thumbnails.high?.url || playlist.snippet.thumbnails.default?.url || playlist.snippet.thumbnails.medium?.url,
        channelTitle: playlist.snippet.channelTitle,
        channelId: playlist.snippet.channelId,
        publishedAt: playlist.snippet.publishedAt,
        viewCount: 0,
        likeCount: 0,
        commentCount: 0,
        duration: `${playlist.contentDetails.itemCount || 0} videos`,
        definition: 'hd',
        caption: false,
        score: calculatePlaylistScore(playlist, query),
        isPlaylist: true,
      }));

      finalResults = finalResults.concat(processedPlaylists);
    }

    if (finalResults.length === 0) {
      console.log('No YouTube results, falling back to simulation');
      return simulateYouTubeSearch(query);
    }

    // EDUCATION FILTER: Remove "why", opinion, and non-tutorial videos
    finalResults = finalResults.filter(v => {
      const title = v.title.toLowerCase();
      const description = v.description.toLowerCase();
      
      // Exclude non-educational content
      const nonEducationalKeywords = [
        'why you should',
        'why you shouldn\'t',
        'why not',
        'why learn',
        'don\'t learn',
        'is it worth',
        'career advice',
        'should you',
        'vs ',
        'better than',
        'worst',
        'best',
        'top 10',
        'react to',
        'roasted',
        'drama',
        'opinion',
        'rant',
      ];
      
      // Check if title contains non-educational keywords
      const hasNonEducationalContent = nonEducationalKeywords.some(keyword => 
        title.includes(keyword) || description.includes(keyword)
      );
      
      // Prioritize educational keywords
      const educationalKeywords = [
        'tutorial',
        'course',
        'learn',
        'guide',
        'lesson',
        'explained',
        'introduction',
        'fundamentals',
        'basics',
        'beginner',
        'advanced',
        'complete',
        'full course',
        'crash course',
      ];
      
      const hasEducationalContent = educationalKeywords.some(keyword => 
        title.includes(keyword) || description.includes(keyword)
      );
      
      // Keep if educational and not non-educational
      return hasEducationalContent || !hasNonEducationalContent;
    });

    // Filter and sort
    return finalResults
      .filter(v => v.score >= 40) // Only show quality videos
      .filter(v => !v.isPlaylist || v.isPlaylist) // Keep all for now
      .filter(v => v.isPlaylist || !isSpamVideo(v)) // Remove spam from videos only
      .sort((a, b) => b.score - a.score)
      .slice(0, 12); // Return top 12

  } catch (error) {
    console.error('YouTube search error:', error.message);
    return simulateYouTubeSearch(query);
  }
};

/**
 * Calculate content relevance score using ML-like algorithm
 */
const calculateContentScore = (item, query) => {
  let score = 0;
  const queryTerms = query.toLowerCase().split(' ');
  const title = item.title.toLowerCase();
  const snippet = (item.snippet || '').toLowerCase();
  const url = (item.link || '').toLowerCase();

  // Title relevance (40% weight)
  queryTerms.forEach(term => {
    if (title.includes(term)) score += 40 / queryTerms.length;
  });

  // Description relevance (30% weight)
  queryTerms.forEach(term => {
    if (snippet.includes(term)) score += 30 / queryTerms.length;
  });

  // Trusted educational domains (30% weight)
  const trustedDomains = [
    'mdn.mozilla.org', 'stackoverflow.com', 'w3schools.com',
    'freecodecamp.org', 'geeksforgeeks.org', 'tutorialspoint.com',
    'codecademy.com', 'coursera.org', 'udemy.com', 'edx.org',
    'medium.com', 'dev.to', 'realpython.com', 'javatpoint.com',
    'programiz.com', 'guru99.com', 'digitalocean.com'
  ];

  trustedDomains.forEach(domain => {
    if (url.includes(domain)) score += 30;
  });

  return Math.min(score, 100);
};

/**
 * Advanced video relevance score with multiple factors
 */
const calculateAdvancedVideoScore = (video, statistics, contentDetails, query) => {
  let score = 0;
  const queryWords = query.toLowerCase().split(/\s+/).filter(w => w.length >= 3);
  const title = video.snippet.title.toLowerCase();
  const description = video.snippet.description.toLowerCase();
  const channelTitle = video.snippet.channelTitle.toLowerCase();

  // 1. Title Relevance (35% weight) - Most important
  let titleScore = 0;
  // Exact phrase match
  if (title.includes(query.toLowerCase())) {
    titleScore += 35;
  } else {
    // Individual word matches
    let titleMatches = 0;
    queryWords.forEach(word => {
      if (title.includes(word)) titleMatches++;
    });
    titleScore += (titleMatches / queryWords.length) * 35;
  }
  score += titleScore;

  // 2. Description Relevance (15% weight)
  let descMatches = 0;
  queryWords.forEach(word => {
    if (description.includes(word)) descMatches++;
  });
  score += (descMatches / queryWords.length) * 15;

  // 3. Engagement Quality (25% weight)
  const views = parseInt(statistics.viewCount || 0);
  const likes = parseInt(statistics.likeCount || 0);
  const comments = parseInt(statistics.commentCount || 0);

  // View count scoring (10%)
  if (views >= 1000000) score += 10;      // 1M+ views
  else if (views >= 500000) score += 9;   // 500K+ views
  else if (views >= 100000) score += 8;   // 100K+ views
  else if (views >= 50000) score += 7;    // 50K+ views
  else if (views >= 10000) score += 6;    // 10K+ views
  else if (views >= 5000) score += 4;     // 5K+ views
  else if (views >= 1000) score += 2;     // 1K+ views

  // Like ratio scoring (10%)
  const likeRatio = views > 0 ? (likes / views) : 0;
  if (likeRatio >= 0.08) score += 10;     // 8%+ excellent
  else if (likeRatio >= 0.05) score += 8; // 5%+ very good
  else if (likeRatio >= 0.03) score += 6; // 3%+ good
  else if (likeRatio >= 0.01) score += 3; // 1%+ fair

  // Comment engagement (5%)
  const commentRatio = views > 0 ? (comments / views) : 0;
  if (commentRatio >= 0.01) score += 5;   // 1%+ highly engaged
  else if (commentRatio >= 0.005) score += 3; // 0.5%+ engaged

  // 4. Channel Authority (15% weight)
  const educationalChannels = [
    'freecodecamp', 'traversy media', 'programming with mosh',
    'net ninja', 'fireship', 'corey schafer', 'academind',
    'tech with tim', 'web dev simplified', 'dev ed', 'clever programmer',
    'coding train', 'sentdex', 'socratica', 'cs dojo',
    'code with harry', 'telusko', 'edureka', 'simplilearn',
    'kudvenkat', 'derek banas', 'thenewboston', 'ben awad',
    'hussein nasser', 'gaurav sen', 'tech dummies', 'colt steele'
  ];

  let channelBonus = 0;
  for (const channel of educationalChannels) {
    if (channelTitle.includes(channel)) {
      channelBonus = 15;
      break;
    }
  }
  
  // Verified/official channels pattern
  if (channelTitle.includes('official') || channelTitle.includes('docs')) {
    channelBonus = Math.max(channelBonus, 12);
  }

  score += channelBonus;

  // 5. Content Quality Indicators (10% weight)
  const qualityKeywords = [
    'tutorial', 'course', 'explained', 'guide', 'learn',
    'complete', 'full', 'crash course', 'introduction', 'beginner',
    'step by step', 'from scratch', 'comprehensive', 'masterclass'
  ];
  
  let qualityScore = 0;
  qualityKeywords.forEach(keyword => {
    if (title.includes(keyword)) qualityScore += 1;
    if (description.includes(keyword)) qualityScore += 0.5;
  });
  score += Math.min(qualityScore, 10);

  // 6. Video Duration Optimization (bonus)
  const duration = parseDuration(contentDetails.duration || 'PT0S');
  const minutes = duration / 60;
  
  // Prefer educational length videos
  if (minutes >= 10 && minutes <= 60) score += 5;      // Sweet spot
  else if (minutes >= 5 && minutes < 10) score += 3;   // Quick tutorial
  else if (minutes >= 60 && minutes <= 180) score += 2; // Long course
  else if (minutes < 5) score -= 5;                    // Too short, likely low quality
  else if (minutes > 240) score -= 3;                  // Too long

  // 7. HD Video bonus
  if (contentDetails.definition === 'hd') score += 2;

  // 8. Captions available bonus (accessibility)
  if (contentDetails.caption === 'true') score += 2;

  // 9. Recency Factor (bonus/penalty)
  const publishDate = new Date(video.snippet.publishedAt);
  const monthsOld = (Date.now() - publishDate.getTime()) / (1000 * 60 * 60 * 24 * 30);
  
  if (monthsOld <= 6) score += 5;        // Very recent
  else if (monthsOld <= 12) score += 3;  // Recent
  else if (monthsOld <= 24) score += 1;  // Somewhat recent
  else if (monthsOld > 48) score -= 2;   // Quite old

  // 10. Spam/Clickbait Detection (penalties)
  const spamPatterns = [
    'click here', 'watch this', 'you won\'t believe',
    'shocking', 'amazing trick', 'secret', 'must watch',
    'gone wrong', 'prank', 'challenge', 'vs', 'reaction'
  ];

  spamPatterns.forEach(pattern => {
    if (title.includes(pattern)) score -= 15;
    if (description.includes(pattern)) score -= 5;
  });

  // ALL CAPS title penalty (clickbait indicator)
  if (title === title.toUpperCase() && title.length > 10) {
    score -= 10;
  }

  // Too many emojis penalty
  const emojiCount = (title.match(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu) || []).length;
  if (emojiCount > 3) score -= 8;

  return Math.max(0, Math.min(100, score));
};

/**
 * Calculate playlist relevance score
 */
const calculatePlaylistScore = (playlist, query) => {
  let score = 50; // Base score for playlists
  const title = playlist.snippet.title.toLowerCase();
  const description = playlist.snippet.description.toLowerCase();
  const queryLower = query.toLowerCase();
  const queryTerms = queryLower.split(' ');

  // Title relevance (40% weight)
  queryTerms.forEach(term => {
    if (title.includes(term)) score += 8;
  });

  // Full query match bonus
  if (title.includes(queryLower)) score += 15;

  // Educational keywords
  const educationalKeywords = ['tutorial', 'course', 'complete', 'full', 'guide', 'playlist', 'series'];
  educationalKeywords.forEach(keyword => {
    if (title.includes(keyword)) score += 5;
  });

  // Item count bonus (more videos = better course)
  const itemCount = playlist.contentDetails?.itemCount || 0;
  if (itemCount >= 20) score += 10;
  else if (itemCount >= 10) score += 7;
  else if (itemCount >= 5) score += 4;

  // Channel authority
  const authorityChannels = ['freecodecamp', 'traversy', 'programming with mosh', 'academind', 
                             'net ninja', 'dev ed', 'clever programmer', 'corey schafer'];
  const channelLower = playlist.snippet.channelTitle.toLowerCase();
  if (authorityChannels.some(ch => channelLower.includes(ch))) {
    score += 20;
  }

  return Math.max(0, Math.min(100, score));
};

/**
 * Detect spam/clickbait videos
 */
const isSpamVideo = (video) => {
  const title = video.title.toLowerCase();
  const description = video.description.toLowerCase();

  // Hard spam filters
  const hardSpam = [
    'free robux', 'free vbucks', 'free money', 'get rich quick',
    'miracle cure', 'lose weight fast', 'make money online',
    'bitcoin giveaway', 'crypto giveaway', 'iphone giveaway'
  ];

  for (const spam of hardSpam) {
    if (title.includes(spam) || description.includes(spam)) {
      return true;
    }
  }

  // Low engagement despite high views (bought views indicator)
  if (video.viewCount > 10000) {
    const likeRatio = video.likeCount / video.viewCount;
    const commentRatio = video.commentCount / video.viewCount;
    
    if (likeRatio < 0.001 && commentRatio < 0.0001) {
      return true; // Suspiciously low engagement
    }
  }

  // Excessive caps and emojis
  const capsRatio = (title.match(/[A-Z]/g) || []).length / title.length;
  const emojiCount = (title.match(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}]/gu) || []).length;
  
  if (capsRatio > 0.7 && emojiCount > 5) {
    return true; // Clickbait pattern
  }

  return false;
};

/**
 * Calculate video relevance score (legacy, kept for backward compatibility)
 */
const calculateVideoScore = (video, statistics, query) => {
  let score = 0;
  const queryTerms = query.toLowerCase().split(' ');
  const title = video.snippet.title.toLowerCase();
  const description = video.snippet.description.toLowerCase();

  // Title relevance (30% weight)
  queryTerms.forEach(term => {
    if (title.includes(term)) score += 30 / queryTerms.length;
  });

  // Description relevance (20% weight)
  queryTerms.forEach(term => {
    if (description.includes(term)) score += 20 / queryTerms.length;
  });

  // Engagement metrics (30% weight)
  const views = parseInt(statistics.viewCount || 0);
  const likes = parseInt(statistics.likeCount || 0);
  
  if (views > 100000) score += 15;
  else if (views > 10000) score += 10;
  else if (views > 1000) score += 5;

  const likeRatio = views > 0 ? (likes / views) : 0;
  if (likeRatio > 0.05) score += 15; // Good like ratio
  else if (likeRatio > 0.02) score += 10;
  else if (likeRatio > 0.01) score += 5;

  // Channel quality (10% weight)
  const trustedChannels = [
    'traversy media', 'freecodecamp', 'programming with mosh',
    'net ninja', 'fireship', 'corey schafer', 'academind',
    'tech with tim', 'clever programmer', 'web dev simplified'
  ];

  const channelName = video.snippet.channelTitle.toLowerCase();
  trustedChannels.forEach(channel => {
    if (channelName.includes(channel)) score += 10;
  });

  // Recency bonus (10% weight)
  const publishDate = new Date(video.snippet.publishedAt);
  const monthsOld = (Date.now() - publishDate.getTime()) / (1000 * 60 * 60 * 24 * 30);
  
  if (monthsOld < 6) score += 10;
  else if (monthsOld < 12) score += 7;
  else if (monthsOld < 24) score += 4;

  return Math.min(score, 100);
};

/**
 * Simulated Google search with categorized trusted sources
 */
const simulateGoogleSearch = (query, category) => {
  const searchTemplates = [
    // Academic sources
    {
      title: `${query} Research Papers - Google Scholar`,
      description: `Academic research papers and peer-reviewed articles on ${query}. Find scholarly literature from universities and research institutions.`,
      url: `https://scholar.google.com/scholar?q=${encodeURIComponent(query)}`,
      source: 'scholar.google.com',
      category: 'academic',
      relevanceScore: 94,
      autoGenerated: true,
    },
    {
      title: `${query} - ACM Digital Library`,
      description: `Computer science research on ${query} from ACM publications. Access cutting-edge academic content and technical papers.`,
      url: `https://dl.acm.org/search?query=${encodeURIComponent(query)}`,
      source: 'dl.acm.org',
      category: 'academic',
      relevanceScore: 92,
      autoGenerated: true,
    },
    // Learning platforms
    {
      title: `Learn ${query} - freeCodeCamp`,
      description: `Comprehensive ${query} course with interactive exercises. Learn by building real projects with step-by-step guidance.`,
      url: `https://www.freecodecamp.org/news/${query.toLowerCase().replace(/\s+/g, '-')}-tutorial/`,
      source: 'freecodecamp.org',
      category: 'learningPlatform',
      relevanceScore: 96,
      autoGenerated: true,
    },
    {
      title: `${query} Course - Coursera`,
      description: `Professional ${query} courses from top universities. Earn certificates while learning from industry experts.`,
      url: `https://www.coursera.org/search?query=${encodeURIComponent(query)}`,
      source: 'coursera.org',
      category: 'learningPlatform',
      relevanceScore: 93,
      autoGenerated: true,
    },
    {
      title: `${query} on Khan Academy`,
      description: `Free ${query} lessons with practice exercises. Master concepts at your own pace with personalized learning.`,
      url: `https://www.khanacademy.org/search?q=${encodeURIComponent(query)}`,
      source: 'khanacademy.org',
      category: 'learningPlatform',
      relevanceScore: 90,
      autoGenerated: true,
    },
    // Technical articles
    {
      title: `${query} - MDN Web Docs`,
      description: `Official ${query} documentation from Mozilla. Complete reference with examples, browser compatibility, and best practices.`,
      url: `https://developer.mozilla.org/en-US/search?q=${encodeURIComponent(query)}`,
      source: 'developer.mozilla.org',
      category: 'technicalArticle',
      relevanceScore: 98,
      autoGenerated: true,
    },
    {
      title: `${query} Tutorial - W3Schools`,
      description: `Easy-to-understand ${query} tutorial with examples. Learn with interactive exercises and quizzes.`,
      url: `https://www.w3schools.com/${query.toLowerCase().replace(/\s+/g, '')}/`,
      source: 'w3schools.com',
      category: 'technicalArticle',
      relevanceScore: 91,
      autoGenerated: true,
    },
    {
      title: `${query} - GeeksforGeeks`,
      description: `Complete ${query} guide with theory, examples, and practice problems. Includes interview questions and solutions.`,
      url: `https://www.geeksforgeeks.org/${query.toLowerCase().replace(/\s+/g, '-')}/`,
      source: 'geeksforgeeks.org',
      category: 'technicalArticle',
      relevanceScore: 89,
      autoGenerated: true,
    },
    {
      title: `Understanding ${query} - Stack Overflow`,
      description: `Community-driven ${query} discussions and solutions. Find answers from experienced developers.`,
      url: `https://stackoverflow.com/search?q=${encodeURIComponent(query)}`,
      source: 'stackoverflow.com',
      category: 'technicalArticle',
      relevanceScore: 87,
      autoGenerated: true,
    },
    {
      title: `${query} Guide - DigitalOcean`,
      description: `Practical ${query} tutorials with real-world examples. Learn by doing with clear, actionable steps.`,
      url: `https://www.digitalocean.com/community/tutorials?q=${encodeURIComponent(query)}`,
      source: 'digitalocean.com',
      category: 'technicalArticle',
      relevanceScore: 88,
      autoGenerated: true,
    },
  ];

  return searchTemplates;
};

/**
 * Simulated YouTube search with realistic educational content
 */
const simulateYouTubeSearch = (query) => {
  const queryLower = query.toLowerCase();
  
  // Generate realistic video results based on query
  const videoTemplates = [
    {
      title: `${query} - Full Course for Beginners`,
      description: `Learn ${query} from scratch in this comprehensive tutorial. Perfect for beginners with step-by-step explanations and hands-on examples. Covers all fundamental concepts and best practices.`,
      channelTitle: 'freeCodeCamp.org',
      viewCount: 850000,
      likeCount: 42500,
      commentCount: 3200,
      duration: 'PT2H15M30S',
      publishedAt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(), // 3 months ago
    },
    {
      title: `${query} Crash Course - Learn in 60 Minutes`,
      description: `Quick ${query} tutorial for developers. Master the essentials with practical examples and real-world projects. Fast-paced and to the point.`,
      channelTitle: 'Traversy Media',
      viewCount: 420000,
      likeCount: 23000,
      commentCount: 1800,
      duration: 'PT58M45S',
      publishedAt: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString(), // 1.5 months ago
    },
    {
      title: `${query} Tutorial - Complete Guide`,
      description: `Everything you need to know about ${query}. Detailed explanations, code walkthroughs, and industry best practices. Suitable for all skill levels.`,
      channelTitle: 'Programming with Mosh',
      viewCount: 620000,
      likeCount: 35000,
      commentCount: 2400,
      duration: 'PT1H42M20S',
      publishedAt: new Date(Date.now() - 120 * 24 * 60 * 60 * 1000).toISOString(), // 4 months ago
    },
    {
      title: `${query} Explained in 100 Seconds`,
      description: `Ultra-fast introduction to ${query}. Get up to speed quickly with this concise overview covering the most important concepts.`,
      channelTitle: 'Fireship',
      viewCount: 890000,
      likeCount: 52000,
      commentCount: 4100,
      duration: 'PT1M52S',
      publishedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(), // 1 month ago
    },
    {
      title: `Master ${query} - Advanced Techniques`,
      description: `Deep dive into ${query} with advanced concepts and optimization techniques. Build production-ready applications with confidence.`,
      channelTitle: 'Academind',
      viewCount: 310000,
      likeCount: 18500,
      commentCount: 1500,
      duration: 'PT3H10M15S',
      publishedAt: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000).toISOString(), // 6 months ago
    },
    {
      title: `${query} for Python Developers`,
      description: `Learn ${query} specifically tailored for Python programmers. Clear explanations with Python-focused examples and use cases.`,
      channelTitle: 'Corey Schafer',
      viewCount: 280000,
      likeCount: 16000,
      commentCount: 1200,
      duration: 'PT45M30S',
      publishedAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(), // 2 months ago
    },
    {
      title: `${query} Project Tutorial - Build a Real Application`,
      description: `Hands-on ${query} project from start to finish. Build, test, and deploy a complete application while learning best practices.`,
      channelTitle: 'The Net Ninja',
      viewCount: 195000,
      likeCount: 11000,
      commentCount: 850,
      duration: 'PT1H25M40S',
      publishedAt: new Date(Date.now() - 75 * 24 * 60 * 60 * 1000).toISOString(), // 2.5 months ago
    },
    {
      title: `${query} Introduction and Setup`,
      description: `Get started with ${query}. Installation, configuration, and your first project. Perfect starting point for complete beginners.`,
      channelTitle: 'Web Dev Simplified',
      viewCount: 340000,
      likeCount: 19500,
      commentCount: 1600,
      duration: 'PT32M15S',
      publishedAt: new Date(Date.now() - 50 * 24 * 60 * 60 * 1000).toISOString(), // 1.5 months ago
    },
  ];

  // Map of real educational video IDs for common topics (verified educational content)
  const educationalVideoMap = {
    // Programming Languages
    'javascript': ['W6NZfCO5SIk', 'PkZNo7MFNFg', 'jS4aFq5-91M', 'lI1ae4REbFM', 'hdI2bqOjy3c'],
    'js': ['W6NZfCO5SIk', 'PkZNo7MFNFg', 'jS4aFq5-91M', 'lI1ae4REbFM', 'hdI2bqOjy3c'],
    'python': ['rfscVS0vtbw', 'kqtD5dpn9C8', '_uQrJ0TkZlc', 'eWRfhZUzrAc', 'YYXdXT2l_Oc'],
    'java': ['eIrMbAQSU34', 'grEKMHGYyns', 'A74TOX803D0', 'xk4_1vDrzzo', 'GoXwIVyNvX0'],
    'cpp': ['vLnPwxZdW4Y', '18c3MTX0PK0', 'ZzaPdXTrSb8', '8jLOx1hD3_o', 'j8nAHeVKL08'],
    'c++': ['vLnPwxZdW4Y', '18c3MTX0PK0', 'ZzaPdXTrSb8', '8jLOx1hD3_o', 'j8nAHeVKL08'],
    'c#': ['GhQdlIFylQ8', 'gfkTfcpWqAY', 'M5ugY7fWydE', 'qOruiBrXlAw', 'YT8s-90oDC0'],
    'csharp': ['GhQdlIFylQ8', 'gfkTfcpWqAY', 'M5ugY7fWydE', 'qOruiBrXlAw', 'YT8s-90oDC0'],
    'ruby': ['t_ispmWmdjY', 'Dji9ALCgfpM', '8T9sxEv0r6E', 'fmyvWz5TUWg', 'UYm0kfnRTJk'],
    'go': ['YS4e4q9oBaU', 'C8LgvuEBraI', 'yyUHQIec83I', 'YzLrWHZa-Kc', 'un6ZyFkqFKo'],
    'golang': ['YS4e4q9oBaU', 'C8LgvuEBraI', 'yyUHQIec83I', 'YzLrWHZa-Kc', 'un6ZyFkqFKo'],
    'rust': ['zF34dRivLOw', 'BpPEoZW5IiY', 'ygL_xcavzQ4', 'OX9HJsJUDxA', 'MsocPEZBd-M'],
    'typescript': ['BwuLxPH8IDs', 'd56mG7DezGs', 'ahCwqrYpIuM', 'BCg4U1FzODs', 'SpwzRDUQ1GI'],
    'php': ['OK_JCtrrv-c', 'a7_WFUlFS94', 'ZdP0KM49IVk', 'BUCiSSyIGGU', 'zZ6vybT1HQs'],
    'swift': ['comQ1-x2a1Q', 'CwA1VWP0Ldw', 'nWoWZzPfuW8', '8Xg7E9shq0U', 'FcsY1YPBwzQ'],
    'kotlin': ['F9UC9DY-vIU', 'EExSSotojVI', 'iYrgWO2oibY', 'BCSlZIUj18Y', 'wuiT4T_LJQo'],
    
    // Web Development
    'react': ['w7ejDZ8SWv8', 'Ke90Tje7VS0', 'SqcY0GlETPk', 'b9eMGE7QtTk', 'RVFAyFWO4go'],
    'reactjs': ['w7ejDZ8SWv8', 'Ke90Tje7VS0', 'SqcY0GlETPk', 'b9eMGE7QtTk', 'RVFAyFWO4go'],
    'angular': ['3qBXWUpoPHo', '3dHNOWTI7H8', 'k5E2AVpwsko', 'Fdf5aTYRW0E', '0eWrpsCLMJQ'],
    'vue': ['FXpIoQ_rT_c', 'qZXt1Aom3Cs', 'nhBVL41-_Cw', 'YrxBCBibVo0', 'KTFH4P8unUQ'],
    'vuejs': ['FXpIoQ_rT_c', 'qZXt1Aom3Cs', 'nhBVL41-_Cw', 'YrxBCBibVo0', 'KTFH4P8unUQ'],
    'html': ['UB1O30fR-EE', 'pQN-pnXPaVg', 'qz0aGYrrlhU', 'mU6anWqZJcc', 'HD13eq_Pmp8'],
    'css': ['1PnVor36_40', 'yfoY53QXEnI', 'OXGznpKZ_sA', 'G3e-cpL7ofc', 'Edsxf_NBFrw'],
    'html5': ['UB1O30fR-EE', 'pQN-pnXPaVg', 'qz0aGYrrlhU', 'mU6anWqZJcc', 'HD13eq_Pmp8'],
    'css3': ['1PnVor36_40', 'yfoY53QXEnI', 'OXGznpKZ_sA', 'G3e-cpL7ofc', 'Edsxf_NBFrw'],
    'bootstrap': ['4sosXZsdy-s', 'O_9u1P5YjVc', 'Jyvffr3aCp0', 'eow125xV5-c', 'GqNXbLd5PhQ'],
    'tailwind': ['pfaSUYaSgRo', 'ft30zcMlFao', 'dFgzHOX84xQ', 'mr15Xzb1Ook', 'UBOj6rqRUME'],
    'sass': ['_a5j7KoflTs', 'nu5mdN2JIwM', 'Zz6eOVaaelI', '3_1UKzZKHZs', 'jfMHA8SqUL4'],
    'nextjs': ['mTz0GXj8NN0', 'ZVnjOPwW4ZA', '843nec-IvW0', 'JWCS5IdECVI', 'Sklc_fQBmcs'],
    'next.js': ['mTz0GXj8NN0', 'ZVnjOPwW4ZA', '843nec-IvW0', 'JWCS5IdECVI', 'Sklc_fQBmcs'],
    
    // Backend & Databases
    'node': ['fBNz5xF-Kx4', 'TlB_eWDSMt4', 'Oe421EPjeBE', 'ENrzD9HAZK4', 'f2EqECiTBL8'],
    'nodejs': ['fBNz5xF-Kx4', 'TlB_eWDSMt4', 'Oe421EPjeBE', 'ENrzD9HAZK4', 'f2EqECiTBL8'],
    'express': ['L72fhGm1tfE', 'SccSCuHhOw0', 'pKd0Rpw7O48', 'Oe421EPjeBE', 'fgTGADljAeg'],
    'expressjs': ['L72fhGm1tfE', 'SccSCuHhOw0', 'pKd0Rpw7O48', 'Oe421EPjeBE', 'fgTGADljAeg'],
    'mongodb': ['ofme2o29ngU', '9OPP_1eAENg', 'Www6cTUymCY', 'ExcRbA7fy_A', 'c2M-rlkkT5o'],
    'sql': ['HXV3zeQKqGY', '7S_tz1z_5bA', 'zbMHLJ0dY4w', 'KLvnJzXvuW4', '9Pzj7Aj25lw'],
    'mysql': ['7S_tz1z_5bA', '7GVFYt6_ZFM', 'KLvnJzXvuW4', 'vgIc4ctNFbc', '9ylj9NR0Lcg'],
    'postgresql': ['qw--VYLpxG4', 'SpfIwlAYaKk', 'eMIxuk0nOkU', 'ZWnMD14T6Gk', 'zlwGT41AQz8'],
    'postgres': ['qw--VYLpxG4', 'SpfIwlAYaKk', 'eMIxuk0nOkU', 'ZWnMD14T6Gk', 'zlwGT41AQz8'],
    'redis': ['jgpVdJB2sKQ', 'Hbt56gFj998', 'G1rOthIU-uo', 'OqCK95AS-YE', 'a4yX7RUgTxI'],
    'graphql': ['BcLNfwF04Kw', 'eIQh02xuVw4', '7wzR4Ig5pTI', 'ZQL7tL2S0oQ', 'Y0lDGjwRYKw'],
    'rest api': ['SLwpqD8n3d0', '-MTSQjw5DrM', 'lsMQRaeKNDk', '0oXYLzuucKU', 'SLwpqD8n3d0'],
    'api': ['SLwpqD8n3d0', '-MTSQjw5DrM', 'lsMQRaeKNDk', '0oXYLzuucKU', 'ByGJQzlzxQg'],
    
    // DevOps & Tools
    'git': ['8JJ101D3knE', 'RGOj5yH7evk', 'HVsySz-h9r4', 'zTjRZNkhiEU', 'hwP7WQkmECE'],
    'github': ['tRZGeaHPoaw', 'nhNq2kIvi9s', 'eulnSXkhE7I', 'iv8rSLsi1xo', 'DVRQoVRzMIY'],
    'docker': ['fqMOX6JJhGo', 'pTFZFxd4hOI', '3c-iBn73dDE', 'pg19Z8LL06w', '17Bl31rlnWg'],
    'kubernetes': ['X48VuDVv0do', 'PH-2FfFD2PU', 'cC46cg5FFAM', 's_o8dwzRlu4', 'VnvRFRk_kvE'],
    'jenkins': ['FX322RVNGj4', 'LFDrDnKPOTg', 'f4idgaq2VqA', '2KxrjkJb83c', 'p7-U1_E_j3w'],
    'aws': ['3hLmDS179YE', 'ulprqHHWlng', 'ubCNZRNjhyo', 'SOTamWNgDKc', '3hLmDS179YE'],
    'azure': ['tDuruX7XSac', 'NKEFWyqJ5XA', '3gnLwqMd_rg', '68WbSJpcGmY', '4BwyqmRTrx4'],
    'linux': ['sWbUDq4S6Y8', 'wBp0Rb-ZJak', 'oxuRxtrO2Ag', 'ZtqBQ68cfJc', 'v_1zB2WNN14'],
    
    // Data Science & AI
    'machine learning': ['i_LwzRVP7bg', '7eh4d6sabA0', 'gmvvaobm7eQ', 'aircAruvnKk', 'w2OtwL5T1ow'],
    'ml': ['i_LwzRVP7bg', '7eh4d6sabA0', 'gmvvaobm7eQ', 'aircAruvnKk', 'w2OtwL5T1ow'],
    'deep learning': ['aircAruvnKk', 'CS4cs9xVecg', 'VyWAvY2CF9c', 'ER2It2mIagI', 'N8Sn3cy8Nn0'],
    'tensorflow': ['tPYj3fFJGjk', 'MotG3XI2qSs', 'VoYfa7hox7s', 'i8NETqtGHms', 'KNAWp2S3w94'],
    'pytorch': ['IC0_FRiX-sw', 'c36lUUr864M', 'Jy4wM2X21u0', 'EMXfZB8FVUA', 'GIsg-ZUy0MY'],
    'pandas': ['vmEHCJofslg', 'PcvsOaixUh8', 'ZyhVh-qRZPA', 'iGFdh6_FePU', 'bcx4Tc4lNPc'],
    'numpy': ['QUT1VHiLmmI', 'GB9ByFAIAH4', '8Mpc9ukltVA', 'QUT1VHiLmmI', 'DcfYgePyedM'],
    'data science': ['ua-CiDNNj30', 'dr7L8i7t4XY', 'E0Hmnixke2g', 'mkv5mxYu0Wk', 'X3paOmcrTjQ'],
    
    // Mobile Development
    'android': ['fis26HvvDII', 'EOfCEhWq8sg', 'BCSlZIUj18Y', '8Pv96bvBJL4', 'RcSHAkpwXAQ'],
    'ios': ['comQ1-x2a1Q', 'CwA1VWP0Ldw', 'n5X_tUHpE0w', '09TeUXjzpKs', 'F2ojC6TNwws'],
    'flutter': ['pTJJsmejUOQ', 'VPvVD8t02U8', '1ukSR1GRtMU', 'fmPmrJGbb6w', 'x0uinJvhNxI'],
    'react native': ['0-S5a0eXPoc', 'ur6I5m2nTvk', 'obH0Po_RdWk', 'ANdSdIlgsEw', 'DYM1x5AMRZI'],
    
    // Other Topics
    'algorithm': ['0IAPZzGSbME', 'RBSGKlAvoiM', '8hly31xKli0', 'A03oI0znAoc', '92S4zgXN17o'],
    'data structure': ['RBSGKlAvoiM', '0IAPZzGSbME', 'zg9ih6SVACc', 'AT14lCXuMKI', 'B31LgI4Y4DQ'],
    'dsa': ['RBSGKlAvoiM', '0IAPZzGSbME', 'zg9ih6SVACc', 'AT14lCXuMKI', 'B31LgI4Y4DQ'],
    'design pattern': ['tv-_1er1mWI', 'NU_1StN5Tkk', 'v9ejT8FO-7I', 'BWprw8UHIzA', 'tAuRQs_d9F8'],
    'testing': ['r9HdJ8P6GQI', 'FgnxcUQ5vho', 'Ez90qc8tR5Y', '8Xwvr6PlpZ8', 'Geigs7c-W0E'],
    'security': ['8ZtInClXe1Q', '2_lswM1S264', 'VjtRgdJhq04', 'Kv5nCtQMhTE', 'JY8MGKs6ylw'],
  };

  // Get real video IDs with improved matching
  const getVideoIds = (query) => {
    const queryLower = query.toLowerCase().trim();
    
    // Try exact match first
    if (educationalVideoMap[queryLower]) {
      return educationalVideoMap[queryLower];
    }
    
    // Try substring matching
    for (const [key, videos] of Object.entries(educationalVideoMap)) {
      if (queryLower.includes(key) || key.includes(queryLower)) {
        return videos;
      }
    }
    
    // Fallback: use VERIFIED educational video IDs (NO RICKROLLS!)
    // These are popular programming tutorials from freeCodeCamp, Traversy Media, etc.
    return ['W6NZfCO5SIk', 'rfscVS0vtbw', 'w7ejDZ8SWv8', 'fBNz5xF-Kx4', 
            'PkZNo7MFNFg', 'kqtD5dpn9C8', 'Ke90Tje7VS0', 'BwuLxPH8IDs'];
  };

  const videoIds = getVideoIds(query);

  // Generate realistic video objects with REAL YouTube URLs
  return videoTemplates.map((template, index) => {
    const videoId = videoIds[index] || videoIds[0]; // Use real video IDs
    return {
      title: template.title,
      description: template.description,
      url: `https://www.youtube.com/watch?v=${videoId}`,
      videoId: videoId,
      thumbnail: `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
      channelTitle: template.channelTitle,
      channelId: `channel_${index}`,
      publishedAt: template.publishedAt,
      viewCount: template.viewCount,
      likeCount: template.likeCount,
      commentCount: template.commentCount,
      duration: template.duration,
      definition: 'hd',
      caption: true,
      score: calculateRelevanceScore(
        { title: template.title, snippet: template.description, publishedAt: template.publishedAt },
        query
      ),
      autoGenerated: true,
    };
  }).sort((a, b) => b.score - a.score).slice(0, 8);
};

export const estimateTime = (contentType, content) => {
  if (contentType === 'video-url') {
    // Try to parse duration from YouTube or default
    return 20; // Default 20 minutes for videos
  }
  
  // For text content, estimate based on word count
  const words = content.split(/\s+/).length;
  const readingSpeed = 200; // words per minute
  return Math.ceil(words / readingSpeed);
};

export const extractTopics = (query) => {
  // Remove common words
  const stopWords = ['learn', 'tutorial', 'how', 'to', 'what', 'is', 'the', 'a', 'an', 'and', 'or', 'for', 'in'];
  const words = query.toLowerCase().split(/\s+/);
  
  const topics = words.filter(word => !stopWords.includes(word) && word.length > 2);
  
  // Capitalize first letter
  return topics.map(topic => topic.charAt(0).toUpperCase() + topic.slice(1));
};

export const determineDifficulty = (title, description) => {
  const text = (title + ' ' + description).toLowerCase();
  
  if (text.includes('beginner') || text.includes('introduction') || text.includes('basics') || text.includes('getting started')) {
    return 'beginner';
  }
  
  if (text.includes('advanced') || text.includes('expert') || text.includes('master') || text.includes('deep dive')) {
    return 'advanced';
  }
  
  return 'intermediate';
};

export const autoGenerateResources = async (query, preferredType = 'all', videoType = 'all') => {
  const categorizedResults = {
    academic: [],
    learningPlatforms: [],
    technicalArticles: [],
    videoTutorials: [],
    query,
    generatedAt: new Date().toISOString(),
  };

  try {
    // Search both Google and YouTube in parallel
    const [googleResults, youtubeResults] = await Promise.all([
      preferredType === 'video' ? [] : searchGoogleContent(query),
      preferredType === 'article' ? [] : searchYouTubeVideos(query, videoType),
    ]);

    // Categorize Google results into 3 sections
    googleResults.forEach(item => {
      const resource = {
        title: item.title,
        description: item.description,
        url: item.url,
        source: item.source,
        type: 'article',
        score: item.relevanceScore || item.score || 0,
        isAutoGenerated: true,
        estimatedTime: estimateTime('article', item.description),
        difficulty: determineDifficulty(item.title, item.description),
      };

      // Route to appropriate section
      switch (item.category) {
        case 'academic':
          categorizedResults.academic.push(resource);
          break;
        case 'learningPlatform':
          categorizedResults.learningPlatforms.push(resource);
          break;
        case 'technicalArticle':
        default:
          categorizedResults.technicalArticles.push(resource);
          break;
      }
    });

    // Process YouTube results as video tutorials
    categorizedResults.videoTutorials = youtubeResults.map(item => ({
      title: item.title,
      description: item.description,
      url: item.url,
      source: item.channelTitle,
      type: 'video',
      score: item.score || 0,
      thumbnail: item.thumbnail,
      views: item.viewCount,
      likes: item.likeCount,
      duration: item.duration,
      publishedAt: item.publishedAt,
      isAutoGenerated: true,
      estimatedTime: Math.ceil(parseDuration(item.duration) / 60), // Convert to minutes
      difficulty: determineDifficulty(item.title, item.description),
    })).filter(v => v.score >= 40); // Filter low-quality videos

    // Sort each section by score and limit results
    categorizedResults.academic = categorizedResults.academic
      .sort((a, b) => b.score - a.score)
      .slice(0, 4);
    
    categorizedResults.learningPlatforms = categorizedResults.learningPlatforms
      .sort((a, b) => b.score - a.score)
      .slice(0, 4);
    
    categorizedResults.technicalArticles = categorizedResults.technicalArticles
      .sort((a, b) => b.score - a.score)
      .slice(0, 6);
    
    categorizedResults.videoTutorials = categorizedResults.videoTutorials
      .sort((a, b) => b.score - a.score)
      .slice(0, 6);

    // Calculate total results
    categorizedResults.totalResults = 
      categorizedResults.academic.length +
      categorizedResults.learningPlatforms.length +
      categorizedResults.technicalArticles.length +
      categorizedResults.videoTutorials.length;

    return categorizedResults;
  } catch (error) {
    console.error('Auto-generate resources error:', error);
    throw error;
  }
};

/**
 * Parse YouTube duration format (PT1H30M15S) to seconds
 */
const parseDuration = (duration) => {
  if (!duration) return 0;
  const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return 0;
  const hours = parseInt(match[1] || 0);
  const minutes = parseInt(match[2] || 0);
  const seconds = parseInt(match[3] || 0);
  return hours * 3600 + minutes * 60 + seconds;
};
