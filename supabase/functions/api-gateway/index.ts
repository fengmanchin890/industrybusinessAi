// API Gateway - Unified entry point for all API calls
// Handles rate limiting, authentication, logging, and routing

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface RateLimitConfig {
  requests: number;
  per: 'minute' | 'hour' | 'day';
}

const RATE_LIMITS: Record<string, RateLimitConfig> = {
  free: { requests: 100, per: 'day' },
  pro: { requests: 1000, per: 'day' },
  enterprise: { requests: 10000, per: 'day' },
  default: { requests: 50, per: 'day' }
};

const AI_CORE_URL = Deno.env.get('AI_CORE_URL') || 'http://ai-core:8000';
const DATA_CONNECTOR_URL = Deno.env.get('DATA_CONNECTOR_URL') || 'http://data-connector:8001';

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const startTime = Date.now();
  let companyId: string | null = null;
  let userId: string | null = null;

  try {
    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    // Verify authentication
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid or expired token' }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    userId = user.id;
    companyId = user.user_metadata?.company_id || user.id;

    // Get company settings for rate limiting
    const { data: company } = await supabaseClient
      .from('companies')
      .select('subscription_tier, settings')
      .eq('id', companyId)
      .single();

    const tier = company?.subscription_tier || 'free';
    
    // Check rate limit
    const rateLimitOk = await checkRateLimit(
      supabaseClient,
      companyId,
      tier
    );

    if (!rateLimitOk) {
      return new Response(
        JSON.stringify({
          error: 'Rate limit exceeded',
          message: `Your ${tier} tier limit has been reached. Please upgrade or wait.`,
        }),
        {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Parse request
    const url = new URL(req.url);
    const path = url.pathname.replace('/api-gateway', '');
    const method = req.method;
    
    let body = null;
    if (method !== 'GET' && method !== 'HEAD') {
      try {
        body = await req.json();
      } catch {
        body = null;
      }
    }

    // Route request to appropriate service
    let targetUrl: string;
    let targetPath: string;

    if (path.startsWith('/ai/')) {
      targetPath = path.replace('/ai', '/api/v1');
      targetUrl = `${AI_CORE_URL}${targetPath}`;
    } else if (path.startsWith('/data/')) {
      targetPath = path.replace('/data', '/api/v1');
      targetUrl = `${DATA_CONNECTOR_URL}${targetPath}`;
    } else {
      return new Response(
        JSON.stringify({ error: 'Invalid path. Use /ai/* or /data/*' }),
        {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Add query parameters
    const searchParams = url.searchParams.toString();
    if (searchParams) {
      targetUrl += `?${searchParams}`;
    }

    // Forward request to target service
    const targetHeaders: HeadersInit = {
      'Content-Type': 'application/json',
      'Authorization': authHeader,
      'X-Company-Id': companyId,
      'X-User-Id': userId,
    };

    const targetReq = new Request(targetUrl, {
      method,
      headers: targetHeaders,
      body: body ? JSON.stringify(body) : undefined,
    });

    const response = await fetch(targetReq);
    const responseData = await response.text();
    const latency = Date.now() - startTime;

    // Log request
    await logRequest(
      supabaseClient,
      companyId,
      userId,
      path,
      method,
      response.status,
      latency,
      body ? JSON.stringify(body).length : 0,
      responseData.length,
      req.headers.get('CF-Connecting-IP') || req.headers.get('X-Forwarded-For'),
      req.headers.get('User-Agent')
    );

    // Return response
    return new Response(responseData, {
      status: response.status,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
        'X-Latency-Ms': latency.toString(),
      },
    });

  } catch (error) {
    console.error('Gateway error:', error);
    
    const latency = Date.now() - startTime;
    
    return new Response(
      JSON.stringify({
        error: 'Internal server error',
        message: error.message,
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
          'X-Latency-Ms': latency.toString(),
        },
      }
    );
  }
});

/**
 * Check if company has exceeded rate limit
 */
async function checkRateLimit(
  supabaseClient: any,
  companyId: string,
  tier: string
): Promise<boolean> {
  const config = RATE_LIMITS[tier] || RATE_LIMITS.default;
  
  // Calculate time window
  const now = new Date();
  let startTime: Date;
  
  switch (config.per) {
    case 'minute':
      startTime = new Date(now.getTime() - 60 * 1000);
      break;
    case 'hour':
      startTime = new Date(now.getTime() - 60 * 60 * 1000);
      break;
    case 'day':
      startTime = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      break;
    default:
      startTime = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  }

  // Count requests in time window
  const { count, error } = await supabaseClient
    .from('api_requests')
    .select('*', { count: 'exact', head: true })
    .eq('company_id', companyId)
    .gte('created_at', startTime.toISOString());

  if (error) {
    console.error('Rate limit check error:', error);
    return true; // Allow on error
  }

  return (count || 0) < config.requests;
}

/**
 * Log API request to database
 */
async function logRequest(
  supabaseClient: any,
  companyId: string,
  userId: string,
  endpoint: string,
  method: string,
  statusCode: number,
  latencyMs: number,
  requestSize: number,
  responseSize: number,
  ipAddress: string | null,
  userAgent: string | null
): Promise<void> {
  try {
    await supabaseClient.from('api_requests').insert({
      company_id: companyId,
      user_id: userId,
      endpoint,
      method,
      status_code: statusCode,
      latency_ms: latencyMs,
      request_size: requestSize,
      response_size: responseSize,
      ip_address: ipAddress,
      user_agent: userAgent,
    });
  } catch (error) {
    console.error('Failed to log request:', error);
    // Don't fail the request if logging fails
  }
}



