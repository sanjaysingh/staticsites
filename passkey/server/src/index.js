import { SignJWT, jwtVerify } from 'jose';

// Helper function to generate random challenge
function generateChallenge() {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return btoa(String.fromCharCode.apply(null, array))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

// Helper function to verify JWT token
async function verifyToken(token) {
  try {
    const { payload } = await jwtVerify(
      token,
      new TextEncoder().encode(env.JWT_SECRET)
    );
    return payload;
  } catch (error) {
    return null;
  }
}

// Helper function to create JWT token
async function createToken(userId) {
  return new SignJWT({ userId })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('24h')
    .sign(new TextEncoder().encode(env.JWT_SECRET));
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname;

    // CORS headers
    const corsHeaders = {
      'Access-Control-Allow-Origin': 'https://static.sanjaysingh.net',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    };

    // Handle CORS preflight requests
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: corsHeaders,
      });
    }

    // Authentication endpoints
    if (path.startsWith('/auth')) {
      if (path === '/auth/register' && request.method === 'POST') {
        const challenge = generateChallenge();
        
        // Store challenge in KV for verification
        await env.DB.prepare(
          'INSERT INTO challenges (challenge, type) VALUES (?, ?)'
        ).bind(challenge, 'registration').run();

        const options = {
          challenge: challenge,
          rp: {
            name: 'Passkey Todo App',
            id: 'static.sanjaysingh.net',
          },
          user: {
            id: new Uint8Array(16),
            name: 'user',
            displayName: 'User',
          },
          pubKeyCredParams: [
            { type: 'public-key', alg: -7 }, // ES256
            { type: 'public-key', alg: -257 }, // RS256
          ],
          timeout: 60000,
          attestation: 'direct',
          authenticatorSelection: {
            authenticatorAttachment: 'platform',
            userVerification: 'required',
            requireResidentKey: true,
          },
        };

        return new Response(JSON.stringify(options), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      if (path === '/auth/verify-registration' && request.method === 'POST') {
        try {
          const credential = await request.json();
          console.log('Received credential:', JSON.stringify(credential, null, 2));
          console.log('Credential properties:', {
            hasId: !!credential.id,
            hasClientDataJSON: !!credential.clientDataJSON,
            hasRawId: !!credential.rawId,
            hasResponse: !!credential.response,
            hasType: !!credential.type
          });
          
          if (!credential || !credential.id || !credential.clientDataJSON) {
            return new Response(JSON.stringify({ 
              error: 'Invalid credential data',
              received: {
                hasCredential: !!credential,
                hasId: !!credential?.id,
                hasClientDataJSON: !!credential?.clientDataJSON
              }
            }), {
              status: 400,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
          }

          // Verify the challenge
          const challenge = await env.DB.prepare(
            'SELECT * FROM challenges WHERE challenge = ? AND type = ?'
          ).bind(credential.clientDataJSON, 'registration').first();

          if (!challenge) {
            return new Response(JSON.stringify({ error: 'Invalid challenge' }), {
              status: 400,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
          }

          // Generate a unique user ID if not provided
          const userId = credential.userHandle || crypto.randomUUID();

          // Store the credential
          const result = await env.DB.prepare(
            'INSERT INTO credentials (credential_id, public_key, user_id) VALUES (?, ?, ?)'
          ).bind(
            credential.id,
            JSON.stringify(credential),
            userId
          ).run();

          if (!result.success) {
            throw new Error('Failed to store credential');
          }

          // Create session token
          const token = await createToken(userId);

          return new Response(JSON.stringify({ token }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        } catch (error) {
          console.error('Verification error:', error);
          return new Response(JSON.stringify({ 
            error: 'Verification failed: ' + error.message,
            details: error.stack
          }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }
      }

      if (path === '/auth/login' && request.method === 'POST') {
        const challenge = generateChallenge();
        
        // Store challenge in KV for verification
        await env.DB.prepare(
          'INSERT INTO challenges (challenge, type) VALUES (?, ?)'
        ).bind(challenge, 'login').run();

        const options = {
          challenge: challenge,
          rpId: 'static.sanjaysingh.net',
          allowCredentials: [], // We'll let the authenticator find the right credential
          userVerification: 'required',
          timeout: 60000,
        };

        return new Response(JSON.stringify(options), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      if (path === '/auth/verify-login' && request.method === 'POST') {
        const { credential } = await request.json();
        
        // Verify the challenge
        const challenge = await env.DB.prepare(
          'SELECT * FROM challenges WHERE challenge = ? AND type = ?'
        ).bind(credential.response.clientDataJSON, 'login').first();

        if (!challenge) {
          return new Response('Invalid challenge', { status: 400 });
        }

        // Verify the credential
        const storedCredential = await env.DB.prepare(
          'SELECT * FROM credentials WHERE credential_id = ?'
        ).bind(credential.id).first();

        if (!storedCredential) {
          return new Response('Invalid credential', { status: 400 });
        }

        // Create session token
        const token = await createToken(storedCredential.user_id);

        return new Response(JSON.stringify({ token }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    // Todo endpoints
    if (path.startsWith('/todos')) {
      // Verify authentication
      const authHeader = request.headers.get('Authorization');
      if (!authHeader?.startsWith('Bearer ')) {
        return new Response('Unauthorized', { status: 401 });
      }

      const token = authHeader.split(' ')[1];
      const payload = await verifyToken(token);
      if (!payload) {
        return new Response('Unauthorized', { status: 401 });
      }

      if (path === '/todos' && request.method === 'GET') {
        const todos = await env.DB.prepare(
          'SELECT * FROM todos WHERE user_id = ? ORDER BY created_at DESC'
        ).bind(payload.userId).all();

        return new Response(JSON.stringify(todos.results), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      if (path === '/todos' && request.method === 'POST') {
        const { text } = await request.json();
        
        const result = await env.DB.prepare(
          'INSERT INTO todos (text, user_id) VALUES (?, ?) RETURNING *'
        ).bind(text, payload.userId).first();

        return new Response(JSON.stringify(result), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const todoId = path.split('/')[2];
      if (todoId) {
        if (request.method === 'PATCH') {
          const { completed } = await request.json();
          
          const result = await env.DB.prepare(
            'UPDATE todos SET completed = ? WHERE id = ? AND user_id = ? RETURNING *'
          ).bind(completed, todoId, payload.userId).first();

          if (!result) {
            return new Response('Not found', { status: 404 });
          }

          return new Response(JSON.stringify(result), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        if (request.method === 'DELETE') {
          await env.DB.prepare(
            'DELETE FROM todos WHERE id = ? AND user_id = ?'
          ).bind(todoId, payload.userId).run();

          return new Response(null, { status: 204 });
        }
      }
    }

    return new Response('Not found', { status: 404 });
  },
}; 